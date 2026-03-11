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
  IonLabel,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { TypeMoral } from "../../model/TypeMoral";
import { PersonneMorale } from "../../model/Demandeur/PersonneMorale";
import SearchModal from "./SearchModal";
import ModalDemandeur from "./ModalDemandeur";
import DemandeurView from "./DemandeurView";
import { PersonnePhysique } from "../../model/Demandeur/PersonnePhysique";

interface MoralProps {
  personne: PersonneMorale;
  setPersonne: (value: PersonneMorale) => void;
  readonly?: boolean; // optionnel, false par défaut
}

const Moral: React.FC<MoralProps> = ({
  personne,
  setPersonne,
  readonly = false,
}) => {
  const [typeMoral, setTypeMoral] = useState<TypeMoral[]>([]);
  const [dirigeants, setDirigeants] = useState<PersonnePhysique[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPersonneModal, setShowPersonneModal] = useState(false);
  const [decomposed, setDecomposed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newDirigeant, setNewDirigeant] = useState<PersonnePhysique>(
    PersonnePhysique.init(),
  );
  const [dummyMorale] = useState<PersonneMorale>(PersonneMorale.init()); // ← prop obligatoire

  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: "typeMoralData" });
      if (value) setTypeMoral(JSON.parse(value));
    };
    loadData();
  }, []);

  const addDirigeant = () => {
    try {
      setDirigeants((prev) => {
        const exists = prev.find((d) => d.id === newDirigeant.id);
        if (exists) return prev;
        return [...prev, { ...newDirigeant, representanType: "dirigeant" }];
      });
      setNewDirigeant(PersonnePhysique.init());
      setShowPersonneModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <IonList>
      {/* ─── Champs PersonneMorale ─── */}
      <IonItem>
        <IonSelect
          label="Type :"
          value={personne.typeMorale}
          placeholder="Type de personne morale"
          disabled={readonly}
          onIonChange={(e) =>
            setPersonne({ ...personne, typeMorale: e.detail.value! })
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
          value={personne.denomination}
          readonly={readonly}
          onIonChange={(e) =>
            setPersonne({ ...personne, denomination: e.detail.value! })
          }
          placeholder="Dénomination"
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Date de création :"
          type="date"
          value={personne.dateCreation}
          readonly={readonly}
          onIonChange={(e) =>
            setPersonne({ ...personne, dateCreation: e.detail.value! })
          }
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Siège :"
          type="text"
          value={personne.siege}
          readonly={readonly}
          onIonChange={(e) =>
            setPersonne({ ...personne, siege: e.detail.value! })
          }
          placeholder="Siège"
        />
      </IonItem>

      <IonItem>
        <IonTextarea
          label="Observations"
          rows={4}
          value={personne.observations}
          readonly={readonly}
          onIonChange={(e) =>
            setPersonne({ ...personne, observations: e.detail.value! })
          }
        />
      </IonItem>

      {/* ─── Liste des dirigeants ─── */}
      {dirigeants.length > 0 && (
        <IonItem lines="none">
          <IonLabel>
            <h3
              style={{
                fontWeight: "bold",
                color: "var(--ion-color-primary)",
                marginBottom: "8px",
              }}
            >
              Dirigeants ({dirigeants.length})
            </h3>
          </IonLabel>
        </IonItem>
      )}

      {dirigeants.map((d) => (
        <IonItem
          key={d.id}
          lines="none"
          style={{
            marginBottom: "6px",
            borderRadius: "8px",
            backgroundColor: "var(--ion-color-light)",
          }}
        >
          <DemandeurView
            personne={d}
            type={0}
            onDelete={() =>
              setDirigeants((prev) => prev.filter((r) => r.id !== d.id))
            }
            swipeEnabled={!readonly}
          />
        </IonItem>
      ))}

      {/* ─── Section dirigeants ─── */}
      {!readonly && (
        <IonItem>
          <IonGrid>
            <IonRow className="justify-content-between text-center">
              <IonCol size="12" size-md="4">
                <IonButton
                  expand="full"
                  onClick={() => {
                    setNewDirigeant(PersonnePhysique.init());
                    setShowPersonneModal(true);
                  }}
                >
                  Ajout dirigeant
                </IonButton>
              </IonCol>
              <IonCol size="12" size-md="4">
                <IonButton
                  expand="full"
                  color="tertiary"
                  onClick={() => setShowSearchModal(true)}
                >
                  Recherche dirigeant
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonItem>
      )}

      {/* ─── SearchModal — filtre physique uniquement via withRole ─── */}
      <SearchModal
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        withRole={true}
        roles={[{ text: "Representant", data: "representant" }]}
        onSelect={(d) => {
          if (d.type !== 0) return;
          const exists = dirigeants.find((r) => r.id === d.id);
          if (!exists) {
            setDirigeants((prev) => [
              ...prev,
              { ...d, representanType: "Representant" },
            ]);
          }
        }}
      />

      <ModalDemandeur
        showCreateModal={showPersonneModal}
        setShowCreateModal={setShowPersonneModal}
        personnePhysique={newDirigeant}
        setPersonnePhysique={setNewDirigeant}
        personneMorale={dummyMorale} // ← ajout obligatoire
        setPersonneMorale={() => {}} // ← bloqué, inutile ici
        addDemandeur={addDirigeant} // ← renommer addPersonne → addDemandeur
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        isPhysique={0} // ← forcé, pas de state
        setIsPhysique={() => {}} // ← bloqué
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        withRepresentants={false}
      />
    </IonList>
  );
};

export default Moral;
