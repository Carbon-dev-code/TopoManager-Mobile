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
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import { Demandeur } from "../../model/parcelle/DemandeurDTO";

interface PhysiqueProps {
  demandeur: Demandeur;
  setDemandeur: (value: Demandeur) => void;
  readonly?: boolean; // optionnel, false par défaut
}

const Physique: React.FC<PhysiqueProps> = ({
  demandeur,
  setDemandeur,
  readonly = false,
}) => {
  return (
    <IonList className="pt-0">
      <IonItem className="mb-2">
        <IonGrid className="p-0">
          <IonRow>
            <IonCol size="12" className="m-0 p-0">
              <IonInput
                readonly={readonly}
                label="Nom"
                placeholder="Enter le nom du demandeur"
                value={demandeur.nom}
                onIonInput={(e) =>
                  setDemandeur({ ...demandeur, nom: String(e.detail.value) })
                }
              />
            </IonCol>
            <IonCol size="12" className="m-0 p-0">
              <IonInput
                readonly={readonly}
                label="Prenom"
                placeholder="Enter le prenom du demandeur"
                value={demandeur.prenom}
                onIonInput={(e) =>
                  setDemandeur({ ...demandeur, prenom: String(e.detail.value) })
                }
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonItem>

      <IonCheckbox
        style={{ marginLeft: "20px" }}
        labelPlacement="end"
        checked={demandeur.neVers}
        disabled={readonly}
        onIonChange={(e) =>
          setDemandeur({ ...demandeur, neVers: Boolean(e.detail.checked) })
        }
      >
        Né vers (approximatif)
      </IonCheckbox>

      <IonItem>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              {demandeur.neVers ? (
                <IonInput
                  labelPlacement="stacked"
                  type="number"
                  label="Date de naissance*"
                  placeholder="Année (ex: 1985)"
                  min="1500"
                  max={new Date().getFullYear()}
                  readonly={readonly}
                  value={demandeur.dateNaissance ? demandeur.dateNaissance : ""}
                  onIonInput={(e) => {
                    const year = e.detail.value;
                    setDemandeur({ ...demandeur, dateNaissance: year ?? null });
                  }}
                />
              ) : (
                <IonInput
                  type="date"
                  labelPlacement="stacked"
                  label="Date de naissance*"
                  readonly={readonly}
                  value={
                    demandeur.dateNaissance
                      ? typeof demandeur.dateNaissance === "string"
                        ? demandeur.dateNaissance.substring(0, 10)
                        : new Date(demandeur.dateNaissance).toISOString().substring(0,10)
                      : ""
                  }
                  onIonInput={(e) =>
                    setDemandeur({
                      ...demandeur,
                      dateNaissance: e.detail.value ? e.detail.value : null, // On garde la string du format date HTML
                    })
                  }
                />
              )}
            </IonCol>
            <IonCol size="12">
              <IonInput
                type="text"
                labelPlacement="stacked"
                label="Lieu de naissance"
                placeholder="Entrer le lieu de naissance du demandeur"
                readonly={readonly}
                value={demandeur.lieuNaissance}
                onIonInput={(e) =>
                  setDemandeur({
                    ...demandeur,
                    lieuNaissance: String(e.detail.value),
                  })
                }
              />
            </IonCol>
            <IonCol size="12">
              <IonInput
                labelPlacement="stacked"
                label="Adresse"
                placeholder="Enter l'adresse du demandeur"
                readonly={readonly}
                value={demandeur.adresse}
                onIonInput={(e) =>
                  setDemandeur({
                    ...demandeur,
                    adresse: String(e.detail.value),
                  })
                }
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonItem>

      <IonItem>
        <IonLabel className="me-3 truncate">Sexe :</IonLabel>
        <IonRadioGroup
          value={demandeur.sexe}
          onIonChange={(e) => {
            if (readonly) return;
            setDemandeur({ ...demandeur, sexe: e.detail.value });
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <IonItem lines="none">
              <IonRadio justify="end" value="1" disabled={readonly}>
                Masculin
              </IonRadio>
            </IonItem>
            <IonItem lines="none">
              <IonRadio justify="end" value="0" disabled={readonly}>
                Féminin
              </IonRadio>
            </IonItem>
          </div>
        </IonRadioGroup>
      </IonItem>

      <IonItem className="custom-wrapper">
        <IonLabel className="me-3">Situation matrimoniale</IonLabel>
        <IonRadioGroup
          value={demandeur.situation}
          onIonChange={(e) => {
            if (readonly) return;
            setDemandeur({ ...demandeur, situation: e.detail.value });
          }}
        >
          <div className="radio-options">
            <IonItem lines="none">
              <IonRadio justify="end" value="0" disabled={readonly}>
                Célibataire
              </IonRadio>
            </IonItem>
            <IonItem lines="none">
              <IonRadio justify="end" value="1" disabled={readonly}>
                Marié(e)
              </IonRadio>
            </IonItem>
            <IonItem lines="none">
              <IonRadio justify="end" value="2" disabled={readonly}>
                Veuf(ve)
              </IonRadio>
            </IonItem>
          </div>
        </IonRadioGroup>
      </IonItem>

      <div style={{ marginLeft: "16px" }}>
        {(demandeur.situation === "1" || demandeur.situation === "2") && (
          <IonInput
            className="border-bottom"
            label="Nom du conjoint"
            placeholder="Enter le nom du conjoint du demandeur"
            readonly={readonly}
            value={demandeur.nomConjoint}
            onIonInput={(e) =>
              setDemandeur({
                ...demandeur,
                nomConjoint: String(e.detail.value),
              })
            }
          />
        )}
      </div>

      <div className="border-bottom" style={{ marginLeft: "15px" }}>
        <h5 className="mt-4">Filiation</h5>
        <IonGrid>
          <IonRow>
            <IonInput
              label="Nom du père"
              placeholder="Enter le nom du père demandeur"
              readonly={readonly}
              value={demandeur.nomPere}
              onIonInput={(e) =>
                setDemandeur({ ...demandeur, nomPere: String(e.detail.value) })
              }
            />
          </IonRow>
        </IonGrid>
        <IonGrid>
          <IonRow>
            <IonInput
              label="Nom de la mère"
              placeholder="Enter le nom de la mère du demandeur"
              readonly={readonly}
              value={demandeur.nomMere}
              onIonInput={(e) =>
                setDemandeur({ ...demandeur, nomMere: String(e.detail.value) })
              }
            />
          </IonRow>
        </IonGrid>
      </div>

      <IonItem>
        <IonLabel className="me-3">Pièces d'identification</IonLabel>
        <IonRadioGroup
          value={demandeur.piece}
          onIonChange={(e) => {
            if (readonly) return;
            setDemandeur({ ...demandeur, piece: Number(e.detail.value) });
          }}
        >
          <div className="radio-options">
            <IonItem lines="none">
              <IonRadio justify="end" value={2} disabled={readonly}>
                Neant
              </IonRadio>
            </IonItem>
            <IonItem lines="none">
              <IonRadio justify="end" value={0} disabled={readonly}>
                CIN
              </IonRadio>
            </IonItem>
            <IonItem lines="none">
              <IonRadio justify="end" value={1} disabled={readonly}>
                Acte de naissance
              </IonRadio>
            </IonItem>
          </div>
        </IonRadioGroup>
      </IonItem>

      {demandeur.piece === 0 && (
        <div>
          <h5 style={{ marginLeft: "20px" }} className="mt-4">
            CIN
          </h5>
          <div style={{ marginLeft: "20px" }} className="mb-3">
            <IonLabel position="stacked">Numéro</IonLabel>
            <div className="d-flex gap-2">
              {[0, 1, 2, 3].map((index) => (
                <IonInput
                  key={index}
                  className="form-control px-3"
                  style={{ width: "25%" }}
                  readonly={readonly}
                  value={demandeur.cin?.numero?.[index] || ""}
                  onIonInput={(e) => {
                    const value = e.detail.value || "";
                    const existingNumero = demandeur.cin?.numero ?? [
                      "",
                      "",
                      "",
                      "",
                    ];
                    const newNumero = [...existingNumero];
                    newNumero[index] = value;
                    setDemandeur({
                      ...demandeur,
                      cin: { ...demandeur.cin, numero: newNumero },
                    });
                  }}
                  maxlength={3}
                />
              ))}
            </div>
          </div>

          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    type="date"
                    label="Date CIN"
                    readonly={readonly}
                    value={
                      demandeur.cin?.date
                        ? demandeur.cin.date.toISOString().substring(0, 10)
                        : ""
                    }
                    onIonInput={(e) =>
                      setDemandeur({
                        ...demandeur,
                        cin: {
                          ...demandeur.cin,
                          date: e.detail.value
                            ? new Date(e.detail.value)
                            : null,
                        },
                      })
                    }
                  />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    type="text"
                    label="Lieu"
                    placeholder="Lieu du délivrance du CIN"
                    readonly={readonly}
                    value={demandeur.cin?.lieu || ""}
                    onIonInput={(e) =>
                      setDemandeur({
                        ...demandeur,
                        cin: { ...demandeur.cin, lieu: e.detail.value! },
                      })
                    }
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
        </div>
      )}

      {demandeur.piece === 1 && (
        <>
          <h5 className="mt-4" style={{ marginLeft: "20px" }}>
            Acte de naissance
          </h5>
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonInput
                    label="Numéro"
                    readonly={readonly}
                    value={demandeur.acte?.numero || ""}
                    placeholder="N154648464169"
                    onIonInput={(e) =>
                      setDemandeur({
                        ...demandeur,
                        acte: { ...demandeur.acte, numero: e.detail.value! },
                      })
                    }
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          <IonItem>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Lieu"
                    placeholder="Lieu de l'acte de naissance"
                    readonly={readonly}
                    value={demandeur.acte?.lieu}
                    onIonInput={(e) =>
                      setDemandeur({
                        ...demandeur,
                        acte: { ...demandeur.acte, lieu: e.detail.value || "" },
                      })
                    }
                  />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Date de l'acte de naissance"
                    type="date"
                    readonly={readonly}
                    value={
                      demandeur.acte?.date
                        ? demandeur.acte.date.toISOString().substring(0, 10)
                        : ""
                    }
                    onIonInput={(e) =>
                      setDemandeur({
                        ...demandeur,
                        acte: {
                          ...demandeur.acte,
                          date: e.detail.value
                            ? new Date(e.detail.value)
                            : null,
                        },
                      })
                    }
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
        </>
      )}
    </IonList>
  );
};

export default Physique;
