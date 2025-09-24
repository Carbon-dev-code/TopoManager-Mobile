import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonViewWillEnter,
} from "@ionic/react";
import { searchSharp } from "ionicons/icons";
import { useState } from "react";
import { Preferences } from "@capacitor/preferences";
import "./Tab6.css";

const Tab6: React.FC = () => {
    const [deviceId, setDeviceId] = useState<string>("");

    // Charger la valeur au montage
    useIonViewWillEnter(() => {
        const loadG = async () => {
            const { value } = await Preferences.get({ key: "device_id" });
            if (value) setDeviceId(value);
        }
        loadG();
    });

    // Sauvegarder le device_id
    const saveDeviceId = async () => {
        await Preferences.set({ key: "device_id", value: deviceId });
    };

    // Réinitialiser toutes les preferences sauf session_id
    const resetPreferences = async () => {
        const all = await Preferences.keys();
        const keysToDelete = all.keys.filter((k) => k !== "session_id");
        for (const key of keysToDelete) {
            await Preferences.remove({ key });
        }
        alert("Préférences réinitialisées (session conservée) ✔️");
        setDeviceId(""); // vider le champ
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
                        <IonButton aria-label="Rechercher">
                            <IonIcon icon={searchSharp} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                <div className="admin-card">
                    <IonItem lines="none">
                        <IonLabel position="stacked">ID du Device</IonLabel>
                        <IonInput
                            value={deviceId}
                            placeholder="Entrez un numéro"
                            onIonChange={(e) => setDeviceId(e.detail.value!)}
                        />
                    </IonItem>

                    <IonButton expand="full" color="primary" onClick={saveDeviceId} className="ion-margin-top">
                        Sauvegarder
                    </IonButton>

                    <IonButton expand="full" color="danger" onClick={resetPreferences} className="ion-margin-top">
                        Réinitialiser toutes les données
                    </IonButton>
                </div>
            </IonContent>

        </IonPage>
    );
};

export default Tab6;
