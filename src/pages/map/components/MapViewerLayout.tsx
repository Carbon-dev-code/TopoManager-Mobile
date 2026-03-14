import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonLoading,
  IonToast,
} from "@ionic/react";
import { search } from "ionicons/icons";
import { Parcelle } from "../../../entities/parcelle";
import CardGlass from "../../../shared/ui/CardGlass";

interface MapViewerLayoutProps {
  mapElement: React.RefObject<HTMLDivElement>;
  loadingMap: boolean;
  currentParcelle: Parcelle | null;
  showCard: boolean;
  setShowCard: (show: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  children: React.ReactNode;
}

export const MapViewerLayout: React.FC<MapViewerLayoutProps> = ({
  mapElement,
  loadingMap,
  currentParcelle,
  showCard,
  setShowCard,
  setShowSearch,
  toastMessage,
  setToastMessage,
  children,
}) => {
  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons slot="start" className="glass-btn">
            <IonMenuButton />
          </IonButtons>
          {currentParcelle && (
            <IonTitle className="glass-label">
              Parcelle {currentParcelle.code}
            </IonTitle>
          )}
          <IonButtons
            onClick={() => setShowSearch((prev) => !prev)}
            slot="end"
            className="glass-btn"
          >
            <IonIcon icon={search} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonLoading
          isOpen={loadingMap}
          message="Initialisation de la carte..."
          spinner="circles"
        />

        <div ref={mapElement} className="map-container"></div>
        {children}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ""}
          duration={2000}
          color="danger"
          onDidDismiss={() => setToastMessage(null)}
        />

        {showCard && currentParcelle && (
          <CardGlass
            currentParcelle={currentParcelle}
            setShowCard={setShowCard}
          />
        )}
        
      </IonContent>
    </IonPage>
  );
};
