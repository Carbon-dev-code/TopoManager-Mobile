import React, { useState } from "react";
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
} from "@ionic/react";
import { close } from "ionicons/icons";
import { Riverin, TypeRiverin } from "../../entities/parcelle";
import SeacrhModal from "../demandeur/SearchDemandeurModal";
import DemandeurView from "../demandeur/DemandeurView";
import "./ModalRiverin.css";
import ModalDemandeur from "../demandeur/ModalDemandeur";
import Toast, { ToastType } from "../../shared/ui/Toast";
import { PersonnePhysique, PersonneMorale } from "../../entities/demandeur";

interface ModalRiverinProps {
  showRiverin: boolean;
  setShowRiverin: (value: boolean) => void;
  addRiverin: () => void;
  repereL: { code_repere: number; repere: string }[];
  newRiverin: Riverin;
  setNewRiverin: (value: Riverin) => void;
}

const ModalRiverin: React.FC<ModalRiverinProps> = ({
  showRiverin,
  setShowRiverin,
  addRiverin,
  repereL,
  newRiverin,
  setNewRiverin,
}) => {
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] =
    useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [personnePhysique, setPersonnePhysique] = useState<PersonnePhysique>(
    PersonnePhysique.init(),
  );
  const [personneMorale, setPersonneMorale] = useState<PersonneMorale>(
    PersonneMorale.init(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [isPhysique, setIsPhysique] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  const removeDemandeur = () => {
    setNewRiverin({
      ...newRiverin,
      personnePhysique: null,
      personneMorale: null,
      typePersonne: null,
    });
  };

  const addPersonneToRiverin = () => {
    if (isPhysique === 0) {
      setNewRiverin({
        ...newRiverin,
        personnePhysique,
        personneMorale: null,
        typePersonne: 0,
      });
    } else {
      setNewRiverin({
        ...newRiverin,
        personneMorale,
        personnePhysique: null,
        typePersonne: 1,
      });
    }
    setPersonnePhysique(PersonnePhysique.init());
    setPersonneMorale(PersonneMorale.init());
    setIsPhysique(0);
    setShowDemandeurModal(false);
  };

  const handleSelectFromSearch = (
    pp: PersonnePhysique | PersonneMorale,
    type: 0 | 1,
  ) => {
    if (type === 0) {
      setNewRiverin({
        ...newRiverin,
        personnePhysique: pp as PersonnePhysique,
        personneMorale: null,
        typePersonne: 0,
      });
    } else {
      setNewRiverin({
        ...newRiverin,
        personneMorale: pp as PersonneMorale,
        personnePhysique: null,
        typePersonne: 1,
      });
    }
    setShowSearchDemandeurModal(false);
  };

  const hasPersonne = newRiverin.typePersonne !== null &&
    (newRiverin.personnePhysique || newRiverin.personneMorale);

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
            <IonButton onClick={addRiverin}>Ajouter</IonButton>
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

          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonSelect
                    label="Type de voisin :"
                    value={newRiverin.type}
                    onIonChange={(e) =>
                      setNewRiverin({
                        ...newRiverin,
                        type: e.detail.value as TypeRiverin,
                        nom: null,
                        personnePhysique: null,
                        personneMorale: null,
                        typePersonne: null,
                      })
                    }
                    placeholder="Type de riverain"
                  >
                    <IonSelectOption value="personne">Personne (physique / moral)</IonSelectOption>
                    <IonSelectOption value="autre">Autre</IonSelectOption>
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>

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

          {newRiverin.type === "personne" && (
            <>
              <div className="backGround">
                {hasPersonne ? (
                  <div className="demandeur-list">
                    <DemandeurView
                      personne={
                        newRiverin.typePersonne === 0
                          ? newRiverin.personnePhysique!
                          : newRiverin.personneMorale!
                      }
                      type={newRiverin.typePersonne ?? 0}
                      swipeEnabled={true}
                      onDelete={removeDemandeur}
                    />
                  </div>
                ) : (
                  <IonLabel className="demandeur-none" color="danger">
                    Aucune personne sélectionnée
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
                        Ajout voisin
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton
                        expand="full"
                        color="tertiary"
                        onClick={() => setShowSearchDemandeurModal(true)}
                      >
                        Recherche voisin
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>
            </>
          )}

          <IonItem lines="none">
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
          onSelect={(d) =>
            handleSelectFromSearch(
              d.type === 0 ? d.personnePhysique : d.personneMorale,
              d.type ?? 0,
            )
          }
        />

        <ModalDemandeur
          showCreateModal={showDemandeurModal}
          setShowCreateModal={setShowDemandeurModal}
          personnePhysique={personnePhysique}
          setPersonnePhysique={setPersonnePhysique}
          personneMorale={personneMorale}
          setPersonneMorale={setPersonneMorale}
          addDemandeur={addPersonneToRiverin}
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
          isPhysique={isPhysique}
          setIsPhysique={setIsPhysique}
          decomposed={decomposed}
          setDecomposed={setDecomposed}
          withRepresentants={false}
        />
      </IonContent>
    </IonModal>
  );
};

export default ModalRiverin;

