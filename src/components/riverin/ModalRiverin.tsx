import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonToast,
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
  useIonViewWillEnter,
} from "@ionic/react";
import { close } from "ionicons/icons";
import { Riverin } from "../../model/parcelle/Riverin";
import SeacrhModal from "../demandeur/SearchModal";
import { Demandeur } from "../../model/parcelle/Demandeur";
import DemandeurView from "../demandeur/DemandeurView";
import "./ModalRiverin.css";
import ModalDemandeur from "../demandeur/ModalDemandeur";
import { Preferences } from "@capacitor/preferences";

interface ModalRiverinProps {
  showRiverin: boolean;
  setShowRiverin: (value: boolean) => void;
  addRiverin: () => void;
  riverinMess: string;
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
  demandeurs
}) => {
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] = useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [isPhysique, setIsPhysique] = useState(0);
  const [demandeurList, setDemandeurList] = useState<Demandeur[]>([]);

  const loadDemandeurFromStorage = async (): Promise<Demandeur[]> => {
    const result = await Preferences.get({ key: "demandeur" });
    if (result.value) {
      try {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
      }
    }
    return [];
  };

  const load = async () => {
    setDemandeurList(await loadDemandeurFromStorage());
  };

  useIonViewWillEnter(() => {
    load();
  });

  const addDemandeur = async () => {
    const newList = [...demandeurList, demandeur];
    setNewRiverin({ ...newRiverin, demandeur: demandeur });
    await Preferences.set({ key: "demandeur", value: JSON.stringify(newList) });
    setDemandeur(Demandeur.init());
    setShowDemandeurModal(false);
  };

  return (
    <IonModal
      isOpen={showRiverin}
      onDidDismiss={() => {
        setShowRiverin(false);
      }}
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                setShowRiverin(false);
              }}
            >
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
        <IonToast trigger="open-loading" message={riverinMess} duration={900} />
        <IonList>
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonSelect
                    label="Repère :"
                    onIonChange={(e) =>
                      setNewRiverin({
                        ...newRiverin,
                        repere: Number(e.detail.value),
                      })
                    }
                    placeholder="Riverain du parcelle"
                  >
                    {repereL.map((rep, index) => (
                      <IonSelectOption
                        key={`rep-${index}`}
                        value={rep.code_repere}
                      >
                        {rep.repere}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          <IonItem>
            {newRiverin.demandeur ? (
              <div className="demandeur-list">
                <DemandeurView demandeur={newRiverin.demandeur} />
              </div>
            ) : (
              <IonLabel className="demandeur-none">⚠️ Aucun demandeur sélectionné</IonLabel>
            )}
          </IonItem>
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
        </IonList>
        <SeacrhModal
          showSearchModal={showSearchDemandeurModal} setShowSearchModal={setShowSearchDemandeurModal}
          onSelect={(d) => {
            setNewRiverin({ ...newRiverin, demandeur: d });
          }}
        />
        {/**Modal creation demandeur*/}
        <ModalDemandeur
          showCreateModal={showDemandeurModal} setShowCreateModal={setShowDemandeurModal}
          demandeur={demandeur} setDemandeur={setDemandeur}
          addDemandeur={addDemandeur}
          toastMessage={toastMessage} setToastMessage={setToastMessage}
          isPhysique={isPhysique} setIsPhysique={setIsPhysique}
          decomposed={decomposed} setDecomposed={setDecomposed}
        />
      </IonContent>
    </IonModal>
  );
};

export default ModalRiverin;
