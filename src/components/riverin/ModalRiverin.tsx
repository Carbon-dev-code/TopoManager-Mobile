import React, { useEffect, useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonLabel,
  IonInput,
  useIonViewWillEnter,
} from "@ionic/react";
import { close } from "ionicons/icons";
import { Riverin, TypeRiverin } from "../../model/parcelle/Riverin";
import SeacrhModal from "../demandeur/SearchModal";
import { Demandeur } from "../../model/parcelle/Demandeur";
import DemandeurView from "../demandeur/DemandeurView";
import "./ModalRiverin.css";
import ModalDemandeur from "../demandeur/ModalDemandeur";
import { Preferences } from "@capacitor/preferences";
import Toast, { ToastType } from "../toast/Toast";

interface ModalRiverinProps {
  showRiverin: boolean;
  setShowRiverin: (value: boolean) => void;
  addRiverin: () => void;
  riverinMess: string | null;
  repereL: { code_repere: number; repere: string }[];
  newRiverin: Riverin;
  setNewRiverin: (value: Riverin) => void;
  demandeurs: Demandeur[];
}

const ModalRiverin: React.FC<ModalRiverinProps> = ({
  showRiverin,
  setShowRiverin,
  addRiverin,
  riverinMess,
  repereL,
  newRiverin,
  setNewRiverin,
}) => {
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] =
    useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [isPhysique, setIsPhysique] = useState(0);
  const [, setDemandeurList] = useState<Demandeur[]>([]);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  const removeDemandeur = () => {
    setNewRiverin({ ...newRiverin, demandeur: null });
  };

  const loadDemandeurFromStorage = async (): Promise<Demandeur[]> => {
    const result = await Preferences.get({ key: "demandeur" });
    if (result.value) {
      try {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
      }
    }
    return [];
  };

  useIonViewWillEnter(() => {
    loadDemandeurFromStorage().then(setDemandeurList);
  });

  const addDemandeur = async () => {
    setNewRiverin({ ...newRiverin, demandeur });
    setDemandeur(Demandeur.init());
    setShowDemandeurModal(false);
  };

  useEffect(() => {
    if (!riverinMess) return;
    const message =
      riverinMess === "success"
        ? "Riverin ajouté avec succès"
        : "Vérifiez le repère et la désignation";
    setToast({ visible: true, message, type: riverinMess as ToastType });
  }, [riverinMess]);

  return (
    <IonModal isOpen={showRiverin} onDidDismiss={() => setShowRiverin(false)}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => setShowRiverin(false)}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Ajout de nouveau riverain au parcelle</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={addRiverin} id="open-loading">
              Ajouter
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((t) => ({ ...t, visible: false }))}
        />

        <IonList>
          {/* ─── Repère ─────────────────────────────────────────── */}
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonSelect
                    label="Repère :"
                    value={newRiverin.repere}
                    onIonChange={(e) =>
                      setNewRiverin({ ...newRiverin, repere: e.detail.value })
                    }
                    placeholder="Riverain du parcelle"
                  >
                    {repereL.map((rep, index) => (
                      <IonSelectOption key={`rep-${index}`} value={rep.repere}>
                        {rep.repere}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>

          {/* ─── Type ───────────────────────────────────────────── */}
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonSelect
                    label="Type :"
                    value={newRiverin.type}
                    onIonChange={(e) =>
                      setNewRiverin({
                        ...newRiverin,
                        type: e.detail.value as TypeRiverin,
                        nom: null,
                        demandeur: null,
                      })
                    }
                    placeholder="Type de riverain"
                  >
                    <IonSelectOption value="personne">Personne</IonSelectOption>
                    <IonSelectOption value="autre">Autre</IonSelectOption>
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>

          {/* ─── Champ libre si "autre" ──────────────────────────── */}
          {newRiverin.type === "autre" && (
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonInput
                      label="Désignation :"
                      placeholder="Ex: Route, Rivière, Rocher..."
                      value={newRiverin.nom ?? ""}
                      onIonInput={(e) =>
                        setNewRiverin({
                          ...newRiverin,
                          nom: e.detail.value ?? null,
                        })
                      }
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
          )}

          {/* ─── Personne ────────────────────────────────────────── */}
          {newRiverin.type === "personne" && (
            <>
              <div className="backGround">
                {newRiverin.demandeur ? (
                  <div className="demandeur-list">
                    <DemandeurView
                      demandeur={newRiverin.demandeur}
                      swipeEnabled={true}
                      onDelete={removeDemandeur}
                    />
                  </div>
                ) : (
                  <IonLabel className="demandeur-none" color="danger">
                    Aucun personne sélectionné
                  </IonLabel>
                )}
              </div>
              <div className="barRiverin"></div>
              <IonItem lines="none">
                <IonGrid>
                  <IonRow className="justify-content-between text-center">
                    <IonCol size="12" size-md="6">
                      <IonButton
                        expand="full"
                        onClick={() => setShowDemandeurModal(true)}
                      >
                        Ajout demandeur
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton
                        expand="full"
                        color="tertiary"
                        onClick={() => setShowSearchDemandeurModal(true)}
                      >
                        Recherche demandeur
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>
            </>
          )}

          {/* ─── Observation ─────────────────────────────────────── */}
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonTextarea
                    label="Observation"
                    value={newRiverin.observation}
                    onIonChange={(e) =>
                      setNewRiverin({
                        ...newRiverin,
                        observation: e.detail.value || "",
                      })
                    }
                    labelPlacement="stacked"
                    placeholder="Votre observation sur la parcelle"
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
        </IonList>

        <SeacrhModal
          showSearchModal={showSearchDemandeurModal}
          setShowSearchModal={setShowSearchDemandeurModal}
          onSelect={(d) => setNewRiverin({ ...newRiverin, demandeur: d })}
        />

        <ModalDemandeur
          showCreateModal={showDemandeurModal}
          setShowCreateModal={setShowDemandeurModal}
          demandeur={demandeur}
          setDemandeur={setDemandeur}
          addDemandeur={addDemandeur}
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
          isPhysique={isPhysique}
          setIsPhysique={setIsPhysique}
          decomposed={decomposed}
          setDecomposed={setDecomposed}
        />
      </IonContent>
    </IonModal>
  );
};

export default ModalRiverin;
