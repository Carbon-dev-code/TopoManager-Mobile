import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonActionSheet,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Demandeur } from "../../model/parcelle/DemandeurDTO";

import "./SearchModal.css";
import DemandeurView from "./DemandeurView";
import { getAllDemandeurs } from "../../model/base/DbSchema";

interface SearchModalProps {
  showSearchModal: boolean;
  setShowSearchModal: (b: boolean) => void;
  onSelect: (d: Demandeur) => void;
  withRole?: boolean; // ← nouveau : si true, demande le rôle après sélection
  onSelectWithRole?: (d: Demandeur, role: string) => void; // ← nouveau
}

const ROLES = [
  { text: "Propriétaire", data: "Propriétaire" },
  { text: "Tuteur légal", data: "tuteurLegal" },
  { text: "Mandataire", data: "mandataire" },
  { text: "Representant", data: "mandataire" },
];

const SearchModal: React.FC<SearchModalProps> = ({
  showSearchModal,
  setShowSearchModal,
  onSelect,
  withRole = false,
}) => {
  const [query, setQuery] = useState("");
  const [localDemandeurs, setLocalDemandeurs] = useState<Demandeur[]>([]);
  const [recentSearches, setRecentSearches] = useState<Demandeur[]>([]);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [selectedDemandeur, setSelectedDemandeur] = useState<Demandeur | null>(
    null,
  );

  useEffect(() => {
    if (!showSearchModal) return;
    const load = async () => {
      setLocalDemandeurs(await getAllDemandeurs());
    };
    load();
  }, [showSearchModal]);

  useEffect(() => {
    if (!showSearchModal) return;
    const load = async () => {
      const allDemandeurs = await getAllDemandeurs();
      setLocalDemandeurs(allDemandeurs);
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        const savedIds: string[] = JSON.parse(saved).map(
          (d: Demandeur) => d.id,
        );
        const fresh = savedIds
          .map((id) => allDemandeurs.find((d) => d.id === id))
          .filter(Boolean) as Demandeur[];
        setRecentSearches(fresh);
      }
    };
    load();
  }, [showSearchModal]);

  const filtered = query
    ? localDemandeurs.filter((d) =>
        `${d.prenom ?? ""} ${d.nom ?? ""} ${d.denomination ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : recentSearches;

  const saveRecent = (d: Demandeur) => {
    setRecentSearches((prev) => {
      const exists = prev.find((r) => r.id === d.id);
      if (exists) return prev;
      const updated = [d, ...prev].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelect = (d: Demandeur) => {
    if (withRole) {
      // ← stocker la sélection et ouvrir l'ActionSheet
      setSelectedDemandeur(d);
      setShowRoleSheet(true);
    } else {
      onSelect({ ...d });
      setShowSearchModal(false);
      saveRecent(d);
    }
  };

  return (
    <>
      <IonModal
        isOpen={showSearchModal}
        onDidDismiss={() => setShowSearchModal(false)}
      >
        <IonContent>
          <div className="search-header">
            <IonButtons slot="start">
              <IonButton onClick={() => setShowSearchModal(false)}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonSearchbar
              value={query}
              debounce={300}
              onIonInput={(e) => setQuery(e.detail.value!)}
              placeholder="Search..."
              animated
            />
          </div>

          <div className="search-results">
            {query === "" && recentSearches.length > 0 && (
              <div
                className="recent-label"
                style={{ padding: "10px", fontWeight: "bold", color: "#666" }}
              >
                Recherches récentes
              </div>
            )}
            {filtered.length > 0 ? (
              filtered.map((d, idx) => (
                <div key={idx} onClick={() => handleSelect(d)}>
                  <DemandeurView demandeur={d} />
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", marginTop: "20px" }}>
                Aucun résultat
              </p>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* ─── ActionSheet rôle ─── */}
      <IonActionSheet
        isOpen={showRoleSheet}
        header="Choisir le rôle"
        onDidDismiss={() => {
          setShowRoleSheet(false);
          setSelectedDemandeur(null);
        }}
        buttons={[
          ...ROLES.map((role) => ({
            text: role.text,
            handler: () => {
              if (selectedDemandeur) {
                onSelect({ ...selectedDemandeur, representanType: role.data });
                saveRecent(selectedDemandeur);
                setShowSearchModal(false);
              }
            },
          })),
          { text: "Annuler", role: "cancel" },
        ]}
      />
    </>
  );
};

export default SearchModal;
