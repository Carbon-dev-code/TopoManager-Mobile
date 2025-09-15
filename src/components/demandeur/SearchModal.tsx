import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonModal,
  IonSearchbar,
} from "@ionic/react";
import { arrowBack} from "ionicons/icons";
import { useEffect, useState } from "react";
import { Demandeur } from "../../model/parcelle/Demandeur";

import "./SearchModal.css"; // 👉 Import du CSS
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


  const filtered = localDemandeurs.filter((d) =>
    `${d.prenom ?? ""} ${d.nom ?? ""} ${d.denomination ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!showSearchModal) return; // évite de charger quand c'est fermé

    const load = async () => {
      setLocalDemandeurs(await getAllDemandeurs());
    };

    load();
  }, [showSearchModal]); // ⚡️ re-exécuté à chaque ouverture


  return (
    <IonModal
      isOpen={showSearchModal}
      onDidDismiss={() => setShowSearchModal(false)}
    >
      <IonContent>
        {/* Barre de recherche en haut */}
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

        {/* Liste filtrée avec ton composant */}
        <div className="search-results">
          {filtered.length > 0 ? (
            filtered.map((d, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelect(d);
                  setShowSearchModal(false);
                }}
              >
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