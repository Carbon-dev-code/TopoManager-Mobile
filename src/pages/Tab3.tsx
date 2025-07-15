import React, { useState, useEffect } from 'react';
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
  IonHeader as ModalHeader,
  IonToolbar as ModalToolbar,
  IonTitle as ModalTitle,
  IonContent as ModalContent,
  IonButtons as ModalButtons,
  IonButton as ModalButton
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { refresh, person, business, sync, checkmarkCircle, closeCircle, server } from 'ionicons/icons';

interface Demandeur {
  id: string;
  type: 'physique' | 'morale';
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
  received?: any;
  server_time?: string;
}

const DEFAULT_IP_PORT = '192.168.88.85:80';
const API_BASE_PATH = '/havelo_mandrare';

const Tab3: React.FC = () => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [serverIpPort, setServerIpPort] = useState(DEFAULT_IP_PORT);
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempServerIpPort, setTempServerIpPort] = useState(DEFAULT_IP_PORT);

  const STORAGE_KEY = 'parcelles_data';
  const SERVER_URL_KEY = 'server_url';

  // Fonction pour construire l'URL complète
  const buildServerUrl = (ipPort: string) => {
    return `http://${ipPort}${API_BASE_PATH}`;
  };

  // Charger les données au montage du composant
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
        const ipPort = `${url.hostname}${url.port ? `:${url.port}` : ''}`;
        setServerIpPort(ipPort);
        setTempServerIpPort(ipPort);
      }
    } catch (e) {
      console.error("Erreur de chargement de l'URL:", e);
    }
  };

  const saveServerUrl = async (ipPort: string) => {
    const cleanedIpPort = ipPort.trim().replace(/^https?:\/\//, '');

    // Validation basique
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
        value: JSON.stringify(updatedParcelles)
      });
      setParcelles(updatedParcelles);
    } catch (e) {
      console.error("Erreur de sauvegarde:", e);
      showError("Erreur lors de la sauvegarde des données");
    }
  };

  const showSuccess = (message: string) => {
    setToastMessage(message);
    setToastColor('success');
    setShowToast(true);
  };

  const showError = (message: string) => {
    setToastMessage(message);
    setToastColor('danger');
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ajoutez d'autres headers si nécessaire
        },
        body: JSON.stringify(parcelleData),
        mode: 'cors' // Explicitement demande un mode CORS
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      return data.success;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error("Serveur inaccessible. Vérifiez:\n1. L'adresse du serveur\n2. Votre connexion réseau\n3. Les logs du serveur");
        }
        throw error;
      }
      throw new Error("Erreur inconnue lors de la synchronisation");
    }
  };

  const synchroniserParcelle = async (parcelleId: string) => {
    const parcelle = parcelles.find(p => p.id === parcelleId);
    if (!parcelle) return;

    try {
      // Mise à jour de l'état "en cours"
      const tempParcelles = parcelles.map(p =>
        p.id === parcelleId ? {
          ...p,
          synchronise: false,
          syncError: undefined,
          syncing: true
        } : p
      );
      await saveParcelles(tempParcelles);

      // Appel API
      const success = await syncWithAPI(parcelle);

      if (success) {
        const updated = parcelles.map(p =>
          p.id === parcelleId ? {
            ...p,
            synchronise: true,
            syncError: undefined,
            syncing: false,
            lastSync: new Date().toISOString()
          } : p
        );
        await saveParcelles(updated);
        showSuccess(`Parcelle ${parcelle.code} synchronisée!`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      const updated = parcelles.map(p =>
        p.id === parcelleId ? {
          ...p,
          synchronise: false,
          syncError: errorMsg,
          syncing: false
        } : p
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

    const nonSyncParcelles = parcelles.filter(p => !p.synchronise);
    if (nonSyncParcelles.length === 0) return;

    setSyncingAll(true);

    try {
      // Mise à jour temporaire
      const tempParcelles = parcelles.map(p =>
        !p.synchronise ? { ...p, syncing: true, syncError: undefined } : p
      );
      await saveParcelles(tempParcelles);

      // Synchronisation séquentielle
      for (const parcelle of nonSyncParcelles) {
        try {
          await syncWithAPI(parcelle);
          // Mise à jour individuelle après chaque succès
          const updated = parcelles.map(p =>
            p.id === parcelle.id ? { ...p, synchronise: true, syncing: false } : p
          );
          await saveParcelles(updated);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
          const updated = parcelles.map(p =>
            p.id === parcelle.id ? { ...p, syncError: errorMsg, syncing: false } : p
          );
          await saveParcelles(updated);
          // Continue malgré les erreurs
        }
      }

      showSuccess(`${nonSyncParcelles.length} parcelles traitées`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      showError(`Erreur lors de la synchronisation: ${errorMsg}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const hasUnsynced = parcelles.some(p => !p.synchronise);

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

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Adresse serveur:</IonLabel>
          <IonText color="primary" slot="end">
            {serverIpPort}
          </IonText>
        </IonItem>

        <div className="ion-margin-bottom ion-margin-top">
          <IonButton expand="block" onClick={loadParcelles} disabled={loading}>
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
        </div>

        {syncingAll && (
          <>
            <IonText>Synchronisation en cours...</IonText>
            <IonProgressBar type="indeterminate" />
          </>
        )}

        {loading && !syncingAll ? (
          <IonText>Chargement...</IonText>
        ) : parcelles.length === 0 ? (
          <IonText color="medium">
            Aucune parcelle enregistrée localement.
          </IonText>
        ) : (
          parcelles.map((parcelle) => (
            <IonCard key={parcelle.id}>
              <IonCardHeader>
                <IonLabel>
                  <strong>Parcelle :</strong> {parcelle.code}
                  {parcelle.lastSync && (
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>
                      Dernière sync: {new Date(parcelle.lastSync).toLocaleString()}
                    </p>
                  )}
                </IonLabel>
              </IonCardHeader>
              <IonCardContent>
                {parcelle.demandeurs.length > 0 ? (
                  <IonList>
                    {parcelle.demandeurs.map((d) => (
                      <IonItem key={d.id}>
                        <IonIcon
                          icon={d.type === 'physique' ? person : business}
                          slot="start"
                        />
                        <IonLabel>
                          {d.type === 'physique'
                            ? `${d.nom} ${d.prenom}`
                            : d.denomination}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                ) : (
                  <IonText color="medium">Aucun demandeur</IonText>
                )}

                <div className="mt-3 d-flex justify-content-between align-items-center">
                  <div>
                    {parcelle.syncing ? (
                      <IonText color="primary">Synchronisation en cours...</IonText>
                    ) : parcelle.synchronise ? (
                      <IonText color="success">
                        <IonIcon icon={checkmarkCircle} /> Synchronisé
                      </IonText>
                    ) : (
                      <IonText color="danger">
                        <IonIcon icon={closeCircle} /> Non synchronisé
                      </IonText>
                    )}
                    {parcelle.syncError && (
                      <IonText color="danger">
                        <p style={{ fontSize: '0.8rem' }}>{parcelle.syncError}</p>
                      </IonText>
                    )}
                  </div>

                  {!parcelle.synchronise && !parcelle.syncing && (
                    <IonButton
                      size="small"
                      onClick={() => synchroniserParcelle(parcelle.id)}
                      disabled={syncingAll || loading}
                    >
                      Synchroniser
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {/* Modal pour configurer le serveur */}
        <IonModal isOpen={showServerModal} onDidDismiss={() => setShowServerModal(false)}>
          <ModalHeader>
            <ModalToolbar>
              <ModalButtons slot="start">
                <ModalButton onClick={() => setShowServerModal(false)}>Annuler</ModalButton>
              </ModalButtons>
              <ModalTitle>Configuration du serveur</ModalTitle>
              <ModalButtons slot="end">
                <ModalButton onClick={() => saveServerUrl(tempServerIpPort)}>Valider</ModalButton>
              </ModalButtons>
            </ModalToolbar>
          </ModalHeader>
          <ModalContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Adresse du serveur (IP:port)</IonLabel>
              <IonInput
                type="text"
                value={tempServerIpPort}
                placeholder="192.168.88.85:80"
                onIonChange={e => setTempServerIpPort(e.detail.value || '')}
                clearInput
              />
            </IonItem>
            <IonText color="medium" className="ion-margin-top">
              <small>
                Format: IP:port<br />
                Exemple: 192.168.88.85:80
              </small>
            </IonText>
          </ModalContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;