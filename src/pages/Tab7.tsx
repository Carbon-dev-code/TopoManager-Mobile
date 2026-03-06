import {
  IonButtons, IonContent, IonHeader, IonMenuButton,
  IonPage, IonTitle, IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { CommunityDevice } from "@capacitor-community/device";
import { Network } from "@capacitor/network";
import { Geolocation } from "@capacitor/geolocation";
import "./Tab7.css";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const Tab7: React.FC = () => {
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(1);
  const [animated, setAnimated] = useState(false);

  // Réseau
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>("");

  // GPS
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    // Stockage
    const fetchStorage = async () => {
      if (Capacitor.isNativePlatform()) {
        const info = await CommunityDevice.getInfo();
        setTotal(info.realDiskTotal || info.diskTotal || 1);
        setUsed(
          (info.realDiskTotal || info.diskTotal || 0) -
          (info.realDiskFree || info.diskFree || 0)
        );
      } else {
        const est = await navigator.storage?.estimate();
        setUsed(est?.usage || 0);
        setTotal(est?.quota || 1);
      }
      setTimeout(() => setAnimated(true), 100);
    };

    // Réseau
    const fetchNetwork = async () => {
      const status = await Network.getStatus();
      setConnected(status.connected);
      setConnectionType(status.connectionType);
    };

    // GPS
    const fetchGps = async () => {
      setGpsLoading(true);
      setGpsError(null);
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });
        setGpsAccuracy(pos.coords.accuracy);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setGpsError("Non disponible");
      } finally {
        setGpsLoading(false);
      }
    };

    fetchStorage();
    fetchNetwork();
    fetchGps();

    // Écoute les changements réseau
    const handler = Network.addListener("networkStatusChange", (status) => {
      setConnected(status.connected);
      setConnectionType(status.connectionType);
    });

    return () => { handler.then(h => h.remove()); };
  }, []);

  const pct = Math.min((used / total) * 100, 100);
  const storageColor = pct < 50 ? "#00c9a7" : pct < 80 ? "#f7b731" : "#ff6b6b";
  const storageStatus = pct < 50 ? "Normal" : pct < 80 ? "Modéré" : "Critique";

  const gpsColor = gpsAccuracy === null ? "#aaa" : gpsAccuracy < 10 ? "#00c9a7" : gpsAccuracy < 50 ? "#f7b731" : "#ff6b6b";

  const gpsStatus = gpsAccuracy === null ? "—"
    : gpsAccuracy < 10 ? "Excellent" : gpsAccuracy < 50 ? "Modéré" : "Faible";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>États système</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding tab7-content">

        {/* Stockage */}
        <div className="storage-card">
          <div className="storage-header">
            <span className="storage-title">Stockage</span>
            <span className="storage-status" style={{ color: storageColor }}>{storageStatus}</span>
          </div>
          <div className="storage-pct" style={{ color: storageColor }}>{pct.toFixed(0)}%</div>
          <div className="storage-bar-track">
            <div className="storage-bar-fill"
              style={{ width: animated ? `${pct}%` : "0%", background: storageColor }} />
          </div>
          <div className="storage-footer">
            <span>{formatBytes(used)} utilisés</span>
            <span>{formatBytes(total)} total</span>
          </div>
        </div>

        {/* Réseau */}
        <div className="storage-card">
          <div className="storage-header">
            <span className="storage-title">Réseau</span>
            <span className="storage-status" style={{ color: connected ? "#00c9a7" : "#ff6b6b" }}>
              {connected === null ? "—" : connected ? "Connecté" : "Hors ligne"}
            </span>
          </div>
          <div className="net-row">
            <div className={`net-dot ${connected ? "net-dot-on" : "net-dot-off"}`} />
            <span className="net-type">
              {connectionType ? connectionType.toUpperCase() : "—"}
            </span>
          </div>
        </div>

        {/* GPS */}
        <div className="storage-card">
          <div className="storage-header">
            <span className="storage-title">GPS</span>
            <span className="storage-status" style={{ color: gpsColor }}>
              {gpsLoading ? "Recherche…" : gpsError ? "Erreur" : gpsStatus}
            </span>
          </div>
          {gpsLoading ? (
            <div className="gps-loading">
              <div className="gps-spinner" />
              <span>Acquisition du signal…</span>
            </div>
          ) : gpsError ? (
            <div className="gps-error-text">{gpsError}</div>
          ) : gpsAccuracy !== null ? (
            <>
              <div className="storage-pct" style={{ color: gpsColor }}>
                ±{gpsAccuracy.toFixed(1)} m
              </div>
              <div className="storage-bar-track">
                <div className="storage-bar-fill"
                  style={{
                    width: animated ? `${Math.max(0, 100 - gpsAccuracy)}%` : "0%",
                    background: gpsColor
                  }} />
              </div>
              <div className="storage-footer">
                <span>Précision GPS</span>
                <span style={{ color: gpsColor }}>{gpsStatus}</span>
              </div>
            </>
          ) : null}
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Tab7;