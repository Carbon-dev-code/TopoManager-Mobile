import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonPage, IonRadio, IonRadioGroup, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import "./Tab5.css";
import { searchSharp, create, close } from "ionicons/icons";
import { useState } from "react";
import { Demandeur } from "../model/parcelle/Demandeur";
import Physique from "../components/demandeur/Physique";
import Moral from "../components/demandeur/Moral";


const Tab5: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState(""); // texte de recherche
  const [seacrh, setSearch] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [demandeur, setDemandeur] = useState<Demandeur>(Demandeur.init());
  const [isPhysique, setIsPhysique] = useState(0);


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
        <IonModal
          isOpen={showCreateModal}
          onDidDismiss={() => {
            setShowCreateModal(false);
          }}
        >
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonButton onClick={() => setShowCreateModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Ajouter Demandeur</IonTitle>
              <IonButtons slot="end">
                <IonButton strong={true} onClick={addDemandeur}>
                  Ajouter
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel className="me-3">Type :</IonLabel>
                <IonRadioGroup
                  value={isPhysique.toString()}
                  onIonChange={(e) => {
                    const value = Number(e.detail.value);
                    setIsPhysique(value);
                    setDemandeur({
                      ...demandeur,
                      type: Number(value), // Si type doit être une string
                    });
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                  >
                    <IonItem lines="none">
                      <IonRadio justify="end" value="0">
                        Physique
                      </IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio justify="end" value="1">
                        Morale
                      </IonRadio>
                    </IonItem>
                  </div>
                </IonRadioGroup>
              </IonItem>
            </IonList>
            {isPhysique === 0 ? (
              <Physique demandeur={demandeur} setDemandeur={setDemandeur}/>
            ) : (
              <Moral demandeur={demandeur} setDemandeur={setDemandeur} typeMoral={[]}/>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
