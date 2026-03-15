import React from "react";
import {
  IonList,
  IonItem,
  IonInput,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
} from "@ionic/react";
import { PersonnePhysique } from "../../entities/demandeur";

interface PhysiqueProps {
  physique: PersonnePhysique;
  setPhysique: (value: PersonnePhysique) => void;
  readonly?: boolean;
}

const Physique: React.FC<PhysiqueProps> = ({ physique, setPhysique, readonly = false }) => {
  const cinStr = physique.cin?.numero ?? "";

  const cinNumero = [
    cinStr.substring(0, 3),
    cinStr.substring(3, 6),
    cinStr.substring(6, 9),
    cinStr.substring(9, 12),
  ];

  return (
    <IonList className="pt-0 rounded-list">

      {/* Identité */}
      <div className="form-section-title">Identité</div>

      <IonItem>
        <IonInput
          readonly={readonly}
          label="Nom"
          placeholder="Entrer le nom du demandeur"
          value={physique.nom}
          onIonInput={(e) => setPhysique({ ...physique, nom: String(e.detail.value) })}
        />
      </IonItem>

      <IonItem>
        <IonInput
          readonly={readonly}
          label="Prénom"
          placeholder="Entrer le prénom du demandeur"
          value={physique.prenom}
          onIonInput={(e) => setPhysique({ ...physique, prenom: String(e.detail.value) })}
        />
      </IonItem>

      <IonItem lines="none" className="mb-0">
        <IonCheckbox
          labelPlacement="end"
          checked={physique.neVers}
          disabled={readonly}
          onIonChange={(e) => setPhysique({ ...physique, neVers: Boolean(e.detail.checked) })}
        >
          <span className="fs-7">Né vers (approximatif)</span>
        </IonCheckbox>
      </IonItem>

      <IonItem>
        {physique.neVers ? (
          <IonInput
            labelPlacement="stacked"
            type="number"
            label="Date de naissance*"
            placeholder="Année (ex: 1985)"
            min="1500"
            max={new Date().getFullYear()}
            readonly={readonly}
            value={physique.dateNeVers ? physique.dateNeVers : ""}
            onIonInput={(e) => setPhysique({ ...physique, dateNeVers: e.detail.value ?? null })}
          />
        ) : (
          <IonInput
            type="date"
            labelPlacement="stacked"
            label="Date de naissance*"
            readonly={readonly}
            value={
              physique.dateNaissance
                ? typeof physique.dateNaissance === "string"
                  ? physique.dateNaissance.substring(0, 10)
                  : new Date(physique.dateNaissance).toISOString().substring(0, 10)
                : ""
            }
            onIonInput={(e) =>
              setPhysique({ ...physique, dateNaissance: e.detail.value ? e.detail.value : null })
            }
          />
        )}
      </IonItem>

      <IonItem>
        <IonInput
          type="text"
          labelPlacement="stacked"
          label="Lieu de naissance"
          placeholder="Entrer le lieu de naissance"
          readonly={readonly}
          value={physique.lieuNaissance}
          onIonInput={(e) => setPhysique({ ...physique, lieuNaissance: String(e.detail.value) })}
        />
      </IonItem>

      <IonItem>
        <IonInput
          labelPlacement="stacked"
          label="Adresse"
          placeholder="Entrer l'adresse"
          readonly={readonly}
          value={physique.adresse}
          onIonInput={(e) => setPhysique({ ...physique, adresse: String(e.detail.value) })}
        />
      </IonItem>

      {/* Sexe */}
      <div className="form-section-title">Sexe</div>
      <div className="radio-item-wrapper">
        <div className="radio-inline-row">
          {[
            { label: "Masculin", value: 1 },
            { label: "Féminin", value: 0 },
          ].map((opt) => (
            <div
              key={opt.value}
              className={`radio-pill ${physique.sexe === opt.value ? "active" : ""}`}
              onClick={() => { if (!readonly) setPhysique({ ...physique, sexe: opt.value }); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* Situation matrimoniale */}
      <div className="form-section-title">Situation matrimoniale</div>
      <div className="radio-item-wrapper">
        <div className="radio-inline-row">
          {[
            { label: "Célibataire", value: "0" },
            { label: "Marié(e)", value: "1" },
            { label: "Veuf(ve)", value: "2" },
          ].map((opt) => (
            <div
              key={opt.value}
              className={`radio-pill ${physique.situation === opt.value ? "active" : ""}`}
              onClick={() => { if (!readonly) setPhysique({ ...physique, situation: opt.value }); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {(physique.situation === "1" || physique.situation === "2") && (
        <IonItem>
          <IonInput
            label="Nom du conjoint"
            placeholder="Entrer le nom du conjoint"
            readonly={readonly}
            value={physique.nomConjoint}
            onIonInput={(e) => setPhysique({ ...physique, nomConjoint: String(e.detail.value) })}
          />
        </IonItem>
      )}

      {/* Filiation */}
      <div className="form-section-title">Filiation</div>

      <IonItem>
        <IonInput
          label="Nom du père"
          placeholder="Entrer le nom du père"
          readonly={readonly}
          value={physique.nomPere}
          onIonInput={(e) => setPhysique({ ...physique, nomPere: String(e.detail.value) })}
        />
      </IonItem>

      <IonItem>
        <IonInput
          label="Nom de la mère"
          placeholder="Entrer le nom de la mère"
          readonly={readonly}
          value={physique.nomMere}
          onIonInput={(e) => setPhysique({ ...physique, nomMere: String(e.detail.value) })}
        />
      </IonItem>

      {/* Pièces d'identification */}
      <div className="form-section-title">Pièces d'identification</div>
      <div className="radio-item-wrapper">
        <div className="radio-inline-row">
          {/* Néant — désactive tout */}
          <div
            className={`radio-pill ${!physique.cin && !physique.acte ? "active" : ""}`}
            onClick={() => {
              if (readonly) return;
              setPhysique({ ...physique, cin: null, acte: null });
            }}
          >
            Néant
          </div>

          {/* CIN */}
          <div
            className={`radio-pill ${physique.cin ? "active" : ""}`}
            onClick={() => {
              if (readonly) return;
              setPhysique({
                ...physique,
                cin: physique.cin ? null : { numero: "", date: null, lieu: "" },
              });
            }}
          >
            CIN
          </div>

          {/* Acte naissance */}
          <div
            className={`radio-pill ${physique.acte ? "active" : ""}`}
            onClick={() => {
              if (readonly) return;
              setPhysique({
                ...physique,
                acte: physique.acte ? null : { numero: "", date: null, lieu: "" },
              });
            }}
          >
            Acte naissance
          </div>
        </div>
      </div>

      {/* CIN */}
      {physique.cin && (
        <IonList>
          <div className="form-section-title">CIN</div>
          <IonItem lines="none">
            <IonLabel position="stacked">Numéro</IonLabel>
            <div className="d-flex gap-2" style={{ width: "100%", paddingTop: "8px" }}>
              {[0, 1, 2, 3].map((index) => (
                <IonInput
                  key={index}
                  className="form-control px-3"
                  style={{ width: "25%" }}
                  readonly={readonly}
                  value={cinNumero[index] || ""}
                  onIonInput={(e) => {
                    const value = e.detail.value || "";
                    const newNumero = [...cinNumero];
                    newNumero[index] = value;
                    setPhysique({
                      ...physique,
                      cin: { ...physique.cin, numero: newNumero.join("") }
                    });
                  }}
                  maxlength={3}
                />
              ))}
            </div>
          </IonItem>
          <IonItem lines="inset">
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    type="date"
                    label="Date CIN"
                    readonly={readonly}
                    value={physique.cin?.date?.substring(0, 10) ?? ""}
                    onIonInput={(e) =>
                      setPhysique({
                        ...physique,
                        cin: { ...physique.cin, date: e.detail.value || null },
                      })
                    }
                  />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    type="text"
                    label="Lieu"
                    placeholder="Lieu de délivrance"
                    readonly={readonly}
                    value={physique.cin?.lieu || ""}
                    onIonInput={(e) =>
                      setPhysique({ ...physique, cin: { ...physique.cin, lieu: e.detail.value! } })
                    }
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
        </IonList>
      )}

      {/* Acte de naissance */}
      {physique.acte && (
        <IonList>
          <div className="form-section-title">Acte de naissance</div>
          <IonItem>
            <IonInput
              label="Numéro"
              readonly={readonly}
              value={physique.acte?.numero || ""}
              placeholder="N154648464169"
              onIonInput={(e) =>
                setPhysique({ ...physique, acte: { ...physique.acte, numero: e.detail.value! } })
              }
            />
          </IonItem>
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Lieu"
                    placeholder="Lieu de l'acte"
                    readonly={readonly}
                    value={physique.acte?.lieu}
                    onIonInput={(e) =>
                      setPhysique({ ...physique, acte: { ...physique.acte, lieu: e.detail.value || "" } })
                    }
                  />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Date de l'acte"
                    type="date"
                    readonly={readonly}
                    value={physique.acte?.date ? String(physique.acte.date).substring(0, 10) : ""} onIonInput={(e) =>
                      setPhysique({
                        ...physique,
                        acte: { ...physique.acte, date: e.detail.value},
                      })
                    }
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
        </IonList>
      )}

    </IonList>
  );
};

export default Physique;