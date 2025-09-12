import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Demandeur } from "../model/parcelle/Demandeur";
import { TypeMoral } from "../model/TypeMoral";
import { Preferences } from "@capacitor/preferences";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";

const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState(""); 
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [typeMoral, setTypeMoral] = useState<TypeMoral[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: "typeMoralData" });
      if (value) {
        setTypeMoral(JSON.parse(value));
      }
    };

    loadData();
  }, []);

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

      <IonContent fullscreen>
        {/**Modal creation demandeur*/}
        <ModalDemandeur 
          showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal} 
          demandeur={demandeur} setDemandeur={setDemandeur}
          typeMoral={typeMoral} addDemandeur={addDemandeur}
          toastMessage={toastMessage} setToastMessage={setToastMessage}
          isPhysique={isPhysique} setIsPhysique={setIsPhysique}
          decomposed={decomposed} setDecomposed={setDecomposed}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
