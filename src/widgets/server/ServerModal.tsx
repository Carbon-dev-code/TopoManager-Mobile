import { IonInput } from "@ionic/react";
import { useEffect, useState } from "react";
import { ConfigService } from "../../shared/lib/config/ConfigService";
import "./ServerModal.css";

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ServerModal: React.FC<ServerModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [ipPort, setIpPort] = useState("");

  useEffect(() => {
    if (isOpen)
      ConfigService.getServerIpPort()
        .then(setIpPort)
        .catch(() => setIpPort(""));
  }, [isOpen]);

  const handleSave = async () => {
    await ConfigService.saveServerUrl(ipPort);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="server-modal-overlay" onClick={onClose}>
      <div className="server-modal-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="server-modal-icon">🌐</div>
        <div className="server-modal-title">Configurer le serveur</div>
        <div className="server-modal-subtitle">
          Entrez l'adresse IP et le port du serveur
        </div>

        <div className="server-modal-field">
          <div className="server-modal-field-label">Adresse IP : Port</div>
          <IonInput
            className="server-modal-input"
            value={ipPort}
            onIonChange={(e) => setIpPort(e.detail.value ?? "")}
            placeholder="192.168.1.10:8080"
            inputmode="url"
          />
        </div>

        <div className="server-modal-actions">
          <button className="server-modal-btn cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="server-modal-btn save" onClick={handleSave}>
            Enregistrer
          </button>
        </div>

      </div>
    </div>
  );
};

export default ServerModal;