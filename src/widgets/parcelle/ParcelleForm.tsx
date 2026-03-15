import React from "react";
import {
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTextarea,
  IonIcon,
} from "@ionic/react";
import { Parcelle } from "../../entities/parcelle";
import { Categorie, Status } from "../../entities/reference";
import { ParametreTerritoire } from "../../entities/territoire";
import DemandeurView from "../demandeur/DemandeurView";
import Photo from "../../shared/ui/Photo";
import RiverinView from "../riverin/RiverinView";
import CategorySelect from "../../shared/ui/CategorySelect";
import { deletePhotos } from "../../shared/lib/db/DbSchema";

import "./ParcelleForm.css";
import { addCircle, searchCircle } from "ionicons/icons";

interface ParcelleFormProps {
  mode: "view" | "edit" | "create";
  parcelle: Parcelle;
  setParcelle: (parcelle: Parcelle | ((prev: Parcelle) => Parcelle)) => void;
  categorie: Categorie[];
  onCategoriesChange: (categories: Categorie[]) => void;
  status: Status[];
  parametreTerritoire: ParametreTerritoire | null;
  activeTab: "demandeur" | "riverin";
  setActiveTab: (tab: "demandeur" | "riverin") => void;
  decomposed: boolean;
  setDecomposed: (decomposed: boolean) => void;
  takePhotoParcelle: () => void;
  onCreateParcelle: () => void;
  onShowDemandeurModal: () => void;
  onShowSearchModal: () => void;
  onShowRiverinModal: () => void;
}

const ParcelleForm: React.FC<ParcelleFormProps> = ({
  mode,
  parcelle,
  setParcelle,
  categorie,
  onCategoriesChange,
  status,
  parametreTerritoire,
  activeTab,
  setActiveTab,
  decomposed,
  setDecomposed,
  takePhotoParcelle,
  onCreateParcelle,
  onShowDemandeurModal,
  onShowSearchModal,
  onShowRiverinModal,
}) => {
  const isDisabled = mode === "view";

  const updateField = <K extends keyof Parcelle>(
    field: K,
    value: Parcelle[K],
  ) => {
    setParcelle((prev) => ({ ...prev, [field]: value }));
  };

  const removeDemandeur = (index: number) => {
    setParcelle((prev) => ({
      ...prev,
      demandeurs: prev.demandeurs.filter((_, i) => i !== index),
    }));
  };

  const removeRiverin = (index: number) => {
    setParcelle((prev) => ({
      ...prev,
      riverin: prev.riverin.filter((_, i) => i !== index),
    }));
  };

  return (
    <IonList className="rounded-list">
      {/* Section — Identification */}
      <div className="form-section-title">Identification</div>

      <IonItem>
        <IonInput labelPlacement="floating" type="datetime-local"
          value={parcelle.dateCreation} readonly>
          <div slot="label">En date du</div>
        </IonInput>
      </IonItem>
      <IonItem>
        <IonInput labelPlacement="floating" type="text"
          readonly value={parcelle.code}>
          <div slot="label">Code parcelle</div>
        </IonInput>
      </IonItem>

      {/* Section — Informations foncières */}
      <div className="form-section-title">Informations foncières</div>

      <IonItem>
        <IonSelect disabled={isDisabled} label="Status"
          value={String(parcelle.status)}
          onIonChange={(e) => updateField("status", Number(e.detail.value))}
          placeholder="Status de terre" interface="alert">
          {status.map((s) => (
            <IonSelectOption key={`status-${s.id}`} value={s.id}>
              {s.labelstatus}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonItem>
        <IonInput label="Origine" type="text" className="input-end"
          onIonInput={(e) => {
            const val = e.detail.value?.toUpperCase() ?? "";
            updateField("origine", val);
            if (e.target) (e.target as HTMLIonInputElement).value = val;
          }}
          placeholder="T000AV" readonly={isDisabled} value={parcelle.origine} />
      </IonItem>

      <IonItem>
        <IonInput label="Durée d'occupation" type="number"
          min={0} max={200}
          onIonChange={(e) => updateField("anneeOccup", Number(e.detail.value))}
          placeholder="Nombre d'années" className="input-end"
          readonly={isDisabled} value={parcelle.anneeOccup} />
      </IonItem>

      <IonItem>
        <CategorySelect categories={categorie} value={parcelle.categorie}
          disabled={isDisabled}
          onSelect={(cat) => updateField("categorie", cat)}
          onCategoriesChange={onCategoriesChange} />
      </IonItem>

      <IonItem>
        <IonInput label="Consistance" type="text" className="input-end"
          onIonChange={(e) => updateField("consistance", String(e.detail.value))}
          placeholder="Consistance du terrain"
          readonly={isDisabled} value={parcelle.consistance} />
      </IonItem>

      {/* Section — Mentions légales */}
      <div className="form-section-title">Mentions légales</div>

      <IonItem lines={parcelle.oppossition ? "none" : "inset"}>
        <IonCheckbox labelPlacement="start"
          onIonChange={(e) => updateField("oppossition", e.detail.checked)}
          checked={parcelle.oppossition} disabled={isDisabled}>
          Opposition
        </IonCheckbox>
      </IonItem>
      {parcelle.oppossition && (
        <IonItem lines="none" className="mb-2">
          <IonTextarea placeholder="Détails sur l'opposition..."
            labelPlacement="stacked" label="Observation opposition"
            autoGrow disabled={isDisabled}
            value={parcelle.observationOpposition}
            onIonInput={(e) => updateField("observationOpposition", e.detail.value ?? "")}
            className="textarea-cool" />
        </IonItem>
      )}

      <IonItem lines={parcelle.revandication ? "none" : "inset"}>
        <IonCheckbox disabled={isDisabled} labelPlacement="start"
          checked={parcelle.revandication}
          onIonChange={(e) => updateField("revandication", e.detail.checked)}>
          Revendication
        </IonCheckbox>
      </IonItem>
      {parcelle.revandication && (
        <IonItem lines="none" className="mb-2">
          <IonTextarea placeholder="Détails sur la revendication..."
            labelPlacement="stacked" label="Observation revendication"
            autoGrow disabled={isDisabled}
            value={parcelle.observationRevendication}
            onIonInput={(e) => updateField("observationRevendication", e.detail.value ?? "")}
            className="textarea-cool" />
        </IonItem>
      )}

      {/* Section — Demandeurs & Riverains */}
      <div className="form-section-title">Demandeurs & Riverains</div>

      {mode !== "view" && (
        <IonItem lines="none">
          <div className="action-buttons-col">
            <div className="action-buttons-row">
              <button className="action-btn btn-primary" onClick={onShowDemandeurModal}>
                <IonIcon icon={addCircle} /> Demandeur
              </button>
              <button className="action-btn btn-secondary" onClick={onShowSearchModal}>
                <IonIcon icon={searchCircle} /> Rechercher
              </button>
            </div>
            <button className="action-btn btn-secondary btn-full" onClick={onShowRiverinModal}>
              <IonIcon icon={addCircle} /> Riverain
            </button>
          </div>
        </IonItem>
      )}

      <div className="tabs-wrapper">
        <div className="tabs-header">
          <IonSegment value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value as "demandeur" | "riverin")}>
            <IonSegmentButton value="demandeur">
              <IonLabel>Demandeurs</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="riverin">
              <IonLabel>Riverains</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
        <div className="tab-content-scroll">
          {activeTab === "demandeur" && (
            <div className="demandeur-list">
              {parcelle.demandeurs?.length === 0 && (
                <div className="empty-state">Aucun demandeur enregistré</div>
              )}
              {parcelle.demandeurs.map((d, i) => {
                const personne = d.type === 0 ? d.personnePhysique : d.personneMorale;
                return (
                  <DemandeurView key={i} personne={personne}
                    type={d.type ?? 0} representanType={d.representanType}
                    swipeEnabled={mode !== "view"}
                    onDelete={mode !== "view" ? () => removeDemandeur(i) : undefined} />
                );
              })}
            </div>
          )}
          {activeTab === "riverin" && (
            <div className="riverin-list">
              {parcelle.riverin?.length === 0 && (
                <div className="empty-state">Aucun riverain enregistré</div>
              )}
              {parcelle.riverin?.map((r, i) => (
                <RiverinView key={i} riverin={r}
                  swipeEnabled={mode !== "view"}
                  onDelete={mode !== "view" ? () => removeRiverin(i) : undefined} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section — Photos */}
      {parcelle.photos?.length > 0 && mode === "view" ? (
        <IonItem>
          <Photo photos={parcelle.photos} decomposed={decomposed}
            setDecomposed={setDecomposed} takePhoto={() => { }} clearPhotos={() => { }} viewOnly />
        </IonItem>
      ) : (
        mode !== "view" && (
          <>
            <div className="form-section-title">Photos</div>
            <IonItem>
              <Photo photos={parcelle.photos} decomposed={decomposed}
                setDecomposed={setDecomposed} takePhoto={takePhotoParcelle}
                clearPhotos={async () => {
                  await deletePhotos(parcelle.photos);
                  updateField("photos", []);
                }}
                onDeletePhoto={async (idx) => {
                  await deletePhotos([parcelle.photos[idx]]);
                  updateField("photos", parcelle.photos.filter((_, i) => i !== idx));
                }}
                name="PRENDRE DES PHOTOS" />
            </IonItem>
          </>
        )
      )}

      {/* Section — Territoire */}
      <div className="form-section-title">Paramètres territoriaux</div>
      <IonItem className="territoire-ion-item">
        <div className="territoire-wrapper">
          <div className="territoire-card">
            {[
              { label: "Région", value: parametreTerritoire?.region.nomregion },
              { label: "District", value: parametreTerritoire?.district.nomdistrict },
              { label: "Commune", value: parametreTerritoire?.commune.nomcommune },
              { label: "Fokontany", value: parametreTerritoire?.fokontany.nomfokontany },
              { label: "Hameau", value: parametreTerritoire?.hameau?.nomhameau },
            ].map(({ label, value }) => (
              <div key={label} className="territoire-field">
                <span className="territoire-label-parcelle-forms">{label}</span>
                <div className="territoire-input">{value ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </IonItem>

      {/* Section — Observation */}
      <div className="form-section-title">Observation</div>
      <IonItem>
        <IonTextarea
          onIonChange={(e) => updateField("observation", e.detail.value || "")}
          labelPlacement="stacked"
          placeholder="Votre observation sur la parcelle"
          disabled={isDisabled} value={parcelle.observation} />
      </IonItem>

      {mode !== "view" && (
        <IonButton expand="full" shape="round" onClick={onCreateParcelle} className="mt-3">
          {mode === "edit" ? "Mettre à jour" : "Enregistrer la parcelle"}
        </IonButton>
      )}
    </IonList>
  );
};

export default ParcelleForm;

