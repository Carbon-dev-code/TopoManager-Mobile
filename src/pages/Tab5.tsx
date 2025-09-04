import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close } from "ionicons/icons";
import { useState } from "react";

const Demandeur: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState(""); // texte de recherche
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Création de demandeur</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label="Rechercher" onClick={() => setSearch(true)}>
              <IonIcon icon={searchSharp} slot="icon-only" />
            </IonButton>
            <IonButton
              aria-label="Créer une nouvelle demandeur"
              onClick={() => setShowCreateModal(true)}
            >
              <IonIcon icon={create} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      {seacrh && (
        <IonToolbar className="transparent-toolbar">
          <IonSearchbar
            autoFocus
            showCancelButton="focus"
            className="custom-search"
            placeholder="Recherche demandeur"
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
          />
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              color="danger"
              onClick={() => {
                setSearch(false);
                setSearchQuery(""); // réinitialise la recherche
              }}
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      )}

      <IonContent fullscreen></IonContent>
    </IonPage>
  );
};

export default Demandeur;
