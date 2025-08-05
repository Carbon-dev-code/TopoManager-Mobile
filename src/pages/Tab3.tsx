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
  IonSpinner,
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
  IonCardHeader,
  IonCardSubtitle,
  IonChip,
  IonCardTitle,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import {
  refresh,
  person,
  business,
  sync,
  checkmark,
  settings,
  wifi,
} from "ionicons/icons";
import "./Tab3.css";
import { ConfigService } from "../model/ConfigService";
import { Parcelle } from "../model/parcelle/Parcelle";

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
  const [filtreParcelle, setFiltreParcelle] = useState<
    "tous" | "sync" | "nosync" | "erreur"
  >("tous");

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

  const saveServerUrl = (ipPort: string) => {
    const cleanedIpPort = ipPort.trim().replace(/^https?:\/\//, "");
    if (!cleanedIpPort.match(/^[\w\\.-]+(:\d+)?$/)) {
      showError("Format invalide. Utilisez IP:port (ex: 192.168.1.100:80)");
      return false;
    }

    try {
      const fullUrl = buildServerUrl(cleanedIpPort);
      ConfigService.setServerBaseUrl(fullUrl);
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
    let parcelle = parcelles.find((p) => p.code === parcelleId);
    if (!parcelle) return;

    // ➕ Marquer comme en cours
    parcelle = { ...parcelle, syncing: true };
    setParcelles((prev) =>
      prev.map((p) => (p.code === parcelleId ? parcelle! : p))
    );

    try {
      const success = await syncWithAPI(parcelle);

      if (success) {
        const updated = parcelles.map((p) =>
          p.code === parcelleId
            ? {
                ...p,
                synchronise: 1,
                syncError: undefined,
                lastSync: new Date().toISOString(),
                syncing: false,
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
        p.code === parcelleId
          ? {
              ...p,
              synchronise: 2,
              syncError: errorMsg,
              syncing: false,
            }
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

    const nonSyncParcelles = parcelles.filter((p) => p.synchronise == 0 ||  p.synchronise == 2);
    if (nonSyncParcelles.length == 0) {
      showSuccess("Toutes les parcelles sont déjà synchronisées.");
      return;
    }

    setSyncingAll(true);
    let updatedParcelles = [...parcelles];

    for (const parcelle of nonSyncParcelles) {
      // ✅ Marquer la parcelle comme en cours de sync
      updatedParcelles = updatedParcelles.map((p) =>
        p.code === parcelle.code ? { ...p, syncing: true } : p
      );
      setParcelles(updatedParcelles);

      try {
        const success = await syncWithAPI(parcelle);

        updatedParcelles = updatedParcelles.map((p) =>
          p.code === parcelle.code
            ? {
                ...p,
                synchronise: 1,
                lastSync: success ? new Date().toISOString() : p.lastSync,
                syncError: undefined,
                syncing: false, // ✅ sync terminée
              }
            : p
        );
        setParcelles(updatedParcelles);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erreur inconnue";

        updatedParcelles = updatedParcelles.map((p) =>
          p.code === parcelle.code
            ? {
                ...p,
                synchronise: 2, // ❗ erreur de sync
                syncError: errorMsg,
                syncing: false, // ✅ sync terminée malgré l'erreur
              }
            : p
        );
        setParcelles(updatedParcelles);
      }
    }

    await saveParcelles(updatedParcelles);
    showSuccess(`${nonSyncParcelles.length} parcelle(s) synchronisée(s)`);
    setSyncingAll(false);
  };

  const testerConnexion = async () => {
    if (!serverIpPort) {
      showError("Adresse du serveur non définie.");
      return;
    }

    const testUrl = `${buildServerUrl(serverIpPort)}/ping`;
    setTestingConnection(true);
    const controller = new AbortController();
    const timeout = 10000;

    const start = performance.now();

    const timer = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(testUrl, {
        method: "GET",
        signal: controller.signal,
      });

      const end = performance.now();
      const delayMs = Math.round(end - start);
      clearTimeout(timer);

      if (!response.ok) throw new Error(`Statut HTTP: ${response.status}`);

      const speedText =
        delayMs < 100
          ? "Ultra rapide 🚀"
          : delayMs < 200
          ? "Rapide ✅"
          : "Lent 🐢";
      showSuccess(`Connexion réussie (${delayMs} ms) — ${speedText}`);
    } catch (error: unknown) {
      clearTimeout(timer);

      if (error instanceof DOMException && error.name === "AbortError") {
        showError(
          `Le serveur ne reponds pas après une attente de ${
            timeout / 1000
          } secondes ⏱️`
        );
      } else if (error instanceof Error) {
        showError(`Erreur de connexion : ${error.message}`);
      } else {
        showError("Erreur inconnue");
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const hasUnsynced = parcelles.some((p) => p.synchronise != 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Upload</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={loadParcelles} disabled={loading || syncingAll}>
              <IonIcon icon={refresh} />
            </IonButton>
            <IonButton onClick={() => setShowServerModal(true)}>
              <IonIcon icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {testingConnection && (
        <IonProgressBar type="indeterminate" className="my-progress-bar" />
      )}

      <IonLoading
        isOpen={loading || syncingAll}
        message={loading ? "Chargement..." : "Synchronisation en cours..."}
      />

      <IonContent className="ion-padding">
        <div className="row align-items-center">
          <div className="col">
            <IonItem lines="none">
              <IonLabel>Adresse serveur :</IonLabel>
              <IonText color="primary" className="ms-2">
                {serverIpPort}
              </IonText>
            </IonItem>
          </div>
          <div className="col-auto">
            <IonButton
              size="default"
              expand="block"
              color="primary"
              onClick={testerConnexion}
              disabled={testingConnection}
            >
              <IonIcon icon={wifi} slot="start" />
              {testingConnection ? "Test en cours..." : "Tester la connexion"}
            </IonButton>
          </div>
        </div>

        {hasUnsynced && (
          <IonButton
            expand="block"
            color="success"
            onClick={synchroniserToutes}
            disabled={syncingAll || loading}
          >
            <IonIcon icon={sync} slot="start" /> Synchroniser toutes les
            parcelles
          </IonButton>
        )}

        {/* Filtre ajouté ici */}
        <div className="mb-3 mt-3">
          <div
            className="d-flex justify-content-center overflow-auto"
            style={{ gap: "0.5rem" }}
          >
            <div className="col-auto">
              <input
                type="radio"
                className="btn-check"
                name="filtreParcelle"
                id="tous-outlined"
                autoComplete="off"
                checked={filtreParcelle === "tous"}
                onChange={() => setFiltreParcelle("tous")}
              />
              <label
                className="btn btn-outline-primary"
                htmlFor="tous-outlined"
              >
                Tous
              </label>
            </div>
            <div className="col-auto">
              <input
                type="radio"
                className="btn-check"
                name="filtreParcelle"
                id="sync-outlined"
                autoComplete="off"
                checked={filtreParcelle === "sync"}
                onChange={() => setFiltreParcelle("sync")}
              />
              <label
                className="btn btn-outline-primary"
                htmlFor="sync-outlined"
              >
                Synchronisées
              </label>
            </div>
            <div className="col-auto">
              <input
                type="radio"
                className="btn-check"
                name="filtreParcelle"
                id="nosync-outlined"
                autoComplete="off"
                checked={filtreParcelle === "nosync"}
                onChange={() => setFiltreParcelle("nosync")}
              />
              <label
                className="btn btn-outline-primary"
                htmlFor="nosync-outlined"
              >
                Non synchronisées
              </label>
            </div>
            <div className="col-auto">
              <input
                type="radio"
                className="btn-check"
                name="filtreParcelle"
                id="error-outlined"
                autoComplete="off"
                checked={filtreParcelle === "erreur"}
                onChange={() => setFiltreParcelle("erreur")}
              />
              <label
                className="btn btn-outline-primary"
                htmlFor="error-outlined"
              >
                Avec erreurs
              </label>
            </div>
          </div>
        </div>

        <div className="cardContent">
          {parcelles
            .filter((p) => {
              if (filtreParcelle === "tous") return true;
              if (filtreParcelle === "sync") return p.synchronise == 1;
              if (filtreParcelle === "nosync") return p.synchronise == 0 || p.synchronise == 2;
              if (filtreParcelle === "erreur") return p.synchronise == 2;
              return true;
            })
            .map((parcelle) => (
              <IonCard key={parcelle.code} className="custom-card">
                <span
                  className={`position-badge-custom-tab1 ion-color ${
                    parcelle.synchronise == 0 ? "ion-color-success" : "ion-color-danger"
                  }  ${parcelle.synchronise ? "disabled" : ""}`}
                  title="Synchroniser"
                  onClick={() => {
                    if (parcelle.synchronise === 0 && !parcelle.syncing) {
                      synchroniserParcelle(parcelle.code!);
                    }
                  }}
                  role="button"
                >
                  {parcelle.syncing ? (
                    <IonSpinner name="crescent" color="light"  style={{ width: "18px", height: "18px" }}
                    />
                  ) : (
                    <IonIcon icon={parcelle.synchronise == 0 ? checkmark : sync} />
                  )}
                  <span className="visually-hidden">
                    {" "}
                    {parcelle.synchronise
                      ? "Parcelle synchronisée"
                      : "Parcelle à synchroniser"}{" "}
                  </span>
                </span>

                <IonCardHeader className="custom-header-card">
                  <IonCardTitle>
                    <strong>{parcelle.code}</strong>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    {parcelle.lastSync && (
                      <IonChip color="danger">
                        <IonIcon icon={sync} color="primary"></IonIcon>
                        <IonLabel>
                          {" "}
                          Sync le {new Date(
                            parcelle.lastSync
                          ).toLocaleString()}{" "}
                        </IonLabel>
                      </IonChip>
                    )}

                    {parcelle.syncError && (
                      <IonChip color="danger">
                        <IonIcon icon={sync} color="warning"></IonIcon>
                        <IonLabel> ⚠️ {parcelle.syncError}</IonLabel>
                      </IonChip>
                    )}
                  </IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonList className="scrollable-list">
                    {parcelle.demandeurs.map((demandeur) => (
                      <IonItem key={`dem` + demandeur.id} lines="none">
                        <IonIcon
                          slot="start"
                          icon={demandeur.type === 0 ? person : business}
                        />
                        <IonLabel>
                          {demandeur.type === 0
                            ? `${demandeur.nom} ${demandeur.prenom}`
                            : demandeur.denomination}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
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
            <IonLabel position="stacked">
              Adresse IP et port (Ex: 192.168.88.85:80)
            </IonLabel>
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
          duration={3500}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
