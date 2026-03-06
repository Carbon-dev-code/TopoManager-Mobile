import {IonButton,IonButtons,IonContent,IonHeader,IonIcon,IonList,IonMenuButton,IonPage,IonSearchbar,IonTitle,IonToolbar,useIonViewWillEnter,} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close, informationCircle } from "ionicons/icons";
import { Demandeur } from "../model/parcelle/Demandeur";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import { useState } from "react";
import DemandeurView from "../components/demandeur/DemandeurView";
import { getAllDemandeurs, insertDemandeur } from "../model/base/DbSchema";
import Alert from "../components/alert/Alert";
import Toast, { ToastType } from "../components/toast/Toast";

type ModalMode = "create" | "view" | "edit";

const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [demandeurList, setDemandeurList] = useState<Demandeur[]>([]);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [tempAlertMessage, setTempAlertMessage] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  const loadDemandeurFromStorage = async (): Promise<Demandeur[]> => {
    return await getAllDemandeurs();
  };

  const load = async () => {
    const list = await loadDemandeurFromStorage();
    setDemandeurList(list);
  };

  useIonViewWillEnter(() => {
    load();
  });

  // ===== Ouvrir en mode création =====
  const handleOpenCreate = () => {
    setDemandeur(Demandeur.init());
    setIsPhysique(0);
    setModalMode("create");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode vue =====
  const handleOpenView = (d: Demandeur) => {
    setDemandeur(d);
    setIsPhysique(d.type ?? 0);
    setModalMode("view");
    setShowCreateModal(true);
  };

  // === Supprimer le demandeur ===
  const handlaOpenDelete = (d: Demandeur) => {
    console.log("FAFAFO");
  }

  // ===== Ouvrir en mode édition =====
  const handleOpenEdit = (d: Demandeur) => {
    setDemandeur(d);
    setIsPhysique(d.type ?? 0);
    setModalMode("edit");
    setShowCreateModal(true);
  };

  const addDemandeur = async () => {
    try {
      await insertDemandeur(demandeur);
      setDemandeur(Demandeur.init());
      setDemandeurList(await getAllDemandeurs());
      setShowCreateModal(false);
      setToast({
        visible: true,
        message: "Demandeur ajouté avec succès",
        type: "success",
      });
    } catch (error) {
      setTempAlertMessage(
        error instanceof Error
          ? error.message
          : "Erreur inconnue veuillez vous adresse au administrateur",
      );
      setShowTempAlert(true);
    }
  };

  // Filtre recherche
  const filteredList = demandeurList.filter((d) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    const nom = (d.nom ?? "").toLowerCase();
    const prenom = (d.prenom ?? "").toLowerCase();
    const denomination = (d.denomination ?? "").toLowerCase();
    return (
      nom.includes(query) ||
      prenom.includes(query) ||
      denomination.includes(query)
    );
  });

  return (
    <IonPage>
      <IonHeader>
        {seacrh ? (
          <IonToolbar className="transparent-toolbar">
            <IonSearchbar
              autoFocus
              showCancelButton="focus"
              className="custom-search"
              placeholder="Recherche demandeur"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
            />
            <IonButtons slot="end">
              <IonButton
                fill="clear"
                size="large"
                onClick={() => {
                  setSearch(false);
                  setSearchQuery("");
                }}
              >
                <IonIcon icon={close} slot="icon-only" color="light" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        ) : (
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Création de demandeur</IonTitle>
            <IonButtons slot="end">
              <IonButton
                aria-label="Rechercher"
                onClick={() => setSearch(true)}
              >
                <IonIcon icon={searchSharp} slot="icon-only" />
              </IonButton>
              <IonButton
                aria-label="Créer une nouvelle demandeur"
                onClick={handleOpenCreate}
              >
                <IonIcon icon={create} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent fullscreen>
        {filteredList.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon
              icon={informationCircle}
              size="large"
              className="text-muted mb-3"
            />
            <h4 className="text-muted">Aucune demandeur enregistré</h4>
            <IonButton onClick={handleOpenCreate}>
              Créer des demandeurs
            </IonButton>
          </div>
        ) : (
          filteredList.map((d, index) => (
            <IonList className="custom-list-md">
              <DemandeurView
                key={index}
                demandeur={d}
                longPressEnabled={true}
                onView={() => handleOpenView(d)}
                onEdit={() => handleOpenEdit(d)}
                onDelete={() => handlaOpenDelete(d)}
              />
            </IonList>
          ))
        )}

        <ModalDemandeur
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          demandeur={demandeur}
          setDemandeur={setDemandeur}
          addDemandeur={addDemandeur}
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
          isPhysique={isPhysique}
          setIsPhysique={setIsPhysique}
          decomposed={decomposed}
          setDecomposed={setDecomposed}
          mode={modalMode}
        />

        <Alert
          show={showTempAlert}
          type={0}
          title="Information"
          message={tempAlertMessage}
          onClose={() => setShowTempAlert(false)}
        />

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((t) => ({ ...t, visible: false }))}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
