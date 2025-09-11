import { useState } from "react";
import { IonButton, IonImg, IonToast } from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const PhotoCapture: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl, // peut aussi être URI si besoin
        source: CameraSource.Camera, // caméra seulement
      });

      if (image.dataUrl) {
        setPhoto(image.dataUrl);
      } else {
        setToastMessage("Erreur lors de la capture de la photo");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setToastMessage("Action annulée ou erreur caméra");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <IonButton onClick={takePhoto}>Prendre une photo 📸</IonButton>

      {photo && (
        <div style={{ marginTop: "20px" }}>
          <IonImg src={photo} />
        </div>
      )}

      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage || ""}
        duration={2000}
        onDidDismiss={() => setToastMessage(null)}
        color="danger"
      />
    </div>
  );
};

export default PhotoCapture;