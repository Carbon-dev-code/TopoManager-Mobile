import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { arrowBack, close } from "ionicons/icons";
import { useState } from "react";
import { Demandeur } from "../../model/parcelle/Demandeur";

import "./SearchModal.css"; // 👉 Import du CSS
import DemandeurView from "./DemandeurView";

interface SearchModalProps {
  showSearchModal: boolean;
  setShowSearchModal: (b: boolean) => void;
  demandeurs: Demandeur[];
  onSelect: (d: Demandeur) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  showSearchModal,
  setShowSearchModal,
  demandeurs,
  onSelect,
}) => {
  const [query, setQuery] = useState("");

  const filtered = demandeurs.filter((d) =>
    `${d.prenom ?? ""} ${d.nom ?? ""} ${d.denomination ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

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