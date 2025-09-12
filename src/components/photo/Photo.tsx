import React from "react";
import { IonImg, IonButton, IonIcon } from "@ionic/react";
import { cameraOutline, trashOutline } from "ionicons/icons";
import "./Photo.css";

interface PhotoProps {
  photos: string[];
  decomposed: boolean;
  setDecomposed: (value: boolean) => void;
  takePhoto: () => void;
  clearPhotos: () => void;
  name?: string;
}

const Photo: React.FC<PhotoProps> = ({
  photos,
  decomposed,
  setDecomposed,
  takePhoto,
  clearPhotos,
  name
}) => {
  return (
    <div className="w-100">
      {/* Stack d’images dynamiques */}
      {photos && photos.length > 0 && (
        <div
          className={`image-stack ${decomposed ? "decomposed" : ""}`}
          onClick={() => setDecomposed(!decomposed)}
        >
          {photos.map((p, idx) => (
            <IonImg key={idx} src={p} className="image" />
          ))}

          {/* Badge +N si plus de 3 photos */}
          {!decomposed && photos.length > 1 && (
            <div className="image-badge">+{photos.length}</div>
          )}
        </div>
      )}

      {/* Boutons en flex */}
      <div className="button-photo">
        <IonButton style={{ flex: 1 }} onClick={takePhoto} size="small" expand="full">
          <IonIcon icon={cameraOutline} size="small" slot="icon-only" className="mx-2"/> {name}
        </IonButton>

        {photos && photos.length > 0 && (
          <IonButton style={{ flex: 1 }} color="danger" onClick={clearPhotos} size="small" expand="full">
             <IonIcon icon={trashOutline} size="small" slot="icon-only" className="mx-2"/> Supprimer les photos
          </IonButton>
        )}
      </div>
    </div>
  );
};
export default Photo;