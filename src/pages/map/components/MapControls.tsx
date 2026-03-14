import React from "react";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonCheckbox,
  IonLabel,
} from "@ionic/react";
import {
  checkmark,
  addOutline,
  closeOutline,
  handLeftOutline,
  removeOutline,
  magnetOutline,
  stopSharp,
  navigateSharp,
  pencilOutline,
  information,
  locateOutline,
  layersOutline,
  searchSharp,
} from "ionicons/icons";
import { Parcelle } from "../../../entities/parcelle";
import Cube from "../../../shared/ui/Cube";
import { formatSurface } from "../utils/formatters";

interface MapControlsProps {
  fabOpen: boolean;
  isEditMode: boolean;
  selectedPointIndex: number | null;
  snapEnabled: boolean;
  tracking: boolean;
  currentParcelle: Parcelle | null;
  showLocalTiles: boolean;
  layerVisibility: Record<string, boolean>;
  drawPoints: [number, number][];
  surface: number;
  getRealPointsCount: (points: [number, number][]) => number;
  setShowLocalTiles: (show: boolean) => void;
  setShowGPS: (show: boolean) => void;
  toggleLayer: (layer: string | string[]) => void;
  savePolygonEdit: () => void;
  addPolygone: () => void;
  addPointInEditMode: () => void;
  addPointInCreateMode: () => void;
  moveSelectedPointToCenter: () => void;
  deleteSelectedPoint: () => void;
  setSelectedPointIndex: (index: number | null) => void;
  performSnap: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  cancelEdit: () => void;
  toggleTracking: () => void;
  onEditToggle: () => void;
  onShowCard: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  fabOpen,
  isEditMode,
  selectedPointIndex,
  snapEnabled,
  tracking,
  currentParcelle,
  showLocalTiles,
  layerVisibility,
  drawPoints,
  surface,
  getRealPointsCount,
  setShowLocalTiles,
  setShowGPS,
  toggleLayer,
  savePolygonEdit,
  addPolygone,
  addPointInEditMode,
  addPointInCreateMode,
  moveSelectedPointToCenter,
  deleteSelectedPoint,
  setSelectedPointIndex,
  performSnap,
  setSnapEnabled,
  cancelEdit,
  toggleTracking,
  onEditToggle,
  onShowCard,
}) => {
  return (
    <div className="map-controls">
      {fabOpen && (
        <div className="fab">
          <IonButton
            className="glass-btn"
            fill="clear"
            onClick={isEditMode ? savePolygonEdit : addPolygone}
          >
            <IonIcon color="success" icon={checkmark} />
          </IonButton>

          {isEditMode ? (
            <>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={(e) => {
                  e.stopPropagation();
                  addPointInEditMode();
                }}
              >
                <IonIcon color="primary" icon={addOutline} />
              </IonButton>

              <IonButton
                className="glass-btn"
                fill={selectedPointIndex !== null ? "solid" : "clear"}
                color={selectedPointIndex !== null ? "primary" : "medium"}
                onClick={moveSelectedPointToCenter}
                disabled={selectedPointIndex === null}
              >
                <IonIcon icon={handLeftOutline} />
              </IonButton>

              <IonButton
                className="glass-btn"
                fill={selectedPointIndex !== null ? "solid" : "clear"}
                color={selectedPointIndex !== null ? "danger" : "medium"}
                onClick={deleteSelectedPoint}
                disabled={
                  selectedPointIndex === null ||
                  getRealPointsCount(drawPoints) <= 2
                }
              >
                <IonIcon icon={removeOutline} />
              </IonButton>

              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() => setSelectedPointIndex(null)}
                disabled={selectedPointIndex === null}
              >
                <IonIcon color="medium" icon={closeOutline} />
              </IonButton>
            </>
          ) : (
            <>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={addPointInCreateMode}
              >
                <IonIcon color="primary" icon={addOutline} />
              </IonButton>

              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() =>
                  // This will be handled by parent
                  {}
                }
                disabled={drawPoints.length === 0}
              >
                <IonIcon color="danger" icon={removeOutline} />
              </IonButton>
            </>
          )}

          <IonButton
            className="glass-btn"
            fill={snapEnabled ? "solid" : "clear"}
            color={snapEnabled ? "tertiary" : "medium"}
            onClick={() => {
              const newSnapState = !snapEnabled;
              setSnapEnabled(newSnapState);
              if (newSnapState) {
                performSnap();
              }
            }}
          >
            <IonIcon icon={magnetOutline} />
          </IonButton>

          <IonButton
            className="glass-btn"
            fill="clear"
            onClick={cancelEdit}
          >
            <IonIcon color="dark" icon={closeOutline} />
          </IonButton>

          <IonButton
            className="glass-btn"
            fill={tracking ? "solid" : "clear"}
            color={tracking ? "danger" : "primary"}
            onClick={toggleTracking}
          >
            <IonIcon icon={tracking ? stopSharp : navigateSharp} />
          </IonButton>
        </div>
      )}

      {currentParcelle && (
        <>
          <IonButton
            fill="clear"
            className="glass-btn"
            onClick={onEditToggle}
          >
            <IonIcon
              color={fabOpen ? "dark" : "danger"}
              icon={pencilOutline}
            />
          </IonButton>

          <IonButton
            className="glass-btn"
            fill="clear"
            onClick={onShowCard}
          >
            <IonIcon color="dark" icon={information} />
          </IonButton>
        </>
      )}

      <IonButton
        className="glass-btn"
        fill="clear"
        onClick={() => setShowGPS(true)}
      >
        <IonIcon color="dark" icon={locateOutline} />
      </IonButton>

      {!showLocalTiles && (
        <div className="glass-panel">
          <h4 className="glass-title">Couches visibles</h4>
          <IonItem className="glass-item border-bottom" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.parcelle}
              onIonChange={() => toggleLayer(["parcelle"])}
            />
            <Cube color="orange" /> Parcelle
          </IonItem>
          <IonItem className="glass-item border-bottom" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.ipss}
              onIonChange={() => toggleLayer(["ipss"])}
            />
            <Cube color="blue" /> IPSS
          </IonItem>
          <IonItem className="glass-item" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.titre}
              onIonChange={() => toggleLayer("titre")}
            />
            <Cube color="red" /> Titre
          </IonItem>
          <IonItem className="glass-item border-bottom" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.requisition}
              onIonChange={() => toggleLayer("requisition")}
            />
            <Cube color="chartreuse" />Requisition
          </IonItem>
          <IonItem className="glass-item" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.demandecf}
              onIonChange={() => toggleLayer("demandecf")}
            />
            <Cube color="purple" /> Demande CF
          </IonItem>
          <IonItem className="glass-item border-bottom" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.certificat}
              onIonChange={() => toggleLayer("certificat")}
            />
            <Cube color="yellow" /> Karatany
          </IonItem>
          <IonItem className="glass-item" lines="none">
            <IonCheckbox
              slot="start"
              checked={layerVisibility.fond}
              onIonChange={() => toggleLayer("fond")}
            />
            Fond image
          </IonItem>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {fabOpen && drawPoints.length >= 3 && (
          <div className="surface-parcelle">
            Surface {formatSurface(surface)}
          </div>
        )}
        <IonButton
          fill="clear"
          className="glass-btn"
          onClick={() => setShowLocalTiles(!showLocalTiles)}
        >
          <IonIcon color="dark" icon={layersOutline} />
        </IonButton>
      </div>
    </div>
  );
};
