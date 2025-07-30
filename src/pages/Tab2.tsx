import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { OSM, XYZ } from "ol/source";
import "ol/ol.css";
import "./Tab2.css";

const Tab2: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const tileCache = useRef<Record<string, string>>({});
  const localLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastDebug = useRef<string>("");
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  const sanitizeName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  }, []);

  const getTileUrl = useCallback(async (z: number, x: number, y: number): Promise<string> => {
    const cacheKey = `${z}/${x}/${y}`;

    if (tileCache.current[cacheKey] !== undefined) {
      return tileCache.current[cacheKey];
    }

    try {
      const { value } = await Preferences.get({ key: "parametreActuel" });
      if (!value) return "";

      const params = JSON.parse(value);
      const {
        region: { nomregion },
        district: { nomdistrict },
        commune: { nomcommune },
        fokontany: { nomfokontany },
        hameau: { nomhameau },
      } = params;

      const layerName = "fond";
      const tilePath = `tiles/${sanitizeName(nomregion)}/${sanitizeName(nomdistrict)}/${sanitizeName(nomcommune)}/${sanitizeName(nomfokontany)}/${sanitizeName(nomhameau)}/${layerName}/${z}/${x}/${y}.png`;

      const file = await Filesystem.readFile({
        path: tilePath,
        directory: Directory.Data,
      });

      const url = `data:image/png;base64,${file.data}`;
      tileCache.current[cacheKey] = url;
      return url;
    } catch (error) {
      console.warn("Erreur de chargement de tuile:", error);
      tileCache.current[cacheKey] = ""; // Empêche de refaire la requête
      return "";
    }
  }, [sanitizeName]);

  useEffect(() => {
    if (!mapElement.current) return;

    const initialView = new View({
      center: fromLonLat([46.383814, -25.041426]),
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: initialView,
    });

    const localSource = new XYZ({
      tileUrlFunction: ([z, x, y]) => {
        const cacheKey = `${z}/${x}/${y}`;
        const url = tileCache.current[cacheKey] || "";

        if (!url) {
          getTileUrl(z, x, y).then(() => {
            if (!refreshTimeout.current) {
              refreshTimeout.current = setTimeout(() => {
                localSource.refresh();
                refreshTimeout.current = null;
              }, 300);
            }
          });
        }

        const debugText = `Zoom: ${z} | X: ${x} | Y: ${y}\nURL: ${url ? "OK" : "Manquante"}`;
        if (lastDebug.current !== debugText) {
          setDebugInfo(debugText);
          lastDebug.current = debugText;
        }

        return url || "assets/placeholder-tile.png";
      },
    });

    const localLayer = new TileLayer({ source: localSource });
    map.addLayer(localLayer);
    localLayerRef.current = localLayer;
    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      map.dispose();
      tileCache.current = {};
    };
  }, [getTileUrl]);

  const toggleLocalTiles = useCallback(() => {
    if (localLayerRef.current && mapRef.current) {
      const layer = localLayerRef.current;
      const map = mapRef.current;

      if (showLocalTiles) {
        map.removeLayer(layer);
      } else {
        map.addLayer(layer);
      }
      setShowLocalTiles((prev) => !prev);
    }
  }, [showLocalTiles]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Carte du Territoire</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div ref={mapElement} className="map-container"></div>
        <div className="map-controls">
          <IonButton onClick={toggleLocalTiles} title="Afficher ou masquer le fond de carte">
            {showLocalTiles ? "Masquer le fond" : "Afficher le fond"}
          </IonButton>
        </div>
        {debugInfo && (
          <div className="debug-info">
            <pre>{debugInfo}</pre>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab2;