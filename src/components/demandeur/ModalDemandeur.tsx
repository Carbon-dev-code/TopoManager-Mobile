import React, { useState, useCallback } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonToast,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonAlert,
} from "@ionic/react";
import { close, createOutline } from "ionicons/icons";
import "./ModalDemandeur.css";
import Physique from "./Physique";
import Moral from "./Moral";
import { Demandeur } from "../../model/parcelle/Demandeur";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import Photo from "../photo/Photo";
import { deletePhotos } from "../../model/base/DbSchema";

type ModalMode = "create" | "view" | "edit";

interface ModalDemandeurProps {
  showCreateModal: boolean;
  setShowCreateModal: (b: boolean) => void;
  demandeur: Demandeur;
  setDemandeur: React.Dispatch<React.SetStateAction<Demandeur>>;
  addDemandeur: () => void;
  toastMessage?: string | null;
  setToastMessage?: (msg: string | null) => void;
  isPhysique: number;
  setIsPhysique: (d: number) => void;
  decomposed: boolean;
  setDecomposed: (d: boolean) => void;
  mode?: ModalMode;
}

const TITLES: Record<ModalMode, string> = {
  create: "Ajouter Demandeur",
  view: "Détails Demandeur",
  edit: "Modifier Demandeur",
};

const ModalDemandeur: React.FC<ModalDemandeurProps> = ({
  showCreateModal,
  setShowCreateModal,
  demandeur,
  setDemandeur,
  addDemandeur,
  toastMessage,
  setToastMessage,
  isPhysique,
  setIsPhysique,
  decomposed,
  setDecomposed,
  mode = "create",
}) => {
  const [showConfirmProfile, setShowConfirmProfile] = useState(false);
  const [lastPhotoIndex] = useState<number | null>(null);
  const isReadOnly = mode === "view";

  // ─── Compression ────────────────────────────────────────────────
  async function compressImage(
    base64: string,
    maxSize = 1024,
    quality = 0.6,
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64}`;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
    });
  }

  // ─── Prise de photo ─────────────────────────────────────────────
  const takePhoto = useCallback(async () => {
    if ((demandeur.photos?.length ?? 0) >= 1) {
      // ← 5 devient 1
      setToastMessage?.("1 photo maximum pour le demandeur");
      return;
    }
    try {
      const photo = await Camera.getPhoto({
        quality: 60,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 512,
        height: 512,
        correctOrientation: true,
      });

      if (!photo.base64String) throw new Error("Pas de photo");

      const compressed = await compressImage(photo.base64String, 512, 0.7);
      const fileName = `demandeur/${Date.now()}.jpeg`;
      await Filesystem.writeFile({
        path: fileName,
        data: compressed,
        directory: Directory.Data,
        recursive: true,
      });

      setDemandeur((prev: Demandeur) => ({
        ...prev,
        photos: [fileName], // ← remplace au lieu d'ajouter
        indexPhoto: 0,
      }));

      // Plus besoin de demander si photo de profil — c'est automatiquement index 0
    } catch (err) {
      console.error(err);
      setToastMessage?.("Erreur lors de la capture");
    }
  }, [demandeur.photos, setDemandeur, setToastMessage]);

  return (
    <IonModal
      isOpen={showCreateModal}
      onDidDismiss={() => setShowCreateModal(false)}
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => setShowCreateModal(false)}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>{TITLES[mode]}</IonTitle>
          <IonButtons slot="end">
            {mode === "view" && (
              <IonButton onClick={() => setShowCreateModal(false)}>
                <IonIcon icon={createOutline} slot="icon-only" />
              </IonButton>
            )}
            {mode !== "view" && (
              <IonButton strong={true} onClick={addDemandeur}>
                {mode === "edit" ? "Mettre à jour" : "Ajouter"}
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel className="me-3 truncate">Type :</IonLabel>
            <IonRadioGroup
              value={isPhysique.toString()}
              onIonChange={(e) => {
                if (isReadOnly) return;
                const value = Number(e.detail.value);
                setIsPhysique(value);
                const fresh = Demandeur.init();
                setDemandeur({
                  ...fresh,
                  type: value,
                  id: demandeur.id,
                  photos: demandeur.photos,
                  indexPhoto: demandeur.indexPhoto,
                  observations: demandeur.observations,
                  adresse: demandeur.adresse,
                });
              }}
            >
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <IonItem lines="none">
                  <IonRadio justify="end" value="0" disabled={isReadOnly}>
                    Physique
                  </IonRadio>
                </IonItem>
                <IonItem lines="none">
                  <IonRadio justify="end" value="1" disabled={isReadOnly}>
                    Morale
                  </IonRadio>
                </IonItem>
              </div>
            </IonRadioGroup>
          </IonItem>
        </IonList>

        {isPhysique === 0 ? (
          <Physique
            demandeur={demandeur}
            setDemandeur={setDemandeur}
            readonly={isReadOnly}
          />
        ) : (
          <Moral
            demandeur={demandeur}
            setDemandeur={setDemandeur}
            readonly={isReadOnly}
          />
        )}

        {/* ─── Photos ─────────────────────────────────────────────── */}
        <IonItem lines="none">
          <Photo
            photos={demandeur.photos ?? []}
            decomposed={decomposed}
            setDecomposed={setDecomposed}
            takePhoto={takePhoto}
            viewOnly={isReadOnly}
            maxPhotos={1} // ← ajout
            clearPhotos={async () => {
              await deletePhotos(demandeur.photos ?? []);
              setDemandeur((prev: Demandeur) => ({
                ...prev,
                photos: [],
                indexPhoto: null,
              }));
            }}
            onDeletePhoto={async (idx) => {
              await deletePhotos([demandeur.photos[idx]]);
              setDemandeur((prev: Demandeur) => ({
                ...prev,
                photos: prev.photos.filter((_, i) => i !== idx),
                indexPhoto: null,
              }));
            }}
            name="Photo du demandeur"
          />
        </IonItem>
      </IonContent>

      <IonAlert
        isOpen={showConfirmProfile}
        header="Photo de profil"
        message="Voulez-vous définir cette photo comme photo de profil ?"
        buttons={[
          {
            text: "Non",
            role: "cancel",
            handler: () => setShowConfirmProfile(false),
          },
          {
            text: "Oui",
            handler: () => {
              if (lastPhotoIndex !== null) {
                setDemandeur((prev: Demandeur) => ({
                  ...prev,
                  indexPhoto: lastPhotoIndex,
                }));
              }
              setShowConfirmProfile(false);
            },
          },
        ]}
      />

      {toastMessage && setToastMessage && (
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage(null)}
          color="danger"
          position="top"
        />
      )}
    </IonModal>
  );
};

export default ModalDemandeur;
