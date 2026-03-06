import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { CommunityDevice } from "@capacitor-community/device";
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

  useEffect(() => {
    const fetch = async () => {
      if (Capacitor.isNativePlatform()) {
        const info = await CommunityDevice.getInfo();
        setTotal(info.realDiskTotal || info.diskTotal || 1);
        setUsed(
          (info.realDiskTotal || info.diskTotal || 0) -
            (info.realDiskFree || info.diskFree || 0),
        );
      } else {
        const est = await navigator.storage?.estimate();
        setUsed(est?.usage || 0);
        setTotal(est?.quota || 1);
      }
      setTimeout(() => setAnimated(true), 100);
    };
    fetch();
  }, []);

  const pct = Math.min((used / total) * 100, 100);
  const color = pct < 50 ? "#00c9a7" : pct < 80 ? "#f7b731" : "#ff6b6b";
  const status = pct < 50 ? "Normal" : pct < 80 ? "Modéré" : "Critique";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>États système</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding tab7-content">
        <div className="storage-card">
          <div className="storage-header">
            <span className="storage-title">Stockage</span>
            <span className="storage-status" style={{ color }}>
              {status}
            </span>
          </div>

          <div className="storage-pct" style={{ color }}>
            {pct.toFixed(0)}%
          </div>

          <div className="storage-bar-track">
            <div
              className="storage-bar-fill"
              style={{ width: animated ? `${pct}%` : "0%", background: color }}
            />
          </div>

          <div className="storage-footer">
            <span>{formatBytes(used)} utilisés</span>
            <span>{formatBytes(total)} total</span>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab7;
