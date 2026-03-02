import {
  IonPage, IonContent, IonButton, IonLoading, IonAlert, IonHeader, IonButtons, IonIcon,
  IonMenuButton, IonTitle, IonToolbar, IonCard, IonLabel, IonCardContent, IonList, IonItem,
  IonModal, IonText, IonProgressBar,
  useIonViewWillEnter, IonPopover
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { useState, useEffect, useCallback } from "react";
import { ConfigService } from "../model/ConfigService";
import { Buffer } from "buffer";
import { FileTransfer } from "@capacitor/file-transfer";
import { close, settingsOutline, sync, ellipsisVertical, map, layersOutline, serverOutline } from "ionicons/icons";
import "./Tab4.css";
import { Territoire } from "../model/Territoire";
import { ParametreTerritoire } from "../model/ParametreTerritoire";
import { District } from "../model/limite/District";
import { Commune } from "../model/limite/Commune";
import { Fokontany } from "../model/limite/Fokontany";
import { Hameau } from "../model/limite/Hameau";
import { useDb } from "../model/base/DbContextType";
import { verifIDDevice } from "../model/base/DbSchema";
import TerritorialSelector from "../components/territoire/Territorialselector";
import ServerModal from "../components/server/ServerModal";
import { PluginListenerHandle } from "@capacitor/core";

const Tab4 = () => {
  // États de base
  const [territoire, setTerritoire] = useState<Territoire[]>([]);
  const [parametres, setParametres] = useState<ParametreTerritoire[]>([]);
  const [parametreActuel, setParametreActuel] = useState<ParametreTerritoire | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>("");
  const [modalServerOpen, setModalServerOpen] = useState(false);

  // États UI
  const [showModal, setShowModal] = useState(false);
  const [showModalCarte, setShowModalCarte] = useState(false);
  const [showModalConfirmation, setShowModalConfirmation] = useState<{ message: string; onConfirm: () => void; onCancel: () => void } | null>(null);

  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingTiles, setIsDownloadingTiles] = useState(false);
  const [progression, setProgression] = useState<number>(0);

  // États messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sélections pour paramètres
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [selectedFokontany, setSelectedFokontany] = useState<number | null>(null);
  const [selectedHameau, setSelectedHameau] = useState<number | null>(null);

  const { resetMBTiles, loadMBTiles } = useDb();

  // ==================== HOOKS UTILITAIRES ====================

  useIonViewWillEnter(() => {
    loadSavedData();
  });

  useEffect(() => {
    let listenerHandle: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listenerHandle = await FileTransfer.addListener("progress", (p) => {
        if (p.contentLength > 0) setProgression(p.bytes / p.contentLength);
      });
    };

    setupListener();

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  useEffect(() => {
    if (parametres.length > 0) {
      Preferences.set({ key: "parametres", value: JSON.stringify(parametres) });
    }
  }, [parametres]);

  useEffect(() => {
    if (parametreActuel) {
      Preferences.set({ key: "parametreActuel", value: JSON.stringify(parametreActuel) });
    }
  }, [parametreActuel]);

  const handleServerSaved = async () => {
    setServerUrl(await ConfigService.getServerIpPort());
  };

  // ==================== FONCTIONS DE CHARGEMENT ====================
  const loadSavedData = async () => {
    try {
      setServerUrl(await ConfigService.getServerIpPort());

      const [savedParams, currentParam, device, territoireDataParams] = await Promise.all([
        Preferences.get({ key: "parametres" }),
        Preferences.get({ key: "parametreActuel" }),
        Preferences.get({ key: "device_id" }),
        Preferences.get({ key: "territoireData" })
      ]);

      if (savedParams.value) setParametres(JSON.parse(savedParams.value));
      if (currentParam.value) setParametreActuel(JSON.parse(currentParam.value));
      if (device.value) setDeviceId(device.value);
      if (territoireDataParams.value) setTerritoire(JSON.parse(territoireDataParams.value));
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  };

  // ==================== SYNCHRONISATION DONNÉES ====================

  const fetchData = async () => {
    setError(null);

    try {
      const currentServerUrl = await ConfigService.getServerBaseUrl();
      await ConfigService.verifyServerConnection(500); //500ms

      const endpoints = ["getTerritoire", "getCategorie", "getStatus", "getRepere", "getTypeMoral"];
      setIsSyncing(true);
      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(`${currentServerUrl}/${endpoint}`))
      );

      // Vérification des erreurs
      responses.forEach((response, index) => {
        if (!response.ok) throw new Error(`Erreur ${endpoints[index]}: ${response.status}`);
      });

      const [territoireData, categorieData, statusData, repereData, typeMoralData] =
        await Promise.all(responses.map(r => r.json()));

      // Sauvegarde parallèle
      await Promise.all([
        Preferences.set({ key: "territoireData", value: JSON.stringify(territoireData.data) }),
        Preferences.set({ key: "categorieData", value: JSON.stringify(categorieData.data) }),
        Preferences.set({ key: "statusData", value: JSON.stringify(statusData.data) }),
        Preferences.set({ key: "repereData", value: JSON.stringify(repereData.data) }),
        Preferences.set({ key: "typeMoralData", value: JSON.stringify(typeMoralData.data) })
      ]);

      setTerritoire(territoireData.data);
      setShowModal(true);
    } catch (err: unknown) {
      setError(`Échec de la synchronisation: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==================== TÉLÉCHARGEMENT PLOF ====================

  const fetchPlof = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentServerIp = await ConfigService.getServerIp();
      if (!currentServerIp) throw new Error("Configuration serveur manquante");

      const workspace = "H-topo";
      const authHeader = "Basic " + Buffer.from("admin:geoserver").toString("base64");
      const baseUrl = `http://${currentServerIp}:8080`;

      // Récupération datastores
      const dsResp = await fetch(`${baseUrl}/geoserver/rest/workspaces/${workspace}/datastores.json`, {
        headers: { Accept: "application/json", Authorization: authHeader }
      });
      if (!dsResp.ok) throw new Error(`Erreur datastores: ${dsResp.status}`);

      const dsData = await dsResp.json();
      const datastores = dsData.dataStores.dataStore.map((ds: any) => ds.name);

      const structure = { workspace, datastores: [] as any[] };

      for (const dsName of datastores) {
        const ftResp = await fetch(
          `${baseUrl}/geoserver/rest/workspaces/${workspace}/datastores/${dsName}/featuretypes.json`,
          { headers: { Accept: "application/json", Authorization: authHeader } }
        );

        if (!ftResp.ok) continue;

        const ftData = await ftResp.json();
        const layers = ftData.featureTypes.featureType.map((f: any) => f.name);
        const savedLayers = [];

        for (const layerName of layers) {
          const wfsResp = await fetch(
            `${baseUrl}/geoserver/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${layerName}&outputFormat=application/json`,
            { headers: { Accept: "application/json", Authorization: authHeader } }
          );

          if (!wfsResp.ok) continue;

          const geojson = await wfsResp.json();
          if (geojson.features) {
            geojson.features = geojson.features.map((feature: any) => ({
              ...feature,
              properties: { ...feature.properties, name: layerName }
            }));
          }

          const localPath = `plof/${dsName}/${layerName}.geojson`;
          await Filesystem.writeFile({
            path: localPath,
            data: JSON.stringify(geojson),
            directory: Directory.Data,
            encoding: Encoding.UTF8,
            recursive: true
          });

          savedLayers.push({ name: layerName, path: localPath });
        }

        structure.datastores.push({ name: dsName, layers: savedLayers });
      }

      await Preferences.set({ key: "plofData", value: JSON.stringify(structure) });
      setSuccess("Téléchargement PLOF terminé");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== TÉLÉCHARGEMENT CARTE ====================

  const fetchCarte = async () => {
    setShowModalCarte(false);
    setIsDownloadingTiles(true);
    setProgression(0);
    setError(null);

    try {
      const serverUrl = await ConfigService.getServerBaseUrl();
      if (!serverUrl) throw new Error("Configuration serveur manquante");

      const mbtilesPath = "TopoManager/mbtiles/amb.mbtiles";
      const dbName = "ambSQLite.db";

      await resetMBTiles();

      // Créer dossier
      try {
        await Filesystem.mkdir({ directory: Directory.Documents, path: "TopoManager/mbtiles", recursive: true });
      } catch { /* exists */ }

      // Vérifier fichier existant
      try {
        await Filesystem.stat({ directory: Directory.Documents, path: mbtilesPath });
        const overwrite = await new Promise<boolean>((resolve) => {
          setShowModalConfirmation({
            message: "Une carte existe déjà. Mettre à jour ?",
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
          });
        });
        if (!overwrite) {
          setIsDownloadingTiles(false);
          return;
        }
        await Filesystem.deleteFile({ directory: Directory.Documents, path: mbtilesPath });
      } catch { /* n'existe pas */ }

      // Téléchargement
      const { uri } = await Filesystem.getUri({ directory: Directory.Documents, path: mbtilesPath });
      const filePathAbs = uri.startsWith("file://") ? uri : `file://${uri}`;

      await FileTransfer.downloadFile({
        url: `${serverUrl}/getCarte`,
        path: filePathAbs,
        method: "GET",
        progress: true
      });

      setProgression(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vérification
      const statSource = await Filesystem.stat({ path: mbtilesPath, directory: Directory.Documents });
      if (statSource.size === 0) throw new Error("Fichier téléchargé vide");

      // Installation
      const { uri: dataUri } = await Filesystem.getUri({ directory: Directory.Data, path: "" });
      const databasesPath = dataUri.replace("file://", "").replace("/files", "") + "/databases";

      await Filesystem.mkdir({ path: databasesPath, directory: undefined, recursive: true }).catch(() => { });

      try {
        await Filesystem.deleteFile({ path: `${databasesPath}/${dbName}`, directory: undefined });
      } catch { /* pas d'ancienne DB */ }

      const { uri: sourceUri } = await Filesystem.getUri({ directory: Directory.Documents, path: mbtilesPath });
      await Filesystem.copy({
        from: sourceUri.replace("file://", ""),
        directory: undefined,
        to: `${databasesPath}/${dbName}`,
        toDirectory: undefined
      });

      await Filesystem.deleteFile({ path: mbtilesPath, directory: Directory.Documents }).catch(() => { });

      if (loadMBTiles) await loadMBTiles();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsDownloadingTiles(false);
      setTimeout(() => setProgression(0), 500);
    }
  };

  // ==================== GESTION PARAMÈTRES ====================
  const verifParametresComplets = () => {
    if (!selectedRegion || !selectedDistrict || !selectedCommune || !selectedFokontany || !selectedHameau) {
      throw new Error("Veuillez sélectionner tous les niveaux territoriaux");
    }
  };

  const enregistrerParametres = useCallback(async () => {
    try {
      // Vérification device
      await verifIDDevice();

      // Vérification sélection complète
      verifParametresComplets();

      // Récupération hiérarchique sécurisée
      const region = territoire.find(r => r.idregion === selectedRegion);
      if (!region) throw new Error("Région introuvable");

      const district = region.districts?.find(d => d.iddistrict === selectedDistrict);
      if (!district) throw new Error("District introuvable");

      const commune = district.communes?.find(c => c.idcommune === selectedCommune);
      if (!commune) throw new Error("Commune introuvable");

      const fokontany = commune.fokontany?.find(f => f.idfokontany === selectedFokontany);
      if (!fokontany) throw new Error("Fokontany introuvable");

      const hameau = fokontany.hameaux?.find(h => h.idhameau === selectedHameau);
      if (!hameau) throw new Error("Hameau introuvable");

      // Création nouveau paramètre
      const nouveauParametre = new ParametreTerritoire({
        id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        region: new Territoire(region.idregion, region.coderegion, region.nomregion),
        district: new District(district.iddistrict, district.codedistrict, district.nomdistrict),
        commune: new Commune(commune.idcommune, commune.codecommune, commune.nomcommune),
        fokontany: new Fokontany(fokontany.idfokontany, fokontany.codefokontany, fokontany.nomfokontany),
        hameau: new Hameau(hameau.idhameau, hameau.codehameau, hameau.nomhameau),
        code_parcelle: 0,
        increment: 0,
        dateSelection: new Date().toISOString(),
      });

      // Mise à jour du state
      setParametres(prev => [...prev, nouveauParametre]);
      setParametreActuel(nouveauParametre);
      setShowModal(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue, contactez l'administrateur");
    }
  }, [selectedRegion, selectedDistrict, selectedCommune, selectedFokontany, selectedHameau, territoire]);

  const currentParcelleCode = parametreActuel ? `${deviceId}-${parametreActuel.region.coderegion}-${parametreActuel.district.codedistrict}-${parametreActuel.commune.codecommune}-${parametreActuel.fokontany.codefokontany}-${parametreActuel.hameau.codehameau}-${parametreActuel.increment + 1}` : "";

  // ==================== RENDER ====================

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Paramètrage</IonTitle>
          <IonButtons slot="end">
            <IonButton id="dropdown-trigger">
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonPopover trigger="dropdown-trigger" triggerAction="click">
        <IonContent>
          <IonList>
            <IonItem button onClick={() => setModalServerOpen(true)} disabled={isLoading}>
              <IonIcon icon={serverOutline} slot="start" />
              <IonLabel>Adresse du Serveur</IonLabel>
            </IonItem>
            <IonItem button onClick={fetchData} disabled={isLoading}>
              <IonIcon icon={sync} slot="start" />
              <IonLabel>Maj. locale</IonLabel>
            </IonItem>
            <IonItem button onClick={() => setShowModalCarte(true)} disabled={isLoading}>
              <IonIcon icon={map} slot="start" />
              <IonLabel>Ajouter une carte</IonLabel>
            </IonItem>
            <IonItem button onClick={fetchPlof} disabled={isLoading} lines="none">
              <IonIcon icon={layersOutline} slot="start" />
              <IonLabel>Maj. plof local</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>

      <IonContent className="ion-padding" color="light">
        {/* Carte du paramètre actuel */}
        <IonCard color="white" className="current-param-card">
          <IonCardContent>
            <div className="ion-text-center ion-margin-bottom">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IonIcon icon={settingsOutline} style={{ fontSize: "2.5rem", color: "#3880ff", marginRight: "10px" }} />
                <div>
                  <IonLabel style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Paramétrage Actuel</IonLabel>
                  <div><IonText color="medium">Serveur: {serverUrl}</IonText></div>
                </div>
              </div>
            </div>

            {parametreActuel ? (
              <div className="param-details">
                <div className="px-1">
                  <IonLabel>
                    <IonText color="medium" className="small-text">
                      (Code tablette - Code région - Code district - Code commune - Code fokontany - Code hameau - Numéro auto increment)
                    </IonText>
                    <p className="highlight-text"><b>{currentParcelleCode || "Aucun code disponible"}</b></p>
                  </IonLabel>
                </div>

                <div className="param-row">
                  {[
                    { label: "Région", value: parametreActuel.region.nomregion },
                    { label: "District", value: parametreActuel.district.nomdistrict },
                    { label: "Création", value: new Date(parametreActuel.dateSelection).toLocaleString() }
                  ].map((item, i) => (
                    <div className="param-col" key={i}>
                      <IonItem lines="none" className="param-card">
                        <IonLabel>
                          <IonText color="medium">{item.label}</IonText>
                          <p className="highlight-text"><b>{item.value}</b></p>
                        </IonLabel>
                      </IonItem>
                    </div>
                  ))}
                </div>

                <div className="param-row">
                  {[
                    { label: "Commune", value: parametreActuel.commune.nomcommune },
                    { label: "Fokontany", value: parametreActuel.fokontany.nomfokontany },
                    { label: "Hameau", value: parametreActuel.hameau.nomhameau }
                  ].map((item, i) => (
                    <div className="param-col" key={i}>
                      <IonItem lines="none" className="param-card">
                        <IonLabel>
                          <IonText color="medium">{item.label}</IonText>
                          <p className="highlight-text"><b>{item.value}</b></p>
                        </IonLabel>
                      </IonItem>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ion-text-center ion-padding">
                <IonText color="medium"><p>Aucun paramètre sélectionné</p></IonText>
              </div>
            )}

            <div className="ion-text-center ion-margin-top">
              <IonButton onClick={() => setShowModal(true)} shape="round" className="edit-button">
                <IonIcon slot="start" icon={settingsOutline} />
                Ajouter un nouveau paramètre
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Historique */}
        {parametres.length > 0 && (
          <IonCard color="white" className="saved-params-card">
            <IonCardContent className="p-0">
              <IonText color="dark"><h3 className="ms-3 mt-3">Historique des Paramètres</h3></IonText>
              <IonList lines="none" className="saved-params-list">
                {parametres.map(param => (
                  <IonItem
                    key={`param-${param.id}`}
                    button
                    onClick={() => setParametreActuel(param)}
                    color={parametreActuel?.id === param.id ? "primary" : ""}
                    className="saved-param-item"
                  >
                    <IonLabel className="param-label">
                      <IonText>
                        <p>
                          {param.region.nomregion} → {param.district.nomdistrict} → {param.commune.nomcommune} →
                          {param.fokontany.nomfokontany} → {param.hameau.nomhameau}
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

      {/* Loadings & Alerts */}
      {isSyncing && <IonLoading isOpen message="Synchronisation..." />}

      {isDownloadingTiles && (
        <>
          <IonProgressBar value={progression} />
          <div className="ion-text-center">Téléchargement des cartes: {Math.round(progression * 100)}%</div>
        </>
      )}

      {isLoading && <IonLoading isOpen message="Chargement..." />}
      {error && <IonAlert isOpen onDidDismiss={() => setError(null)} header="Erreur" message={error} buttons={["OK"]} />}
      {success && <IonAlert isOpen onDidDismiss={() => setSuccess(null)} header="Succès" message={success} buttons={["OK"]} />}

      {/* Modal Configuration Serveur */}
      <ServerModal
        isOpen={modalServerOpen}
        onClose={() => setModalServerOpen(false)}
        onSaved={() => handleServerSaved()}
      />

      {/* Modal Carte */}
      <IonModal isOpen={showModalCarte} onDidDismiss={() => setShowModalCarte(false)} className="param-modal">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className="ion-text-center">Télécharger la carte</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModalCarte(false)}><IonIcon slot="icon-only" icon={close} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" color="light">
          <TerritorialSelector
            territoire={territoire}
            selectedRegion={selectedRegion}
            selectedDistrict={selectedDistrict}
            selectedCommune={selectedCommune}
            selectedFokontany={selectedFokontany}
            selectedHameau={selectedHameau}
            onRegionChange={setSelectedRegion}
            onDistrictChange={setSelectedDistrict}
            onCommuneChange={setSelectedCommune}
            onFokontanyChange={setSelectedFokontany}
            onHameauChange={setSelectedHameau}
            onSubmit={fetchCarte}
            submitLabel="Télécharger la carte"
            isForMap={true}
          />
        </IonContent>
      </IonModal>

      {/* Modal Paramètres */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="param-modal">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className="ion-text-center">Configuration du Territoire</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}><IonIcon slot="icon-only" icon={close} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" color="light">
          <TerritorialSelector
            territoire={territoire}
            selectedRegion={selectedRegion}
            selectedDistrict={selectedDistrict}
            selectedCommune={selectedCommune}
            selectedFokontany={selectedFokontany}
            selectedHameau={selectedHameau}
            onRegionChange={setSelectedRegion}
            onDistrictChange={setSelectedDistrict}
            onCommuneChange={setSelectedCommune}
            onFokontanyChange={setSelectedFokontany}
            onHameauChange={setSelectedHameau}
            onSubmit={enregistrerParametres}
            submitLabel="Enregistrer la configuration"
            isForMap={false}
          />
        </IonContent>
      </IonModal>

      {/* Confirmation */}
      <IonAlert
        isOpen={!!showModalConfirmation}
        header="Confirmation"
        message={showModalConfirmation?.message}
        buttons={[
          { text: "Annuler", role: "cancel", handler: () => { showModalConfirmation?.onCancel(); setShowModalConfirmation(null); } },
          { text: "Écraser", handler: () => { showModalConfirmation?.onConfirm(); setShowModalConfirmation(null); } }
        ]}
      />
    </IonPage>
  );
};

export default Tab4;