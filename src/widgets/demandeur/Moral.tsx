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
import { TypeMoral } from "../../entities/reference";
import {
  PersonneMorale,
  PersonnePhysique,
  RepresentantMoral,
} from "../../entities/demandeur";
import SearchModal from "./SearchModal";
import ModalDemandeur from "./ModalDemandeur";
import DemandeurView from "./DemandeurView";

interface MoralProps {
  personne: PersonneMorale;
  setPersonne: (value: PersonneMorale) => void;
  readonly?: boolean;
}

const Moral: React.FC<MoralProps> = ({ personne, setPersonne, readonly = false }) => {
  const [typeMoral, setTypeMoral] = useState<TypeMoral[]>([]);
  const [dirigeants, setDirigeants] = useState<RepresentantMoral[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPersonneModal, setShowPersonneModal] = useState(false);
  const [decomposed, setDecomposed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newDirigeant, setNewDirigeant] = useState<PersonnePhysique>(
    PersonnePhysique.init(),
  );
  const [dummyMorale] = useState<PersonneMorale>(PersonneMorale.init());

  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: "typeMoralData" });
      if (value) setTypeMoral(JSON.parse(value));
    };
    loadData();
  }, []);

  const addDirigeant = () => {
    try {
      const exists = dirigeants.find((d) => d.personnePhysique.id === newDirigeant.id);
      if (!exists) {
        const newRep = new RepresentantMoral(newDirigeant, "representant");
        const updated = [...dirigeants, newRep];
        setDirigeants(updated);
        setPersonne({ ...personne, representant: updated });
      }
      setNewDirigeant(PersonnePhysique.init());
      setShowPersonneModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setDirigeants(personne.representant ?? []);
  }, [personne.id, personne.representant]);

  return (
    <IonList>
      <IonItem>
        <IonSelect
          label="Type :"
          value={personne.typeMorale}
          placeholder="Type de personne morale"
          disabled={readonly}
          onIonChange={(e) => setPersonne({ ...personne, typeMorale: Number(e.detail.value) })}
        >
          {typeMoral.map((type, index) => (
            <IonSelectOption key={`type-${index}`} value={Number(type.id)}>
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
          onIonChange={(e) => setPersonne({ ...personne, denomination: e.detail.value! })}
          placeholder="Dénomination"
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Date de création :"
          type="date"
          value={personne.dateCreation}
          readonly={readonly}
          onIonChange={(e) => setPersonne({ ...personne, dateCreation: e.detail.value! })}
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Siège :"
          type="text"
          value={personne.siege}
          readonly={readonly}
          onIonChange={(e) => setPersonne({ ...personne, siege: e.detail.value! })}
          placeholder="Siège"
        />
      </IonItem>

      <IonItem>
        <IonTextarea
          label="Observations"
          labelPlacement="stacked"
          rows={4}
          value={personne.observations}
          readonly={readonly}
          onIonChange={(e) => setPersonne({ ...personne, observations: e.detail.value! })}
        />
      </IonItem>

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
              Représentant ({dirigeants.length})
            </h3>
          </IonLabel>
        </IonItem>
      )}

      {dirigeants.map((d) => (
        <div className="p-2 bg-light" key={d.personnePhysique.id}>
          <DemandeurView
            personne={d.personnePhysique}
            type={0}
            representanType={d.role}
            onDelete={() => {
              const updated = dirigeants.filter(
                (r) => r.personnePhysique.id !== d.personnePhysique.id,
              );
              setDirigeants(updated);
              setPersonne({ ...personne, representant: updated });
            }}
            swipeEnabled={!readonly}
          />
        </div>
      ))}

      {!readonly && (
        <IonItem lines="none">
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
                  Ajout Représentant
                </IonButton>
              </IonCol>
              <IonCol size="12" size-md="4">
                <IonButton
                  expand="full"
                  color="tertiary"
                  onClick={() => setShowSearchModal(true)}
                >
                  Recherche Représentant
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonItem>
      )}

      <SearchModal
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        withRole={true}
        roles={[{ text: "Representant", data: "representant" }]}
        onSelect={(d) => {
          if (d.type !== 0) return;
          const pp = d.personnePhysique;
          const exists = dirigeants.find((r) => r.personnePhysique.id === pp.id);
          if (!exists) {
            const newRep = new RepresentantMoral(pp, "representant");
            const updated = [...dirigeants, newRep];
            setDirigeants(updated);
            setPersonne({ ...personne, representant: updated });
          }
        }}
      />

      <ModalDemandeur
        showCreateModal={showPersonneModal}
        setShowCreateModal={setShowPersonneModal}
        personnePhysique={newDirigeant}
        setPersonnePhysique={setNewDirigeant}
        personneMorale={dummyMorale}
        setPersonneMorale={() => {}}
        addDemandeur={addDirigeant}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        isPhysique={0}
        setIsPhysique={() => {}}
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        withRepresentants={false}
        forcePhysique={true}
      />
    </IonList>
  );
};

export default Moral;
