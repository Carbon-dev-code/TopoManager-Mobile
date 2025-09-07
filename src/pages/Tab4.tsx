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
  IonPopover,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { useState, useEffect } from "react";
import { ConfigService } from "../model/ConfigService";
import { Buffer } from "buffer";
import {
  close,
  settingsOutline,
  sync,
  ellipsisVertical,
  map,
  layersOutline,
} from "ionicons/icons";
import "./Tab4.css";
import { Territoire } from "../model/Territoire";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { District } from "../model/limite/District";
import { Commune } from "../model/limite/Commune";
import { Fokontany } from "../model/limite/Fokontany";
import { Hameau } from "../model/limite/Hameau";

const Tab4 = () => {
  const [territoire, setTerritoire] = useState<Territoire[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allLoader, setAllLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showModalCarte, setShowModalCarte] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [selectedFokontany, setSelectedFokontany] = useState<number | null>(
    null
  );
  const [selectedHameau, setSelectedHameau] = useState<number | null>(null);
  const [parametres, setParametres] = useState<ParametreTerritoire[]>([]);
  const [parametreActuel, setParametreActuel] =
    useState<ParametreTerritoire | null>(null);
  const [currentParcelleCode, setCurrentParcelleCode] = useState<string>("");
  const [progression, setProgression] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false); // Pour fetchData
  const [isDownloadingTiles, setIsDownloadingTiles] = useState(false); // Pour fetchCarte

  useIonViewWillEnter(() => {
    loadConfig().then(() => refreshCurrentParams());
  });

  const refreshCurrentParams = async () => {
    try {
      const { value } = await Preferences.get({ key: "parametreActuel" });
      if (value) {
        const current = JSON.parse(value);
        setParametreActuel(current);

        const codeComplet = `${current.region.coderegion}-${current.district.codedistrict
          }-${current.commune.codecommune}-${current.fokontany.codefokontany}-${current.hameau.codehameau
          }-${current.increment + 1}`;
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
      const { value } = await Preferences.get({ key: "territoireData" });
      if (value) {
        setTerritoire(JSON.parse(value));
      }
      return url; // Important pour le .then()
    } catch (error) {
      setError("Configurez l'URL du serveur d'abord");
      throw error; // Propage l'erreur
    }
  };

  const fetchPlof = async () => {
    setAllLoader(true);
    setError(null);
    setSuccess(null);

    try {
      const currentServerIp = await ConfigService.getServerIp();
      if (!currentServerIp) throw new Error("Configuration serveur manquante");

      const workspace = "H-topo";
      const authHeader =
        "Basic " + Buffer.from("admin:geoserver").toString("base64");

      const protocol = "http";
      const port = 8080;
      const baseUrl = `${protocol}://${currentServerIp}:${port}`;

      // 1. Lister tous les datastores
      const dsUrl = `${baseUrl}/geoserver/rest/workspaces/${workspace}/datastores.json`;
      const dsResp = await fetch(dsUrl, {
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
        },
      });
      if (!dsResp.ok)
        throw new Error(`Erreur récupération datastores: ${dsResp.status}`);
      const dsData = await dsResp.json();
      const datastores = dsData.dataStores.dataStore.map((ds: any) => ds.name);

      const structure = {
        workspace,
        datastores: [],
      };

      // 2. Pour chaque datastore, lister les couches vecteur
      for (const dsName of datastores) {
        const ftUrl = `${baseUrl}/geoserver/rest/workspaces/${workspace}/datastores/${dsName}/featuretypes.json`;
        const ftResp = await fetch(ftUrl, {
          headers: {
            Accept: "application/json",
            Authorization: authHeader,
          },
        });
        if (!ftResp.ok) {
          console.warn(`Erreur sur datastore ${dsName}`);
          continue;
        }
        const ftData = await ftResp.json();
        const layers = ftData.featureTypes.featureType.map((f: any) => f.name);

        const savedLayers = [];

        // 3. Télécharger chaque couche en GeoJSON (WFS)
        for (const layerName of layers) {
          const wfsUrl = `${baseUrl}/geoserver/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${layerName}&outputFormat=application/json`;

          const wfsResp = await fetch(wfsUrl, {
            headers: {
              Accept: "application/json",
              Authorization: authHeader,
            },
          });

          if (!wfsResp.ok) {
            console.warn(`Erreur téléchargement couche ${layerName}`);
            continue;
          }

          const geojson = await wfsResp.json();

          // Ajout dynamique d'un attribut "name" dans chaque feature
          if (geojson.features && Array.isArray(geojson.features)) {
            geojson.features = geojson.features.map((feature: any) => ({
              ...feature,
              properties: {
                ...feature.properties,
                name: layerName,
              },
            }));
          }

          // 4. Enregistrer localement
          const localPath = `plof/${dsName}/${layerName}.geojson`;
          await Filesystem.writeFile({
            path: localPath,
            data: JSON.stringify(geojson),
            directory: Directory.Data,
            encoding: Encoding.UTF8,
            recursive: true,
          });

          savedLayers.push({
            name: layerName,
            path: localPath,
          });
        }

        // Ajouter au tableau global
        structure.datastores.push({
          name: dsName,
          layers: savedLayers,
        });
      }

      // 5. Sauvegarder la structure dans Preferences
      await Preferences.set({
        key: "plofData",
        value: JSON.stringify(structure),
      });

      setSuccess("Téléchargement PLOF terminé");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAllLoader(false);
    }
  };

  const fetchData = async () => {
    setIsSyncing(true);
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
      const [
        territoireResponse,
        categorieResponse,
        statusResponse,
        repereResponse,
        typeMoralResponse,
      ] = await Promise.all([
        fetch(`${currentServerUrl}/getTerritoire`),
        fetch(`${currentServerUrl}/getCategorie`),
        fetch(`${currentServerUrl}/getStatus`),
        fetch(`${currentServerUrl}/getRepere`),
        fetch(`${currentServerUrl}/getTypeMoral`),
      ]);

      if (!territoireResponse.ok) {
        throw new Error(`Erreur territoire: ${territoireResponse.status}`);
      }

      if (!categorieResponse.ok) {
        throw new Error(`Erreur categorie: ${categorieResponse.status}`);
      }

      if (!statusResponse.ok) {
        throw new Error(`Erreur categorie: ${statusResponse.status}`);
      }

      if (!repereResponse.ok) {
        throw new Error(`Erreur repere: ${repereResponse.status}`);
      }

      if (!typeMoralResponse.ok) {
        throw new Error(
          `Erreur type de personne moral: ${typeMoralResponse.status}`
        );
      }

      const territoireData = await territoireResponse.json();
      const categorieData = await categorieResponse.json();
      const statusData = await statusResponse.json();
      const repereData = await repereResponse.json();
      const typeMoralData = await typeMoralResponse.json();

      // 4. Sauvegarder dans les préférences
      await Preferences.set({
        key: "territoireData",
        value: JSON.stringify(territoireData.data),
      });

      await Preferences.set({
        key: "categorieData",
        value: JSON.stringify(categorieData.data),
      });

      await Preferences.set({
        key: "statusData",
        value: JSON.stringify(statusData.data),
      });

      await Preferences.set({
        key: "repereData",
        value: JSON.stringify(repereData.data),
      });

      await Preferences.set({
        key: "typeMoralData",
        value: JSON.stringify(typeMoralData.data),
      });

      // 5. Mettre à jour l'état local
      setTerritoire(territoireData.data);
      setShowModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Échec de la synchronisation: ${message}`);
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(",")[1];
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const sanitizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/gi, "_"); // remplace caractères spéciaux
  };

  const fetchCarte = async () => {
    setIsDownloadingTiles(true);
    setError(null);
    setProgression(0);

    try {
      const currentServerUrl = await ConfigService.getServerBaseUrl();
      if (!currentServerUrl) throw new Error("Configuration serveur manquante");
      setServerUrl(currentServerUrl);

      const region = territoire.find((r) => r.idregion === selectedRegion);
      const district = region?.districts.find((d) => d.iddistrict === selectedDistrict);
      const commune = district?.communes.find((c) => c.idcommune === selectedCommune);
      const fokontany = commune?.fokontany.find((f) => f.idfokontany === selectedFokontany);
      const hameau = fokontany?.hameaux.find((h) => h.idhameau === selectedHameau);

      const payload = {
        region: sanitizeName(region?.nomregion ?? "inconnu"),
        district: sanitizeName(district?.nomdistrict ?? "inconnu"),
        commune: sanitizeName(commune?.nomcommune ?? "inconnu"),
        fokontany: sanitizeName(fokontany?.nomfokontany ?? "inconnu"),
        hameau: sanitizeName(hameau?.nomhameau ?? "inconnu"),
      };

      const listResponse = await fetch(`${currentServerUrl}/getCarte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!listResponse.ok) throw new Error("Impossible de lister les tuiles");

      const tiles: string[] = await listResponse.json();
      const total = tiles.length;
      let done = 0;

      // --- Détection device pour adaptatif ---
      const cores = navigator.hardwareConcurrency || 4;
      const MAX_CONCURRENCY = Math.min(cores, 12); // limite max
      let concurrency = 1; // démarrage safe
      let lastUpdate = 0;
      const tileQueue = [...tiles];

      const processTile = async (tilePath: string) => {
        try {
          const response = await fetch(`${currentServerUrl}/fonds/${tilePath}`);
          if (!response.ok) return;

          let blob = await response.blob();
          let base64 = await blobToBase64(blob);

          await Filesystem.writeFile({
            path: `tiles/fond/${tilePath}`,
            data: base64,
            directory: Directory.Data,
            recursive: true,
          });

          blob = null as any;
          base64 = null as any;

        } catch {
          // silencieux
        } finally {
          done++;
          const now = Date.now();
          if ((done % 10 === 0 || done === total) && now - lastUpdate > 300) {
            setProgression(done / total);
            lastUpdate = now;
          }
        }
      };

      const runWithConcurrency = async (level: number) => {
        const start = performance.now();
        const batch: Promise<void>[] = [];

        for (let i = 0; i < level && tileQueue.length; i++) {
          const tilePath = tileQueue.splice(0, 1)[0];
          if (tilePath) batch.push(processTile(tilePath));
        }

        await Promise.all(batch);

        // --- Pause adaptative selon cores ---
        const pause = cores <= 4 ? 50 : cores <= 8 ? 25 : 10;
        await new Promise((r) => setTimeout(r, pause));

        return performance.now() - start;
      };

      while (tileQueue.length) {
        const duration = await runWithConcurrency(concurrency);

        // --- Ajustement dynamique de la concurrence ---
        if (duration < 500 && concurrency < MAX_CONCURRENCY) {
          concurrency++;
        } else if (duration > 2000 && concurrency > 1) {
          concurrency = Math.floor(concurrency / 2);
        }

        if (concurrency < 1) concurrency = 1;
      }

      setProgression(1);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Échec de la synchronisation: ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsDownloadingTiles(false);
      setTimeout(() => setProgression(0), 1000);
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

    const nouveauParametre = new ParametreTerritoire({
      id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      region: new Territoire(
        region.idregion,
        region.coderegion,
        region.nomregion
      ),
      district: new District(
        district.iddistrict,
        district.codedistrict,
        district.nomdistrict
      ),
      commune: new Commune(
        commune.idcommune,
        commune.codecommune,
        commune.nomcommune
      ),
      fokontany: new Fokontany(
        fokontany.idfokontany,
        fokontany.codefokontany,
        fokontany.nomfokontany
      ),
      hameau: new Hameau(hameau.idhameau, hameau.codehameau, hameau.nomhameau),
      code_parcelle: 0,
      increment: 0,
      dateSelection: new Date().toISOString(),
    });

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

      const codeComplet = `${nouveauParametre.region.coderegion}-${nouveauParametre.district.codedistrict
        }-${nouveauParametre.commune.codecommune}-${nouveauParametre.fokontany.codefokontany
        }-${nouveauParametre.hameau.codehameau}-${nouveauParametre.increment + 1
        }`;
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

      const codeComplet = `${parametre.region.coderegion}-${parametre.district.codedistrict
        }-${parametre.commune.codecommune}-${parametre.fokontany.codefokontany}-${parametre.hameau.codehameau
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
    const matches = serverUrl.match(/^https?:\/\/([^\\/]+)/);
    return matches ? matches[1] : serverUrl;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>

          <IonTitle className="ion-text-center">Paramètrage</IonTitle>

          <IonButtons slot="end">
            <IonButton id="dropdown-trigger">
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>

          <IonPopover trigger="dropdown-trigger" triggerAction="click">
            <IonContent>
              <IonList>
                <IonItem button onClick={fetchData} disabled={isLoading}>
                  <IonIcon icon={sync} slot="start" />
                  <IonLabel>Maj. locale</IonLabel>
                </IonItem>
                <IonItem
                  button
                  onClick={() => setShowModalCarte(true)}
                  disabled={isLoading}
                >
                  <IonIcon icon={map} slot="start" />
                  <IonLabel>Ajouter une carte</IonLabel>
                </IonItem>
                <IonItem button onClick={fetchPlof} disabled={isLoading}>
                  <IonIcon icon={layersOutline} slot="start" />
                  <IonLabel>Maj. plof local</IonLabel>
                </IonItem>
              </IonList>
            </IonContent>
          </IonPopover>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" color="light">
        {/* Carte du paramètre actuel */}
        <IonCard color="white" className="current-param-card">
          <IonCardContent>
            <div
              className="ion-text-center ion-margin-bottom"
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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
                        (Code region-Code district-Code commune-Code
                        fokontany-Code hameau-Numero auto increment)
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
                          <b>{parametreActuel.region.nomregion}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">District</IonText>
                        <p>
                          <b>{parametreActuel.district.nomdistrict}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Création</IonText>
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
                          <b>{parametreActuel.commune.nomcommune}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Fokontany</IonText>
                        <p>
                          <b>{parametreActuel.fokontany.nomfokontany}</b>
                        </p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  <div className="col">
                    <IonItem lines="none" className="param-item">
                      <IonLabel>
                        <IonText color="medium">Hameau</IonText>
                        <p>
                          <b>{parametreActuel.hameau.nomhameau}</b>
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
                          {param.region.nomregion} →{" "}
                          {param.district.nomdistrict}
                        </h3>
                        <p>
                          {param.commune.nomcommune} →{" "}
                          {param.fokontany.nomfokontany} →{" "}
                          {param.hameau.nomhameau}
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
      {isSyncing && <IonLoading isOpen={true} message="Synchronisation..." />}
      {isDownloadingTiles && (
        <>
          <IonProgressBar value={progression} />
          <div className="ion-text-center">
            Téléchargement des cartes: {Math.round(progression * 100)}%
          </div>
        </>
      )}
      {allLoader ? (
        <IonLoading isOpen={true} message="Chargement..." />
      ) : error ? (
        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Erreur"
          message={error}
          buttons={["OK"]}
        />
      ) : success ? (
        <IonAlert
          isOpen={!!success}
          onDidDismiss={() => setSuccess(null)}
          header="Success"
          message={success}
          buttons={["OK"]}
        />
      ) : null}

      <IonModal
        isOpen={showModalCarte}
        onDidDismiss={() => setShowModalCarte(false)}
        className="param-modal"
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className="ion-text-center">
              Telecharger la carte Voulue
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModalCarte(false)}>
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
                  onClick={fetchCarte}
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
