import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonModal,
  IonSearchbar,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Demandeur } from "../../model/parcelle/Demandeur";

import "./SearchModal.css";
import DemandeurView from "./DemandeurView";
import { getAllDemandeurs } from "../../model/base/DbSchema";

interface SearchModalProps {
  showSearchModal: boolean;
  setShowSearchModal: (b: boolean) => void;
  onSelect: (d: Demandeur) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  showSearchModal,
  setShowSearchModal,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [localDemandeurs, setLocalDemandeurs] = useState<Demandeur[]>([]);
  const [recentSearches, setRecentSearches] = useState<Demandeur[]>([]);

  // Charger les demandeurs à l'ouverture du modal
  useEffect(() => {
    if (!showSearchModal) return;

    const load = async () => {
      setLocalDemandeurs(await getAllDemandeurs());
    };
    load();
  }, [showSearchModal]);

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const filtered = query ? localDemandeurs.filter((d) => `${d.prenom ?? ""} ${d.nom ?? ""} ${d.denomination ?? ""}` .toLowerCase() .includes(query.toLowerCase())) : recentSearches;

  const handleSelect = (d: Demandeur) => {
    onSelect({ ...d });
    setShowSearchModal(false);

    setRecentSearches((prev) => {
      const exists = prev.find(r => r.id === d.id);
      if (exists) return prev;

      const updated = [d, ...prev].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });

  };


  return (
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
  );
};

export default SearchModal;