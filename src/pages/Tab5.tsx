import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close } from "ionicons/icons";
import { Demandeur } from "../model/parcelle/Demandeur";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import { useState } from "react";

const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);


  const addDemandeur = () => {
    console.log(demandeur);
    setDemandeur(Demandeur.init);
    setShowCreateModal(false);
  };

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
            <IonButton aria-label="Créer une nouvelle demandeur" onClick={() => setShowCreateModal(true)}>
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
              onClick={() => { setSearch(false); setSearchQuery(""); }}
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      )}

      <IonContent fullscreen>
        <IonList>
          <div className="person-card">
            <IonAvatar className="person-avatar">R</IonAvatar>
            <div className="person-info">
              <span className="prenom">Jean</span>
              <span className="nom">Rakoto</span>
            </div>
          </div>
        </IonList>
        <ModalDemandeur
          showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal}
          demandeur={demandeur} setDemandeur={setDemandeur}
          addDemandeur={addDemandeur}
          toastMessage={toastMessage} setToastMessage={setToastMessage}
          isPhysique={isPhysique} setIsPhysique={setIsPhysique}
          decomposed={decomposed} setDecomposed={setDecomposed}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
