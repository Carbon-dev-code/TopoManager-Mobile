import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  ellipsisVertical,
  refreshCircleOutline,
  saveSharp,
} from "ionicons/icons";
import { useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { clearDatabase } from "../../model/base/DbSchema";
import Alert from "../../components/alert/Alert";
import "./AdminSettingsPage.css";

const AdminSettingsPage: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>("");
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isModified, setIsModified] = useState(false);

  useIonViewWillEnter(() => {
    const loadDeviceId = async () => {
      const { value } = await Preferences.get({ key: "device_id" });
      if (value) setDeviceId(value);
    };
    loadDeviceId();
  });

  const saveDeviceId = async () => {
    if (!deviceId) return;
    try {
      await Preferences.set({ key: "device_id", value: deviceId });
      setIsModified(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du device_id:", err);
    }
  };

  const resetPreferences = async () => {
    try {
      await Preferences.clear();
      await clearDatabase();
      setDeviceId("");
      setTimeout(() => {
        window.location.href = "/accueil";
      }, 100);
    } catch (err) {
      console.error("Erreur lors du reset:", err);
    }
  };

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
        <div className="admin-card">
          <div className="row d-flex align-items-center">
            <div className="col">
              <div className="row d-flex align-items-center">
                <div className="col-auto">ID du Device :</div>
                <div className="col">
                  <IonInput
                    className="input-tab-6-custom"
                    value={deviceId}
                    placeholder="XXXXX"
                    onIonChange={async (e) => {
                      const val = e.detail.value ?? "";
                      setDeviceId(val);
                      setIsModified(true);
                      await Preferences.set({ key: "device_id", value: val });
                    }}
                    onIonFocus={() => setIsFocused(true)}
                    onIonBlur={() => setIsFocused(false)}
                  />
                </div>
              </div>
            </div>
            <div className="col-auto">
              {(isFocused || isModified) && (
                <div className="save-button" onClick={saveDeviceId}>
                  <IonIcon icon={saveSharp} />
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <Alert
        show={showAlert}
        type={1}
        title="Réinitialisation"
        message="Êtes-vous sûr de vouloir supprimer toutes les données ?"
        onCancel={() => setShowAlert(false)}
        onConfirm={() => {
          resetPreferences();
          setShowAlert(false);
        }}
        onClose={() => setShowAlert(false)}
      />
    </IonPage>
  );
};

export default AdminSettingsPage;

