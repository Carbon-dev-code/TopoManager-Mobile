import React from "react";
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
} from "@ionic/react";
import { close } from "ionicons/icons";
import { Riverin } from "../../model/parcelle/Riverin";

interface ModalRiverinProps {
  showRiverin: boolean;
  setShowRiverin: (value: boolean) => void;
  addRiverin: () => void;
  riverinMess: string;
  repereL: { code_repere: number; repere: string }[];
  newRiverin: Riverin;
  setNewRiverin: (value: Riverin) => void;
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
      </IonContent>
    </IonModal>
  );
};

export default ModalRiverin;
