import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat, toLonLat } from "ol/proj";
import { OSM, XYZ } from "ol/source";
import "ol/ol.css";
import "./Tab2.css";
import {
  addOutline,
  removeOutline,
  eyeOffOutline,
  eyeOutline,
  pencilOutline,
} from "ionicons/icons";

const Tab2: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const tileCache = useRef<Record<string, string>>({});
  const localLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const lastDebug = useRef<string>("");
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [stateDrawCarte, setstateDrawCarte] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const alreadyChecked = useRef(new Set<string>());
  const [centerCoords, setCenterCoords] = useState<[number, number] | null>(
    null
  );

  const sanitizeName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  }, []);

  const getTileUrl = useCallback(
    async (z: number, x: number, y: number): Promise<string> => {
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
        const tilePath = `tiles/${sanitizeName(nomregion)}/${sanitizeName(
          nomdistrict
        )}/${sanitizeName(nomcommune)}/${sanitizeName(
          nomfokontany
        )}/${sanitizeName(nomhameau)}/${layerName}/${z}/${x}/${y}.png`;

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
    },
    [sanitizeName]
  );

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
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: initialView,
    });

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) {
        const lonLat = toLonLat(center); // ← Convertit en [lon, lat]
        setCenterCoords([lonLat[0], lonLat[1]]);
      }
    });

    const localSource = new XYZ({
      tileUrlFunction: ([z, x, y]) => {
        const cacheKey = `${z}/${x}/${y}`;
        const url = tileCache.current[cacheKey] || "";

        // === Affichage debug (OK ou Manquante)
        const debugText = `Zoom: ${z} URL: ${url ? "O" : "M"}`;
        if (lastDebug.current !== debugText) {
          setDebugInfo(debugText);
          lastDebug.current = debugText;
        }

        // === CAS 1 : tuile présente
        if (url) {
          alreadyChecked.current.delete(cacheKey); // réinitialise
          return url;
        }

        // === CAS 2 : tuile absente
        if (!alreadyChecked.current.has(cacheKey)) {
          alreadyChecked.current.add(cacheKey);

          // Essaie de la récupérer
          getTileUrl(z, x, y).then(() => {
            if (tileCache.current[cacheKey]) {
              localSource.refresh();
            }
          });
        }

        return "assets/placeholder-tile.png";
      },
    });

    const localLayer = new TileLayer({
      source: localSource,
    });
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

  const drawCarte = useCallback(() => {
    if (stateDrawCarte) {
      setstateDrawCarte(false);
    } else {
      setstateDrawCarte(true);
    }
  }, [stateDrawCarte]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="ion-text-center">Carte du Territoire</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {stateDrawCarte && (
          <div className="map-crosshair">
            +
            {centerCoords && (
              <div className="coord-display">
                <div>X: {centerCoords[0].toFixed(6)}</div>
                <div>Y: {centerCoords[1].toFixed(6)}</div>
              </div>
            )}
          </div>
        )}

        <div ref={mapElement} className="map-container"></div>
        <div className="map-controls">
          <IonButton className="glass-btn" fill="clear" onClick={drawCarte}>
            <IonIcon
              color={stateDrawCarte ? "blue" : "dark"}
              icon={pencilOutline}
            />
          </IonButton>
          <IonButton
            className="glass-btn"
            fill="clear"
            onClick={toggleLocalTiles}
          >
            <IonIcon
              color="dark"
              icon={showLocalTiles ? eyeOffOutline : eyeOutline}
            />
          </IonButton>
        </div>
        {debugInfo && (
          <div className="debug-info">
            <pre className="m-0">{debugInfo}</pre>
          </div>
        )}

        {stateDrawCarte && (
          <div className="tools">
            <div className="draw">
              <IonButton className="glass-btn-draw" fill="clear">
                <IonIcon color="blue" icon={addOutline} />
              </IonButton>
              <IonButton className="glass-btn-draw" fill="clear">
                <IonIcon color="danger" icon={removeOutline} />
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
