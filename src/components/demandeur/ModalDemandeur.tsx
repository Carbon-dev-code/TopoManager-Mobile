import React, { useCallback } from "react";
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
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { close } from "ionicons/icons";
import "./ModalDemandeur.css";
import Physique from "./Physique";
import Moral from "./Moral";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import Photo from "../photo/Photo";
import { deletePhotos } from "../../model/base/DbSchema";
import { PersonnePhysique } from "../../model/Demandeur/PersonnePhysique";
import { PersonneMorale } from "../../model/Demandeur/PersonneMorale";

type ModalMode = "create" | "view" | "edit";

interface ModalDemandeurProps {
  showCreateModal: boolean;
  setShowCreateModal: (b: boolean) => void;
  personnePhysique: PersonnePhysique;
  setPersonnePhysique: React.Dispatch<React.SetStateAction<PersonnePhysique>>;
  personneMorale: PersonneMorale;
  setPersonneMorale: React.Dispatch<React.SetStateAction<PersonneMorale>>;
  addDemandeur: () => void;
  toastMessage?: string | null;
  setToastMessage?: (msg: string | null) => void;
  isPhysique: number;
  setIsPhysique: (d: number) => void;
  decomposed: boolean;
  setDecomposed: (d: boolean) => void;
  mode?: ModalMode;
  withRepresentants?: boolean;
  representanType?: string | null;
  setRepresentanType?: (role: string | null) => void;
}

const TITLES: Record<ModalMode, string> = {
  create: "Ajouter Personne",
  view: "Détails Personne",
  edit: "Modifier Personne",
};

const ModalDemandeur: React.FC<ModalDemandeurProps> = ({
  showCreateModal,
  setShowCreateModal,
  personnePhysique,
  setPersonnePhysique,
  personneMorale,
  setPersonneMorale,
  addDemandeur,
  toastMessage,
  setToastMessage,
  isPhysique,
  setIsPhysique,
  decomposed,
  setDecomposed,
  mode = "create",
  withRepresentants = false,
  representanType,
  setRepresentanType,
}) => {
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
    if ((personnePhysique.photos?.length ?? 0) >= 1) {
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
      setPersonnePhysique((prev) => ({
        ...prev,
        photos: [fileName],
        indexPhoto: 0,
      }));
    } catch (err) {
      console.error(err);
      setToastMessage?.("Erreur lors de la capture");
    }
  }, [personnePhysique.photos, setPersonnePhysique, setToastMessage]);

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
            {mode !== "view" && (
              <IonButton strong={true} onClick={addDemandeur}>
                {mode === "edit" ? "Mettre à jour" : "Ajouter"}
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ─── Type physique / morale ─────────────────────────────── */}
        <IonList>
          <IonItem>
            <IonLabel className="me-3 truncate">Type :</IonLabel>
            <IonRadioGroup
              value={isPhysique.toString()}
              onIonChange={(e) => {
                if (isReadOnly) return;
                setIsPhysique(Number(e.detail.value));
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
          <>
            {withRepresentants && (
              <IonItem>
                <IonSelect
                  label="Rôle :"
                  interface="alert"
                  disabled={isReadOnly}
                  value={representanType ?? "proprietaire"} // ← défaut propriétaire
                  onIonChange={(e) => setRepresentanType?.(e.detail.value)}
                >
                  <IonSelectOption value="proprietaire">
                    Propriétaire
                  </IonSelectOption>
                  <IonSelectOption value="tuteurLegal">
                    Tuteur légal
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
            )}
            <Physique
              physique={personnePhysique}
              setPhysique={setPersonnePhysique}
              readonly={isReadOnly}
            />
            <IonItem lines="none">
              <Photo
                photos={personnePhysique.photos ?? []}
                decomposed={decomposed}
                setDecomposed={setDecomposed}
                takePhoto={takePhoto}
                viewOnly={isReadOnly}
                maxPhotos={1}
                clearPhotos={async () => {
                  await deletePhotos(personnePhysique.photos ?? []);
                  setPersonnePhysique((prev) => ({
                    ...prev,
                    photos: [],
                    indexPhoto: null,
                  }));
                }}
                onDeletePhoto={async (idx) => {
                  await deletePhotos([personnePhysique.photos[idx]]);
                  setPersonnePhysique((prev) => ({
                    ...prev,
                    photos: prev.photos.filter((_, i) => i !== idx),
                    indexPhoto: null,
                  }));
                }}
                name="Photo du demandeur"
              />
            </IonItem>
          </>
        ) : (
          <Moral
            personne={personneMorale}
            setPersonne={setPersonneMorale}
            readonly={isReadOnly}
          />
        )}
      </IonContent>

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
