import React from "react";
import {
    IonList, IonItem, IonInput, IonCheckbox, IonGrid, IonRow, IonCol,
    IonLabel, IonRadioGroup, IonRadio
} from "@ionic/react";

interface PhysiqueProps {
    demandeur: any;
    setDemandeur: (value: any) => void;
}

const Physique: React.FC<PhysiqueProps> = ({ demandeur, setDemandeur }) => {
    return (
        <IonList className="pt-0">
            <IonItem className="mb-2">
                <IonGrid className="p-0">
                    <IonRow>
                        <IonCol size="12" className="m-0 p-0">
                            <IonInput
                                label="Nom"
                                placeholder="Enter le nom du demandeur"
                                value={demandeur.nom}
                                onIonChange={(e) => setDemandeur({ ...demandeur, nom: String(e.detail.value) })}
                            />
                        </IonCol>
                        <IonCol size="12" className="m-0 p-0">
                            <IonInput
                                label="Prenom"
                                placeholder="Enter le prenom du demandeur"
                                value={demandeur.prenom}
                                onIonChange={(e) => setDemandeur({ ...demandeur, prenom: String(e.detail.value) })
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
                onIonChange={(e) =>
                    setDemandeur({
                        ...demandeur,
                        neVers: Boolean(e.detail.checked),
                    })
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
                                    value={
                                        demandeur.dateNaissance
                                            ? demandeur.dateNaissance.getFullYear()
                                            : ""
                                    }
                                    onIonChange={(e) => {
                                        const year = e.detail.value;
                                        if (year && year.length === 4) {
                                            const date = new Date(`${year}-01-01`);
                                            setDemandeur({
                                                ...demandeur,
                                                dateNaissance: date,
                                            });
                                        } else {
                                            setDemandeur({
                                                ...demandeur,
                                                dateNaissance: null,
                                            });
                                        }
                                    }}
                                />
                            ) : (
                                <IonInput
                                    type="date"
                                    labelPlacement="stacked"
                                    label="Date de naissance*"
                                    value={
                                        demandeur.dateNaissance
                                            ? demandeur.dateNaissance
                                                .toISOString()
                                                .substring(0, 10)
                                            : ""
                                    }
                                    onIonChange={(e) =>
                                        setDemandeur({
                                            ...demandeur,
                                            dateNaissance: e.detail.value
                                                ? new Date(e.detail.value)
                                                : null,
                                        })
                                    }
                                />
                            )}
                        </IonCol>
                        <IonCol size="12">
                            <IonInput
                                labelPlacement="stacked"
                                label="Lieu de naissance"
                                placeholder="Entrer le lieu de naissance du demandeur"
                            ></IonInput>
                        </IonCol>
                        <IonCol size="12">
                            <IonInput
                                labelPlacement="stacked"
                                label="Adresse"
                                placeholder="Enter l'adresse du demandeur"
                                onIonChange={(e) =>
                                    setDemandeur({
                                        ...demandeur,
                                        adresse: String(e.detail.value),
                                    })
                                }
                            ></IonInput>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonItem>
            <IonItem>
                <IonLabel className="me-3">Sexe :</IonLabel>
                <IonRadioGroup
                    value={demandeur.sexe}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            sexe: e.detail.value,
                        })
                    }
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <IonItem lines="none">
                            <IonRadio justify="end" value="1">
                                Masculin
                            </IonRadio>
                        </IonItem>
                        <IonItem lines="none">
                            <IonRadio justify="end" value="0">
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
                    onIonChange={(e) =>
                        setDemandeur({ ...demandeur, situation: e.detail.value })
                    }
                >
                    <div className="radio-options">
                        <IonItem lines="none">
                            <IonRadio justify="end" value="0">
                                Célibataire
                            </IonRadio>
                        </IonItem>
                        <IonItem lines="none">
                            <IonRadio justify="end" value="1">
                                Marié(e)
                            </IonRadio>
                        </IonItem>
                        <IonItem lines="none">
                            <IonRadio justify="end" value="2">
                                Veuf(ve)
                            </IonRadio>
                        </IonItem>
                    </div>
                </IonRadioGroup>
            </IonItem>

            <div style={{ marginLeft: "16px" }}>
                {(demandeur.situation === "1" ||
                    demandeur.situation === "2") && (
                        <IonInput
                            className="border-bottom"
                            label="Nom du conjoint"
                            placeholder="Enter le nom de la mère du demandeur"
                            value={demandeur.nomConjoint}
                            onIonChange={(e) =>
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
                            value={demandeur.nomPere}
                            onIonChange={(e) =>
                                setDemandeur({
                                    ...demandeur,
                                    nomPere: String(e.detail.value),
                                })
                            }
                        />
                    </IonRow>
                </IonGrid>
                <IonGrid>
                    <IonRow>
                        <IonInput
                            label="Nom de la mère"
                            placeholder="Enter le nom de la mère du demandeur"
                            value={demandeur.nomMere}
                            onIonChange={(e) =>
                                setDemandeur({
                                    ...demandeur,
                                    nomMere: String(e.detail.value),
                                })
                            }
                        />
                    </IonRow>
                </IonGrid>
            </div>
            <IonItem>
                <IonLabel className="me-3">Pièces d'identification</IonLabel>
                <IonRadioGroup
                    value={demandeur.piece}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            piece: Number(e.detail.value),
                        })
                    }
                >
                    <div className="radio-options">
                        <IonItem lines="none">
                            <IonRadio justify="end" value={2}>
                                Neant
                            </IonRadio>
                        </IonItem>
                        <IonItem lines="none">
                            <IonRadio justify="end" value={0}>
                                CIN
                            </IonRadio>
                        </IonItem>
                        <IonItem lines="none">
                            <IonRadio justify="end" value={1}>
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
                                    value={demandeur.cin?.numero?.[index] || ""}
                                    onIonChange={(e) => {
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
                                            cin: {
                                                ...demandeur.cin,
                                                numero: newNumero,
                                            },
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
                                        value={
                                            demandeur.cin?.date
                                                ? demandeur.cin.date
                                                    .toISOString()
                                                    .substring(0, 10)
                                                : ""
                                        }
                                        onIonChange={(e) =>
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
                                        value={demandeur.cin?.lieu || ""}
                                        onIonChange={(e) =>
                                            setDemandeur({
                                                ...demandeur,
                                                cin: {
                                                    ...demandeur.cin,
                                                    lieu: e.detail.value!,
                                                },
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
                                        value={demandeur.acte?.numero || ""}
                                        onIonChange={(e) =>
                                            setDemandeur({
                                                ...demandeur,
                                                acte: {
                                                    ...demandeur.acte,
                                                    numero: e.detail.value!,
                                                },
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
                                        value={demandeur.acte?.lieu}
                                        onIonChange={(e) =>
                                            setDemandeur({
                                                ...demandeur,
                                                acte: {
                                                    ...demandeur.acte,
                                                    lieu: e.detail.value || "",
                                                },
                                            })
                                        }
                                    />
                                </IonCol>
                                <IonCol size="12" sizeMd="6">
                                    <IonInput
                                        label="Date de l'acte de naissance"
                                        type="date"
                                        value={
                                            demandeur.acte?.date
                                                ? demandeur.acte.date
                                                    .toISOString()
                                                    .substring(0, 10)
                                                : ""
                                        }
                                        onIonChange={(e) =>
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
