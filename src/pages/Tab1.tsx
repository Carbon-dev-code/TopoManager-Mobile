import React, { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAlert,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonTextarea,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import {
  trash,
  add,
  close,
  informationCircle,
  person,
  business,
  male,
  female,
  create,
} from "ionicons/icons";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab1.css";

// Interfaces
interface CIN {
  numero: string[];
  date: string;
  lieu: string;
}

interface ActeNaissance {
  numero: string;
  date: string;
  lieu: string;
}

interface Demandeur {
  id: string;
  type: "physique" | "morale";
  nom?: string;
  prenom?: string;
  neVers?: boolean;
  dateNaissance?: string;
  lieuNaissance?: string;
  sexe?: string;
  adresse?: string;
  nomPere?: string;
  nomMere?: string;
  situation?: string;
  nomConjoint?: string;
  piece?: "cin" | "acte" | "rien";
  cin?: CIN;
  acte?: ActeNaissance;
  denomination?: string;
  typeMorale?: string;
  dateCreation?: string;
  siege?: string;
  observations?: string;
}

interface Parcelle {
  id: string;
  code: string;
  type: string;
  demandeurs: Demandeur[];
}

interface TempParcelle {
  code: string;
  type: string;
  demandeurs: Demandeur[];
}

const STORAGE_KEY = "parcelles_data";

const Tab1: React.FC = () => {
  // États principaux
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [tempParcelle, setTempParcelle] = useState<TempParcelle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [currentParcelleCode, setCurrentParcelleCode] = useState("");
  const [typeParcelle, setTypeParcelle] = useState<string>("");

  // États du formulaire demandeur
  const [isPhysique, setIsPhysique] = useState(true);
  const [formData, setFormData] = useState<Partial<Demandeur>>({
    neVers: false,
    sexe: "",
    situation: "",
    piece: undefined,
    cin: { numero: ["", "", "", ""], date: "", lieu: "" },
    acte: { numero: "", date: "", lieu: "" },
  });

  // Alertes
  const [showDeleteAlert, setShowDeleteAlert] = useState({
    show: false,
    parcelleId: "",
    demandeurId: "",
  });

  // Charger/Sauvegarder les données
  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);
    };
    load();
  }, []);

  useEffect(() => {
    saveParcellesToStorage(parcelles);
  }, [parcelles]);

  // Fonctions stockage local
  const saveParcellesToStorage = async (parcelles: Parcelle[]) => {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(parcelles),
    });
  };

  const loadParcellesFromStorage = async (): Promise<Parcelle[]> => {
    const result = await Preferences.get({ key: STORAGE_KEY });
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

  // Création de parcelle avec demandeurs
  const createParcelle = async () => {
    if (!tempParcelle || !tempParcelle.code) return;

    const newParcelle: Parcelle = {
      id: Date.now().toString(),
      code: tempParcelle.code,
      type: tempParcelle.type,
      demandeurs: tempParcelle.demandeurs.map((d) => ({
        ...d,
        cin: d.piece === "cin" ? d.cin : undefined,
        acte: d.piece === "acte" ? d.acte : undefined,
      })),
    };

    const allParcelles = [...parcelles, newParcelle];
    setParcelles(allParcelles);
    setTempParcelle(null);
    setShowCreateModal(false);
  };

  const removeParcelle = (id: string) => {
    setParcelles(parcelles.filter((p) => p.id !== id));
  };

  // Gestion demandeurs
  const addDemandeur = () => {
    if (!tempParcelle) return;

    if (isPhysique) {
      if (!formData.nom || !formData.prenom || !formData.dateNaissance) {
        alert("Veuillez remplir les champs Nom, Prénom, Date de naissance");
        return;
      }
    } else {
      if (!formData.denomination) {
        alert("Veuillez saisir la dénomination");
        return;
      }
    }

    const newDemandeur: Demandeur = {
      id: Date.now().toString(),
      type: isPhysique ? "physique" : "morale",
      ...formData,
      cin: formData.piece === "cin" ? formData.cin : undefined,
      acte: formData.piece === "acte" ? formData.acte : undefined,
    };

    setTempParcelle({
      ...tempParcelle,
      demandeurs: [...tempParcelle.demandeurs, newDemandeur],
    });

    resetForm();
    setShowDemandeurModal(false);
  };

  // Suppression demandeur dans tempParcelle
  const removeDemandeurFromTemp = (id: string) => {
    if (!tempParcelle) return;
    setTempParcelle({
      ...tempParcelle,
      demandeurs: tempParcelle.demandeurs.filter((d) => d.id !== id),
    });
  };

  // Reset formulaire demandeur
  const resetForm = () => {
    setFormData({
      neVers: false,
      sexe: "",
      situation: "",
      piece: undefined,
      cin: { numero: ["", "", "", ""], date: "", lieu: "" },
      acte: { numero: "", date: "", lieu: "" },
      nomConjoint: "",
    });
    setIsPhysique(true);
  };

  // Gestion input formulaire demandeur
  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedChange = (
    field: "cin" | "acte",
    key: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  const handleCinNumberChange = (index: number, value: string) => {
    setFormData((prev) => {
      const currentCin = prev.cin || {
        numero: ["", "", "", ""],
        date: "",
        lieu: "",
      };
      const newNumero = [...currentCin.numero];
      newNumero[index] = value;

      return {
        ...prev,
        cin: {
          ...currentCin,
          numero: newNumero,
        },
      };
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Gestion Parcelles</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowCreateModal(true)}>
              <IonIcon icon={create} slot="start" />
              Ajouter
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {parcelles.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon
              icon={informationCircle}
              size="large"
              className="text-muted mb-3"
            />
            <h4 className="text-muted">Aucune parcelle enregistrée</h4>
            <IonButton onClick={() => setShowCreateModal(true)}>
              Créer une première parcelle
            </IonButton>
          </div>
        ) : (
          <div className="cards-grid">
            {parcelles.map((parcelle) => (
              <IonCard key={parcelle.id} className="row m-1">
                <span
                  className="position-badge-custom-tab1"
                  role="button"
                  color="danger"
                  onClick={() => removeParcelle(parcelle.id)}
                >
                  <IonIcon icon={trash} />
                </span>

                <div className="col-12 col-sm-6 col-md-4 d-flex flex-column justify-content-center">
                  <IonLabel className="parcelle-code">
                    Parcelle : {parcelle.code}
                  </IonLabel>

                  <IonBadge color="primary" className="mt-2 fit-content-tab1">
                    {parcelle.demandeurs.length} demandeur(s)
                  </IonBadge>
                  <IonLabel className="mt-1">
                    Type : <strong>{parcelle.type}</strong>
                  </IonLabel>
                </div>

                <div className="col">
                  {parcelle.demandeurs.length === 0 ? (
                    <p className="text-muted">Aucun demandeur pour cette parcelle</p>
                  ) : (
                    <IonList>
                      {parcelle.demandeurs.map((demandeur) => (
                        <IonItem key={demandeur.id}>
                          <IonIcon
                            slot="start"
                            icon={demandeur.type === "physique" ? person : business}
                          />
                          <IonLabel>
                            {demandeur.type === "physique"
                              ? `${demandeur.nom} ${demandeur.prenom}`
                              : demandeur.denomination}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              </IonCard>
            ))}
          </div>
        )}

        {/* Modal Création Parcelle */}
        <IonModal
          isOpen={showCreateModal}
          onDidDismiss={() => {
            setTempParcelle(null);
            setShowCreateModal(false);
            setCurrentParcelleCode("");
            setTypeParcelle("");
          }}
        >
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonButton
                  onClick={() => {
                    setTempParcelle(null);
                    setShowCreateModal(false);
                    setCurrentParcelleCode("");
                    setTypeParcelle("");
                  }}
                >
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>
                {tempParcelle ? "Ajouter des demandeurs" : "Nouvelle Parcelle"}
              </IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {!tempParcelle ? (
              <IonCard>
                <IonCardContent>
                  <IonInput
                    label="Code Parcelle"
                    labelPlacement="floating"
                    placeholder="Ex: 123-045-789"
                    value={currentParcelleCode}
                    onIonChange={(e) => setCurrentParcelleCode(e.detail.value || "")}
                    className="mb-3"
                  />

                  <IonSelect
                    label="Type de Parcelle"
                    labelPlacement="floating"
                    placeholder="Choisir un type"
                    value={typeParcelle}
                    onIonChange={(e) => setTypeParcelle(e.detail.value)}
                    className="mb-3"
                  >
                    <IonSelectOption value="TANIMBOLY">TANIMBOLY</IonSelectOption>
                    <IonSelectOption value="TANIMBARY">TANIMBARY</IonSelectOption>
                    <IonSelectOption value="DOBO">DOBO</IonSelectOption>
                  </IonSelect>

                  <IonButton
                    expand="block"
                    onClick={() => {
                      if (currentParcelleCode && typeParcelle) {
                        setTempParcelle({
                          code: currentParcelleCode,
                          type: typeParcelle,
                          demandeurs: [],
                        });
                        setCurrentParcelleCode("");
                        setTypeParcelle("");
                        setShowDemandeurModal(true);
                      }
                    }}
                    disabled={!currentParcelleCode || !typeParcelle}
                  >
                    <IonIcon icon={add} slot="start" />
                    Continuer pour ajouter des demandeurs
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ) : (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonLabel>
                      Parcelle: {tempParcelle.code} ({tempParcelle.type})
                    </IonLabel>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonButton
                      expand="block"
                      onClick={() => setShowDemandeurModal(true)}
                    >
                      <IonIcon icon={add} slot="start" />
                      Ajouter un demandeur
                    </IonButton>

                    {tempParcelle.demandeurs.length > 0 && (
                      <div className="mt-3">
                        <h5>Demandeurs ajoutés:</h5>
                        <IonList>
                          {tempParcelle.demandeurs.map((demandeur) => (
                            <IonItem key={demandeur.id}>
                              <IonLabel>
                                {demandeur.type === "physique"
                                  ? `${demandeur.nom} ${demandeur.prenom}`
                                  : demandeur.denomination}
                              </IonLabel>
                              <IonButton
                                fill="clear"
                                color="danger"
                                onClick={() => removeDemandeurFromTemp(demandeur.id)}
                              >
                                <IonIcon icon={trash} />
                              </IonButton>
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={createParcelle}
                  className="mt-3"
                  disabled={tempParcelle.demandeurs.length === 0}
                >
                  <IonIcon icon={create} slot="start" />
                  Créer la parcelle avec {tempParcelle.demandeurs.length} demandeur(s)
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* Modal Ajout Demandeur */}
        <IonModal
          isOpen={showDemandeurModal}
          onDidDismiss={() => {
            resetForm();
            setShowDemandeurModal(false);
            if (!tempParcelle) setShowCreateModal(false);
          }}
        >
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonButton
                  onClick={() => {
                    resetForm();
                    setShowDemandeurModal(false);
                  }}
                >
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Ajouter un demandeur</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <IonRadioGroup
              value={isPhysique}
              onIonChange={(e) => {
                setIsPhysique(e.detail.value);
                resetForm();
              }}
              className="mb-3"
            >
              <IonItem>
                <IonLabel>Personne Physique</IonLabel>
                <IonRadio slot="start" value={true} />
              </IonItem>
              <IonItem>
                <IonLabel>Personne Morale</IonLabel>
                <IonRadio slot="start" value={false} />
              </IonItem>
            </IonRadioGroup>

            {isPhysique ? (
              <>
                <IonInput
                  label="Nom"
                  labelPlacement="floating"
                  value={formData.nom || ""}
                  name="nom"
                  onIonChange={handleInputChange}
                  required
                />
                <IonInput
                  label="Prénom"
                  labelPlacement="floating"
                  value={formData.prenom || ""}
                  name="prenom"
                  onIonChange={handleInputChange}
                  required
                />

                <IonCheckbox
                  checked={formData.neVers}
                  onIonChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      neVers: e.detail.checked,
                    }))
                  }
                />
                <IonLabel>Né vers</IonLabel>

                <IonInput
                  label="Date de naissance"
                  labelPlacement="floating"
                  type="date"
                  value={formData.dateNaissance || ""}
                  name="dateNaissance"
                  onIonChange={handleInputChange}
                  disabled={formData.neVers}
                />
                <IonInput
                  label="Lieu de naissance"
                  labelPlacement="floating"
                  value={formData.lieuNaissance || ""}
                  name="lieuNaissance"
                  onIonChange={handleInputChange}
                  disabled={formData.neVers}
                />

                <IonRadioGroup
                  value={formData.sexe}
                  onIonChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sexe: e.detail.value,
                    }))
                  }
                >
                  <IonItem>
                    <IonLabel>Masculin</IonLabel>
                    <IonRadio slot="start" value="M" />
                  </IonItem>
                  <IonItem>
                    <IonLabel>Féminin</IonLabel>
                    <IonRadio slot="start" value="F" />
                  </IonItem>
                </IonRadioGroup>

                <IonInput
                  label="Adresse"
                  labelPlacement="floating"
                  value={formData.adresse || ""}
                  name="adresse"
                  onIonChange={handleInputChange}
                />

                <IonInput
                  label="Nom du père"
                  labelPlacement="floating"
                  value={formData.nomPere || ""}
                  name="nomPere"
                  onIonChange={handleInputChange}
                />

                <IonInput
                  label="Nom de la mère"
                  labelPlacement="floating"
                  value={formData.nomMere || ""}
                  name="nomMere"
                  onIonChange={handleInputChange}
                />

                <IonSelect
                  label="Situation matrimoniale"
                  value={formData.situation}
                  placeholder="Sélectionner"
                  onIonChange={(e) =>
                    setFormData((prev) => ({ ...prev, situation: e.detail.value }))
                  }
                >
                  <IonSelectOption value="celibataire">Célibataire</IonSelectOption>
                  <IonSelectOption value="marie">Marié(e)</IonSelectOption>
                  <IonSelectOption value="divorce">Divorcé(e)</IonSelectOption>
                  <IonSelectOption value="veuf">Veuf/Veuve</IonSelectOption>
                </IonSelect>

                <IonInput
                  label="Nom du conjoint"
                  labelPlacement="floating"
                  value={formData.nomConjoint || ""}
                  name="nomConjoint"
                  onIonChange={handleInputChange}
                />

                <IonSelect
                  label="Type de pièce"
                  value={formData.piece}
                  placeholder="Sélectionner"
                  onIonChange={(e) =>
                    setFormData((prev) => ({ ...prev, piece: e.detail.value }))
                  }
                >
                  <IonSelectOption value="cin">CIN</IonSelectOption>
                  <IonSelectOption value="acte">Acte de naissance</IonSelectOption>
                  <IonSelectOption value="rien">Aucune pièce</IonSelectOption>
                </IonSelect>

                {formData.piece === "cin" && (
                  <>
                    <IonLabel>Numéro CIN (4 parties)</IonLabel>
                    <div className="d-flex justify-content-between">
                      {formData.cin?.numero.map((num, idx) => (
                        <IonInput
                          key={idx}
                          value={num}
                          onIonChange={(e) =>
                            handleCinNumberChange(idx, e.detail.value || "")
                          }
                          className="cin-input"
                          maxlength={2}
                        />
                      ))}
                    </div>

                    <IonInput
                      label="Date de délivrance"
                      type="date"
                      value={formData.cin?.date || ""}
                      onIonChange={(e) =>
                        handleNestedChange("cin", "date", e.detail.value || "")
                      }
                    />
                    <IonInput
                      label="Lieu de délivrance"
                      value={formData.cin?.lieu || ""}
                      onIonChange={(e) =>
                        handleNestedChange("cin", "lieu", e.detail.value || "")
                      }
                    />
                  </>
                )}

                {formData.piece === "acte" && (
                  <>
                    <IonInput
                      label="Numéro acte"
                      value={formData.acte?.numero || ""}
                      onIonChange={(e) =>
                        handleNestedChange("acte", "numero", e.detail.value || "")
                      }
                    />
                    <IonInput
                      label="Date acte"
                      type="date"
                      value={formData.acte?.date || ""}
                      onIonChange={(e) =>
                        handleNestedChange("acte", "date", e.detail.value || "")
                      }
                    />
                    <IonInput
                      label="Lieu acte"
                      value={formData.acte?.lieu || ""}
                      onIonChange={(e) =>
                        handleNestedChange("acte", "lieu", e.detail.value || "")
                      }
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {/* Formulaire Personne Morale */}
                <IonInput
                  label="Dénomination"
                  labelPlacement="floating"
                  value={formData.denomination || ""}
                  name="denomination"
                  onIonChange={handleInputChange}
                />
                <IonSelect
                  label="Type Personne Morale"
                  value={formData.typeMorale || ""}
                  placeholder="Sélectionner"
                  onIonChange={(e) =>
                    setFormData((prev) => ({ ...prev, typeMorale: e.detail.value }))
                  }
                >
                  <IonSelectOption value="sarl">SARL</IonSelectOption>
                  <IonSelectOption value="sarlunipersonnelle">
                    SARL Unipersonnelle
                  </IonSelectOption>
                  <IonSelectOption value="sa">SA</IonSelectOption>
                  <IonSelectOption value="groupement">Groupement</IonSelectOption>
                  <IonSelectOption value="association">Association</IonSelectOption>
                  <IonSelectOption value="cooperative">Coopérative</IonSelectOption>
                </IonSelect>

                <IonInput
                  label="Date de création"
                  type="date"
                  value={formData.dateCreation || ""}
                  name="dateCreation"
                  onIonChange={handleInputChange}
                />

                <IonInput
                  label="Siège"
                  value={formData.siege || ""}
                  name="siege"
                  onIonChange={handleInputChange}
                />

                <IonTextarea
                  label="Observations"
                  value={formData.observations || ""}
                  name="observations"
                  onIonChange={handleInputChange}
                />
              </>
            )}

            <IonButton expand="block" onClick={addDemandeur} className="mt-3">
              <IonIcon icon={add} slot="start" />
              Ajouter le demandeur
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
