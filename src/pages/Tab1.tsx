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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonTextarea,
  IonIcon,
  IonCard,
  IonRadioGroup,
  IonRadio,
  IonGrid,
  IonCol,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonToast,
} from "@ionic/react";
import {
  trash,
  close,
  informationCircle,
  person,
  business,
  create,
  personOutline,
  businessOutline,
} from "ionicons/icons";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab1.css";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { Categorie } from "../model/Categorie";
import { Status } from "../model/Status";
import { Parcelle } from "../model/parcelle/Parcelle";
import { Demandeur } from "../model/parcelle/Demandeur";
import { Riverin } from "../model/parcelle/Riverin";
import { Repere } from "../model/Repere";
import { TypeMoral } from "../model/TypeMoral";

const Tab1: React.FC = () => {
  const STORAGE_KEY = "parcelles_data";
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState<boolean>(false);
  const [showRiverin, setShowRiverin] = useState<boolean>(false);
  const [riverinMess, setRiverinMess] = useState<string>("Ajouter");
  const [currentParcelleCode, setCurrentParcelleCode] = useState("");
  const [currentIncrement, setCurrentIncrement] = useState(0);
  const [parametreTerritoire, setParametreTerritoire] =
    useState<ParametreTerritoire | null>(null);
  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [repereL, setRepere] = useState<Repere[]>([]);
  const [typeMoral, setTypeMoral] = useState<TypeMoral[]>([]);

  const [parcelle, setParcelle] = useState<Parcelle>(Parcelle.init());
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [newRiverin, setNewRiverin] = useState<Riverin>(Riverin.init);
  const [activeTab, setActiveTab] = useState<"demandeur" | "riverin">(
    "demandeur"
  );

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

  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);
    };
    load();
  }, []);

  const nextCodeParcelle = async () => {
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });

      if (parametrePref.value) {
        const parametreActuel = JSON.parse(parametrePref.value);
        const newIncrement = (parametreActuel.increment || 0) + 1;
        const code_parcelle_complet = `${parametreActuel.region.coderegion}-${
          parametreActuel.district.codedistrict
        }-${parametreActuel.commune.codecommune}-${
          parametreActuel.fokontany.codefokontany
        }-${parametreActuel.hameau?.codehameau}-${newIncrement.toString()}`;

        setCurrentParcelleCode(code_parcelle_complet);
        setCurrentIncrement(newIncrement);
        setParametreTerritoire(parametreActuel);

        setParcelle((prev) => ({
          ...prev,
          code: code_parcelle_complet,
          dateCreation: new Date().toISOString().split("T")[0],
          parametreTerritoire: parametreActuel,
        }));
      }
    } catch (error) {
      console.error("Erreur dans nextCodeParcelle:", error);
    }
  };

  const getCategorie = async () => {
    const { value } = await Preferences.get({ key: "categorieData" });
    if (value) {
      setCategorie(JSON.parse(value));
    }
  };

  const getStatus = async () => {
    const { value } = await Preferences.get({ key: "statusData" });

    if (value) {
      setStatus(JSON.parse(value));
    }
  };

  const getRepere = async () => {
    const { value } = await Preferences.get({ key: "repereData" });

    if (value) {
      setRepere(JSON.parse(value));
    }
  };

  const getTypeMoral = async () => {
    const { value } = await Preferences.get({ key: "typeMoralData" });

    if (value) {
      setTypeMoral(JSON.parse(value));
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      nextCodeParcelle();
      getCategorie();
      getStatus();
      getRepere();
      getTypeMoral();
    }
  }, [showCreateModal]);

  const addDemandeur = () => {
    parcelle.demandeurs.push(demandeur);
    console.log(demandeur);
    setDemandeur(Demandeur.init);
    setShowDemandeurModal(false);
  };

  const addRiverin = () => {
    if (newRiverin.repere == null || newRiverin.observation.trim() === "") {
      setRiverinMess("😡 Vérifiez votre insertion");
      return; // stop ici
    }
    parcelle.riverin.push(newRiverin);
    console.log(newRiverin);
    setNewRiverin(Riverin.init);
    setRiverinMess("✅ Riverin ajouté");
  };

  const removeParcelle = (code: string) => {
    //Fonction remove mila fafana ny ao am stockage
    setParcelles(parcelles.filter((p) => p.code !== code));
  };

  const createParcelle = async () => {
    console.log(parcelle);
    parcelles.push(parcelle);

    /*
    const existing = await Preferences.get({ key: STORAGE_KEY });
    let oldParcelles: Parcelle[] = [];
    if (existing.value) {
      oldParcelles = JSON.parse(existing.value);
    }
    const allParcelles = [...oldParcelles, parcelle];
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(allParcelles),
    });
    */
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

      <IonContent>
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
              <IonCard key={parcelle.code} className="row m-1">
                <span
                  className="position-badge-custom-tab1"
                  role="button"
                  color="danger"
                  onClick={() => removeParcelle(parcelle.code!!)}
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
                </div>

                <div className="col">
                  {parcelle.demandeurs.length === 0 ? (
                    <p className="text-muted">
                      Aucun demandeur pour cette parcelle
                    </p>
                  ) : (
                    <IonList>
                      {parcelle.demandeurs.map((demandeur) => (
                        <IonItem key={`dem` + demandeur.id}>
                          <IonIcon
                            slot="start"
                            icon={demandeur.type === 0 ? person : business}
                          />
                          <IonLabel>
                            {demandeur.type === 0
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
      </IonContent>

      {/*Modal creation de parcelle*/}
      <IonModal
        isOpen={showCreateModal}
        onDidDismiss={() => {
          setShowCreateModal(false);
        }}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton
                onClick={() => {
                  setShowCreateModal(false);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Nouvelle parcelle</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonList>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonInput
                      labelPlacement="floating"
                      type="text"
                      readonly={true}
                      value={parcelle.code}
                    >
                      <div slot="label">Code parcelle</div>
                    </IonInput>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonInput
                      labelPlacement="floating"
                      type="date"
                      value={parcelle.dateCreation}
                      readonly={true}
                    >
                      <div slot="label">En date du</div>
                    </IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>

            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonSelect
                      label="Status :"
                      value={parcelle.status}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          status: Number(e.detail.value),
                        })
                      }
                      placeholder="Status de terre"
                    >
                      {status.map((stat, index) => (
                        <IonSelectOption
                          key={`status-${index}`}
                          value={stat.id}
                        >
                          {stat.labelstatus}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonInput
                      label="Année d'occupation :"
                      type="number"
                      value={parcelle.anneeOccup}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          anneeOccup: Number(e.detail.value),
                        })
                      }
                      placeholder="Nombre d'année"
                    ></IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonSelect
                      label="Catégorie :"
                      value={parcelle.categorie}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          categorie: Number(e.detail.value),
                        })
                      }
                      placeholder="Catégorie de terre"
                    >
                      {categorie.map((cat, index) => (
                        <IonSelectOption
                          key={`categorie-${index}`}
                          value={cat.idcategorie}
                        >
                          {cat.labelcategorie}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonInput
                      label="Consistance :"
                      type="text"
                      value={parcelle.consistance}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          consistance: String(e.detail.value),
                        })
                      }
                      placeholder="Consistance du terrain"
                    ></IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonCheckbox
                      labelPlacement="start"
                      checked={parcelle.oppossition}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          oppossition: e.detail.checked,
                        })
                      }
                    >
                      Opposition
                    </IonCheckbox>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonCheckbox
                      labelPlacement="start"
                      checked={parcelle.revandication}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          revandication: e.detail.checked,
                        })
                      }
                    >
                      Revandication
                    </IonCheckbox>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow className="justify-content-between text-center">
                  <IonCol size="12" size-md="4">
                    <IonButton
                      expand="full"
                      onClick={() => setShowDemandeurModal(true)}
                    >
                      Ajout demandeur
                    </IonButton>
                  </IonCol>
                  <IonCol size="12" size-md="4">
                    <IonButton expand="full" color="tertiary">
                      Recherche demandeur
                    </IonButton>
                  </IonCol>
                  <IonCol size="12" size-md="4">
                    <IonButton
                      expand="full"
                      onClick={() => setShowRiverin(true)}
                    >
                      Ajout riverin
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <div className="tabs-wrapper">
              {/* Conteneur fixe pour le segment */}
              <div className="tabs-header">
                <IonSegment
                  value={activeTab}
                  onIonChange={(e) =>
                    setActiveTab(e.detail.value as "demandeur" | "riverin")
                  }
                >
                  <IonSegmentButton value="demandeur">
                    <IonLabel>Demandeurs</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="riverin">
                    <IonLabel>Riverins</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>

              {/* Contenu scrollable */}
              <div className="tab-content-scroll">
                {activeTab === "demandeur" && (
                  <div className="demandeur-list">
                    {parcelle.demandeurs.map((d, i) => (
                      <IonItem key={i} lines="none" className="custom-item">
                        <IonIcon
                          icon={d.type === 0 ? personOutline : businessOutline}
                          slot="start"
                          color="primary"
                          style={{ fontSize: "24px", marginRight: "12px" }}
                        />
                        <IonLabel>
                          <h3 style={{ marginBottom: 4 }}>
                            {d.type === 0 ? `${d.nom} ${d.prenom}` : d.denomination}
                          </h3>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                )}

                {activeTab === "riverin" && (
                  <div className="riverin-list">
                    {parcelle.riverin?.map((r, i) => (
                      <IonItem key={i} lines="none" className="custom-item">
                        <IonLabel>
                          <h3 style={{ marginBottom: 4 }}>
                            🧭 {["Nord", "Est", "Sud", "Ouest"][r.repere!! - 1]}
                          </h3>
                          <p style={{ margin: 0 }}>📝 {r.observation}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <IonItem>
              <IonGrid className="ion-margin-bottom">
                <IonRow className="ion-wrap ion-gap">
                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Région</small>
                      <div>
                        <strong>{parametreTerritoire?.region.nomregion}</strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">District</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.district.nomdistrict}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Commune</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.commune.nomcommune}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Fokontany</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.fokontany.nomfokontany}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Hameau</small>
                      <div>
                        <strong>{parametreTerritoire?.hameau.nomhameau}</strong>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonTextarea
                      label="Observation"
                      value={parcelle.observation}
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          observation: e.detail.value || "",
                        })
                      }
                      labelPlacement="stacked"
                      placeholder="Votre observation sur la parcelle"
                    ></IonTextarea>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
          </IonList>
          <IonButton expand="full" onClick={createParcelle}>
            Enregistrer la parcelle
          </IonButton>
        </IonContent>
      </IonModal>

      {/**Modal riverin */}
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
            <IonTitle>Ajout de nouveau riverin au parcelle</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={addRiverin} id="open-loading">
                Ajouter
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonToast
            trigger="open-loading"
            message={riverinMess}
            duration={900}
          ></IonToast>
          <IonList>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonSelect
                      label="Repère :"
                      value={newRiverin.repere}
                      onIonChange={(e) =>
                        setNewRiverin({
                          ...newRiverin,
                          repere: Number(e.detail.value),
                        })
                      }
                      placeholder="Riverin du parcelle"
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
                    ></IonTextarea>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>

      {/**Modal creation demandeur*/}
      <IonModal
        isOpen={showDemandeurModal}
        onDidDismiss={() => {
          setShowDemandeurModal(false);
        }}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={() => setShowDemandeurModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Ajouter Demandeur</IonTitle>
            <IonButtons slot="end">
              <IonButton strong={true} onClick={addDemandeur}>
                Ajouter
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            <IonItem>
              <IonLabel className="me-3">Type de Personne :</IonLabel>
              <IonRadioGroup
                value={isPhysique.toString()}
                onIonChange={(e) => {
                  const value = Number(e.detail.value);
                  setIsPhysique(value);
                  setDemandeur({
                    ...demandeur,
                    type: Number(value), // Si type doit être une string
                  });
                }}
              >
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <IonItem lines="none">
                    <IonRadio justify="end" value="0">
                      Physique
                    </IonRadio>
                  </IonItem>
                  <IonItem lines="none">
                    <IonRadio justify="end" value="1">
                      Morale
                    </IonRadio>
                  </IonItem>
                </div>
              </IonRadioGroup>
            </IonItem>
          </IonList>
          {isPhysique === 0 ? (
            <>
              <IonList>
                <IonItem className="mb-2">
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonInput
                          label="Nom"
                          placeholder="Enter le nom du demandeur"
                          value={demandeur.nom}
                          onIonChange={(e) =>
                            setDemandeur({
                              ...demandeur,
                              nom: String(e.detail.value),
                            })
                          }
                        />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput
                          label="Prenom"
                          placeholder="Enter le prenom du demandeur"
                          value={demandeur.prenom}
                          onIonChange={(e) =>
                            setDemandeur({
                              ...demandeur,
                              prenom: String(e.detail.value),
                            })
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
                      <IonCol size="12" size-md="6">
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
                      <IonCol size="12" size-md="6">
                        <IonInput
                          labelPlacement="stacked"
                          label="Lieu de naissance"
                          placeholder="Entrer le lieu de naissance du demandeur"
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
                <IonItem>
                  <IonInput
                    label="Adresse"
                    placeholder="Enter l'adresse du demandeur"
                    value={demandeur.adresse}
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        adresse: String(e.detail.value),
                      })
                    }
                  />
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
                        <IonRadio justify="end" value={0}>
                          CIN
                        </IonRadio>
                      </IonItem>
                      <IonItem lines="none">
                        <IonRadio justify="end" value={1}>
                          Acte de naissance
                        </IonRadio>
                      </IonItem>
                      <IonItem lines="none">
                        <IonRadio justify="end" value={2}>
                          Rien
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
            </>
          ) : (
            <>
              <IonList>
                <IonItem>
                  <IonSelect
                    label="Type :"
                    value={demandeur.typeMorale}
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        typeMorale: e.detail.value!!,
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
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        denomination: e.detail.value!!,
                      })
                    }
                    placeholder="Dénomination"
                  ></IonInput>
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Date de création :"
                    type="date"
                    value={demandeur.dateCreation}
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        dateCreation: e.detail.value!!,
                      })
                    }
                    placeholder="Date de creation"
                  ></IonInput>
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Siège :"
                    type="text"
                    value={demandeur.siege}
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        siege: e.detail.value!!,
                      })
                    }
                    placeholder="Siège"
                  ></IonInput>
                </IonItem>
                <IonItem>
                  <IonTextarea
                    label="Observations"
                    rows={4}
                    placeholder="Saisir des remarques ou notes..."
                    value={demandeur.observations}
                    onIonChange={(e) =>
                      setDemandeur({
                        ...demandeur,
                        observations: e.detail.value!!,
                      })
                    }
                  />
                </IonItem>
              </IonList>
            </>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Tab1;
