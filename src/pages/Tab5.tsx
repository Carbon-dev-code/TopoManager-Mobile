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
  useIonViewWillEnter,
} from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close } from "ionicons/icons";
import { Demandeur } from "../model/parcelle/Demandeur";
import ModalDemandeur from "../components/demandeur/ModalDemandeur";
import { useState } from "react";
import DemandeurView from "../components/demandeur/DemandeurView";
import { getAllDemandeurs, insertDemandeur } from "../model/base/DbSchema";

const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [decomposed, setDecomposed] = useState(false);
  const [demandeurList, setDemandeurList] = useState<Demandeur[]>([]);

  const loadDemandeurFromStorage = async (): Promise<Demandeur[]> => {
    return await getAllDemandeurs();
  };

  const load = async () => {
    const demandeur = await loadDemandeurFromStorage();
    setDemandeurList(demandeur);
  };

  useIonViewWillEnter(() => {
    load();
  });

  const addDemandeur = async () => {
    console.log(demandeur);
    await insertDemandeur(demandeur);
    setDemandeur(Demandeur.init);
    setDemandeurList(await getAllDemandeurs());
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
          <IonSearchbar autoFocus showCancelButton="focus"
            className="custom-search" placeholder="Recherche demandeur"
            value={searchQuery} onIonInput={(e) => setSearchQuery(e.detail.value!)}
          />
          <IonButtons slot="end">
            <IonButton fill="clear" color="danger"
              onClick={() => { setSearch(false); setSearchQuery(""); }}
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      )}

      <IonContent fullscreen>
        <IonList>
          {demandeurList.map((demandeur, index) => (
            <DemandeurView key={index} demandeur={demandeur} />
          ))}
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
