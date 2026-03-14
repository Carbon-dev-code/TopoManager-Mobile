import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonPopover, IonTitle, IonToolbar, useIonViewWillEnter, } from "@ionic/react";
import { ellipsisVertical, refreshCircleOutline, saveSharp } from "ionicons/icons";
import { useState } from "react";

import Alert from "../../shared/ui/Alert";

import { useServer } from "./hooks/useServer";

import "./AdminSettingsPage.css";
import { useServerConnection } from "./hooks/useServerConnection";

const AdminSettingsPage: React.FC = () => {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [isFocusedAdresse, setIsFocusedAdresse] = useState(false);
  const [isModifiedAdresse, setIsModifiedAdresse] = useState(false);

  //hooks personnaliser
  const { serverAdresse, setServerAdresse, getServerAdresse, saveServerAdresse, getDeviceId, deviceId, setDeviceId, saveDeviceId, clearAll } = useServer();
  const { connectionStatus, testConnection } = useServerConnection();


  const init = async () => {
    await getServerAdresse();
    await getDeviceId();
  };

  useIonViewWillEnter(() => {
    init();
  });


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Administrateur</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label="menu" id="dropdown-trigger-tab6">
              <IonIcon icon={ellipsisVertical} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonPopover trigger="dropdown-trigger-tab6" triggerAction="click">
        <IonContent>
          <IonList>
            <IonItem button onClick={() => setShowAlert(true)} lines="none">
              <IonIcon icon={refreshCircleOutline} slot="start" />
              <IonLabel>Réinitialisation</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>

      <IonContent fullscreen className="ion-padding">

        <p className="settings-section-title">Réseau</p>

        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-icon blue">🌐</div>
            <div className="settings-row-content">
              <div className="settings-row-label">Adresse serveur</div>
              <IonInput
                className="settings-row-input"
                value={serverAdresse}
                placeholder="192.168.1.1:8080"
                onIonChange={async (e) => {
                  const val = e.detail.value ?? "";
                  setServerAdresse(val);
                  setIsModifiedAdresse(true);
                  await saveServerAdresse(val);
                }}
                onIonFocus={() => setIsFocusedAdresse(true)}
                onIonBlur={() => setIsFocusedAdresse(false)}
              />
            </div>
            {(isFocusedAdresse || isModifiedAdresse) && (
              <div className="settings-save-btn" onClick={() => saveServerAdresse(serverAdresse)}>
                <IonIcon icon={saveSharp} />
              </div>
            )}
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            <button
              className={`test-connection-btn ${connectionStatus}`}
              onClick={() => testConnection(serverAdresse)}
            >
              <span className={`status-dot ${connectionStatus}`} />
              {connectionStatus === 'idle' && "Tester la connexion"}
              {connectionStatus === 'loading' && "Connexion en cours..."}
              {connectionStatus === 'success' && "Serveur accessible ✓"}
              {connectionStatus === 'error' && "Serveur inaccessible"}
            </button>
          </div>
        </div>

        <p className="settings-section-title">Appareil</p>

        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-icon purple">📱</div>
            <div className="settings-row-content">
              <div className="settings-row-label">ID du Device</div>
              <IonInput
                className="settings-row-input"
                value={deviceId}
                placeholder="XXXXX"
                onIonChange={async (e) => {
                  const val = e.detail.value ?? "";
                  setDeviceId(val);
                  setIsModified(true);
                  await saveDeviceId(val);
                }}
                onIonFocus={() => setIsFocused(true)}
                onIonBlur={() => setIsFocused(false)}
              />
            </div>
            {(isFocused || isModified) && (
              <div className="settings-save-btn" onClick={() => saveDeviceId(deviceId)}>
                <IonIcon icon={saveSharp} />
              </div>
            )}
          </div>
        </div>

        <div className="settings-danger-zone">
          <button className="reset-btn" onClick={() => setShowAlert(true)}>
            🗑️ Réinitialiser toutes les données
          </button>
        </div>

      </IonContent>

      <Alert
        show={showAlert}
        type={1}
        title="Réinitialisation"
        message="Êtes-vous sûr de vouloir supprimer toutes les données ?"
        onCancel={() => setShowAlert(false)}
        onConfirm={() => { clearAll(); setShowAlert(false); }}
        onClose={() => setShowAlert(false)}
      />
    </IonPage>
  );
};

export default AdminSettingsPage;

