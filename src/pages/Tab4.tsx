// Tab4.tsx
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import {
  sync
} from "ionicons/icons";
import '../assets/dist/css/bootstrap.min.css';

const Tab4: React.FC = () => {
  return (
    <IonPage>
        <IonHeader>
        <IonToolbar color="primary">
            <IonButtons slot="start">
            <IonMenuButton />
            </IonButtons>
            <IonTitle>Paramètre</IonTitle>
            <IonButtons slot="end">
                <IonButton>
                    <IonIcon icon={sync} slot="start" />Sync
                </IonButton>
            </IonButtons>
        </IonToolbar>
        </IonHeader>
        <IonContent>
            TESTE
        </IonContent>
    </IonPage> 
  );
};

export default Tab4;