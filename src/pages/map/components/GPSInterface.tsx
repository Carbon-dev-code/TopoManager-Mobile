import React from "react";
import { IonButton, IonInput, IonIcon } from "@ionic/react";
import { searchSharp, closeOutline } from "ionicons/icons";

interface GPSInterfaceProps {
  latitude: string;
  longitude: string;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
  onSearch: () => void;
  onClose: () => void;
}

export const GPSInterface: React.FC<GPSInterfaceProps> = ({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  onSearch,
  onClose,
}) => {
  return (
    <div className="gps-container">
      <div className="gps-search">
        <IonInput
          className="border"
          type="text"
          placeholder="X"
          value={longitude}
          onIonChange={(e) => setLongitude(e.detail.value!)}
        />
        <IonInput
          className="border"
          type="text"
          placeholder="Y"
          value={latitude}
          onIonChange={(e) => setLatitude(e.detail.value!)}
        />
        <IonButton
          className="glass-btn"
          fill="clear"
          size="small"
          color="primary"
          onClick={onSearch}
        >
          <IonIcon icon={searchSharp} style={{ fontSize: "20px" }} />
        </IonButton>
        <IonButton
          className="glass-btn"
          fill="clear"
          size="small"
          color="danger"
          onClick={onClose}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: "20px" }} />
        </IonButton>
      </div>
    </div>
  );
};
