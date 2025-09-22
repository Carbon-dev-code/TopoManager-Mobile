import React, { useState, useEffect, useCallback } from "react";
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
  IonIcon,
  IonProgressBar,
  IonToast,
  IonInput,
  IonModal,
  IonLoading,
  IonCardHeader,
  IonCardSubtitle,
  IonChip,
  IonCardTitle, useIonViewWillEnter, IonRefresher, IonRefresherContent,
} from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { sync, checkmark, settings, wifi } from "ionicons/icons";
import "./Tab3.css";
import { ConfigService } from "../model/ConfigService";
import { Parcelle } from "../model/parcelle/Parcelle";
import DemandeurView from "../components/demandeur/DemandeurView";
import { getAllParcelles, insertParcelle } from "../model/base/DbSchema";

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
  const [syncingAll, setSyncingAll] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "medium">("success");
  const [serverIpPort, setServerIpPort] = useState(DEFAULT_IP_PORT);
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempServerIpPort, setTempServerIpPort] = useState(DEFAULT_IP_PORT);
  const [testingConnection, setTestingConnection] = useState(false);
  const [filtreParcelle, setFiltreParcelle] = useState<"tous" | "sync" | "nosync" | "erreur">("tous");
  const [hasUnsynced, setHasUnsynced] = useState(false);

  const SERVER_URL_KEY = "server_url";

  const buildServerUrl = (ipPort: string) => `http://${ipPort}${API_BASE_PATH}`;

  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
    return await getAllParcelles();
  }, []);

  const loadServerUrl = useCallback(async (): Promise<void> => {
    try {
      const result = await Preferences.get({ key: SERVER_URL_KEY });
      if (result.value) {
        const url = new URL(result.value);
        const ipPort = `${url.hostname}${url.port ? `:${url.port}` : ""}`;
        setServerIpPort(ipPort);
        setTempServerIpPort(ipPort);
        ConfigService.setServerBaseUrl(result.value);
      }
    } catch (e) {
      console.error("Erreur de chargement de l'URL:", e);
    }
  }, []);

  const load = useCallback(async () => {
    await loadServerUrl();
    const savedParcelles = await loadParcellesFromStorage();
    setParcelles(savedParcelles);
    setHasUnsynced(savedParcelles.some((p) => p.synchronise !== 1));
  }, [loadParcellesFromStorage, loadServerUrl]);

  useIonViewWillEnter(() => {
    load();
  });

  useEffect(() => {
    setHasUnsynced(parcelles.some((p) => p.synchronise !== 1));
  }, [parcelles]);

  const saveServerUrl = (ipPort: string) => {
    const cleanedIpPort = ipPort.trim().replace(/^https?:\/\//, "");
    if (!cleanedIpPort.match(/^[\w.-]+(:\d+)?$/)) {
      showError("Format invalide. Utilisez IP:port (ex: 192.168.1.100:80)");
      return false;
    }

    try {
      const fullUrl = buildServerUrl(cleanedIpPort);
      ConfigService.setServerBaseUrl(fullUrl);
      setServerIpPort(cleanedIpPort);
      setTempServerIpPort(cleanedIpPort);
      // ✅ Persister l’URL dans Preferences (bugfix)
      Preferences.set({ key: SERVER_URL_KEY, value: fullUrl });
      setShowServerModal(false);
      showSuccess("Adresse du serveur mise à jour");
      return true;
    } catch (e) {
      console.error("Erreur de sauvegarde:", e);
      showError("Erreur lors de la sauvegarde de l'adresse");
      return false;
    }
  };

  const showSuccess = useCallback((message: string) => {
    setToastMessage(message);
    setToastColor("success");
    setShowToast(true);
  }, []);

  const showError = useCallback((message: string) => {
    setToastMessage(message);
    setToastColor("danger");
    setShowToast(true);
  }, []);

  const syncWithAPI = useCallback(
    async (parcelleData: Parcelle): Promise<boolean> => {
      if (!serverIpPort) {
        showError("Veuillez configurer l'adresse du serveur");
        return false;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s max
      try {
        const endpoint = `${buildServerUrl(
          serverIpPort
        )}/api_parcelle_demandeur`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parcelleData),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        if (!data.success) {
          throw new Error(`Sync échouée: ${data.message ?? "Erreur inconnue"}`);
        }
        return true;
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error("Le serveur ne répond pas (timeout).");
          }
          if (error.message.includes("Failed to fetch")) {
            throw new Error("Serveur inaccessible. Vérifiez la connexion.");
          }
          throw new Error("`Erreur: ${error.message}`");
        }
        showError("Erreur inconnue lors de la synchronisation");
      }
    },
    [serverIpPort, showError]
  );

  const testerConnexion = useCallback(async () => {
    if (!serverIpPort) {
      showError("Adresse du serveur non définie.");
      return;
    }

    const testUrl = `${buildServerUrl(serverIpPort)}/ping`;
    setTestingConnection(true);
    const controller = new AbortController();
    const timeout = 10000;
    const start = performance.now();
    const timer = setTimeout(() => controller.abort(), timeout);

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
        showError(`Le serveur ne répond pas après ${timeout / 1000}s ⏱️`);
      } else if (error instanceof Error) {
        showError(`Erreur de connexion : ${error.message}`);
      } else {
        showError("Erreur inconnue");
      }
    } finally {
      setTestingConnection(false);
    }
  }, [serverIpPort, showError, showSuccess]);

  const handleRefresh = useCallback(
    async (event: CustomEvent) => {
      try {
        await load(); // charge tes données
      } finally {
        event.detail.complete(); // stop le refresher dès que load est terminé
      }
    },
    [load]
  );

  const synchroniserParcelle = useCallback(
    async (parcelleId: string) => {
      const parcelle = parcelles.find((p) => p.code === parcelleId);
      if (!parcelle) return;

      setParcelles((prev) =>
        prev.map((p) => (p.code === parcelleId ? { ...p, syncing: true } : p))
      );

      try {
        const success = await syncWithAPI(parcelle);

        const updatedParcelle = {
          ...parcelle,
          synchronise: success ? 1 : 2,
          syncError: success ? undefined : parcelle.syncError,
          lastSync: success ? new Date().toISOString() : parcelle.lastSync,
          syncing: false,
        };

        await insertParcelle(updatedParcelle);

        setParcelles((prev) =>
          prev.map((p) => (p.code === parcelleId ? updatedParcelle : p))
        );

        if (success) showSuccess(`Parcelle ${parcelle.code} synchronisée!`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";

        const updatedParcelle = {
          ...parcelle,
          synchronise: 2,
          syncError: errorMsg,
          syncing: false,
        };

        await insertParcelle(updatedParcelle);
        setParcelles((prev) =>
          prev.map((p) => (p.code === parcelleId ? updatedParcelle : p))
        );

        showError(`Échec de synchronisation: ${errorMsg}`);
      }
    },
    [parcelles, syncWithAPI, showSuccess, showError]
  );

  const synchroniserToutes = useCallback(async () => {
    if (!serverIpPort) {
      showError("Veuillez configurer l'adresse du serveur");
      return;
    }

    const nonSyncParcelles = parcelles.filter((p) => p.synchronise !== 1);
    if (nonSyncParcelles.length === 0) {
      showSuccess("Toutes les parcelles sont déjà synchronisées.");
      return;
    }

    setSyncingAll(true);

    // marquer toutes les parcelles comme en cours
    let updatedParcelles = parcelles.map((p) =>
      nonSyncParcelles.some((n) => n.code === p.code)
        ? { ...p, syncing: true }
        : p
    );
    setParcelles(updatedParcelles);

    let erreurs = 0;

    for (const parcelle of nonSyncParcelles) {
      try {
        const success = await syncWithAPI(parcelle);

        const updatedParcelle = {
          ...parcelle,
          synchronise: success ? 1 : 2,
          lastSync: success ? new Date().toISOString() : parcelle.lastSync,
          syncError: success ? undefined : "Erreur de synchronisation",
          syncing: false,
        };

        // Persister via localforage
        await insertParcelle(updatedParcelle);

        updatedParcelles = updatedParcelles.map((p) =>
          p.code === parcelle.code ? updatedParcelle : p
        );

        if (!success) erreurs += 1;

        setParcelles(updatedParcelles);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";

        const updatedParcelle = {
          ...parcelle,
          synchronise: 2,
          syncError: errorMsg,
          syncing: false,
        };

        await insertParcelle(updatedParcelle);
        updatedParcelles = updatedParcelles.map((p) =>
          p.code === parcelle.code ? updatedParcelle : p
        );

        erreurs += 1;
        setParcelles(updatedParcelles);
      }
    }

    if (erreurs === 0) {
      showSuccess(`${nonSyncParcelles.length} parcelle(s) synchronisée(s)`);
    } else {
      showError(`${erreurs} parcelle(s) en erreur de synchronisation`);
    }

    setSyncingAll(false);
  }, [parcelles, serverIpPort, syncWithAPI, showSuccess, showError]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Upload</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowServerModal(true)}>
              <IonIcon icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {testingConnection && (
        <IonProgressBar type="indeterminate" className="my-progress-bar" />
      )}

      <IonLoading isOpen={syncingAll} message={"Synchronisation en cours..."} />

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* === Card info serveur avec icône de test === */}
        <div className="server mb-1">
          <div className="server-info-card w-100">
            <IonLabel>Adresse serveur :</IonLabel>
            <IonText color="primary">{serverIpPort}</IonText>
          </div>

          <div className="icon-wrapper" onClick={testerConnexion}>
            <IonIcon
              icon={wifi}
              className={testingConnection ? "blinking-steps" : "idle-icon"}
              style={{ fontSize: "15px" }}
            />
          </div>
        </div>

        <div className="btn-group">
          {hasUnsynced && (
            <IonButton
              color="success"
              onClick={synchroniserToutes}
              disabled={syncingAll}
            >
              <IonIcon icon={sync} slot="start" />
              Synchroniser toutes les parcelles
            </IonButton>
          )}
        </div>

        {/* Filtres */}
        <div className="mb-3 mt-3">
          <div className="filtre-parcelle-container">
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
                className="btn rounded btn-outline-primary"
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
                className="btn rounded btn-outline-primary"
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
                className="btn rounded btn-outline-primary"
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
                className="btn rounded btn-outline-primary"
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
              if (filtreParcelle === "sync") return p.synchronise === 1;
              if (filtreParcelle === "nosync") return p.synchronise === 0 || p.synchronise === 2;
              if (filtreParcelle === "erreur") return p.synchronise === 2;
              return true;
            })
            .map((parcelle) => (
              <IonCard key={parcelle.code} className="custom-card">
                <span
                  className={`position-badge-custom-tab2 ion-color ${parcelle.synchronise === 1
                    ? "ion-color-success"
                    : "ion-color-danger"
                    } ${parcelle.synchronise === 1 ? "disabled" : ""}`}
                  title="Synchroniser"
                  onClick={() => {
                    if (parcelle.synchronise !== 1 && !parcelle.syncing) {
                      synchroniserParcelle(parcelle.code!);
                    }
                  }}
                  role="button"
                >
                  {parcelle.syncing ? (
                    <IonSpinner
                      name="crescent"
                      color="light"
                      style={{ width: "18px", height: "18px" }}
                    />
                  ) : (
                    <IonIcon
                      icon={parcelle.synchronise === 1 ? checkmark : sync}
                    />
                  )}
                  <span className="visually-hidden">
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
                      <IonChip color="success">
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
                        <IonIcon icon={sync} color="danger"></IonIcon>
                        <IonLabel> ⚠️ {parcelle.syncError}</IonLabel>
                      </IonChip>
                    )}
                  </IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent className="p-0">
                  <div className="scrollable-list">
                    {(parcelle.demandeurs ?? []).map((demandeur) => (
                      <DemandeurView
                        key={`dem${demandeur.id}`}
                        demandeur={demandeur}
                      />
                    ))}
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
