import React from "react";
import { IonImg, IonButton } from "@ionic/react";

interface PhotoProps {
  photos: string[];
  decomposed: boolean;
  setDecomposed: (value: boolean) => void;
  takePhoto: () => void;
  clearPhotos: () => void;
}

const Photo: React.FC<PhotoProps> = ({
  photos,
  decomposed,
  setDecomposed,
  takePhoto,
  clearPhotos,
}) => {
  return (
    <div>
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
        <IonButton style={{ flex: 1 }} onClick={takePhoto}>
          Prendre une photo 📸
        </IonButton>

        {photos && photos.length > 0 && (
          <IonButton style={{ flex: 1 }} color="danger" onClick={clearPhotos}>
            Supprimer les photos 🗑️
          </IonButton>
        )}
      </div>
    </div>
  );
};
export default Photo;