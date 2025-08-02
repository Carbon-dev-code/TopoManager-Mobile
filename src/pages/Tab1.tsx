import React, { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAlert,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonTextarea,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonDatetime,
  IonRadioGroup,
  IonRadio,
  IonGrid,
  IonCol,
  IonRow,
} from "@ionic/react";
import {
  trash,
  add,
  close,
  informationCircle,
  person,
  business,
  male,
  female,
  create,
} from "ionicons/icons";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab1.css";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { Categorie } from "../model/Categorie";
import { Status } from "../model/Status";


const Tab1: React.FC = () => {
  const today = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [currentParcelleCode, setCurrentParcelleCode] = useState("");
  const [currentIncrement, setCurrentIncrement] = useState(0);
  const [parametreTerritoire, setParametreTerritoire] = useState<ParametreTerritoire | null>(null);

  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [status, setStatus] = useState<Status[]>([]);

  const nextCodeParcelle = async () => {
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });

      if (parametrePref.value) {
        const parametreActuel = JSON.parse(parametrePref.value);
        const newIncrement = (parametreActuel.increment || 0) + 1;
        const code_parcelle_complet = `${parametreActuel.region.coderegion}-${parametreActuel.district.codedistrict}-${parametreActuel.commune.codecommune}-${parametreActuel.fokontany.codefokontany}-${parametreActuel.hameau?.codehameau}-${newIncrement.toString()}`;
        setCurrentParcelleCode(code_parcelle_complet);
        setCurrentIncrement(newIncrement);
        setParametreTerritoire(parametreActuel);
      }
    } catch (error) {
      console.error("Erreur dans nextCodeParcelle:", error);
    }
  };

  const getCategorie = async () => {
    const { value } = await Preferences.get({ key: "categorieData" });
    if (value) {
      setCategorie(JSON.parse(value));
    }
  };

  const getStatus = async () => {
    const { value } = await Preferences.get({ key: "statusData" });

    if (value) {
      setStatus(JSON.parse(value));
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      nextCodeParcelle();
      getCategorie();
      getStatus();
    }
  }, [showCreateModal]);

  const createParcelle = () => {
    console.log('IO eee');
    
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Gestion Parcelles</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowCreateModal(true)}>
              <IonIcon icon={create} slot="start" />
              Ajouter
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>

      </IonContent>

      {/*Modal creation de parcelle*/}
      <IonModal
        isOpen={showCreateModal}
        onDidDismiss={() => { setShowCreateModal(false) }}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton
                onClick={() => {
                  setShowCreateModal(false);
                }}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>
              Nouvelle parcelle
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonList>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonInput
                      labelPlacement="floating"
                      type="text"
                      value={currentParcelleCode}
                      readonly={true}
                    >
                      <div slot="label">
                        Code parcelle
                      </div>
                    </IonInput>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonInput
                      labelPlacement="floating"
                      type="date"
                      value={today}
                      readonly={true}
                    >
                      <div slot="label">
                        En date du
                      </div>
                    </IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>

            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonSelect
                      label="Status :"
                      placeholder="Status de terre">
                      {status.map((stat, index) => (
                        <IonSelectOption
                          key={`status-${index}`}
                          value={stat.id}
                        >
                          {stat.labelstatus}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonInput
                      label="Année d'occupation :"
                      type="number"
                      placeholder="Nombre d'année">
                    </IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonSelect
                      label="Catégorie :"
                      placeholder="Catégorie de terre">
                      {categorie.map((cat, index) => (
                        <IonSelectOption
                          key={cat.id || `categorie-${index}`}
                          value={cat.id}
                        >
                          {cat.labelcategorie}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonInput
                      label="Consistance :"
                      type="text"
                      placeholder="Consistance du terrain">
                    </IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonCheckbox labelPlacement="start">Opposition</IonCheckbox>
                  </IonCol>
                  <IonCol size="12" size-md="12">
                    <IonCheckbox labelPlacement="start">Revandication</IonCheckbox>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="12">
                    <IonTextarea label="Observation" labelPlacement="stacked" placeholder="Votre observation sur la parcelle"></IonTextarea>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
            <IonItem>
              <IonGrid className="ion-margin-bottom">
                <IonRow className="ion-wrap ion-gap">
                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Région</small>
                      <div><strong>{parametreTerritoire?.region.nomregion}</strong></div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">District</small>
                      <div><strong>{parametreTerritoire?.district.nomdistrict}</strong></div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Commune</small>
                      <div><strong>{parametreTerritoire?.commune.nomcommune}</strong></div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Fokontany</small>
                      <div><strong>{parametreTerritoire?.fokontany.nomfokontany}</strong></div>
                    </div>
                  </IonCol>

                  <IonCol size="6" size-md="4" size-lg="2">
                    <div className="ion-text-wrap">
                      <small className="ion-text-muted">Hameau</small>
                      <div><strong>{parametreTerritoire?.hameau.nomhameau}</strong></div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
          </IonList>
          <IonButton 
            expand="full"
            onClick={createParcelle}
          >Enregistrer la parcelle</IonButton>
        </IonContent>
      </IonModal>
    </IonPage >

  );
};

export default Tab1;
