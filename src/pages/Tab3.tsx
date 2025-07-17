import React, { useState, useEffect } from "react";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonProgressBar,
  IonToast,
  IonInput,
  IonModal,
  IonLoading,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import {
  refresh,
  person,
  business,
  sync,
  checkmarkCircle,
  server,
  wifi,
} from "ionicons/icons";
import "./Tab3.css";

interface Demandeur {
  id: string;
  type: "physique" | "morale";
  nom?: string;
  prenom?: string;
  denomination?: string;
}

interface Parcelle {
  id: string;
  code: string;
  demandeurs: Demandeur[];
  synchronise?: boolean;
  syncError?: string;
  syncing?: boolean;
  lastSync?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  received?: unknown;
  server_time?: string;
}

const DEFAULT_IP_PORT = "192.168.88.85:80";
const API_BASE_PATH = "/havelo_mandrare";

const Tab3: React.FC = () => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "medium">(
    "success"
  );
  const [serverIpPort, setServerIpPort] = useState(DEFAULT_IP_PORT);
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempServerIpPort, setTempServerIpPort] = useState(DEFAULT_IP_PORT);
  const [testingConnection, setTestingConnection] = useState(false);

  const STORAGE_KEY = "parcelles_data";
  const SERVER_URL_KEY = "server_url";

  const buildServerUrl = (ipPort: string) => {
    return `http://${ipPort}${API_BASE_PATH}`;
  };

  useEffect(() => {
    const init = async () => {
      await loadServerUrl();
      await loadParcelles();
    };
    init();
  }, []);

  const loadParcelles = async () => {
    setLoading(true);
    try {
      const result = await Preferences.get({ key: STORAGE_KEY });
      if (result.value) {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) {
          setParcelles(parsed);
        }
      }
    } catch (e) {
      console.error("Erreur de lecture:", e);
      showError("Erreur lors du chargement des données locales");
    } finally {
      setLoading(false);
    }
  };

  const loadServerUrl = async () => {
    try {
      const result = await Preferences.get({ key: SERVER_URL_KEY });
      if (result.value) {
        const url = new URL(result.value);
        const ipPort = `${url.hostname}${url.port ? `:${url.port}` : ""}`;
        setServerIpPort(ipPort);
        setTempServerIpPort(ipPort);
      }
    } catch (e) {
      console.error("Erreur de chargement de l'URL:", e);
    }
  };

  const saveServerUrl = async (ipPort: string) => {
    const cleanedIpPort = ipPort.trim().replace(/^https?:\/\//, "");
    if (!cleanedIpPort.match(/^[\w\.-]+(:\d+)?$/)) {
      showError("Format invalide. Utilisez IP:port (ex: 192.168.1.100:80)");
      return false;
    }

    try {
      const fullUrl = buildServerUrl(cleanedIpPort);
      await Preferences.set({ key: SERVER_URL_KEY, value: fullUrl });
      setServerIpPort(cleanedIpPort);
      setTempServerIpPort(cleanedIpPort);
      setShowServerModal(false);
      showSuccess("Adresse du serveur mise à jour");
      return true;
    } catch (e) {
      console.error("Erreur de sauvegarde:", e);
      showError("Erreur lors de la sauvegarde de l'adresse");
      return false;
    }
  };

  const saveParcelles = async (updatedParcelles: Parcelle[]) => {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(updatedParcelles),
      });
      setParcelles(updatedParcelles);
    } catch (e) {
      console.error("Erreur de sauvegarde:", e);
      showError("Erreur lors de la sauvegarde des données");
    }
  };

  const showSuccess = (message: string) => {
    setToastMessage(message);
    setToastColor("success");
    setShowToast(true);
  };

  const showError = (message: string) => {
    setToastMessage(message);
    setToastColor("danger");
    setShowToast(true);
  };

  const syncWithAPI = async (parcelleData: Parcelle): Promise<boolean> => {
    if (!serverIpPort) {
      showError("Veuillez configurer l'adresse du serveur");
      return false;
    }

    try {
      const endpoint = `${buildServerUrl(serverIpPort)}/api_parcelle_demandeur`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parcelleData),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      return data.success;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
        }
        throw error;
      }
      throw new Error("Erreur inconnue lors de la synchronisation");
    }
  };

  const synchroniserParcelle = async (parcelleId: string) => {
    const parcelle = parcelles.find((p) => p.id === parcelleId);
    if (!parcelle) return;

    try {
      const tempParcelles = parcelles.map((p) =>
        p.id === parcelleId
          ? { ...p, synchronise: false, syncError: undefined, syncing: true }
          : p
      );
      await saveParcelles(tempParcelles);

      const success = await syncWithAPI(parcelle);

      if (success) {
        const updated = parcelles.map((p) =>
          p.id === parcelleId
            ? {
                ...p,
                synchronise: true,
                syncError: undefined,
                syncing: false,
                lastSync: new Date().toISOString(),
              }
            : p
        );
        await saveParcelles(updated);
        showSuccess(`Parcelle ${parcelle.code} synchronisée!`);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      const updated = parcelles.map((p) =>
        p.id === parcelleId
          ? { ...p, synchronise: false, syncError: errorMsg, syncing: false }
          : p
      );
      await saveParcelles(updated);
      showError(`Échec sync: ${errorMsg}`);
    }
  };

  const synchroniserToutes = async () => {
    if (!serverIpPort) {
      showError("Veuillez configurer l'adresse du serveur");
      return;
    }

    const nonSyncParcelles = parcelles.filter((p) => !p.synchronise);
    if (nonSyncParcelles.length === 0) {
      showSuccess("Toutes les parcelles sont déjà synchronisées.");
      return;
    }

    setSyncingAll(true);
    let updatedParcelles = [...parcelles];

    for (const parcelle of nonSyncParcelles) {
      updatedParcelles = updatedParcelles.map((p) =>
        p.id === parcelle.id ? { ...p, syncing: true, syncError: undefined } : p
      );
      setParcelles(updatedParcelles);

      try {
        const success = await syncWithAPI(parcelle);

        updatedParcelles = updatedParcelles.map((p) =>
          p.id === parcelle.id
            ? {
                ...p,
                synchronise: success,
                syncing: false,
                lastSync: success ? new Date().toISOString() : p.lastSync,
              }
            : p
        );
        setParcelles(updatedParcelles);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erreur inconnue";
        updatedParcelles = updatedParcelles.map((p) =>
          p.id === parcelle.id
            ? { ...p, syncing: false, syncError: errorMsg }
            : p
        );
        setParcelles(updatedParcelles);
      }
    }

    await saveParcelles(updatedParcelles);
    showSuccess(`${nonSyncParcelles.length} parcelles synchronisées`);
    setSyncingAll(false);
  };

  const testerConnexion = async () => {
    if (!serverIpPort) {
      showError("Adresse du serveur non définie.");
      return;
    }

    const testUrl = `${buildServerUrl(serverIpPort)}/ping`;
    setTestingConnection(true);
    const start = performance.now();

    try {
      const response = await fetch(testUrl, { method: "GET" });
      const end = performance.now();
      const delayMs = Math.round(end - start);
      if (!response.ok) throw new Error(`Statut HTTP: ${response.status}`);

      const speedText =
        delayMs < 100
          ? "Ultra rapide 🚀"
          : delayMs < 200
          ? "Rapide ✅"
          : "Lent 🐢";
      showSuccess(`Connexion réussie (${delayMs} ms) — ${speedText}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      showError(`Erreur de connexion : ${errorMsg}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const hasUnsynced = parcelles.some((p) => !p.synchronise);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Synchronisation</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowServerModal(true)}>
              <IonIcon icon={server} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonLoading
        isOpen={loading || syncingAll}
        message={loading ? "Chargement..." : "Synchronisation en cours..."}
      />

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Adresse serveur :</IonLabel>
          <IonText color="primary">{serverIpPort}</IonText>
        </IonItem>

        {testingConnection && <IonProgressBar type="indeterminate" />}
        <IonButton
          expand="block"
          color="medium"
          onClick={testerConnexion}
          disabled={testingConnection}
        >
          <IonIcon icon={wifi} slot="start" />
          {testingConnection ? "Test en cours..." : "Tester la connexion"}
        </IonButton>

        <IonButton
          expand="block"
          onClick={loadParcelles}
          disabled={loading || syncingAll}
        >
          <IonIcon icon={refresh} slot="start" />
          Recharger les données locales
        </IonButton>

        {hasUnsynced && (
          <IonButton
            expand="block"
            color="success"
            onClick={synchroniserToutes}
            disabled={syncingAll || loading}
          >
            <IonIcon icon={sync} slot="start" />
            Synchroniser toutes les parcelles
          </IonButton>
        )}

        <div className="cards-grid">
          {parcelles.map((parcelle) => (
            <IonCard
              key={parcelle.id}
              className="parcelle-card position-relative mb-3"
            >
              <IonButton
                fill="clear"
                size="small"
                onClick={() => synchroniserParcelle(parcelle.id)}
                disabled={parcelle.syncing}
                title="Synchroniser"
                className="sync-button"
              >
                <IonIcon
                  icon={parcelle.synchronise ? checkmarkCircle : sync}
                  color={parcelle.synchronise ? "success" : "warning"}
                  size="small"
                />
              </IonButton>

              <IonCardContent>
                <div className="row align-items-start">
                  {parcelle.lastSync && (
                    <p className="parcelle-meta">
                      Synchronisé le{" "}
                      {new Date(parcelle.lastSync).toLocaleString()}
                    </p>
                  )}
                  {/* Col 1 : code + état */}
                  <div className="col-12 col-md-4 mb-2">
                    <div className="parcelle-header">
                      <IonLabel className="parcelle-code">
                        Parcelle : {parcelle.code}
                      </IonLabel>
                    </div>

                    {parcelle.syncError && (
                      <IonText className="parcelle-error">
                        ⚠️ {parcelle.syncError}
                      </IonText>
                    )}
                  </div>

                  {/* Col 2 : Demandeurs */}
                  <div className="col-12 col-md-8">
                    {parcelle.demandeurs.length > 0 ? (
                      <IonList lines="none">
                        {parcelle.demandeurs.map((d) => (
                          <IonItem key={d.id} style={{ padding: "0.2rem 0" }}>
                            <IonIcon
                              icon={d.type === "physique" ? person : business}
                              slot="start"
                              color="primary"
                            />
                            <IonLabel className="demandeur-label">
                              {d.type === "physique"
                                ? `${d.prenom || ""} ${d.nom || ""}`.trim()
                                : d.denomination || ""}
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                    ) : (
                      <IonText color="medium">
                        Pas de demandeur associé.
                      </IonText>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <IonModal
          isOpen={showServerModal}
          onDidDismiss={() => setShowServerModal(false)}
        >
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Configurer le serveur</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowServerModal(false)}>
                  Fermer
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonLabel position="stacked">Adresse IP et port (Ex: 192.168.88.85:80)</IonLabel>
            <IonInput
              value={tempServerIpPort}
              onIonChange={(e) => setTempServerIpPort(e.detail.value!)}
              placeholder="192.168.88.85:80"
              clearInput
              disabled={testingConnection}
            />
            <IonButton
              expand="block"
              onClick={() => saveServerUrl(tempServerIpPort)}
            >
              Enregistrer
            </IonButton>
            <IonButton
              expand="block"
              color="medium"
              onClick={() => setShowServerModal(false)}
            >
              Annuler
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          color={toastColor}
          position="top" // 👈 c'est ce qui le met en haut
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
