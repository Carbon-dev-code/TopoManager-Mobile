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
  IonIcon,
  IonCard,
  IonCardSubtitle,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonLabel,
  useIonViewWillEnter,
  IonSearchbar,
} from "@ionic/react";
import {
  close,
  informationCircle,
  create,
  sync,
  map,
  searchSharp,
  ellipsisVerticalOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab1.css";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { Categorie } from "../model/Categorie";
import { Status } from "../model/Status";
import { Parcelle } from "../model/parcelle/Parcelle";
import { checkDemandeur, Demandeur } from "../model/parcelle/Demandeur";
import { Riverin } from "../model/parcelle/Riverin";
import { Repere } from "../model/Repere";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import ModalRiverin from "../components/riverin/ModalRiverin";
import SeacrhModal from "../components/demandeur/SearchModal";
import DemandeurView from "../components/demandeur/DemandeurView";
import ParcelleForm from "../components/parcelle/ParcelleForm";
import {deleteParcelle,getAllDemandeurs,getAllParcelles,insertParcelle,verifyDatabase,} from "../model/base/DbSchema";
import Alert from "../components/alert/Alert";
import DropDown from "../components/dropdown/DropDown";
import { Directory, Filesystem } from "@capacitor/filesystem";

// Hook personnalisé pour la gestion des données de référence
const useReferenceData = () => {
  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [repereL, setRepere] = useState<Repere[]>([]);

  const loadReferenceData = useCallback(async () => {
    const [categorieData, statusData, repereData] = await Promise.all([
      Preferences.get({ key: "categorieData" }),
      Preferences.get({ key: "statusData" }),
      Preferences.get({ key: "repereData" }),
    ]);

    if (categorieData.value) setCategorie(JSON.parse(categorieData.value));
    if (statusData.value) setStatus(JSON.parse(statusData.value));
    if (repereData.value) setRepere(JSON.parse(repereData.value));
  }, []);

  return { categorie, setCategorie, status, repereL, loadReferenceData };
};

// Hook personnalisé pour la génération du code parcelle
const useParcelleCode = () => {
  const [currentIncrement, setCurrentIncrement] = useState(0);
  const [parametreTerritoire, setParametreTerritoire] =
    useState<ParametreTerritoire | null>(null);

  const generateNextCode = useCallback(async () => {
    try {
      const [parametrePref, devicePref] = await Promise.all([
        Preferences.get({ key: "parametreActuel" }),
        Preferences.get({ key: "device_id" }),
      ]);

      if (!parametrePref.value || !devicePref.value) return null;

      const parametreActuel = JSON.parse(parametrePref.value);
      const deviceId = JSON.parse(devicePref.value);
      const newIncrement = (parametreActuel.increment || 0) + 1;

      const { region, district, commune, fokontany, hameau } = parametreActuel;
      const code = `${deviceId}-${region.coderegion}-${district.codedistrict}-${commune.codecommune}-${fokontany.codefokontany}-${hameau?.codehameau}-${newIncrement}`;

      setCurrentIncrement(newIncrement);
      setParametreTerritoire(parametreActuel);

      const now = new Date();
      const dateTime = now.toISOString().replace("T", " ").split(".")[0];

      return {
        code,
        dateCreation: dateTime,
        parametreTerritoire: parametreActuel,
      };
    } catch (error) {
      console.error("Erreur génération code parcelle:", error);
      return null;
    }
  }, []);

  const saveIncrement = useCallback(async () => {
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });
      if (!parametrePref.value) throw new Error("Paramètres non configurés");

      const parametreActuel = JSON.parse(parametrePref.value);
      await Preferences.set({
        key: "parametreActuel",
        value: JSON.stringify({
          ...parametreActuel,
          increment: currentIncrement,
        }),
      });
    } catch (error) {
      console.error("Erreur sauvegarde incrément:", error);
      throw error;
    }
  }, [currentIncrement]);

  return { parametreTerritoire, generateNextCode, saveIncrement };
};

const Tab1: React.FC = () => {
  const history = useHistory();

  // États UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] =
    useState(false);
  const [showRiverin, setShowRiverin] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [showAlertRemove, setShowAlertRemove] = useState(false);
  const [showAlertVerif, setShowAlertVerif] = useState(false);
  const [verifMessageError, setVerifMessageError] = useState<string | null>(
    null,
  );
  const [codeToRemove, setCodeToRemove] = useState<string | null>(null);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [tempAlertMessage, setTempAlertMessage] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"demandeur" | "riverin">(
    "demandeur",
  );
  const [decomposed, setDecomposed] = useState(false);
  const [isPhysique, setIsPhysique] = useState(0);

  // États données
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [demandeurList, setDemandeurList] = useState<Demandeur[]>([]);
  const [parcelle, setParcelle] = useState<Parcelle>(Parcelle.init());
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [newRiverin, setNewRiverin] = useState<Riverin>(Riverin.init);
  const [riverinMess, setRiverinMess] = useState("Ajouter");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setSelectedParcelle] = useState<Parcelle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalParcelles, setTotalParcelles] = useState(0);
  const ITEMS_PER_PAGE = 13;

  // Hooks personnalisés
  const { categorie, setCategorie, status, repereL, loadReferenceData } =
    useReferenceData();
  const { parametreTerritoire, generateNextCode, saveIncrement } =
    useParcelleCode();

  // Chargement initial
  const loadData = useCallback(async (page: number = 1) => {
    const [{ data, total }, demandeursData] = await Promise.all([getAllParcelles(page, ITEMS_PER_PAGE),getAllDemandeurs(),]);
    setParcelles(data);
    setTotalParcelles(total);
    setDemandeurList(demandeursData);
  }, []);

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  useIonViewWillEnter(() => {
    loadData(currentPage);
  });

  //Avant de cree une parcelle une verification de data s'impose
  const verifyDataBeforeCreate = useCallback(async () => {
    try {
      await verifyDatabase();
      setShowCreateModal(true);
      setMode("create");
      setShowAlertVerif(false);
      setVerifMessageError(null);
    } catch (error) {
      setShowAlertVerif(true);
      setVerifMessageError(
        error instanceof Error
          ? error.message
          : "Erreur inconnue veuillez vous adresse au administrateur",
      );
    }
  }, []);

  // Initialisation modal création
  useEffect(() => {
    if (showCreateModal && mode === "create") {
      (async () => {
        const codeData = await generateNextCode();
        if (codeData) {
          setParcelle((prev) => ({ ...prev, ...codeData }));
        }
        await loadReferenceData();
      })();
    }

    if (showCreateModal && mode !== "create") {
      loadReferenceData();
    }
  }, [showCreateModal, mode, generateNextCode, loadReferenceData]);

  // totalPages calculé depuis le serveur
  const totalPages = Math.ceil(totalParcelles / ITEMS_PER_PAGE);

  // filteredParcelles reste local (sur la page courante seulement)
  const filteredParcelles = useMemo(() => {
    if (!searchQuery) return parcelles;
    const q = searchQuery.toLowerCase();
    return parcelles.filter(
      (p) =>
        p.code?.toLowerCase().includes(q) ||
        p.demandeurs.some(
          (d) =>
            d.nom?.toLowerCase().includes(q) ||
            d.prenom?.toLowerCase().includes(q),
        ),
    );
  }, [searchQuery, parcelles]);

  // Handlers
  const handleCardClick = useCallback(
    (codeParcelle: string) => {
      history.push(`/tab2?from=tab1&action=croquis&code=${codeParcelle}`);
    },
    [history],
  );

  const addDemandeur = useCallback(async () => {
    try {
      checkDemandeur(demandeur);
      setParcelle((prev) => ({
        ...prev,
        demandeurs: [...prev.demandeurs, demandeur],
      }));
      setDemandeur(Demandeur.init());
      setShowDemandeurModal(false);
    } catch (error) {
      setTempAlertMessage(
        error instanceof Error
          ? error.message
          : "Erreur inconnue veuillez vous adresse au administrateur",
      );
      setShowTempAlert(true);
    }
  }, [demandeur]);

  // Reset page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const addRiverin = useCallback(() => {
    if (!newRiverin.repere || !newRiverin.observation.trim()) {
      setRiverinMess("‼️Vérifiez votre insertion");
      return;
    }
    setParcelle((prev) => ({
      ...prev,
      riverin: [...prev.riverin, newRiverin],
    }));
    setNewRiverin(Riverin.init());
    setRiverinMess("✅ Riverin ajouté");
  }, [newRiverin]);

  const removeParcelle = useCallback((code: string, synchronise?: number) => {
    if (synchronise === 1) {
      setTempAlertMessage(
        "Cette parcelle est déjà synchronisée et ne peut pas être supprimée.",
      );
      setShowTempAlert(true);
      return;
    }
    setCodeToRemove(code);
    setShowAlertRemove(true);
  }, []);

  const createParcelle = useCallback(async () => {
    try {
      await insertParcelle(parcelle);

      if (mode === "create") {
        await saveIncrement();
      }

      // Mise à jour de la liste selon le mode
      if (mode === "edit") {
        // Mode édition : remplacer la parcelle existante
        setParcelles((prev) =>
          prev.map((p) => (p.code === parcelle.code ? parcelle : p)),
        );
      } else {
        // Mode création : ajouter la nouvelle parcelle
        setParcelles((prev) => [...prev, parcelle]);
      }

      setParcelle(Parcelle.init());
      setShowCreateModal(false);
    } catch (error) {
      setTempAlertMessage(
        error instanceof Error
          ? error.message
          : "Erreur inconnue veuillez vous adresse au administrateur",
      );
      setShowTempAlert(true);
    }
  }, [parcelle, saveIncrement, mode]);

  async function compressImage(
    base64: string,
    maxSize: number = 1024,
    quality: number = 0.6,
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64}`;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Retourne le base64 compressé sans le préfixe
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed.split(",")[1]); // ← base64 pur
      };
    });
  }
  const takePhotoParcelle = useCallback(async () => {
    try {
      if (parcelle.photos?.length >= 5) {
        setToastMessage("Maximum 5 photos");
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 60,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      if (!photo.base64String) throw new Error("Pas de photo");

      // ← compression réelle avant stockage
      const compressed = await compressImage(photo.base64String, 1024, 0.6);

      const fileName = `photo_${Date.now()}.jpeg`;
      await Filesystem.writeFile({
        path: fileName,
        data: compressed,
        directory: Directory.Data,
      });

      setParcelle((prev) => {
        if (prev.photos?.length >= 5) return prev;
        return {
          ...prev,
          photos: [...prev.photos, fileName],
        };
      });
    } catch (err) {
      console.error(err);
      setToastMessage("Erreur lors de la capture");
    }
  }, [parcelle.photos?.length]);

  const closeSearch = useCallback(() => {
    setSearchMode(false);
    setSearchQuery("");
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setMode("create");
    setParcelle(Parcelle.init());
  }, []);

  return (
    <IonPage>
      <IonHeader>
        {searchMode ? (
          <IonToolbar color="primary">
            <IonSearchbar
              autoFocus
              showCancelButton="focus"
              className="custom-search"
              placeholder="Recherche numéro ou demandeur"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
            />
            <IonButtons slot="end">
              <IonButton fill="clear" size="large" onClick={closeSearch}>
                <IonIcon icon={close} color="light" slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        ) : (
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Collecte des données</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSearchMode(true)}>
                <IonIcon icon={searchSharp} slot="icon-only" />
              </IonButton>
              <IonButton onClick={() => verifyDataBeforeCreate()}>
                <IonIcon icon={create} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      <Alert
        show={showAlertRemove}
        type={1}
        title="Suppression"
        message="Êtes-vous sûr de vouloir supprimer cette parcelle ?"
        onCancel={() => {
          setShowAlertRemove(false);
          setCodeToRemove(null);
        }}
        onConfirm={() => {
          if (codeToRemove) {
            deleteParcelle(codeToRemove);
            setParcelles((prev) => prev.filter((p) => p.code !== codeToRemove));
          }
          setShowAlertRemove(false);
          setCodeToRemove(null);
        }}
        onClose={() => {
          setShowAlertRemove(false);
          setCodeToRemove(null);
        }}
      />

      <Alert
        show={showAlertVerif}
        type={0}
        title="Information"
        duration={5000}
        message={
          verifMessageError ||
          "Une erreur est survenue lors de la vérification des données. Veuillez vous adresser à l'administrateur."
        }
        onClose={() => setShowAlertVerif(false)}
      />

      <IonContent className="ion-padding">
        {parcelles.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon
              icon={informationCircle}
              size="large"
              className="text-muted mb-3"
            />
            <h4 className="text-muted">Aucune parcelle enregistrée</h4>
            <IonButton onClick={() => verifyDataBeforeCreate()}>
              Créer une première parcelle
            </IonButton>
          </div>
        ) : (
          <div className="parcelle-layout">
            {/* Zone scrollable */}
            <div className="parcelle-scroll">
              <div className="cardContent">
                {filteredParcelles.map((p) => (
                  <IonCard key={p.code} className="custom-card">
                    <IonCardHeader className="custom-header-card">
                      <IonCardTitle className="row g-0 d-flex align-items-center">
                        <div className="col">
                          <strong>{p.code}</strong>
                        </div>
                        <div
                          id={`trigger-${p.code}`}
                          className="col-auto three-point"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(p.code!);
                          }}
                        >
                          <IonIcon
                            icon={ellipsisVerticalOutline}
                            className="fs-4"
                          />
                        </div>
                      </IonCardTitle>

                      <DropDown
                        show={openDropdown === p.code}
                        onClose={() => setOpenDropdown(null)}
                        onView={() => {
                          setOpenDropdown(null);
                          setMode("view");
                          setParcelle(p);

                          setSelectedParcelle(p);
                          setShowCreateModal(true);
                        }}
                        onEdit={() => {
                          setOpenDropdown(null);
                          setMode("edit");
                          setParcelle(p);
                          setSelectedParcelle(p);
                          setShowCreateModal(true);
                        }}
                        onDelete={() => {
                          setOpenDropdown(null);
                          removeParcelle(p.code!, p.synchronise);
                        }}
                        onCroquis={() => {
                          setOpenDropdown(null);
                          handleCardClick(p.code!);
                        }}
                        triggerId={`trigger-${p.code}`}
                      />

                      <IonCardSubtitle className="parcelle-chips">
                        <IonChip
                          color={p.synchronise === 1 ? "success" : "danger"}
                        >
                          <IonIcon icon={sync} />
                          <IonLabel>
                            {p.synchronise === 1 ? "Sync" : "Non sync."}
                          </IonLabel>
                        </IonChip>
                        <IonChip
                          color={p.polygone?.length ? "success" : "danger"}
                        >
                          <IonIcon icon={map} />
                          <IonLabel>
                            {p.polygone?.length
                              ? "Avec croquis"
                              : "Pas de croquis"}
                          </IonLabel>
                        </IonChip>
                      </IonCardSubtitle>
                    </IonCardHeader>

                    <IonCardContent className="p-0">
                      <div className="scrollable-list">
                        {p.demandeurs.map((d) => (
                          <DemandeurView key={`dem${d.id}`} demandeur={d} />
                        ))}
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>

            {/* Pagination fixe en bas */}
            {totalPages > 1 && (
              <div className="pagination-footer">
                <div className="pagination-bar">
                  <IonButton
                    fill="clear"
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ‹ Préc
                  </IonButton>

                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => Math.abs(page - currentPage) <= 2)
                      .map((page) => (
                        <IonButton
                          key={page}
                          size="small"
                          fill={page === currentPage ? "solid" : "clear"}
                          color={page === currentPage ? "primary" : "medium"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </IonButton>
                      ))}
                  </div>

                  <IonButton
                    fill="clear"
                    size="small"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Suiv ›
                  </IonButton>
                </div>

                <p className="pagination-info">
                  {totalParcelles} parcelle{totalParcelles > 1 ? "s" : ""}
                  {searchQuery && ` — filtre actif`}
                  {` — page ${currentPage}/${totalPages}`}
                </p>
              </div>
            )}
          </div>
        )}
      </IonContent>

      {/* Modal création parcelle */}
      <IonModal isOpen={showCreateModal} onDidDismiss={closeCreateModal}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={closeCreateModal}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>
              {mode === "view"
                ? "Détail de la parcelle"
                : mode === "edit"
                ? "Modification de la parcelle"
                : "Nouvelle parcelle"}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <ParcelleForm
            mode={mode}
            parcelle={parcelle}
            setParcelle={setParcelle}
            categorie={categorie}
            status={status}
            parametreTerritoire={
              mode !== "create"
                ? parcelle.parametreTerritoire
                : parametreTerritoire
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            decomposed={decomposed}
            setDecomposed={setDecomposed}
            takePhotoParcelle={takePhotoParcelle}
            onCreateParcelle={createParcelle}
            onShowDemandeurModal={() => setShowDemandeurModal(true)}
            onShowSearchModal={() => setShowSearchDemandeurModal(true)}
            onShowRiverinModal={() => setShowRiverin(true)}
            onCategoriesChange={(updatedList) => setCategorie(updatedList)}
          />
        </IonContent>
      </IonModal>

      <Alert
        show={showTempAlert}
        type={0}
        title="Information"
        message={tempAlertMessage}
        onClose={() => setShowTempAlert(false)}
      />

      {/* Modals */}
      <ModalRiverin
        showRiverin={showRiverin}
        setShowRiverin={setShowRiverin}
        addRiverin={addRiverin}
        riverinMess={riverinMess}
        repereL={repereL}
        newRiverin={newRiverin}
        setNewRiverin={setNewRiverin}
        demandeurs={demandeurList}
      />

      <SeacrhModal
        showSearchModal={showSearchDemandeurModal}
        setShowSearchModal={setShowSearchDemandeurModal}
        onSelect={(d) => {
          setParcelle((prev) => {
            const exists = prev.demandeurs.find((r) => r.id === d.id);
            if (exists) return prev;
            return { ...prev, demandeurs: [...prev.demandeurs, d] };
          });
        }}
      />

      <ModalDemandeur
        showCreateModal={showDemandeurModal}
        setShowCreateModal={setShowDemandeurModal}
        demandeur={demandeur}
        setDemandeur={setDemandeur}
        addDemandeur={addDemandeur}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        isPhysique={isPhysique}
        setIsPhysique={setIsPhysique}
        decomposed={decomposed}
        setDecomposed={setDecomposed}
      />
    </IonPage>
  );
};
export default Tab1;
