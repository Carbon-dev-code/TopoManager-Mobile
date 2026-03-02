import React, { useState } from "react";
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
import Photo from "../photo/Photo";

type ModalMode = "create" | "view" | "edit";

interface ModalDemandeurProps {
  showCreateModal: boolean;
  setShowCreateModal: (b: boolean) => void;
  demandeur: Demandeur;
  setDemandeur: (d: Demandeur) => void;
  addDemandeur: () => void;
  toastMessage?: string | null;
  setToastMessage?: (msg: string | null) => void;
  isPhysique: number;
  setIsPhysique: (d: number) => void;
  decomposed: boolean;
  setDecomposed: (d: boolean) => void;
  mode?: ModalMode; // "create" par défaut
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
  const [lastPhotoIndex, setLastPhotoIndex] = useState<number | null>(null);

  const isReadOnly = mode === "view";

  const takePhoto = async () => {
    try {
      if (demandeur.photos.length >= 5) {
        setToastMessage?.("Vous ne pouvez pas ajouter plus de 5 photos");
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!photo.dataUrl) throw new Error("Pas de photo");

      setDemandeur((prev) => ({
        ...prev,
        photos: [...prev.photos, photo.dataUrl],
      }));

      setLastPhotoIndex(demandeur.photos.length);
      setShowConfirmProfile(true);
    } catch (err) {
      console.error(err);
      setToastMessage?.("Erreur lors de la capture");
    }
  };

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
            {/* En mode view : bouton pour passer en edit */}
            {mode === "view" && (
              <IonButton onClick={() => {
                // Signaler au parent de repasser en edit
                // On ferme et le parent réouvre en edit
                setShowCreateModal(false);
              }}>
                <IonIcon icon={createOutline} slot="icon-only" />
              </IonButton>
            )}

            {/* En mode create ou edit : bouton valider */}
            {mode !== "view" && (
              <IonButton strong={true} onClick={addDemandeur}>
                {mode === "edit" ? "Mettre à jour" : "Ajouter"}
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Sélecteur de type — désactivé en view/edit */}
        <IonList>
          <IonItem>
            <IonLabel className="me-3 truncate">Type :</IonLabel>
            <IonRadioGroup
              value={isPhysique.toString()}
              onIonChange={(e) => {
                if (isReadOnly) return;
                const value = Number(e.detail.value);
                setIsPhysique(value);
                setDemandeur({ ...demandeur, type: Number(value) });
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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

        {/* Formulaire selon le type */}
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

        {/* Photos — masquées en mode view */}
        {mode !== "view" && (
          <Photo
            photos={demandeur.photos}
            decomposed={decomposed}
            setDecomposed={setDecomposed}
            takePhoto={takePhoto}
            clearPhotos={() => setDemandeur((prev) => ({ ...prev, photos: [] }))}
            name="Prendre une photo du demandeur"
          />
        )}
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
                setDemandeur((prev) => ({ ...prev, indexPhoto: lastPhotoIndex }));
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