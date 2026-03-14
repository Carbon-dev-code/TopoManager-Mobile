import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonModal, IonButton, IonIcon, IonCard, IonCardSubtitle, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonLabel, useIonViewWillEnter, IonSearchbar, } from "@ionic/react";
import { close, informationCircle, create, sync, map, searchSharp, ellipsisVerticalOutline, } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../../assets/dist/css/bootstrap/bootstrap.min.css";
import "./ParcelleCollectionPage.css";
import { verifyDatabase } from "../../shared/lib/db/DbSchema";
import Alert from "../../shared/ui/Alert";
import DropDown from "../../shared/ui/DropDown";
import ScrollToTop from "../../shared/ui/ScrollToTop";
import DemandeurView from "../../widgets/demandeur/DemandeurView";
import ParcelleForm from "../../widgets/parcelle/ParcelleForm";
import ModalDemandeur from "../../widgets/demandeur/ModalDemandeur";
import ModalRiverin from "../../widgets/riverin/ModalRiverin";
import SeacrhModal from "../../widgets/demandeur/SearchDemandeurModal";
import Toast, { ToastType } from "../../shared/ui/Toast";
import { useReferenceData, useParcelleCode, useParcelleData, useParcelleForm, useCamera, } from "./hooks";
import { Parcelle } from "../../entities/parcelle";

const ParcelleCollectionPage: React.FC = () => {
  const history = useHistory();
  const contentRef = useRef<HTMLIonContentElement>(null);

  // États UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [showSearchDemandeurModal, setShowSearchDemandeurModal] = useState(false);
  const [showRiverin, setShowRiverin] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [showAlertRemove, setShowAlertRemove] = useState(false);
  const [showAlertVerif, setShowAlertVerif] = useState(false);
  const [verifMessageError, setVerifMessageError] = useState<string | null>(null);
  const [codeToRemove, setCodeToRemove] = useState<string | null>(null);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [tempAlertMessage, setTempAlertMessage] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false,  message: "", type: "success" as ToastType, });

  // Hooks personnalisés
  const { categorie, setCategorie, status, repereL, loadReferenceData } = useReferenceData();
  const { parametreTerritoire, generateNextCode, saveIncrement } = useParcelleCode();
  const { parcelles,  currentPage, totalParcelles, searchQuery, totalPages, loadData, removeParcelle, confirmRemoveParcelle, updateParcelle, addParcelle, setCurrentPage, setSearchQuery } = useParcelleData();
  const { parcelle, setParcelle, personnePhysique, setPersonnePhysique, personneMorale, setPersonneMorale, representanType, setRepresentanType, newRiverin, setNewRiverin, mode, setMode, activeTab, setActiveTab, decomposed, setDecomposed, isPhysique, setIsPhysique, resetForm, addDemandeur, addRiverin, createParcelle, } = useParcelleForm();
  const { toastMessage, takePhoto, setToastMessage } = useCamera();

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage, loadData]);

  useIonViewWillEnter(() => {
    loadData(currentPage);
  });

  useEffect(() => {
    if (showCreateModal && mode === "create") {
      (async () => {
        const codeData = await generateNextCode();
        const lastOrigine = await Preferences.get({ key: "lastOrigine" });
        if (codeData)
          setParcelle((prev: Parcelle) => ({
            ...prev,
            ...codeData,
            origine: lastOrigine.value ?? null,
          }));
        await loadReferenceData();
      })();
    }
    if (showCreateModal && mode !== "create") loadReferenceData();
  }, [showCreateModal, mode, generateNextCode, loadReferenceData, setParcelle]);

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
  }, [setMode, setShowCreateModal, setVerifMessageError]);

  const filteredParcelles = useMemo(() => {
    if (!searchQuery) return parcelles;
    const q = searchQuery.toLowerCase();
    return parcelles.filter((p) => p.code?.toLowerCase().includes(q));
  }, [searchQuery, parcelles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

  const handleAddDemandeur = useCallback(async () => {
    const result = await addDemandeur();
    if (!result.success) {
      setTempAlertMessage(result.error as string);
      setShowTempAlert(true);
    } else {
      setShowDemandeurModal(false);
    }
  }, [addDemandeur]);

  const handleAddRiverin = useCallback(() => {
    const result = addRiverin();
    if (!result.success) {
      setTempAlertMessage(result.error as string);
      setShowTempAlert(true);
    } else {
      setToast({ visible: true, message: result.message as string, type: "success", });
    }
  }, [addRiverin]);

  const handleCardClick = useCallback(
    (codeParcelle: string) => {
      history.push(`/tab2?from=tab1&action=croquis&code=${codeParcelle}`);
    },
    [history],
  );

  const handleRemoveParcelle = useCallback((code: string, synchronise?: number) => {
    const result = removeParcelle(code, synchronise);
    if (!result.success) {
      setTempAlertMessage(result.message as string);
      setShowTempAlert(true);
    } else {
      setCodeToRemove(result.codeToRemove as string);
      setShowAlertRemove(true);
    }
  }, [removeParcelle]);

  const handleCreateParcelle = useCallback(async () => {
    const result = await createParcelle(mode === "create" ? saveIncrement : undefined);
    if (!result.success) {
      setTempAlertMessage(result.error as string);
      setShowTempAlert(true);
    } else {
      if (mode === "edit") {
        updateParcelle(parcelle);
      } else {
        addParcelle(parcelle);
      }
      resetForm();
      setShowCreateModal(false);
      setToast({
        visible: true,
        message: "Parcelle ajouté avec success",
        type: "success",
      });
    }
  }, [createParcelle, mode, saveIncrement, parcelle, updateParcelle, addParcelle, resetForm]);

  const takePhotoParcelle = useCallback(async () => {
    const fileName = await takePhoto(5, parcelle.photos || []);
    if (fileName) {
      setParcelle((prev : Parcelle) => {
        if (prev.photos?.length >= 5) return prev;
        return { ...prev, photos: [...prev.photos, fileName] };
      });
    }
  }, [takePhoto, parcelle.photos, setParcelle]);

  const closeSearch = useCallback(() => {
    setSearchMode(false);
    setSearchQuery("");
  }, [setSearchQuery]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setMode("create");
    resetForm();
  }, [resetForm, setMode]);

  return (
    <IonPage>
      {/* Header avec recherche */}
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
              <IonButton onClick={verifyDataBeforeCreate}>
                <IonIcon icon={create} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      {/* Alerts */}
      <Alert
        show={showAlertRemove}
        type={1}
        title="Suppression"
        message="Êtes-vous sûr de vouloir supprimer cette parcelle ?"
        onCancel={() => {
          setShowAlertRemove(false);
          setCodeToRemove(null);
        }}
        onConfirm={async () => {
          if (codeToRemove) {
            await confirmRemoveParcelle(codeToRemove);
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
        show={showAlertVerif} type={0}
        title="Information" duration={5000}
        message={verifMessageError || "Une erreur est survenue lors de la vérification des données."}
        onClose={() => setShowAlertVerif(false)}
      />

      {/* Content */}
      <IonContent ref={contentRef} className="ion-padding">
        {parcelles.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon
              icon={informationCircle}
              size="large"
              className="text-muted mb-3"
            />
            <h4 className="text-muted">Aucune parcelle enregistrée</h4>
            <IonButton onClick={verifyDataBeforeCreate}>
              Créer une première parcelle
            </IonButton>
          </div>
        ) : (
          <div className="parcelle-layout">
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
                          setShowCreateModal(true);
                        }}
                        onEdit={() => {
                          setOpenDropdown(null);
                          setMode("edit");
                          setParcelle(p);
                          setShowCreateModal(true);
                        }}
                        onDelete={() => {
                          setOpenDropdown(null);
                          handleRemoveParcelle(p.code!, p.synchronise);
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
                          <DemandeurView
                            key={`dem${d.id}`}
                            personne={
                              d.type === 0
                                ? d.personnePhysique
                                : d.personneMorale
                            }
                            type={d.type ?? 0}
                            representanType={d.representanType}
                          />
                        ))}
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>

            {/* Pagination */}
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
        <ScrollToTop contentRef={contentRef} />
      </IonContent>

      {/* Modal création/édition */}
      <IonModal isOpen={showCreateModal} onDidDismiss={closeCreateModal}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={closeCreateModal}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>
              {mode === "view" ? "Détail de la parcelle"
                : mode === "edit" ? "Modification de la parcelle"
                : "Nouvelle parcelle"}
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ParcelleForm
            mode={mode} parcelle={parcelle} setParcelle={setParcelle}
            categorie={categorie}
            status={status}
            parametreTerritoire={
              mode !== "create"
                ? parcelle.parametreTerritoire
                : parametreTerritoire
            }
            activeTab={activeTab} setActiveTab={setActiveTab}
            decomposed={decomposed} setDecomposed={setDecomposed}
            takePhotoParcelle={takePhotoParcelle}
            onCreateParcelle={handleCreateParcelle}
            onShowDemandeurModal={() => setShowDemandeurModal(true)}
            onShowSearchModal={() => setShowSearchDemandeurModal(true)}
            onShowRiverinModal={() => setShowRiverin(true)}
            onCategoriesChange={(updatedList) => setCategorie(updatedList)}
          />
        </IonContent>
      </IonModal>

      {/* Autres modals */}
      <Alert 
        show={showTempAlert} type={0} title="Information" message={tempAlertMessage}
        onClose={() => setShowTempAlert(false)}
      />

      <ModalRiverin
        showRiverin={showRiverin} setShowRiverin={setShowRiverin}
        addRiverin={handleAddRiverin}
        repereL={repereL}
        newRiverin={newRiverin} setNewRiverin={setNewRiverin}
      />

      <SeacrhModal
        showSearchModal={showSearchDemandeurModal}
        setShowSearchModal={setShowSearchDemandeurModal}
        withRole={true}
        onSelect={(d, role) => {
          setParcelle((prev : Parcelle) => {
            const exists = prev.demandeurs.find((r) => r.id === d.id);
            if (exists) return prev;
            return {
              ...prev,
              demandeurs: [
                ...prev.demandeurs,
                { ...d, representanType: role ?? "" },
              ],
            };
          });
        }}
      />

      <ModalDemandeur
        showCreateModal={showDemandeurModal}
        setShowCreateModal={setShowDemandeurModal}
        personnePhysique={personnePhysique} setPersonnePhysique={setPersonnePhysique}
        personneMorale={personneMorale} setPersonneMorale={setPersonneMorale}
        addDemandeur={handleAddDemandeur}
        toastMessage={toastMessage} setToastMessage={setToastMessage}
        isPhysique={isPhysique} setIsPhysique={setIsPhysique}
        decomposed={decomposed} setDecomposed={setDecomposed}
        withRepresentants={true}
        representanType={representanType} setRepresentanType={setRepresentanType}
      />

      <Toast
        visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </IonPage>
  );
};

export default ParcelleCollectionPage;
