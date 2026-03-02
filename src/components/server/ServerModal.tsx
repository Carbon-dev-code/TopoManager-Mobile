import { IonModal, IonHeader, IonToolbar, IonTitle, IonButton, IonContent, IonLabel, IonInput, } from "@ionic/react";
import { useEffect, useState } from "react";
import { ConfigService } from "../../model/ConfigService";
import "./ServerModal.css";

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ServerModal: React.FC<ServerModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [ipPort, setIpPort] = useState("");

  useEffect(() => {
    if (isOpen) ConfigService.getServerIpPort().then(setIpPort).catch(() => setIpPort(""));
  }, [isOpen]);

  const handleSave = async () => {
    await ConfigService.saveServerUrl(ipPort);
    onSaved();
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Configurer le serveur</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="card-server-modal">
          <IonLabel position="stacked">
            Adresse IP:port
          </IonLabel>

          <IonInput
            value={ipPort}
            onIonChange={(e) => setIpPort(e.detail.value ?? "")}
            placeholder="192.168.1.10:80"
          />

          <div className="row g-0">
            <div className="col-6">
              <IonButton expand="block" color="danger" onClick={onClose}>
                Annuler
              </IonButton>
            </div>
            <div className="col-6">
              <IonButton expand="block" onClick={handleSave}>
                Enregistrer
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ServerModal;