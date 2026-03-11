import React, { useEffect, useState } from "react";
import {
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonGrid,
  IonButton,
  IonCol,
  IonRow,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { TypeMoral } from "../../model/TypeMoral";
import { Demandeur } from "../../model/parcelle/DemandeurDTO";

interface MoralProps {
  demandeur: Demandeur;
  setDemandeur: (value: Demandeur) => void;
  readonly?: boolean; // optionnel, false par défaut
}

const Moral: React.FC<MoralProps> = ({
  demandeur,
  setDemandeur,
  readonly = false,
}) => {
  const [typeMoral, setTypeMoral] = useState<TypeMoral[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: "typeMoralData" });
      if (value) {
        setTypeMoral(JSON.parse(value));
      }
    };

    loadData();
  }, []);

  return (
    <IonList>
      <IonItem>
        <IonSelect
          label="Type :"
          value={demandeur.typeMorale}
          placeholder="Type de personne morale"
          disabled={readonly}
          onIonChange={(e) =>
            setDemandeur({
              ...demandeur,
              typeMorale: e.detail.value!,
            })
          }
        >
          {typeMoral.map((type, index) => (
            <IonSelectOption key={`type-${index}`} value={type.id}>
              {type.labetypemoral}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonItem>
        <IonInput
          label="Dénomination :"
          type="text"
          value={demandeur.denomination}
          readonly={readonly}
          onIonChange={(e) =>
            setDemandeur({
              ...demandeur,
              denomination: e.detail.value!,
            })
          }
          placeholder="Dénomination"
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Date de création :"
          type="date"
          value={demandeur.dateCreation}
          readonly={readonly}
          onIonChange={(e) =>
            setDemandeur({
              ...demandeur,
              dateCreation: e.detail.value!,
            })
          }
          placeholder="Date de creation"
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Siège :"
          type="text"
          value={demandeur.siege}
          readonly={readonly}
          onIonChange={(e) =>
            setDemandeur({
              ...demandeur,
              siege: e.detail.value!,
            })
          }
          placeholder="Siège"
        />
      </IonItem>

      <IonItem>
        <IonTextarea
          label="Observations"
          rows={4}
          placeholder="Saisir des remarques ou notes..."
          value={demandeur.observations}
          readonly={readonly}
          onIonChange={(e) =>
            setDemandeur({
              ...demandeur,
              observations: e.detail.value!,
            })
          }
        />
      </IonItem>
      <IonItem>
        <IonGrid>
          <IonRow className="justify-content-between text-center">
            <IonCol size="12" size-md="4">
              <IonButton
                expand="full"
              >
                Ajout representant
              </IonButton>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonButton
                expand="full"
                color="tertiary"
              >
                Recherche representant
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonItem>
    </IonList>
  );
};

export default Moral;
