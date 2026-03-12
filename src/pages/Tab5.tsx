import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonList, IonMenuButton, IonPage, IonSearchbar, IonTitle,
  IonToolbar, useIonViewWillEnter,
} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close, informationCircle } from "ionicons/icons";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import { useState } from "react";
import DemandeurView from "../components/demandeur/DemandeurView";
import { insertPersonnePhysique, insertPersonneMorale, getAllPersonnesPhysiques, getAllPersonnesMorales } from "../model/base/DbSchema";
import Alert from "../components/alert/Alert";
import Toast, { ToastType } from "../components/toast/Toast";
import { PersonnePhysique } from "../model/Demandeur/PersonnePhysique";
import { PersonneMorale } from "../model/Demandeur/PersonneMorale";

type ModalMode = "create" | "view" | "edit";

const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [personnePhysique, setPersonnePhysique] = useState<PersonnePhysique>(PersonnePhysique.init());
  const [personneMorale, setPersonneMorale] = useState<PersonneMorale>(PersonneMorale.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [personnePhysiqueList, setPersonnePhysiqueList] = useState<PersonnePhysique[]>([]);
  const [personneMoraleList, setPersonneMoraleList] = useState<PersonneMorale[]>([]);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [tempAlertMessage, setTempAlertMessage] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  const load = async () => {
    const [physiques, morales] = await Promise.all([
      getAllPersonnesPhysiques(),
      getAllPersonnesMorales(),
    ]);

    console.log(morales);
    
    setPersonnePhysiqueList(physiques);
    setPersonneMoraleList(morales);
  };

  useIonViewWillEnter(() => {
    load();
  });

  // ===== Ouvrir en mode création =====
  const handleOpenCreate = () => {
    setPersonnePhysique(PersonnePhysique.init());
    setPersonneMorale(PersonneMorale.init());
    setIsPhysique(0);
    setModalMode("create");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode vue — physique =====
  const handleOpenViewPhysique = (p: PersonnePhysique) => {
    setPersonnePhysique(p);
    setIsPhysique(0);
    setModalMode("view");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode vue — morale =====
  const handleOpenViewMorale = (p: PersonneMorale) => {
    setPersonneMorale(p);
    setIsPhysique(1);
    setModalMode("view");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode édition — physique =====
  const handleOpenEditPhysique = (p: PersonnePhysique) => {
    setPersonnePhysique(p);
    setIsPhysique(0);
    setModalMode("edit");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode édition — morale =====
  const handleOpenEditMorale = (p: PersonneMorale) => {
    setPersonneMorale(p); 
    setIsPhysique(1);
    setModalMode("edit");
    setShowCreateModal(true);
  };

  const addDemandeur = async () => {
    try {
      if (isPhysique === 0) {
        await insertPersonnePhysique(personnePhysique);
        setPersonnePhysique(PersonnePhysique.init());
      } else {
        await insertPersonneMorale(personneMorale);
        setPersonneMorale(PersonneMorale.init());
      }
      await load();
      setShowCreateModal(false);
      setToast({
        visible: true,
        message: modalMode === "edit" ? "Modifié avec succès" : "Ajouté avec succès",
        type: "success",
      });
    } catch (error) {
      setTempAlertMessage(
        error instanceof Error ? error.message : "Erreur inconnue veuillez vous adresse au administrateur",
      );
      setShowTempAlert(true);
    }
  };

  // Filtre recherche — physiques + morales
  const filteredPhysiques = personnePhysiqueList.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (p.nom ?? "").toLowerCase().includes(q) ||
      (p.prenom ?? "").toLowerCase().includes(q)
    );
  });

  const filteredMorales = personneMoraleList.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (p.denomination ?? "").toLowerCase().includes(q);
  });

  return (
    <IonPage>
      <IonHeader>
        {search ? (
          <IonToolbar color="primary">
            <IonSearchbar
              autoFocus
              showCancelButton="focus"
              className="custom-search"
              placeholder="Recherche demandeur"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
            />
            <IonButtons slot="end">
              <IonButton fill="clear" size="large"
                onClick={() => { setSearch(false); setSearchQuery(""); }}
              >
                <IonIcon icon={close} slot="icon-only" color="light" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        ) : (
          <IonToolbar color="primary">
            <IonButtons slot="start"><IonMenuButton /></IonButtons>
            <IonTitle>Création de demandeur</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSearch(true)}>
                <IonIcon icon={searchSharp} slot="icon-only" />
              </IonButton>
              <IonButton onClick={handleOpenCreate}>
                <IonIcon icon={create} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent>
        {filteredPhysiques.length === 0 && filteredMorales.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon icon={informationCircle} size="large" className="text-muted mb-3" />
            <h4 className="text-muted">Aucun demandeur enregistré</h4>
            <IonButton onClick={handleOpenCreate}>Créer des demandeurs</IonButton>
          </div>
        ) : (
          <>
            {filteredPhysiques.map((p) => (
              <IonList className="custom-list-md" key={p.id}>
                <DemandeurView
                  personne={p}
                  type={0}
                  longPressEnabled={true}
                  onView={() => handleOpenViewPhysique(p)}
                  onEdit={() => handleOpenEditPhysique(p)}
                  onDelete={() => console.log(p.id)}
                />
              </IonList>
            ))}
            {filteredMorales.map((p) => (
              <IonList className="custom-list-md" key={p.id}>
                <DemandeurView
                  personne={p}
                  type={1}
                  longPressEnabled={true}
                  onView={() => handleOpenViewMorale(p)}
                  onEdit={() => handleOpenEditMorale(p)}
                  onDelete={() => console.log(p.id)}
                />
              </IonList>
            ))}
          </>
        )}

        <ModalDemandeur
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          personnePhysique={personnePhysique}
          setPersonnePhysique={setPersonnePhysique}
          personneMorale={personneMorale}
          setPersonneMorale={setPersonneMorale}
          addDemandeur={addDemandeur}
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
          isPhysique={isPhysique}
          setIsPhysique={setIsPhysique}
          decomposed={decomposed}
          setDecomposed={setDecomposed}
          mode={modalMode}
        />

        <Alert show={showTempAlert} type={0} title="Information"
          message={tempAlertMessage} onClose={() => setShowTempAlert(false)} />

        <Toast visible={toast.visible} message={toast.message}
          type={toast.type} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
      </IonContent>
    </IonPage>
  );
};

export default Tab5;