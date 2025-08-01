import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
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
import { fromLonLat, transform } from "ol/proj";
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
  checkboxOutline,
  closeOutline,
} from "ionicons/icons";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { Style, Stroke, Fill } from "ol/style";
import Point from "ol/geom/Point";
import { PointC } from "../model/vecteur/PointC";
import CircleStyle from "ol/style/Circle";
import { Polygone } from "../model/vecteur/Polygone";

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
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<number[] | null>(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const sanitizeName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  }, []);

  const updatePolygon = useCallback(() => {
    if (!mapRef.current) return;

    const source = new VectorSource();

    // --- 1. Ajouter le polygone s’il y a assez de points
    if (drawPoints.length > 2) {
      const polygon = new Polygon([[...drawPoints, drawPoints[0]]]); // fermer le polygone
      const polyFeature = new Feature(polygon);
      source.addFeature(polyFeature);
    }

    // --- 2. Ajouter les points (sommets) visibles
    drawPoints.forEach((pt) => {
      const pointFeature = new Feature({
        geometry: new Point(pt),
      });
      source.addFeature(pointFeature);
    });

    // --- 3. Supprimer l’ancienne couche s’il y en a une
    if (vectorLayerRef.current) {
      mapRef.current.removeLayer(vectorLayerRef.current);
    }

    // --- 4. Style personnalisé pour les sommets et le polygone
    const vectorLayer = new VectorLayer({
      source,
      style: (feature) => {
        const geometry = feature.getGeometry();

        if (geometry instanceof Point) {
          return new Style({
            image: new CircleStyle({
              radius: 3,
              fill: new Fill({ color: "#ff0000" }),
              stroke: new Stroke({ color: "#fff", width: 1 }),
            }),
          });
        } else if (geometry instanceof Polygon) {
          return new Style({
            stroke: new Stroke({ color: "#0000ff", width: 1.5 }),
            fill: new Fill({ color: "rgba(0, 0, 255, 0.1)" }),
          });
        }

        return undefined;
      },
    });

    vectorLayerRef.current = vectorLayer;
    mapRef.current.addLayer(vectorLayer);
  }, [drawPoints]);

  const addPolygone = () => {
    const pointObjects: PointC[] = drawPoints.map(([x, y]) => {
      const [tx, ty] = transform([x, y], "EPSG:3857", "EPSG:29702") as [number, number];
      return new PointC(tx, ty);
    });
    //console.log('Liste des Points:', pointObjects);
     new Polygone(pointObjects);

  };


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
    proj4.defs(
      "EPSG:29702",
      "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs"
    );
    register(proj4);
  }, []);

  useEffect(() => {
    if (!mapElement.current) return;

    const initialView = new View({
      center: fromLonLat([46.383814, -25.041426]),
      zoom: 12,
      minZoom: 11,
      maxZoom: 21,
    });

    const scaleControl = new ScaleLine({
      units: "metric",
      bar: true,
      steps: 1,
      text: true,
      minWidth: 135,
      maxWidth: 200,
    });

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

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) {
        const projected = transform(center, "EPSG:3857", "EPSG:29702") as [
          number,
          number
        ];
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

    return () => {
      map.setTarget(undefined);
      map.dispose();
      tileCache.current = {};
    };
  }, [getTileUrl]);

  useEffect(() => {
    updatePolygon();
  }, [drawPoints, updatePolygon]);

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
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons className="glass-btn" slot="start">
            <IonMenuButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {stateDrawCarte && (
          <div className="map-crosshair">
            <div className="cross-symbol"></div>
            {centerCoordsProjected && (
              <div className="coord-display">
                <div>
                  X: {centerCoordsProjected[0].toFixed(6)} Y:{" "}
                  {centerCoordsProjected[1].toFixed(6)}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={mapElement} className="map-container"></div>
        <div className="map-controls">
          {stateDrawCarte && (
            <IonButton
              className="glass-btn-draw"
              fill="clear"
              onClick={addPolygone}
            >
              <IonIcon color="success" icon={checkboxOutline} />
            </IonButton>
          )}
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
              <IonButton
                className="glass-btn-draw"
                fill="clear"
                onClick={() => {
                  if (mapRef.current) {
                    const center = mapRef.current.getView().getCenter();
                    if (center) {
                      setDrawPoints((prev) => [
                        ...prev,
                        center as [number, number],
                      ]);
                    }
                  }
                }}
              >
                <IonIcon color="blue" icon={addOutline} />
              </IonButton>
              <IonButton
                className="glass-btn-draw"
                fill="clear"
                onClick={() => {
                  setDrawPoints((prev) => prev.slice(0, -1));
                }}
              >
                <IonIcon color="danger" icon={removeOutline} />
              </IonButton>
              <IonButton
                className="glass-btn-draw"
                fill="clear"
              >
                <IonIcon color="dark" icon={closeOutline} />
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
