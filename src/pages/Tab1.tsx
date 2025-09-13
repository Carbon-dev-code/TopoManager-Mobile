import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonTextarea,
  IonIcon,
  IonCard,
  IonGrid,
  IonCol,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonToast,
  IonCardSubtitle,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  useIonViewWillEnter,
  IonSearchbar,
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
  sync,
  map,
  searchSharp,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab1.css";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { Categorie } from "../model/Categorie";
import { Status } from "../model/Status";
import { Parcelle } from "../model/parcelle/Parcelle";
import { Demandeur } from "../model/parcelle/Demandeur";
import { Riverin } from "../model/parcelle/Riverin";
import { Repere } from "../model/Repere";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import ModalRiverin from "../components/riverin/ModalRiverin";
import Photo from "../components/photo/Photo";
import SeacrhModal from "../components/demandeur/SearchModal";

const Tab1: React.FC = () => {
  const STORAGE_KEY = "parcelles_data";
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState<boolean>(false);
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] = useState<boolean>(false);
  const [showRiverin, setShowRiverin] = useState<boolean>(false);
  const [riverinMess, setRiverinMess] = useState<string>("Ajouter");
  const [currentIncrement, setCurrentIncrement] = useState(0);
  const [parametreTerritoire, setParametreTerritoire] = useState<ParametreTerritoire | null>(null);
  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [repereL, setRepere] = useState<Repere[]>([]);
  const [parcelle, setParcelle] = useState<Parcelle>(Parcelle.init());
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [demandeurList, setDemandeurList] = useState<Demandeur[]>([]);
  const [isPhysique, setIsPhysique] = useState(0);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [newRiverin, setNewRiverin] = useState<Riverin>(Riverin.init);
  const [activeTab, setActiveTab] = useState<"demandeur" | "riverin">(
    "demandeur"
  );
  const [decomposed, setDecomposed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const history = useHistory();
  const [seacrh, setSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState(""); // texte de recherche


  const handleCardClick = (codeParcelle: string) => {
    history.push(`/tab2?from=tab1&action=croquis&code=${codeParcelle}`);
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

  const loadDemandeurFromStorage = async (): Promise<Demandeur[]> => {
    const result = await Preferences.get({ key: "demandeur" });
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

  const load = async () => {
    setParcelles(await loadParcellesFromStorage());
    setDemandeurList(await loadDemandeurFromStorage());
  };

  useIonViewWillEnter(() => {
    load();
  });

  const nextCodeParcelle = async () => {
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });

      if (parametrePref.value) {
        const parametreActuel = JSON.parse(parametrePref.value);
        const newIncrement = (parametreActuel.increment || 0) + 1;
        const code_parcelle_complet = `${parametreActuel.region.coderegion}-${parametreActuel.district.codedistrict
          }-${parametreActuel.commune.codecommune}-${parametreActuel.fokontany.codefokontany
          }-${parametreActuel.hameau?.codehameau}-${newIncrement.toString()}`;

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

  useEffect(() => {
    if (showCreateModal) {
      nextCodeParcelle();
      getCategorie();
      getStatus();
      getRepere();
    }
  }, [showCreateModal]);

  const addDemandeur = async () => {
    parcelle.demandeurs.push(demandeur);
    await Preferences.set({ key: "demandeur", value: JSON.stringify(demandeur) });
    setDemandeur(Demandeur.init());
    setShowDemandeurModal(false);
  };

  const addRiverin = () => {
    if (newRiverin.repere == null || newRiverin.observation.trim() === "") {
      setRiverinMess("‼️Vérifiez votre insertion");
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
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });
      if (!parametrePref.value) throw new Error("Paramètres non configurés");
      const parametreActuel = JSON.parse(parametrePref.value);

      console.log(parcelle); // visualisation

      parcelles.push(parcelle);

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

      // 6. Mettre à jour l'incrément seulement après succès
      await Preferences.set({
        key: "parametreActuel",
        value: JSON.stringify({
          ...parametreActuel,
          increment: currentIncrement, // On utilise l'incrément déjà calculé
        }),
      });

      setParcelle(Parcelle.init);
      setShowCreateModal(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erreur création parcelle:", error.message);
        alert(`Erreur création: ${error.message}`);
      } else {
        console.error("Erreur inconnue lors de la création");
        alert("Erreur inconnue lors de la création");
      }
    }
  };

  // ⚡ On utilise useMemo pour retourner directement le tableau filtré
  const filteredParcelles = useMemo(() => {
    if (!searchQuery) return parcelles;
    const q = searchQuery.toLowerCase();
    return parcelles.filter((p) => {
      // Cherche dans le code de la parcelle
      if (p.code?.toLowerCase().includes(q)) return true;
      // Cherche dans les demandeurs
      if (
        p.demandeurs.some(
          (d) =>
            d.nom?.toLowerCase().includes(q) ||
            d.prenom?.toLowerCase().includes(q)
        )
      )
        return true;
      return false;
    });
  }, [searchQuery, parcelles]);

  const takePhotoParcelle = useCallback(async () => {
    try {
      if (parcelle.photos && parcelle.photos.length >= 5) {
        setToastMessage?.("Vous ne pouvez pas ajouter plus de 5 photos");
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!photo.dataUrl) throw new Error("Pas de photo");

      setParcelle((prev) => {
        const newParcelle = { ...prev };
        if (!newParcelle.photos) newParcelle.photos = [];
        newParcelle.photos.push(photo.dataUrl);
        return newParcelle;
      });
    } catch (err) {
      console.error(err);
      setToastMessage?.("Erreur lors de la capture");
    }
  }, [demandeur.photos, setDemandeur, setToastMessage]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Collecte des données</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label="Rechercher" onClick={() => setSearch(true)}>
              <IonIcon icon={searchSharp} slot="icon-only" />
            </IonButton>
            <IonButton
              aria-label="Créer une nouvelle parcelle"
              onClick={() => setShowCreateModal(true)}
            >
              <IonIcon icon={create} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {seacrh && (
        <IonToolbar className="transparent-toolbar">
          <IonSearchbar
            autoFocus
            showCancelButton="focus"
            className="custom-search"
            placeholder="Recherche numéro ou demandeur"
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
          />
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              size="large"
              color="danger"
              onClick={() => {
                setSearch(false);
                setSearchQuery(""); // réinitialise la recherche
              }}
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      )}

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
          <div className="cardContent">
            {(searchQuery ? filteredParcelles : parcelles).map((parcelle) => (
              <IonCard
                key={parcelle.code}
                className="custom-card"
                button
                onClick={() => handleCardClick(parcelle.code!)}
              >
                <span
                  className="position-badge-custom-tab1"
                  role="button"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation(); // pour ne pas déclencher le click sur la carte
                    removeParcelle(parcelle.code!);
                  }}
                >
                  <IonIcon icon={trash} />
                </span>

                <IonCardHeader className="custom-header-card">
                  <IonCardTitle>
                    <strong>{parcelle.code}</strong>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <IonChip
                      color={parcelle.synchronise === 1 ? "success" : "danger"}
                    >
                      <IonIcon
                        icon={sync}
                        color={
                          parcelle.synchronise === 1 ? "success" : "danger"
                        }
                      />
                      <IonLabel>
                        {parcelle.synchronise === 1
                          ? "Parcelle sync"
                          : "Parcelle non sync"}
                      </IonLabel>
                    </IonChip>
                    <IonChip
                      color={
                        !parcelle.polygone || parcelle.polygone.length === 0
                          ? "danger"
                          : "success"
                      }
                    >
                      <IonIcon
                        icon={map}
                        color={
                          !parcelle.polygone || parcelle.polygone.length === 0
                            ? "danger"
                            : "success"
                        }
                      />
                      <IonLabel>
                        {!parcelle.polygone || parcelle.polygone.length === 0
                          ? "Pas de croquis"
                          : "Avec croquis"}
                      </IonLabel>
                    </IonChip>
                  </IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonList className="scrollable-list">
                    {parcelle.demandeurs.map((demandeur) => (
                      <IonItem key={`dem${demandeur.id}`} lines="none">
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
                </IonCardContent>
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
                  <IonCol size="12">
                    <IonInput
                      labelPlacement="floating"
                      type="date"
                      value={parcelle.dateCreation}
                      readonly={true}
                    >
                      <div slot="label">En date du</div>
                    </IonInput>
                  </IonCol>
                  <IonCol size="12">
                    <IonInput
                      labelPlacement="floating"
                      type="text"
                      readonly={true}
                      value={parcelle.code}
                    >
                      <div slot="label">Code parcelle</div>
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
                      label="Durée d'occupation :"
                      type="number"
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
                      onIonChange={(e) =>
                        setParcelle({
                          ...parcelle,
                          revandication: e.detail.checked,
                        })
                      }
                    >
                      Revendication
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
                    <IonButton
                      expand="full"
                      color="tertiary"
                      onClick={() => setShowSearchDemandeurModal(true)}
                    >
                      Recherche demandeur
                    </IonButton>
                  </IonCol>
                  <IonCol size="12" size-md="4">
                    <IonButton
                      expand="full"
                      onClick={() => setShowRiverin(true)}
                    >
                      Ajout riverain
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
                    <IonLabel>Riverains</IonLabel>
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
                            {d.type === 0
                              ? `${d.nom} ${d.prenom}`
                              : d.denomination}
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
                            🧭 {["Nord", "Est", "Sud", "Ouest"][r.repere! - 1]}
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
              <Photo
                photos={parcelle.photos}
                decomposed={decomposed} setDecomposed={setDecomposed}
                takePhoto={takePhotoParcelle} // Pas de photo ici
                clearPhotos={() => { setParcelle({ ...parcelle, photos: [] }); }}
                name="Prendre une photo de groupe"

              />
            </IonItem>

            <IonItem>
              <IonGrid className="ion-margin-bottom">
                <IonRow className="ion-wrap ion-gap">
                  <IonCol size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Région</small>
                      <div>
                        <strong>{parametreTerritoire?.region.nomregion}</strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">District</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.district.nomdistrict}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Commune</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.commune.nomcommune}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Fokontany</small>
                      <div>
                        <strong>
                          {parametreTerritoire?.fokontany.nomfokontany}
                        </strong>
                      </div>
                    </div>
                  </IonCol>

                  <IonCol size-md="4" size-lg="2">
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
      <ModalRiverin
        showRiverin={showRiverin} setShowRiverin={setShowRiverin}
        addRiverin={addRiverin}
        riverinMess={riverinMess}
        repereL={repereL}
        newRiverin={newRiverin} setNewRiverin={setNewRiverin}
      />

      {/** Modal de recharche de demandeur **/}
      <SeacrhModal
        showSearchModal={showSearchDemandeurModal} setShowSearchModal={setShowSearchDemandeurModal}
        demandeurs={demandeurList}
        onSelect={(d) => parcelle.demandeurs.push(d)}
      />

      {/**Modal creation demandeur*/}
      <ModalDemandeur
        showCreateModal={showDemandeurModal} setShowCreateModal={setShowDemandeurModal}
        demandeur={demandeur} setDemandeur={setDemandeur}
        addDemandeur={addDemandeur}
        toastMessage={toastMessage} setToastMessage={setToastMessage}
        isPhysique={isPhysique} setIsPhysique={setIsPhysique}
        decomposed={decomposed} setDecomposed={setDecomposed}
      />
    </IonPage>
  );
};

export default Tab1;
