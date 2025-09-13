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

        {/* Liste filtrée */}
        <IonList>
          {filtered.length > 0 ? (
            filtered.map((d, idx) => (
              <IonItem
                key={idx}
                button
                onClick={() => {
                  onSelect(d);
                  setShowSearchModal(false);
                }}
              >
                <IonLabel>
                  {d.type === 0
                    ? `${d.prenom ?? ""} ${d.nom ?? ""}`
                    : d.denomination}
                </IonLabel>
              </IonItem>
            ))
          ) : (
            <IonItem>
              <IonLabel>Aucun résultat</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default SearchModal;