import React, { useEffect, useState } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { IonIcon, IonRippleEffect } from "@ionic/react";
import { cameraOutline, trashOutline, closeCircle } from "ionicons/icons";
import "./Photo.css";

interface PhotoProps {
  photos: string[];
  decomposed: boolean;
  setDecomposed: (value: boolean) => void;
  takePhoto: () => void;
  clearPhotos: () => void;
  onDeletePhoto?: (index: number) => void;
  name?: string;
  viewOnly?: boolean;
  maxPhotos?: number;
}

async function resolveUri(uri: string): Promise<string> {
  if (uri.startsWith("file://") && Capacitor.isNativePlatform())
    return Capacitor.convertFileSrc(uri);
  try {
    const result = await Filesystem.readFile({
      path: uri,
      directory: Directory.Data,
    });
    return `data:image/jpeg;base64,${result.data}`;
  } catch {
    return "";
  }
}

const PhotoItem: React.FC<{
  src: string;
  onDelete?: () => void;
  stacked?: boolean;
}> = ({ src, onDelete, stacked = false }) => {
  const [resolved, setResolved] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    resolveUri(src).then(setResolved);
  }, [src]);

  return (
    <div
      className={`photo-item ${loaded ? "loaded" : ""} ${stacked ? "stacked" : ""}`}
    >
      {!loaded && <div className="photo-skeleton" />}
      {resolved && (
        <img
          src={resolved}
          className="photo-img"
          onLoad={() => setLoaded(true)}
          alt=""
        />
      )}
      {onDelete && loaded && (
        <button
          className="photo-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <IonIcon icon={closeCircle} />
        </button>
      )}
    </div>
  );
};

const Photo: React.FC<PhotoProps> = ({
  photos,
  decomposed,
  setDecomposed,
  takePhoto,
  clearPhotos,
  onDeletePhoto,
  name,
  viewOnly = false,
  maxPhotos = 5,
}) => {
  const hasPhotos = photos?.length > 0;
  const canAdd = !viewOnly && photos.length < maxPhotos;

  return (
    <div className="photo-wrapper">
      {hasPhotos && (
        <div
          className={`photo-gallery ${decomposed ? "decomposed" : "stacked"}`}
          onClick={() => !decomposed && setDecomposed(true)}
        >
          {photos.map((p, idx) => (
            <PhotoItem
              key={idx}
              src={p}
              stacked={!decomposed}
              onDelete={
                !viewOnly && decomposed && onDeletePhoto
                  ? () => onDeletePhoto(idx)
                  : undefined
              }
            />
          ))}

          {!decomposed && photos.length > 1 && (
            <div className="photo-count-badge">
              <span>{photos.length}</span>
              <small>photos</small>
            </div>
          )}

          {decomposed && (
            <button
              className="photo-collapse-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDecomposed(false);
              }}
            >
              Réduire
            </button>
          )}
        </div>
      )}

      {!viewOnly && (
        <div className="photo-actions">
          {canAdd && (
            <button
              className="photo-btn primary ion-activatable"
              onClick={takePhoto}
            >
              <IonRippleEffect />
              <IonIcon icon={cameraOutline} />
              <span>{name ?? "Prendre une photo"}</span>
              {hasPhotos && (
                <em>
                  {photos.length}/{maxPhotos}
                </em>
              )}
            </button>
          )}

          {hasPhotos && (
            <button
              className="photo-btn danger ion-activatable"
              onClick={clearPhotos}
            >
              <IonRippleEffect />
              <IonIcon icon={trashOutline} />
              <span>Tout supprimer</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Photo;

