import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonInput,
  IonToast,
  IonTitle,
  IonLoading,
  useIonViewDidEnter,
  IonItem,
  IonCheckbox,
  IonLabel,
} from "@ionic/react";
import "./Tab2.css";
import { useCallback, useEffect, useRef, useState } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import { fromLonLat, transform, transformExtent } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import VectorImageLayer from "ol/layer/VectorImage";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import ScaleLine from "ol/control/ScaleLine";
import "ol/ol.css";
import {
  addOutline,
  checkmark,
  closeOutline,
  information,
  layersOutline,
  locateOutline,
  navigateSharp,
  pencilOutline,
  removeOutline,
  search,
  searchSharp,
  stopSharp,
} from "ionicons/icons";
import { Preferences } from "@capacitor/preferences";
import { Parcelle } from "../model/parcelle/Parcelle";
import VectorSource from "ol/source/Vector";
import Polygon from "ol/geom/Polygon";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Text from "ol/style/Text";
import GeoJSON from "ol/format/GeoJSON";
import { useLocation } from "react-router";
import { Geolocation } from "@capacitor/geolocation";
import { Polygone } from "../model/vecteur/Polygone";
import { PointC } from "../model/vecteur/PointC";
import Point from "ol/geom/Point";
import CircleStyle from "ol/style/Circle";
import Rotate from "ol/control/Rotate";
import { Capacitor } from "@capacitor/core";
import { useDb } from "../model/base/DbContextType";
import { getAllParcelles, insertParcelle } from "../model/base/DbSchema";
import Cube from "../components/utils/Cube";
import MultiPoint from "ol/geom/MultiPoint";
import CardGlass from "../components/card/CardGlass";
import { getArea } from "ol/sphere";
import { FeatureLike } from "ol/Feature";

// ==================== CONSTANTS ====================
proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs",
);
register(proj4);

const STORAGE_KEY_GEOJSON = "plofData";
const LAYER_ORDER = [
  "region",
  "district",
  "commune",
  "fokontany",
  "ipss",
  "demandecf",
  "requisition",
  "titre",
  "certificat",
  "cadastre",
  "demandefn",
];
const INTERVAL_DURATION = 10000;
const CROSSHAIR_RADIUS_PX = 20;
const THROTTLE_DELAY = 150;
const MAX_CACHE_SIZE = 200; // Nombre max de tuiles en RAM

// Style configurations
const STYLE_CONFIG = {
  ipss: { stroke: "rgba(5, 59, 255,1)", fill: "rgba(5,59,255,0.3)" },
  certificat: { stroke: "rgba(251,255,0,1)", fill: "rgba(251,255,0,0.3)" },
  demandecf: { stroke: "rgba(148,52,211,1)", fill: "rgba(148,52,211,0.3)" },
  requisition: {
    stroke: "rgba(76, 211, 52, 1)",
    fill: "rgba(76, 211, 52,0.3)",
  },
  titre: { stroke: "rgba(255,0,0,1)", fill: "rgba(255,0,0,0.3)" },
  region: { stroke: "rgba(0, 100, 0, 1)", fill: "rgba(0, 100, 0, 0.1)" },
  district: { stroke: "rgba(0, 150, 0, 1)", fill: "rgba(0, 150, 0, 0.1)" },
  commune: { stroke: "rgba(0, 200, 0, 1)", fill: "rgba(0, 200, 0, 0.1)" },
  fokontany: { stroke: "rgba(0, 250, 0, 1)", fill: "rgba(0, 250, 0, 0.1)" },
  cadastre: { stroke: "rgba(200, 100, 0, 1)", fill: "rgba(200, 100, 0, 0.2)" },
  demandefn: { stroke: "rgba(100, 0, 200, 1)", fill: "rgba(100, 0, 200,0.3)" },
  parcelle: { stroke: "rgba(5,59,255,1)", fill: "rgba(5,59,255,0.2)" },
};

const LABEL_MAP = {
  requisition: "num_requisition",
  certificat: "numerocertificat",
  ipss: "code_parcelle",
  demandecf: "numdemande",
  titre: "titres_req",
  parcelle: "code",
};

// ==================== HELPER FUNCTIONS ====================
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const createCircleStyle = (color: string, radius = 6, strokeWidth = 2) =>
  new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#fff", width: strokeWidth }),
    }),
  });

// ==================== MAIN COMPONENT ====================
const Tab2: React.FC = () => {
  // ==================== REFS ====================
  const mapRef = useRef<OLMap | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const localLayerRef = useRef<TileLayer | null>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer>>({});
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const styleCache = useRef<Record<string, Style>>({});
  const watchId = useRef<string | number | null>(null);
  const layerVisibilityRef = useRef({
    fond: true,
    ipss: true,
    parcelle: true,
    titre: true,
    requisition: true,
    demandecf: true,
    certificat: true,
  });

  // ==================== STATE ====================
  const { db, loadMBTiles } = useDb();
  const tileCache = new Map<string, string>();
  const [loadingMap, setLoadingMap] = useState(true);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [geojsons, setGeojsons] = useState<any[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<
    number[] | null
  >(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [showCard, setShowCard] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<number>(0);
  const [layerVisibility, setLayerVisibility] = useState(
    layerVisibilityRef.current,
  );
  const [surface, setSurface] = useState<number>(0);

  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");

  // ==================== DATA LOADING ====================
  const loadParcellesFromStorage = useCallback(async (): Promise<
    Parcelle[]
  > => {
    return await getAllParcelles();
  }, []);

  const loadGeoJsonFromStorage = useCallback(async (): Promise<any[]> => {
    try {
      const plofDataStr = await Preferences.get({ key: STORAGE_KEY_GEOJSON });
      if (!plofDataStr.value) return [];
      const structure = JSON.parse(plofDataStr.value);
      const all: any[] = [];
      for (const ds of structure.datastores) {
        for (const l of ds.layers) {
          const file = await Filesystem.readFile({
            path: l.path,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          all.push(JSON.parse(file.data as string));
        }
      }
      return all;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  useEffect(() => {
    if (drawPoints.length < 3) {
      setSurface(0);
      return;
    }
    const closed = [...drawPoints, drawPoints[0]];
    const polygon = new Polygon([closed]);
    const area = getArea(polygon, { projection: "EPSG:3857" });

    setSurface(area);
  }, [drawPoints]);

  // ==================== STYLES ====================
  const getLabelText = useCallback(
    (feature: Feature, type: string | undefined): string => {
      if (!type) return "";
      const fieldName = LABEL_MAP[type as keyof typeof LABEL_MAP];
      return fieldName
        ? feature.get(fieldName) || ""
        : feature.get("name") || "";
    },
    [],
  );

  const styleByType = useCallback(
    (feature: FeatureLike): Style => {
      const f = feature as Feature; // cast
      const type = f.get("name")?.toLowerCase() || "default";
      const labelText = getLabelText(f, type);

      // Cache basé uniquement sur le type et le texte
      const cacheKey = `${type}_${labelText}`;

      if (styleCache.current[cacheKey]) {
        return styleCache.current[cacheKey];
      }

      const config = STYLE_CONFIG[type as keyof typeof STYLE_CONFIG] || {
        stroke: "#7f7f7f",
        fill: "rgba(127,127,127,0.2)",
      };

      const newStyle = new Style({
        stroke: new Stroke({ color: config.stroke, width: 1.5 }),
        fill: new Fill({ color: config.fill }),
        text: labelText
          ? new Text({
              text: labelText,
              font: "bold 13px Arial",
              fill: new Fill({ color: "#000" }),
              stroke: new Stroke({ color: "#fff", width: 3 }),
              overflow: true, // Important : permet au texte de dépasser légèrement du polygone
              placement: "point",
            })
          : undefined,
      });

      styleCache.current[cacheKey] = newStyle;
      return newStyle;
    },
    [getLabelText],
  );

  // ==================== DATABASE ====================
  const readBounds = useCallback(async (db: any): Promise<number[]> => {
    let bounds: number[] = [];

    try {
      if (typeof db.query === "function") {
        // MOBILE (Capacitor SQLite)
        const res = await db.query(
          "SELECT value FROM metadata WHERE name = ?",
          ["bounds"],
        );
        if (!res.values?.length) throw new Error("Aucun bounds trouvé");

        const value = String(res.values[0].value);
        const parts = value.split(",").map((v) => Number(v.trim()));
        if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) {
          throw new Error("Bounds invalide: " + value);
        }

        bounds = transformExtent(
          parts as [number, number, number, number],
          "EPSG:4326",
          "EPSG:3857",
        );
      } else if (typeof db.prepare === "function") {
        // WEB (sql.js)
        const stmt = db.prepare(
          "SELECT value FROM metadata WHERE name = 'bounds'",
        );
        if (stmt.step()) {
          const value = stmt.getAsObject().value as string;
          const parts = value.split(",").map((v) => Number(v.trim()));
          if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) {
            throw new Error("Bounds invalide: " + value);
          }
          // ✅ Transformation manquante
          bounds = transformExtent(
            parts as [number, number, number, number],
            "EPSG:4326",
            "EPSG:3857",
          );
        } else {
          throw new Error("Aucun bounds trouvé");
        }
        stmt.free();
      } else {
        throw new Error("Driver SQLite non supporté");
      }
    } catch (err) {
      console.error("⚠️ Erreur lecture bounds:", err);
      throw err;
    }

    return bounds;
  }, []);

  const createMbTilesSource = useCallback((db: any) => {
    return new XYZ({
      // Réintégration de l'URL OSM pour le fallback
      url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      cacheSize: 512,
      tileLoadFunction: async (tile, src) => {
        const imageTile = tile as any;
        const tileCoord = imageTile.getTileCoord();
        const [z, x, y_ol] = tileCoord;
        const y = (1 << z) - 1 - y_ol;
        const image = imageTile.getImage() as HTMLImageElement;

        const cacheKey = `${z}-${x}-${y}`;

        // 1. Vérification du cache mémoire
        if (tileCache.has(cacheKey)) {
          image.src = tileCache.get(cacheKey)!;
          return;
        }

        try {
          if (Capacitor.isNativePlatform() && db) {
            const res = await db.query(
              "SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?",
              [z, x, y],
            );

            if (res?.values?.length > 0) {
              const bytes = res.values[0].tile_data;
              const blob = new Blob([new Uint8Array(bytes)], {
                type: "image/png",
              });
              const url = URL.createObjectURL(blob);

              if (tileCache.size >= MAX_CACHE_SIZE) {
                const firstKey = tileCache.keys().next().value;
                if (firstKey !== undefined) tileCache.delete(firstKey);
                // Note: On ne révoque pas immédiatement pour éviter les clignotements
              }

              tileCache.set(cacheKey, url);
              image.src = url;
            } else {
              // 2. Si pas en DB, on charge depuis l'URL OSM (src)
              image.src = src;
            }
          } else if (db) {
            // Version Web (sql.js)
            const stmt = db.prepare(
              "SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?",
            );
            stmt.bind([z, x, y]);
            if (stmt.step()) {
              const tileData = stmt.getAsObject().tile_data;
              const blob = new Blob([tileData], { type: "image/png" });
              const url = URL.createObjectURL(blob);
              tileCache.set(cacheKey, url);
              image.src = url;
            } else {
              image.src = src;
            }
            stmt.free();
          } else {
            // Si la DB n'est pas chargée, on utilise OSM par défaut
            image.src = src;
          }
        } catch (err) {
          console.log(err);
          // En cas d'erreur SQLite, on tente quand même OSM
          image.src = src;
        }
      },
    });
  }, []);

  // ==================== VECTOR LAYERS ====================
  const createVectorLayers = useCallback(() => {
    // Garder VectorLayer pour les parcelles (édition active)
    const parcellesSource = new VectorSource();
    const parcellesLayer = new VectorLayer({
      source: parcellesSource,
      style: styleByType,
      declutter: true,
      renderBuffer: 200, // Augmenté pour éviter que le texte ne disparaisse sur les bords
    });
    parcellesLayer.setZIndex(LAYER_ORDER.length + 1);
    parcellesLayer.set("name", "parcelle");
    parcellesSourceRef.current = parcellesSource;

    const layers: (VectorLayer<any> | VectorImageLayer<any>)[] = [
      parcellesLayer,
    ];

    // VectorImageLayer pour TOUTES les autres couches avec labels
    LAYER_ORDER.forEach((name, i) => {
      const src = new VectorSource();
      const layer = new VectorImageLayer({
        source: src,
        style: styleByType,
        zIndex: i + 1,
        declutter: true,
        imageRatio: 1, // Préserve la netteté du texte
      });
      layer.set("name", name);
      geoJsonLayersRef.current[name] = layer as any;
      layers.push(layer);
    });
    return layers;
  }, [styleByType]);

  const getDrawStyle = useCallback((feature: FeatureLike) => {
    const geom = feature.getGeometry();
    if (geom instanceof Point || geom instanceof MultiPoint) {
      return new Style({
        image: new CircleStyle({
          radius: 3,
          fill: new Fill({ color: "#ff0000" }),
          stroke: new Stroke({ color: "#fff", width: 1.5 }),
        }),
      });
    } else if (geom instanceof Polygon) {
      return new Style({
        stroke: new Stroke({ color: "#0000ff", width: 1.5 }),
        fill: new Fill({ color: "rgba(0,0,255,0.1)" }),
      });
    }
    return undefined;
  }, []);

  // ==================== MAP OPERATIONS ====================
  const addPolygone = useCallback(async () => {
    if (!currentParcelle) {
      setToastMessage("Aucune parcelle sélectionnée !");
      return;
    }

    if (drawPoints.length < 3) {
      setToastMessage("Un polygone a besoin d'au moins 3 points.");
      return;
    }

    const first = drawPoints[0];
    const last = drawPoints[drawPoints.length - 1];
    const closedPoints =
      first[0] === last[0] && first[1] === last[1]
        ? drawPoints
        : [...drawPoints, first];

    const points = closedPoints.map(([x, y]) => {
      const [tx, ty] = transform([x, y], "EPSG:3857", "EPSG:29702") as [
        number,
        number,
      ];
      return new PointC(tx, ty);
    });

    const newPolygone = new Polygone(points);
    const updatedParcelle: Parcelle = {
      ...currentParcelle,
      polygone: [newPolygone],
    };
    const updatedParcelles = parcelles.map((p) =>
      p.code === updatedParcelle.code ? updatedParcelle : p,
    );

    setCurrentParcelle(updatedParcelle);
    setParcelles(updatedParcelles);
    setDrawPoints([]);
    setFabOpen(false);

    await insertParcelle(updatedParcelle);

    const vectorLayer = vectorLayerRef.current;
    if (vectorLayer) {
      const source = vectorLayer.getSource();
      const featurePoints = points.map((p) =>
        transform([p.x, p.y], "EPSG:29702", "EPSG:3857"),
      );
      const polygon = new Polygon([featurePoints]);
      const feature = new Feature(polygon);
      feature.set("name", "parcelle");
      feature.set("code", updatedParcelle.code);
      feature.setStyle((f: FeatureLike) => styleByType(f));
      source!.addFeature(feature);
    }
  }, [currentParcelle, drawPoints, parcelles, styleByType]);

  const addMarkerWithBlink = useCallback(
    (coords: number[], duration = INTERVAL_DURATION) => {
      const map = mapRef.current;
      if (!map) return;

      const marker = new Feature({ geometry: new Point(coords) });
      const style1 = createCircleStyle("red");
      const style2 = createCircleStyle("rgba(30,255,0,1)");

      let visible = true;
      marker.setStyle(style1);
      const interval = setInterval(() => {
        visible = !visible;
        marker.setStyle(visible ? style1 : style2);
      }, 500);

      const vectorSource = new VectorSource({ features: [marker] });
      const markerLayer = new VectorLayer({ source: vectorSource });
      map.addLayer(markerLayer);

      setTimeout(() => {
        clearInterval(interval);
        map.removeLayer(markerLayer);
      }, duration);
    },
    [],
  );

  const blinkFeature = useCallback((feature: Feature, duration = 5000) => {
    if (!mapRef.current) return;
    if (highlightLayerRef.current)
      mapRef.current.removeLayer(highlightLayerRef.current);

    const highlightSource = new VectorSource({ features: [feature] });
    let visible = true;

    const highlightStyle = (visible: boolean) =>
      new Style({
        stroke: new Stroke({
          color: visible
            ? "rgba(81, 255, 0, 0.63)"
            : "rgba(255, 255, 255, 0.63)",
          width: 1.5,
        }),
        fill: new Fill({
          color: visible ? "rgba(255, 255, 255, 1)" : "rgba(81, 255, 0, 0.63)",
        }),
      });

    const vectorLayer = new VectorLayer({
      source: highlightSource,
      style: highlightStyle(true),
      zIndex: 9999,
    });

    mapRef.current.addLayer(vectorLayer);
    highlightLayerRef.current = vectorLayer;

    const blinkInterval = setInterval(() => {
      visible = !visible;
      vectorLayer.setStyle(highlightStyle(visible));
    }, 500);

    setTimeout(() => {
      clearInterval(blinkInterval);
      if (mapRef.current && highlightLayerRef.current) {
        mapRef.current.removeLayer(highlightLayerRef.current);
        highlightLayerRef.current = null;
      }
    }, duration);
  }, []);

  const searchAndZoom = useCallback(
    (searchTerm: string) => {
      if (!mapRef.current) return;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return;

      let foundFeature: Feature | null = null;
      const geoJsonLayers = Object.values(geoJsonLayersRef.current);

      for (const layer of geoJsonLayers) {
        const source = layer.getSource();
        if (!source) continue;
        const features = source.getFeatures();
        for (const feature of features) {
          const props = feature.getProperties();
          for (const key in props) {
            if (
              typeof props[key] === "string" &&
              props[key].toLowerCase().includes(term)
            ) {
              foundFeature = feature;
              break;
            }
          }
          if (foundFeature) break;
        }
        if (foundFeature) break;
      }

      if (!foundFeature && parcelles.length > 0) {
        for (const p of parcelles) {
          if (p.code?.toLowerCase().includes(term) && p.polygone?.length) {
            const points = p.polygone[0].points.map((pt) =>
              transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857"),
            );
            const polygon = new Polygon([points]);
            foundFeature = new Feature(polygon);
            break;
          }
        }
      }

      if (foundFeature) {
        const extent = foundFeature.getGeometry()?.getExtent();
        if (extent) {
          mapRef.current
            .getView()
            .fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
          blinkFeature(foundFeature);
        }
      } else {
        setToastMessage(`Aucune parcelle trouvée pour : ${searchTerm}`);
      }
    },
    [blinkFeature, parcelles],
  );

  const searchGPS = useCallback(() => {
    const x = parseFloat(longitude);
    const y = parseFloat(latitude);
    if (isNaN(x) || isNaN(y)) return setToastMessage("Coordonnées invalides");

    const coords3857 = transform([x, y], "EPSG:29702", "EPSG:3857");
    const map = mapRef.current;
    if (!map) return;

    map.getView().animate({ center: coords3857, zoom: 17, duration: 1000 });
    if (!fabOpen) addMarkerWithBlink(coords3857);
  }, [fabOpen, latitude, longitude, addMarkerWithBlink]);

  const toggleLayer = useCallback(
    (keys: keyof typeof layerVisibility | (keyof typeof layerVisibility)[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      setLayerVisibility((prev) => {
        const newVisibility = !prev[keysArray[0]];
        const updated = { ...prev };
        keysArray.forEach((k) => {
          updated[k] = newVisibility;
          const layer = mapRef.current
            ?.getLayers()
            .getArray()
            .find((l) => l.get("name") === k);
          if (layer) layer.setVisible(newVisibility);
        });
        return updated;
      });
    },
    [],
  );

  const addMbTilesLayer = useCallback(
    async (database: any) => {
      if (!mapRef.current || !database) return;
      setLoadingMap(true);
      try {
        const bounds4326 = await readBounds(database);
        const mbTilesSource = createMbTilesSource(database);
        const mbTilesLayer = new TileLayer({ source: mbTilesSource });
        mbTilesLayer.set("name", "fond");
        localLayerRef.current = mbTilesLayer;
        mapRef.current.addLayer(mbTilesLayer);
        mbTilesSource.refresh();

        // Zoom plus proche avec minZoom
        mapRef.current.getView().fit(bounds4326, {
          padding: [50, 50, 50, 50],
          maxZoom: 21,
          duration: 1000,
        });
      } catch (err) {
        console.error("Erreur ajout MBTiles:", err);
      } finally {
        setLoadingMap(false);
      }
    },
    [readBounds, createMbTilesSource],
  );

  // ==================== GPS TRACKING ====================
  const toggleTracking = useCallback(async () => {
    if (!tracking) {
      try {
        if (Capacitor.isNativePlatform()) {
          const status = await Geolocation.checkPermissions();
          if (status.location !== "granted") {
            const request = await Geolocation.requestPermissions();
            if (request.location !== "granted") {
              setToastMessage("Permission GPS refusée");
              return;
            }
          }
        }

        setGpsStatus(1);
        const handlePosition = (pos: any) => {
          if (pos && mapRef.current) {
            const { longitude, latitude, accuracy } = pos.coords;
            setGpsAccuracy(accuracy);
            setGpsStatus(2);
            mapRef.current.getView().animate({
              center: fromLonLat([longitude, latitude]),
              zoom: 18,
              duration: 800,
            });
          }
        };

        const handleError = (err: any) => {
          setGpsStatus(err.code === 2 ? 1 : 3);
          setToastMessage("Erreur GPS : " + (err.message || "Signal perdu"));
        };

        if (Capacitor.getPlatform() === "web") {
          watchId.current = navigator.geolocation.watchPosition(
            handlePosition,
            handleError,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            },
          );
        } else {
          watchId.current = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            (pos, err) => {
              if (err) handleError(err);
              else handlePosition(pos);
            },
          );
        }
        setTracking(true);
      } catch (e) {
        setGpsStatus(3);
      }
    } else {
      if (watchId.current) {
        if (Capacitor.getPlatform() === "web") {
          navigator.geolocation.clearWatch(watchId.current as number);
        } else {
          await Geolocation.clearWatch({ id: watchId.current as string });
        }
        watchId.current = null;
      }
      setGpsAccuracy(null);
      setGpsStatus(0);
      setTracking(false);
    }
  }, [tracking]);

  // ==================== EFFECTS ====================
  useIonViewDidEnter(() => {
    const loadDataOnEnter = async () => {
      try {
        setLoadingMap(true);
        setGeojsons(await loadGeoJsonFromStorage());
        const loadedParcelles = await loadParcellesFromStorage();
        setParcelles(loadedParcelles);
        const database = db || (await loadMBTiles());
        if (!localLayerRef.current) await addMbTilesLayer(database);
      } catch (err) {
        console.error("Erreur chargement Tab2:", err);
      } finally {
        setLoadingMap(false);
      }
    };
    loadDataOnEnter();
  });

  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
  }, [layerVisibility]);

  useEffect(() => {
    if (
      from === "tab1" &&
      action === "croquis" &&
      codeParcelle &&
      parcelles.length > 0
    ) {
      const found = parcelles.find((p) => p.code === codeParcelle);
      setCurrentParcelle(found || null);
    } else {
      setCurrentParcelle(null);
      setFabOpen(false);
    }
  }, [from, action, codeParcelle, parcelles]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!vectorLayerRef.current) {
      const source = new VectorSource();
      const vectorLayer = new VectorLayer({
        source,
        zIndex: 6,
        style: getDrawStyle,
        declutter: true,
        updateWhileAnimating: false,
        updateWhileInteracting: false,
        renderBuffer: 100, // Réduit la charge de calcul hors-écran
      });
      mapRef.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
    }

    const source = vectorLayerRef.current.getSource();
    if (!source) return;

    if (drawPoints.length > 0) {
      let polygonFeature = source
        .getFeatures()
        .find((f) => f.get("type") === "polygon");
      if (!polygonFeature) {
        polygonFeature = new Feature(new Polygon([[]]));
        polygonFeature.set("type", "polygon");
        source.addFeature(polygonFeature);
      }

      if (drawPoints.length > 2) {
        const coords = [...drawPoints, drawPoints[0]];
        polygonFeature.setGeometry(new Polygon([coords]));
      }

      let pointsFeature = source
        .getFeatures()
        .find((f) => f.get("type") === "points");
      if (!pointsFeature) {
        pointsFeature = new Feature(new MultiPoint([]));
        pointsFeature.set("type", "points");
        source.addFeature(pointsFeature);
      }
      pointsFeature.setGeometry(new MultiPoint(drawPoints));
    } else {
      source.clear();
    }
  }, [drawPoints, getDrawStyle]);

  useEffect(() => {
    if (!mapRef.current || !fabOpen) return;
    const map = mapRef.current;
    const view = map.getView();

    const snapToClosestFeature = () => {
      const center = view.getCenter();
      if (!center) return;

      let snapPoint: number[] | null = null;
      let minDistPx = Infinity;

      const sources = [
        parcellesSourceRef.current,
        ...Object.values(geoJsonLayersRef.current).map((l) => l.getSource()),
      ];

      sources.forEach((source) => {
        if (!source) return;

        const closestFeature = source.getClosestFeatureToCoordinate(center);
        if (closestFeature) {
          const geom = closestFeature.getGeometry();
          const candidate = geom?.getClosestPoint(center);

          if (candidate) {
            const pixelCandidate = map.getPixelFromCoordinate(candidate);
            const pixelCenter = map.getPixelFromCoordinate(center);

            if (pixelCandidate && pixelCenter) {
              const distPx = Math.sqrt(
                Math.pow(pixelCandidate[0] - pixelCenter[0], 2) +
                  Math.pow(pixelCandidate[1] - pixelCenter[1], 2),
              );

              if (distPx <= CROSSHAIR_RADIUS_PX && distPx < minDistPx) {
                minDistPx = distPx;
                snapPoint = candidate;
              }
            }
          }
        }
      });

      if (snapPoint) view.animate({ center: snapPoint, duration: 100 });
    };

    let lastCall = 0;
    const throttledSnap = () => {
      const now = Date.now();
      if (now - lastCall > THROTTLE_DELAY) {
        lastCall = now;
        snapToClosestFeature();
      }
    };

    map.on("moveend", throttledSnap);
    return () => map.un("moveend", throttledSnap);
  }, [fabOpen]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = new OLMap({
      target: mapElement.current,
      view: new View({
        center: fromLonLat([46.8, -18.8]),
        zoom: 13,
        maxZoom: 18,
        minZoom: 11,
      }),
      controls: [
        new ScaleLine({ units: "metric", bar: true, steps: 1, text: true }),
        new Rotate({
          autoHide: false,
          className: "ol-rotate ol-custom-bottom-left",
        }),
      ],
      moveTolerance: 5,
    });

    mapRef.current = map;
    const vectorLayers = createVectorLayers();
    vectorLayers.forEach((layer) => map.addLayer(layer));

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center)
        setCenterCoordsProjected(transform(center, "EPSG:3857", "EPSG:29702"));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
    };
  }, [createVectorLayers]);

  useEffect(() => {
    if (!mapRef.current || geojsons.length === 0) return;
    const format = new GeoJSON();
    Object.keys(geoJsonLayersRef.current).forEach((n) =>
      geoJsonLayersRef.current[n].getSource()?.clear(),
    );
    geojsons.forEach((g) => {
      const fts = format.readFeatures(g, { featureProjection: "EPSG:3857" });
      if (fts.length > 0) {
        const type = fts[0].get("name")?.toLowerCase();
        if (type && geoJsonLayersRef.current[type]) {
          geoJsonLayersRef.current[type].getSource()?.addFeatures(fts);
        }
      }
    });
  }, [geojsons]);

  useEffect(() => {
    if (!parcellesSourceRef.current) return;
    parcellesSourceRef.current.clear();
    const features: Feature[] = [];
    parcelles.forEach((p) =>
      p.polygone?.forEach((pg) => {
        const pts = pg.points.map((pt) =>
          transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857"),
        );
        if (pts.length > 2) {
          const f = new Feature(new Polygon([pts]));
          f.set("code", p.code);
          f.set("name", "parcelle");
          features.push(f);
        }
      }),
    );
    parcellesSourceRef.current.addFeatures(features);
  }, [parcelles]);

  useEffect(() => {
    return () => {
      if (!watchId.current) return;
      if (Capacitor.getPlatform() === "web") {
        navigator.geolocation.clearWatch(watchId.current as number);
      } else {
        Geolocation.clearWatch({ id: watchId.current as string });
      }
    };
  }, []);

  // ==================== RENDER ====================
  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons slot="start" className="glass-btn">
            <IonMenuButton />
          </IonButtons>
          {currentParcelle && (
            <IonTitle className="glass-label">
              Parcelle {currentParcelle.code}
            </IonTitle>
          )}
          <IonButtons
            onClick={() => setShowSearch((prev) => !prev)}
            slot="end"
            className="glass-btn"
          >
            <IonIcon icon={search} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonLoading
          isOpen={loadingMap}
          message="Initialisation de la carte..."
          spinner="circles"
        />

        {fabOpen && (
          <div className="map-crosshair">
            <div className="cross-symbol"></div>
            {centerCoordsProjected && (
              <div className="coord-display">
                <div>
                  X: {centerCoordsProjected[0].toFixed(6)} Y:{" "}
                  {centerCoordsProjected[1].toFixed(6)}
                </div>
                <div className="gps-status">
                  {gpsStatus === 1 && (
                    <div className="gps-loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                  {gpsStatus === 2 && gpsAccuracy !== null && (
                    <div
                      className="gps-accuracy"
                      style={{
                        color:
                          gpsAccuracy < 10
                            ? "green"
                            : gpsAccuracy < 50
                            ? "orange"
                            : "red",
                      }}
                    >
                      Précision GPS: {gpsAccuracy.toFixed(1)} m
                    </div>
                  )}
                  {gpsStatus === 3 && (
                    <div className="gps-error">Erreur GPS</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={mapElement} className="map-container"></div>

        {showSearch && (
          <div className="map-search">
            <div className="search-glass">
              <IonInput
                type="search"
                placeholder="Recherche titre, karatany, ipss, ..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value;
                    if (val?.trim()) searchAndZoom(val.trim());
                  }
                }}
              />
            </div>
          </div>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ""}
          duration={2000}
          color="danger"
          onDidDismiss={() => setToastMessage(null)}
        />

        {showCard && currentParcelle && (
          <CardGlass
            currentParcelle={currentParcelle}
            setShowCard={setShowCard}
          />
        )}

        {showGPS && (
          <div className="gps-container">
            <div className="gps-search">
              <IonInput
                className="border"
                type="text"
                placeholder="X"
                value={longitude}
                onIonChange={(e) => setLongitude(e.detail.value!)}
              />
              <IonInput
                className="border"
                type="text"
                placeholder="Y"
                value={latitude}
                onIonChange={(e) => setLatitude(e.detail.value!)}
              />
              <IonButton
                className="glass-btn"
                fill="clear"
                size="small"
                color="primary"
                onClick={searchGPS}
              >
                <IonIcon icon={searchSharp} style={{ fontSize: "20px" }} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setShowGPS(false)}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: "20px" }} />
              </IonButton>
            </div>
          </div>
        )}

        <div className="map-controls">
          {fabOpen && (
            <div className="fab">
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={addPolygone}
              >
                <IonIcon color="success" icon={checkmark} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() => {
                  const center = mapRef.current?.getView().getCenter();
                  if (center)
                    setDrawPoints((prev) => [
                      ...prev,
                      center as [number, number],
                    ]);
                }}
              >
                <IonIcon color="primary" icon={addOutline} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() => setDrawPoints((prev) => prev.slice(0, -1))}
              >
                <IonIcon color="danger" icon={removeOutline} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() => {
                  setDrawPoints([]);
                  setFabOpen(false);
                }}
              >
                <IonIcon color="dark" icon={closeOutline} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill={tracking ? "solid" : "clear"}
                color={tracking ? "danger" : "primary"}
                onClick={toggleTracking}
              >
                <IonIcon icon={tracking ? stopSharp : navigateSharp} />
              </IonButton>
            </div>
          )}

          {currentParcelle && (
            <>
              <IonButton
                fill="clear"
                className="glass-btn"
                onClick={() => setFabOpen((prev) => !prev)}
              >
                <IonIcon color="danger" icon={pencilOutline} />
              </IonButton>
              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={() => setShowCard(true)}
              >
                <IonIcon color="dark" icon={information} />
              </IonButton>
            </>
          )}

          <IonButton
            className="glass-btn"
            fill="clear"
            onClick={() => setShowGPS((prev) => !prev)}
          >
            <IonIcon color="dark" icon={locateOutline} />
          </IonButton>

          {!showLocalTiles && (
            <div className="glass-panel">
              <h4 className="glass-title">Couches visibles</h4>
              <IonItem className="glass-item border-bottom" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.ipss && layerVisibility.parcelle}
                  onIonChange={() => toggleLayer(["ipss", "parcelle"])}
                />
                <Cube color="blue" /> IPSS
              </IonItem>
              <IonItem className="glass-item" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.titre}
                  onIonChange={() => toggleLayer("titre")}
                />
                <Cube color="red" /> Titre
              </IonItem>
              <IonItem className="glass-item border-bottom" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.requisition}
                  onIonChange={() => toggleLayer("requisition")}
                />
                <Cube color="chartreuse" />
                <IonLabel>Requisition</IonLabel>
              </IonItem>
              <IonItem className="glass-item" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.demandecf}
                  onIonChange={() => toggleLayer("demandecf")}
                />
                <Cube color="purple" /> Demande CF
              </IonItem>
              <IonItem className="glass-item border-bottom" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.certificat}
                  onIonChange={() => toggleLayer("certificat")}
                />
                <Cube color="yellow" /> Karatany
              </IonItem>
              <IonItem className="glass-item" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.fond}
                  onIonChange={() => toggleLayer("fond")}
                />
                Fond image
              </IonItem>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {fabOpen && drawPoints.length >= 3 && (
              <div className="surface-parcelle">
                Surface {surface.toFixed(0)} m²
              </div>
            )}
            <IonButton
              fill="clear"
              className="glass-btn"
              onClick={() => setShowLocalTiles((prev) => !prev)}
            >
              <IonIcon color="dark" icon={layersOutline} />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
