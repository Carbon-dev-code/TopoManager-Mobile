import React from "react";
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
  IonImg,
} from "@ionic/react";
import { close } from "ionicons/icons";
import Physique from "./Physique";
import Moral from "./Moral";
import { Demandeur } from "../../model/parcelle/Demandeur";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

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
}

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
}) => {
  // ⚡ takePhoto définie en interne
  const takePhoto = async () => {
    try {
      if (demandeur.photos && demandeur.photos.length >= 5) {
        setToastMessage?.("Vous ne pouvez pas ajouter plus de 5 photos");
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!photo.dataUrl) throw new Error("Pas de photo");

      setDemandeur((prev) => {
        const newDemandeur = { ...prev };
        if (!newDemandeur.photos) newDemandeur.photos = [];
        newDemandeur.photos.push(photo.dataUrl);
        return newDemandeur;
      });
    } catch (err) {
      console.error(err);
      setToastMessage?.("Erreur lors de la capture");
    }
  };
  return (
    <IonModal
      isOpen={showCreateModal}
      onDidDismiss={() => {
        setShowCreateModal(false);
      }}
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => setShowCreateModal(false)}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Ajouter Demandeur</IonTitle>
          <IonButtons slot="end">
            <IonButton strong={true} onClick={addDemandeur}>
              Ajouter
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ⚡️ Ici tu colles tout ton <IonList> ... <IonToast> ... <div> ... etc. */}
        <IonList>
          <IonItem>
            <IonLabel className="me-3">Type :</IonLabel>
            <IonRadioGroup
              value={isPhysique.toString()}
              onIonChange={(e) => {
                const value = Number(e.detail.value);
                setIsPhysique(value);
                setDemandeur({
                  ...demandeur,
                  type: Number(value), // Si type doit être une string
                });
              }}
            >
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <IonItem lines="none">
                  <IonRadio justify="end" value="0">
                    Physique
                  </IonRadio>
                </IonItem>
                <IonItem lines="none">
                  <IonRadio justify="end" value="1">
                    Morale
                  </IonRadio>
                </IonItem>
              </div>
            </IonRadioGroup>
          </IonItem>
        </IonList>
        {isPhysique === 0 ? (
          <Physique demandeur={demandeur} setDemandeur={setDemandeur} />
        ) : (
          <Moral
            demandeur={demandeur}
            setDemandeur={setDemandeur}
          />
        )}
        {/* Stack d’images dynamiques */}
        {demandeur.photos && demandeur.photos.length > 0 && (
          <div
            className={`image-stack ${decomposed ? "decomposed" : ""}`}
            onClick={() => setDecomposed(!decomposed)}
          >
            {demandeur.photos.map((p, idx) => (
              <IonImg key={idx} src={p} className="image" />
            ))}

            {/* Badge +N si plus de 3 photos */}
            {!decomposed && demandeur.photos.length > 1 && (
              <div className="image-badge">+{demandeur.photos.length}</div>
            )}
          </div>
        )}

        {/* Boutons en flex */}
        <div className="button-photo">
          <IonButton style={{ flex: 1 }} onClick={takePhoto}>
            Prendre une photo 📸
          </IonButton>

          {demandeur.photos && demandeur.photos.length > 0 && (
            <IonButton
              style={{ flex: 1 }}
              color="danger"
              onClick={() => setDemandeur((prev) => ({ ...prev, photos: [] }))}
            >
              Supprimer les photos 🗑️
            </IonButton>
          )}
        </div>
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
