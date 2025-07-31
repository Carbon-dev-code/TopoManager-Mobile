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
import ScaleLine from "ol/control/ScaleLine";
import { fromLonLat, toLonLat, transform } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
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
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

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
  const [centerCoords, setCenterCoords] = useState<[number, number] | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<number[] | null>(null);


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
    proj4.defs("EPSG:29702",
      "+proj=omerc +lat_0=-18.9 +lonc=44.10000000000001 +alpha=18.9 " +
      "+k=0.9995000000000001 +x_0=400000 +y_0=800000 +gamma=18.9 +ellps=intl " +
      "+towgs84=-189,-242,-91,0,0,0,0 +pm=paris +units=m +no_defs"
    );

    register(proj4);
  }, []);


  useEffect(() => {
    if (!mapElement.current) return;

    const initialView = new View({
      center: fromLonLat([46.383814, -25.041426]),
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
    });

    const scaleControl = new ScaleLine({ units: 'metric', bar: true, steps: 1, text: true, minWidth: 140, });

    const map = new Map({
      controls: [scaleControl],
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: initialView,
    });

    // Crée un cercle pour marquer le vrai "centre"
    const centerMarker = new Feature({
      geometry: new Point(initialView.getCenter()!),
    });

    centerMarker.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.9)' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
        }),
      })
    );

    const vectorSource = new VectorSource({
      features: [centerMarker],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) {
        // Mettre à jour le marqueur visuel
        centerMarker.setGeometry(new Point(center));

        const lonLat = toLonLat(center);
        setCenterCoords([lonLat[0], lonLat[1]]);

        const projected = transform(center, "EPSG:3857", "EPSG:29702") as [number, number];
        setCenterCoordsProjected(projected);
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
    map.addLayer(vectorLayer);

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
            <div className="cross-symbol"></div>
            {centerCoords && centerCoordsProjected && (
              <div className="coord-display">
                <div><small>WGS84:</small> || Lon: {centerCoords[0].toFixed(6)} Lat: {centerCoords[1].toFixed(6)}</div>
                <div><small>EPSG:29702:</small> || X: {centerCoordsProjected[0].toFixed(6)} Y: {centerCoordsProjected[1].toFixed(6)}</div>
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