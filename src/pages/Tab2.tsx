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
  IonLabel,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import { useLocation } from 'react-router-dom';
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
  closeOutline,
  checkmark,
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
import { Parcelle } from "../model/parcelle/Parcelle";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Tab2: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const tileCache = useRef<Record<string, string>>({});
  const localLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const lastDebug = useRef<string>("");
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [stateDrawCarte, setstateDrawCarte] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const alreadyChecked = useRef(new Set<string>());
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<number[] | null>(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const query = useQuery();
  const from = query.get('from');
  const action = query.get('action');
  const codeParcelle = query.get('code');
  const STORAGE_KEY = "parcelles_data";

  const loadParcellesFromStorage = async (): Promise<Parcelle[]> => {
    const result = await Preferences.get({ key: STORAGE_KEY });
    if (result.value) {
      try {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
      }
    }
    return [];
  };

  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);

      if (from === 'tab1' && action === 'croquis' && codeParcelle) {
        const found = savedParcelles.find(p => p.code === codeParcelle);
        setCurrentParcelle(found || null);
      } else {
        setCurrentParcelle(null);
      }
    };
    load();
  }, [from, action, codeParcelle]);

  const sanitizeName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  }, []);

  const updatePolygon = useCallback(() => {
    if (!mapRef.current) return;
    const source = new VectorSource();

    if (drawPoints.length > 2) {
      const polygon = new Polygon([[...drawPoints, drawPoints[0]]]);
      source.addFeature(new Feature(polygon));
    }

    drawPoints.forEach(pt => {
      source.addFeature(new Feature({ geometry: new Point(pt) }));
    });

    if (vectorLayerRef.current) mapRef.current.removeLayer(vectorLayerRef.current);

    const vectorLayer = new VectorLayer({
      source,
      style: feature => {
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
          return new Style({
            image: new CircleStyle({
              radius: 3,
              fill: new Fill({ color: "#ff0000" }),
              stroke: new Stroke({ color: "#fff", width: 1 }),
            })
          });
        } else if (geometry instanceof Polygon) {
          return new Style({
            stroke: new Stroke({ color: "#0000ff", width: 1.5 }),
            fill: new Fill({ color: "rgba(0, 0, 255, 0.1)" }),
          });
        }
        return undefined;
      }
    });

    vectorLayerRef.current = vectorLayer;
    mapRef.current.addLayer(vectorLayer);
  }, [drawPoints]);

  const addPolygone = async () => {
    if (!currentParcelle) {
      console.warn("Aucune parcelle sélectionnée !");
      return;
    }

    const points = drawPoints.map(([x, y]) => {
      const [tx, ty] = transform([x, y], "EPSG:3857", "EPSG:29702") as [number, number];
      return new PointC(tx, ty);
    });

    const newPolygone = new Polygone(points);

    // Remplacer ou ajouter le polygone à la parcelle
    const updatedParcelle: Parcelle = {
      ...currentParcelle,
      polygone: [newPolygone], // ou ajoute à un tableau si multiples polygones possibles
    };

    // Met à jour dans la liste
    const updatedParcelles = parcelles.map(p =>
      p.code === updatedParcelle.code ? updatedParcelle : p
    );

    // Appliquer les updates dans l’état
    setCurrentParcelle(updatedParcelle);
    setParcelles(updatedParcelles);
    setDrawPoints([]);

    // 🔒 Sauvegarder dans Preferences
    try {
      await Preferences.set({
        key: "parcelles_data",
        value: JSON.stringify(updatedParcelles),
      });
      console.log("✅ parcelles_data mis à jour avec polygone");
    } catch (err) {
      console.error("❌ Échec sauvegarde Preferences:", err);
    }
  };

  const getTileUrl = useCallback(async (z: number, x: number, y: number): Promise<string> => {
    const cacheKey = `${z}/${x}/${y}`;
    if (tileCache.current[cacheKey] !== undefined) return tileCache.current[cacheKey];

    try {
      const { value } = await Preferences.get({ key: "parametreActuel" });
      if (!value) return "";

      const params = JSON.parse(value);
      const tilePath = `tiles/${sanitizeName(params.region.nomregion)}/${sanitizeName(params.district.nomdistrict)}/${sanitizeName(params.commune.nomcommune)}/${sanitizeName(params.fokontany.nomfokontany)}/${sanitizeName(params.hameau.nomhameau)}/fond/${z}/${x}/${y}.png`;

      const file = await Filesystem.readFile({ path: tilePath, directory: Directory.Data });
      const url = `data:image/png;base64,${file.data}`;
      tileCache.current[cacheKey] = url;
      return url;
    } catch (error) {
      tileCache.current[cacheKey] = "";
      return "";
    }
  }, [sanitizeName]);

  useEffect(() => {
    proj4.defs("EPSG:29702", "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs");
    register(proj4);
  }, []);

  useEffect(() => {
    if (!mapElement.current) return;

    const view = new View({
      center: fromLonLat([46.383814, -25.041426]),
      zoom: 12,
      minZoom: 11,
      maxZoom: 21,
    });

    const map = new Map({
      controls: [new ScaleLine({ units: "metric", bar: true, steps: 1, text: true, minWidth: 135, maxWidth: 200 })],
      target: mapElement.current,
      layers: [new TileLayer({ source: new OSM() })],
      view,
    });

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) {
        setCenterCoordsProjected(transform(center, "EPSG:3857", "EPSG:29702") as [number, number]);
      }
    });

    const localSource = new XYZ({
      tileUrlFunction: ([z, x, y]) => {
        const cacheKey = `${z}/${x}/${y}`;
        const url = tileCache.current[cacheKey] || "";

        if (url) {
          alreadyChecked.current.delete(cacheKey);
          return url;
        }

        if (!alreadyChecked.current.has(cacheKey)) {
          alreadyChecked.current.add(cacheKey);
          getTileUrl(z, x, y).then(() => {
            if (tileCache.current[cacheKey]) localSource.refresh();
          });
        }

        return "assets/placeholder-tile.png";
      }
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

  useEffect(() => {
    updatePolygon();
  }, [drawPoints, updatePolygon]);

  const toggleLocalTiles = useCallback(() => {
    if (!localLayerRef.current || !mapRef.current) return;
    const layer = localLayerRef.current;
    const map = mapRef.current;

    showLocalTiles ? map.removeLayer(layer) : map.addLayer(layer);
    setShowLocalTiles(prev => !prev);
  }, [showLocalTiles]);

  const drawCarte = useCallback(() => {
    setstateDrawCarte(prev => !prev);
  }, []);

  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons className="glass-btn" slot="start">
            <IonMenuButton />
          </IonButtons>
          {currentParcelle != null && (
            <IonLabel className="glass-label" slot="end">
              Croquis du parcelle {currentParcelle.code}
            </IonLabel>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {fabOpen && (
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

        {currentParcelle && (
          <div className="glass-card-bottom">
            <div className="glass-card-header">
              <h3 style={{ margin: 0 }}>
                Parcelle <strong>{currentParcelle.code}</strong>
              </h3>
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setCurrentParcelle(null)}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: '24px' }} />
              </IonButton>
            </div>

            <div className="glass-card-content">
              <p><strong>Date de création :</strong> {currentParcelle.dateCreation || 'N/A'}</p>
              <p><strong>Consistance :</strong> {currentParcelle.consistance || 'Aucune'}</p>
              <p><strong>Opposition :</strong> {currentParcelle.oppossition ? 'Oui' : 'Non'}</p>
              <p><strong>Revandication :</strong> {currentParcelle.revandication ? 'Oui' : 'Non'}</p>
              <p><strong>Observation :</strong> {currentParcelle.observation || 'Aucune'}</p>
            </div>
          </div>
        )}

        <div className="map-controls">
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton
              size="small"
              className="glass-btn"
              onClick={() => setFabOpen(prev => !prev)}
            >
              <IonIcon icon={pencilOutline}></IonIcon>
            </IonFabButton>

            {fabOpen && (
              <div className="custom-fab-list">
                <IonFabButton className="glass-btn-draw" onClick={addPolygone}>
                  <IonIcon color="green" icon={checkmark} />
                </IonFabButton>
                <IonFabButton
                  className="glass-btn-draw"
                  onClick={() => {
                    const center = mapRef.current?.getView().getCenter();
                    if (center) setDrawPoints(prev => [...prev, center as [number, number]]);
                  }}
                >
                  <IonIcon color="blue" icon={addOutline} />
                </IonFabButton>
                <IonFabButton
                  className="glass-btn-draw"
                  onClick={() => setDrawPoints(prev => prev.slice(0, -1))}
                >
                  <IonIcon color="danger" icon={removeOutline} />
                </IonFabButton>
                <IonFabButton
                  className="glass-btn-draw"
                  onClick={() => {
                    setDrawPoints([]);
                    setFabOpen(false);
                  }}
                >
                  <IonIcon color="dark" icon={closeOutline} />
                </IonFabButton>
              </div>
            )}
          </IonFab>
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
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
