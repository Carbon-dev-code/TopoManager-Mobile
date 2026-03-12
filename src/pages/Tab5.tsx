import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close, informationCircle } from "ionicons/icons";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import { useEffect, useMemo, useRef, useState } from "react";
import DemandeurView from "../components/demandeur/DemandeurView";
import {
  insertPersonnePhysique,
  insertPersonneMorale,
  getAllPersonnesPhysiques,
  getAllPersonnesMorales,
  deletePersonneMorale,
  deletePersonnePhysique,
} from "../model/base/DbSchema";
import Alert from "../components/alert/Alert";
import Toast, { ToastType } from "../components/toast/Toast";
import { PersonnePhysique } from "../model/Demandeur/PersonnePhysique";
import { PersonneMorale } from "../model/Demandeur/PersonneMorale";
import ScrollToTop from "../components/ScrollTop/ScrollToTop";

type ModalMode = "create" | "view" | "edit";

const Tab5: React.FC = () => {
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [personnePhysique, setPersonnePhysique] = useState<PersonnePhysique>(
    PersonnePhysique.init(),
  );
  const [personneMorale, setPersonneMorale] = useState<PersonneMorale>(
    PersonneMorale.init(),
  );
  const [isPhysique, setIsPhysique] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [personnePhysiqueList, setPersonnePhysiqueList] = useState<
    PersonnePhysique[]
  >([]);
  const [personneMoraleList, setPersonneMoraleList] = useState<
    PersonneMorale[]
  >([]);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [tempAlertMessage, setTempAlertMessage] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });
  const [showAlertRemove, setShowAlertRemove] = useState(false);
  const [idToRemove, setIdToRemove] = useState<{
    id: string;
    type: 0 | 1;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const load = async () => {
    const [physiques, morales] = await Promise.all([
      getAllPersonnesPhysiques(),
      getAllPersonnesMorales(),
    ]);

    setPersonnePhysiqueList(physiques);
    setPersonneMoraleList(morales);
  };

  useIonViewWillEnter(() => {
    load();
  });

  // ─── Items paginés ───────────────────────────────────────────────
  // Filtre recherche — physiques + morales
  const filteredPhysiques = personnePhysiqueList.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (p.nom ?? "").toLowerCase().includes(q) ||
      (p.prenom ?? "").toLowerCase().includes(q)
    );
  });

  const filteredMorales = personneMoraleList.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (p.denomination ?? "").toLowerCase().includes(q);
  });

  // ─── Pagination ──────────────────────────────────────────────────
  const allFiltered = useMemo(
    () => [
      ...filteredPhysiques.map((p) => ({ type: 0 as const, data: p })),
      ...filteredMorales.map((p) => ({ type: 1 as const, data: p })),
    ],
    [filteredPhysiques, filteredMorales],
  );

  const totalItems = allFiltered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedItems = allFiltered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // reset page si recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // ===== Ouvrir en mode création =====
  const handleOpenCreate = () => {
    setPersonnePhysique(PersonnePhysique.init());
    setPersonneMorale(PersonneMorale.init());
    setIsPhysique(0);
    setModalMode("create");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode vue — physique =====
  const handleOpenViewPhysique = (p: PersonnePhysique) => {
    setPersonnePhysique(p);
    setIsPhysique(0);
    setModalMode("view");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode vue — morale =====
  const handleOpenViewMorale = (p: PersonneMorale) => {
    setPersonneMorale(p);
    setIsPhysique(1);
    setModalMode("view");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode édition — physique =====
  const handleOpenEditPhysique = (p: PersonnePhysique) => {
    setPersonnePhysique(p);
    setIsPhysique(0);
    setModalMode("edit");
    setShowCreateModal(true);
  };

  // ===== Ouvrir en mode édition — morale =====
  const handleOpenEditMorale = (p: PersonneMorale) => {
    setPersonneMorale(p);
    setIsPhysique(1);
    setModalMode("edit");
    setShowCreateModal(true);
  };

  const addDemandeur = async () => {
    try {
      if (isPhysique === 0) {
        await insertPersonnePhysique(personnePhysique);
        setPersonnePhysique(PersonnePhysique.init());
      } else {
        await insertPersonneMorale(personneMorale);
        setPersonneMorale(PersonneMorale.init());
      }
      await load();
      setShowCreateModal(false);
      setToast({
        visible: true,
        message:
          modalMode === "edit" ? "Modifié avec succès" : "Ajouté avec succès",
        type: "success",
      });
    } catch (error) {
      setTempAlertMessage(
        error instanceof Error
          ? error.message
          : "Erreur inconnue veuillez vous adresse au administrateur",
      );
      setShowTempAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        {search ? (
          <IonToolbar color="primary">
            <IonSearchbar
              autoFocus
              showCancelButton="focus"
              className="custom-search"
              placeholder="Recherche demandeur"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
            />
            <IonButtons slot="end">
              <IonButton
                fill="clear"
                size="large"
                onClick={() => {
                  setSearch(false);
                  setSearchQuery("");
                }}
              >
                <IonIcon icon={close} slot="icon-only" color="light" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        ) : (
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Création de demandeur</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSearch(true)}>
                <IonIcon icon={searchSharp} slot="icon-only" />
              </IonButton>
              <IonButton onClick={handleOpenCreate}>
                <IonIcon icon={create} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent ref={contentRef}>
        {paginatedItems.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon
              icon={informationCircle}
              size="large"
              className="text-muted mb-3"
            />
            <h4 className="text-muted">Aucun demandeur enregistré</h4>
            <IonButton onClick={handleOpenCreate}>
              Créer des demandeurs
            </IonButton>
          </div>
        ) : (
          <div className="demandeur-layout">
            <div className="demandeur-scroll">
              {paginatedItems.map((item) =>
                item.type === 0 ? (
                  <IonList className="custom-list-md" key={item.data.id}>
                    <DemandeurView
                      personne={item.data as PersonnePhysique}
                      type={0}
                      longPressEnabled={true}
                      onView={() =>
                        handleOpenViewPhysique(item.data as PersonnePhysique)
                      }
                      onEdit={() =>
                        handleOpenEditPhysique(item.data as PersonnePhysique)
                      }
                      onDelete={() => {
                        setIdToRemove({ id: item.data.id, type: 0 });
                        setShowAlertRemove(true);
                      }}
                    />
                  </IonList>
                ) : (
                  <IonList className="custom-list-md" key={item.data.id}>
                    <DemandeurView
                      personne={item.data as PersonneMorale}
                      type={1}
                      longPressEnabled={true}
                      onView={() =>
                        handleOpenViewMorale(item.data as PersonneMorale)
                      }
                      onEdit={() =>
                        handleOpenEditMorale(item.data as PersonneMorale)
                      }
                      onDelete={() => {
                        setIdToRemove({ id: item.data.id, type: 1 });
                        setShowAlertRemove(true);
                      }}
                    />
                  </IonList>
                ),
              )}
            </div>

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
                  {totalItems} demandeur{totalItems > 1 ? "s" : ""}
                  {searchQuery && ` — filtre actif`}
                  {` — page ${currentPage}/${totalPages}`}
                </p>
              </div>
            )}
          </div>
        )}
        <ScrollToTop contentRef={contentRef} />
      </IonContent>
      <Alert
        show={showAlertRemove}
        type={1}
        title="Suppression"
        message="Êtes-vous sûr de vouloir supprimer ce demandeur ?"
        onCancel={() => {
          setShowAlertRemove(false);
          setIdToRemove(null);
        }}
        onConfirm={async () => {
          if (idToRemove) {
            try {
              if (idToRemove.type === 0) {
                await deletePersonnePhysique(idToRemove.id);
                setPersonnePhysiqueList((prev) =>
                  prev.filter((p) => p.id !== idToRemove.id),
                );
              } else {
                await deletePersonneMorale(idToRemove.id);
                setPersonneMoraleList((prev) =>
                  prev.filter((p) => p.id !== idToRemove.id),
                );
              }
              const newTotal = totalItems - 1;
              const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1;
              if (currentPage > maxPage) setCurrentPage(maxPage);
              setToast({
                visible: true,
                message: "Supprimé avec succès",
                type: "success",
              });
            } catch (error) {
              setTempAlertMessage(
                error instanceof Error
                  ? error.message
                  : "Erreur inconnue veuillez vous adresser à l'administrateur",
              );
              setShowTempAlert(true);
            }
          }
          setShowAlertRemove(false);
          setIdToRemove(null);
        }}
        onClose={() => {
          setShowAlertRemove(false);
          setIdToRemove(null);
        }}
      />

      <ModalDemandeur
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        personnePhysique={personnePhysique}
        setPersonnePhysique={setPersonnePhysique}
        personneMorale={personneMorale}
        setPersonneMorale={setPersonneMorale}
        addDemandeur={addDemandeur}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        isPhysique={isPhysique}
        setIsPhysique={setIsPhysique}
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        mode={modalMode}
      />

      <Alert
        show={showTempAlert}
        type={0}
        title="Information"
        message={tempAlertMessage}
        onClose={() => setShowTempAlert(false)}
        duration={5000}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </IonPage>
  );
};

export default Tab5;
