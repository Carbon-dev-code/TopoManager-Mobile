import {
  IonPage,
  IonContent,
  IonButton,
  IonLoading,
  IonAlert,
  IonHeader,
  IonButtons,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  IonCard,
  IonLabel,
  IonCardContent,
  IonList,
  IonItem,
  IonModal,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonText,
  IonProgressBar,
  useIonViewWillEnter,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { useState, useEffect } from "react";
import { ConfigService } from "../model/ConfigService";
import { close, settingsOutline, sync } from "ionicons/icons";
import "./Tab4.css";

interface Territoire {
  idregion: number;
  coderegion: string;
  nomregion: string;
  districts: District[];
}

interface District {
  iddistrict: number;
  codedistrict: string;
  nomdistrict: string;
  communes: Commune[];
}

interface Commune {
  idcommune: number;
  codecommune: string;
  nomcommune: string;
  fokontany: Fokontany[];
}

interface Fokontany {
  idfokontany: number;
  codefokontany: string;
  nomfokontany: string;
  hameaux: Hameau[];
}

interface Hameau {
  idhameau: number;
  codehameau: string;
  nomhameau: string;
}

interface ParametreTerritoire {
  id: string;
  region: {
    id: number;
    code: string;
    nom: string;
  };
  district: {
    id: number;
    code: string;
    nom: string;
  };
  commune: {
    id: number;
    code: string;
    nom: string;
  };
  fokontany: {
    id: number;
    code: string;
    nom: string;
  };
  hameau: {
    id: number;
    code: string;
    nom: string;
  };
  increment: number;
  dateSelection: string;
}

const Tab4 = () => {
  const [territoire, setTerritoire] = useState<Territoire[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [selectedFokontany, setSelectedFokontany] = useState<number | null>(null);
  const [selectedHameau, setSelectedHameau] = useState<number | null>(null);
  const [parametres, setParametres] = useState<ParametreTerritoire[]>([]);
  const [parametreActuel, setParametreActuel] = useState<ParametreTerritoire | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [currentParcelleCode, setCurrentParcelleCode] = useState<string>("");

  useIonViewWillEnter(() => {
    loadConfig().then(() => refreshCurrentParams());
  });

  const refreshCurrentParams = async () => {
    try {
      const { value } = await Preferences.get({ key: "parametreActuel" });
      if (value) {
        const current = JSON.parse(value);
        setParametreActuel(current);

        const codeComplet = `${current.region.code}-${current.district.code}-${current.commune.code
          }-${current.fokontany.code}-${current.hameau.code}-${current.increment + 1
          }`;
        setCurrentParcelleCode(codeComplet);
      }
    } catch (error) {
      console.error("Erreur rafraîchissement paramètres:", error);
    }
  };

  const loadConfig = async () => {
    try {
      const url = await ConfigService.getServerBaseUrl();
      setServerUrl(url); // Mise à jour de l'état
      const { value } = await Preferences.get({ key: 'territoireData' });
      if (value) {
        setTerritoire(JSON.parse(value));
      }
      return url; // Important pour le .then()
    } catch (error) {
      setError("Configurez l'URL du serveur d'abord");
      throw error; // Propage l'erreur
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setShowProgress(true);
    setError(null);

    try {
      // 1. Récupérer l'URL du serveur
      const currentServerUrl = await ConfigService.getServerBaseUrl();
      setServerUrl(currentServerUrl);

      // 2. Vérification de l'URL
      if (!currentServerUrl) {
        throw new Error("Configuration serveur manquante");
      }

      // 3. Fetch des données territoire
      const [territoireResponse] = await Promise.all([
        fetch(`${currentServerUrl}/getTerritoire`),
      ]);

      if (!territoireResponse.ok) {
        throw new Error(`Erreur territoire: ${territoireResponse.status}`);
      }

      const territoireData = await territoireResponse.json();

      // 4. Sauvegarder dans les préférences
      await Preferences.set({
        key: 'territoireData',
        value: JSON.stringify(territoireData.data)
      });

      // 5. Mettre à jour l'état local
      setTerritoire(territoireData.data);
      setShowModal(true);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Échec de la synchronisation: ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setShowProgress(false);
    }
  };

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const { value: savedParams } = await Preferences.get({
          key: "parametres",
        });
        if (savedParams) {
          setParametres(JSON.parse(savedParams));
        }

        const { value: currentParam } = await Preferences.get({
          key: "parametreActuel",
        });
        if (currentParam) {
          setParametreActuel(JSON.parse(currentParam));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des préférences:", error);
      }
    };

    loadSavedData();
  }, []);

  useEffect(() => {
    const saveParams = async () => {
      if (parametres.length > 0) {
        try {
          await Preferences.set({
            key: "parametres",
            value: JSON.stringify(parametres),
          });
        } catch (error) {
          console.error("Erreur lors de la sauvegarde des paramètres:", error);
        }
      }
    };

    saveParams();
  }, [parametres]);

  useEffect(() => {
    const saveCurrentParam = async () => {
      if (parametreActuel) {
        try {
          await Preferences.set({
            key: "parametreActuel",
            value: JSON.stringify(parametreActuel),
          });
        } catch (error) {
          console.error(
            "Erreur lors de la sauvegarde du paramètre actuel:",
            error
          );
        }
      }
    };

    saveCurrentParam();
  }, [parametreActuel]);

  const migrateParams = async () => {
    const { value } = await Preferences.get({ key: "parametres" });
    if (value) {
      const params = JSON.parse(value);
      const migrated = params.map((p) => ({
        ...p,
        id: p.id || `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      }));
      await Preferences.set({
        key: "parametres",
        value: JSON.stringify(migrated),
      });
      setParametres(migrated);
    }
  };

  useEffect(() => {
    migrateParams();
  }, []);

  const enregistrerParametres = async () => {
    if (
      !selectedRegion ||
      !selectedDistrict ||
      !selectedCommune ||
      !selectedFokontany ||
      !selectedHameau
    ) {
      setError("Veuillez sélectionner tous les niveaux territoriaux");
      return;
    }

    const region = territoire.find((r) => r.idregion === selectedRegion);
    const district = region?.districts.find(
      (d) => d.iddistrict === selectedDistrict
    );
    const commune = district?.communes.find(
      (c) => c.idcommune === selectedCommune
    );
    const fokontany = commune?.fokontany.find(
      (f) => f.idfokontany === selectedFokontany
    );
    const hameau = fokontany?.hameaux.find(
      (h) => h.idhameau === selectedHameau
    );

    if (!region || !district || !commune || !fokontany || !hameau) {
      setError("Données territoriales incomplètes");
      return;
    }

    const nouveauParametre: ParametreTerritoire = {
      id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // ID plus unique
      region: {
        id: region.idregion,
        code: region.coderegion,
        nom: region.nomregion,
      },
      district: {
        id: district.iddistrict,
        code: district.codedistrict,
        nom: district.nomdistrict,
      },
      commune: {
        id: commune.idcommune,
        code: commune.codecommune,
        nom: commune.nomcommune,
      },
      fokontany: {
        id: fokontany.idfokontany,
        code: fokontany.codefokontany,
        nom: fokontany.nomfokontany,
      },
      hameau: {
        id: hameau.idhameau,
        code: hameau.codehameau,
        nom: hameau.nomhameau,
      },
      increment: 0,
      dateSelection: new Date().toISOString(),
    };

    const updatedParams = [...parametres, nouveauParametre];
    setParametres(updatedParams);
    setParametreActuel(nouveauParametre);

    try {
      await Preferences.set({
        key: "parametres",
        value: JSON.stringify(updatedParams),
      });
      await Preferences.set({
        key: "parametreActuel",
        value: JSON.stringify(nouveauParametre),
      });

      const codeComplet = `${nouveauParametre.region.code}-${nouveauParametre.district.code
        }-${nouveauParametre.commune.code}-${nouveauParametre.fokontany.code}-${nouveauParametre.hameau.code
        }-${nouveauParametre.increment + 1}`;
      setCurrentParcelleCode(codeComplet);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }

    setShowModal(false);
  };

  const definirCommeActuel = async (parametre: ParametreTerritoire) => {
    try {
      await Preferences.set({
        key: "parametreActuel",
        value: JSON.stringify(parametre),
      });
      setParametreActuel(parametre);

      const codeComplet = `${parametre.region.code}-${parametre.district.code
        }-${parametre.commune.code}-${parametre.fokontany.code}-${parametre.hameau.code
        }-${parametre.increment + 1}`;
      setCurrentParcelleCode(codeComplet);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du paramètre actuel:", error);
    }
  };

  const resetDistrict = () => {
    setSelectedDistrict(null);
    setSelectedCommune(null);
    setSelectedFokontany(null);
    setSelectedHameau(null);
  };

  const resetCommune = () => {
    setSelectedCommune(null);
    setSelectedFokontany(null);
    setSelectedHameau(null);
  };

  const resetFokontany = () => {
    setSelectedFokontany(null);
    setSelectedHameau(null);
  };

  const getServerAddress = () => {
    if (!serverUrl) return "Non configuré";

    // Extrait http://ip:port ou https://ip:port
    const matches = serverUrl.match(/^https?:\/\/([^\/]+)/);
    return matches ? matches[1] : serverUrl;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          {showProgress && (
            <IonProgressBar type="indeterminate" color="light"></IonProgressBar>
          )}
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="ion-text-center">
            Paramètres Territoriaux
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={fetchData} disabled={isLoading}>
              <IonIcon slot="icon-only" icon={sync} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" color="light">
        {/* Carte du paramètre actuel */}
        <IonCard color="white" className="current-param-card">
          <IonCardContent>
            <div
              className="ion-text-center ion-margin-bottom"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <IonIcon
                  icon={settingsOutline}
                  color="primary"
                  size="large"
                  className="param-icon"
                  style={{ marginRight: "8px" }}
                />
                <IonLabel style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  Paramétrage Actuel
                </IonLabel>
              </div>

              <IonText color="medium" className="mx-2">
                Serveur: {getServerAddress()}
              </IonText>
            </div>

            {parametreActuel ? (
              <div className="param-details">
                <div className="row">
                  <IonItem lines="none" className="param-item">
                    <IonLabel>
                      <IonText color="medium">
                        (Code region-Code district-Code commune-Code fokontany-Code hameau-Numero auto increment)
                      </IonText>
                      <p>
                        <b>{currentParcelleCode || "Aucun code disponible"}</b>
                      </p>
                    </IonLabel>
                  </IonItem>
                </div>
                <div className="row">
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Région</IonText>
                        <p>
                          <b>{parametreActuel.region.nom}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">District</IonText>
                        <p>
                          <b>{parametreActuel.district.nom}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Date de sélection</IonText>
                        <p>
                          <b>
                            {new Date(
                              parametreActuel.dateSelection
                            ).toLocaleString()}
                          </b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Commune</IonText>
                        <p>
                          <b>{parametreActuel.commune.nom}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Fokontany</IonText>
                        <p>
                          <b>{parametreActuel.fokontany.nom}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Hameau</IonText>
                        <p>
                          <b>{parametreActuel.hameau.nom}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ion-text-center ion-padding">
                <IonText color="medium">
                  <p>Aucun paramètre sélectionné</p>
                </IonText>
              </div>
            )}

            <div className="ion-text-center ion-margin-top">
              <IonButton
                onClick={() => setShowModal(true)}
                shape="round"
                className="edit-button"
              >
                <IonIcon slot="start" icon={settingsOutline} />
                Ajouter une nouvelle paramètres
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Liste des paramètres enregistrés */}
        {parametres.length > 0 && (
          <IonCard color="white" className="saved-params-card">
            <IonCardContent>
              <IonListHeader className="saved-params-header">
                <IonText color="dark">
                  <h3>Historique des Paramètres</h3>
                </IonText>
              </IonListHeader>

              <IonList lines="none" className="saved-params-list">
                {parametres.map((param) => (
                  <IonItem
                    key={`param-${param.id}`}
                    button
                    onClick={() => definirCommeActuel(param)}
                    color={parametreActuel?.id === param.id ? "primary" : ""}
                    className="saved-param-item"
                  >
                    <IonLabel className="param-label">
                      <IonText>
                        <h3>
                          {param.region.nom} → {param.district.nom}
                        </h3>
                        <p>
                          {param.commune.nom} → {param.fokontany.nom} →{" "}
                          {param.hameau.nom}
                        </p>
                        <p>{new Date(param.dateSelection).toLocaleString()}</p>
                      </IonText>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>

      {/* Modal de sélection des paramètres */}
      <IonModal
        isOpen={showModal}
        onDidDismiss={() => setShowModal(false)}
        className="param-modal"
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className="ion-text-center">
              Configuration du Territoire
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding" color="light">
          {isLoading ? (
            <IonLoading isOpen={true} message="Chargement..." />
          ) : error ? (
            <IonAlert
              isOpen={!!error}
              onDidDismiss={() => setError(null)}
              header="Erreur"
              message={error}
              buttons={["OK"]}
            />
          ) : (
            <div className="selection-container">
              {/* Sélection de la région */}
              <IonItem className="selection-item" lines="full">
                <IonLabel position="stacked" color="primary">
                  <b>Région</b>
                </IonLabel>
                <IonSelect
                  value={selectedRegion}
                  placeholder="Sélectionnez une région"
                  onIonChange={(e) => {
                    setSelectedRegion(e.detail.value);
                    resetDistrict();
                  }}
                  interface="action-sheet"
                  className="selection-input"
                >
                  {territoire.map((region) => (
                    <IonSelectOption
                      key={`region-${region.idregion}`}
                      value={region.idregion}
                    >
                      {region.nomregion}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {/* Sélection du district */}
              {selectedRegion && (
                <IonItem className="selection-item" lines="full">
                  <IonLabel position="stacked" color="primary">
                    <b>District</b>
                  </IonLabel>
                  <IonSelect
                    value={selectedDistrict}
                    placeholder="Sélectionnez un district"
                    onIonChange={(e) => {
                      setSelectedDistrict(e.detail.value);
                      resetCommune();
                    }}
                    interface="action-sheet"
                    className="selection-input"
                  >
                    {territoire
                      .find((r) => r.idregion === selectedRegion)
                      ?.districts.map((district) => (
                        <IonSelectOption
                          key={`district-${district.iddistrict}`}
                          value={district.iddistrict}
                        >
                          {district.nomdistrict}
                        </IonSelectOption>
                      ))}
                  </IonSelect>
                </IonItem>
              )}

              {/* Sélection de la commune */}
              {selectedDistrict && (
                <IonItem className="selection-item" lines="full">
                  <IonLabel position="stacked" color="primary">
                    <b>Commune</b>
                  </IonLabel>
                  <IonSelect
                    value={selectedCommune}
                    placeholder="Sélectionnez une commune"
                    onIonChange={(e) => {
                      setSelectedCommune(e.detail.value);
                      resetFokontany();
                    }}
                    interface="action-sheet"
                    className="selection-input"
                  >
                    {territoire
                      .flatMap((r) => r.districts)
                      .find((d) => d.iddistrict === selectedDistrict)
                      ?.communes.map((commune) => (
                        <IonSelectOption
                          key={`commune-${commune.idcommune}`}
                          value={commune.idcommune}
                        >
                          {commune.nomcommune}
                        </IonSelectOption>
                      ))}
                  </IonSelect>
                </IonItem>
              )}

              {/* Sélection du fokontany */}
              {selectedCommune && (
                <IonItem className="selection-item" lines="full">
                  <IonLabel position="stacked" color="primary">
                    <b>Fokontany</b>
                  </IonLabel>
                  <IonSelect
                    value={selectedFokontany}
                    placeholder="Sélectionnez un fokontany"
                    onIonChange={(e) => {
                      setSelectedFokontany(e.detail.value);
                      setSelectedHameau(null);
                    }}
                    interface="action-sheet"
                    className="selection-input"
                  >
                    {territoire
                      .flatMap((r) => r.districts.flatMap((d) => d.communes))
                      .find((c) => c.idcommune === selectedCommune)
                      ?.fokontany.map((fokontany) => (
                        <IonSelectOption
                          key={`fokontany-${fokontany.idfokontany}`}
                          value={fokontany.idfokontany}
                        >
                          {fokontany.nomfokontany}
                        </IonSelectOption>
                      ))}
                  </IonSelect>
                </IonItem>
              )}

              {/* Sélection du hameau */}
              {selectedFokontany && (
                <IonItem className="selection-item" lines="full">
                  <IonLabel position="stacked" color="primary">
                    <b>Hameau</b>
                  </IonLabel>
                  <IonSelect
                    value={selectedHameau}
                    placeholder="Sélectionnez un hameau"
                    onIonChange={(e) => setSelectedHameau(e.detail.value)}
                    interface="action-sheet"
                    className="selection-input"
                  >
                    {territoire
                      .flatMap((r) => r.districts)
                      .flatMap((d) => d.communes)
                      .find((c) => c.idcommune === selectedCommune)
                      ?.fokontany.find(
                        (f) => f.idfokontany === selectedFokontany
                      )
                      ?.hameaux.map((hameau) => (
                        <IonSelectOption
                          key={`hameau-${hameau.idhameau}`}
                          value={hameau.idhameau}
                        >
                          {hameau.nomhameau}
                        </IonSelectOption>
                      ))}
                  </IonSelect>
                </IonItem>
              )}

              {/* Bouton d'enregistrement */}
              <div className="ion-text-center ion-margin-top">
                <IonButton
                  expand="block"
                  onClick={enregistrerParametres}
                  disabled={!selectedHameau}
                  shape="round"
                  className="save-button"
                >
                  Enregistrer la configuration
                </IonButton>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Tab4;
