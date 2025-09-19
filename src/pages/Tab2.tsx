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
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, transform } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import ScaleLine from "ol/control/ScaleLine";
import "ol/ol.css";
import {
  addOutline,
  checkmark,
  closeOutline,
  eyeOffOutline,
  eyeOutline,
  information,
  locateOutline,
  navigateSharp,
  pencilOutline,
  removeOutline,
  search,
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

proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

const STORAGE_KEY_GEOJSON = "plofData";
const layerOrder = [
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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Tab2: React.FC = () => {
  // ==================== REFS ====================
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const localLayerRef = useRef<TileLayer | null>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const parcellesLayerRef = useRef<VectorLayer | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer>>({});
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const styleCache = useRef<Record<string, Style>>({});
  const watchId = useRef<string | number | null>(null);

  // ==================== STATE ====================
  const { db, loadMBTiles } = useDb();
  const [loadingMap, setLoadingMap] = useState(true);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [geojsons, setGeojsons] = useState<any[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<number[] | null>(null);
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
  const [layerVisibility, setLayerVisibility] = useState({
    fond: true,
    ipss: true,
    parcelle: true,
    titre: true,
    requisition: true,
    demandecf: true,
    certificat: true,
  });

  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");

  const intervalDuration = 10000;

  // ==================== HOOKS ====================
  useIonViewDidEnter(() => {
    const loadDataOnEnter = async () => {
      try {
        setLoadingMap(true);
        setGeojsons(await loadGeoJsonFromStorage());
        const loadedParcelles = await loadParcellesFromStorage();
        setParcelles(loadedParcelles);

        if (from === "tab1" && action === "croquis" && codeParcelle) {
          const found = loadedParcelles.find((p) => p.code === codeParcelle);
          setCurrentParcelle(found || null);
        } else {
          setCurrentParcelle(null);
          setFabOpen(false);
        }

        const database = await loadMBTiles();
        if (!localLayerRef.current) {
          await addMbTilesLayer(database);
        }
      } catch (err) {
        console.error("Erreur chargement Tab2 :", err);
      } finally {
        setLoadingMap(false);
      }
    };

    loadDataOnEnter();
  });

  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
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
          all.push(JSON.parse(file.data));
        }
      }
      return all;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  // ==================== STYLES ====================
  const getLabelText = (feature: Feature, type: string | undefined): string => {
    if (!type) return "";

    const labelMap: Record<string, string> = {
      requisition: feature.get("num_requisition") || "",
      certificat: feature.get("numerocertificat") || "",
      ipss: feature.get("code_parcelle") || "",
      demandecf: feature.get("numdemande") || "",
      titre: feature.get("titres_req") || "",
      parcelle: feature.get("code") || "",
    };

    return labelMap[type] || feature.get("name") || "";
  };

  const createStyle = (type: string | undefined, labelText: string, zoom: number): Style => {
    const styleMap: Record<string, Style> = {
      ipss: new Style({
        stroke: new Stroke({ color: "rgba(5, 59, 255,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(5,59,255,0.3)" }),
      }),
      certificat: new Style({
        stroke: new Stroke({ color: "rgba(251,255,0,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(251,255,0,0.3)" }),
      }),
      demandecf: new Style({
        stroke: new Stroke({ color: "rgba(148,52,211,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(148,52,211,0.3)" }),
      }),
      requisition: new Style({
        stroke: new Stroke({ color: "rgba(76, 211, 52, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(76, 211, 52,0.3)" }),
      }),
      titre: new Style({
        stroke: new Stroke({ color: "rgba(255,0,0,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(255,0,0,0.3)" }),
      }),
      region: new Style({
        stroke: new Stroke({ color: "rgba(0, 100, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(0, 100, 0, 0.1)" }),
      }),
      district: new Style({
        stroke: new Stroke({ color: "rgba(0, 150, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(0, 150, 0, 0.1)" }),
      }),
      commune: new Style({
        stroke: new Stroke({ color: "rgba(0, 200, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(0, 200, 0, 0.1)" }),
      }),
      fokontany: new Style({
        stroke: new Stroke({ color: "rgba(0, 250, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(0, 250, 0, 0.1)" }),
      }),
      cadastre: new Style({
        stroke: new Stroke({ color: "rgba(200, 100, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(200, 100, 0, 0.2)" }),
      }),
      demandefn: new Style({
        stroke: new Stroke({ color: "rgba(100, 0, 200, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(100, 0, 200,0.3)" }),
      }),
      parcelle: new Style({
        stroke: new Stroke({ color: "rgba(5,59,255,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(5,59,255,0.2)" }),
      }),
    };

    const baseStyle = styleMap[type]?.clone() || new Style({
      stroke: new Stroke({ color: "#7f7f7f", width: 1.5 }),
      fill: new Fill({ color: "rgba(127,127,127,0.2)" }),
    });

    if (labelText && zoom > 10) {
      baseStyle.setText(
        new Text({
          text: labelText,
          font: "16px Arial",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({ color: "#fff", width: 3 }),
          overflow: false,
          placement: "polygon",
        })
      );
    }

    return baseStyle;
  };

  const styleByType = useCallback((feature: Feature): Style => {
    if (!mapRef.current) return new Style();
    const zoom = Math.round(mapRef.current.getView().getZoom() || 0); // arrondi pour limiter les styles

    const type = feature.get("name")?.toLowerCase();
    const labelText = getLabelText(feature, type);
    const cacheKey = `${type}_${labelText}_${zoom}`;

    if (styleCache.current[cacheKey]) return styleCache.current[cacheKey];

    const newStyle = createStyle(type, labelText, zoom);
    styleCache.current[cacheKey] = newStyle;
    return newStyle;
  }, []);

  // ==================== VECTOR & DRAW ====================
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
    const closedPoints = (first[0] === last[0] && first[1] === last[1]) ? drawPoints : [...drawPoints, first];

    const points = closedPoints.map(([x, y]) => {
      const [tx, ty] = transform([x, y], "EPSG:3857", "EPSG:29702") as [number, number];
      return new PointC(tx, ty);
    });

    const newPolygone = new Polygone(points);
    const updatedParcelle: Parcelle = { ...currentParcelle, polygone: [newPolygone] };
    const updatedParcelles = parcelles.map((p) => p.code === updatedParcelle.code ? updatedParcelle : p);

    setCurrentParcelle(updatedParcelle);
    setParcelles(updatedParcelles);
    setDrawPoints([]);
    setFabOpen(false);

    await insertParcelle(updatedParcelle);

    const vectorLayer = vectorLayerRef.current;
    if (vectorLayer) {
      const source = vectorLayer.getSource();
      const featurePoints = points.map((p) => transform([p.x, p.y], "EPSG:29702", "EPSG:3857"));
      const polygon = new Polygon([featurePoints]);
      const feature = new Feature(polygon);
      feature.set("name", "parcelle");
      feature.set("code", updatedParcelle.code);
      feature.setStyle(styleByType);
      source.addFeature(feature);
    }
  }, [currentParcelle, drawPoints, parcelles, styleByType]);

  // ==================== DRAW & LIVE DISPLAY ====================
  useEffect(() => {
    if (!mapRef.current) return;

    if (!vectorLayerRef.current) {
      const source = new VectorSource();
      const vectorLayer = new VectorLayer({
        source,
        zIndex: 6,
        style: (feature) => {
          const geom = feature.getGeometry();
          if (geom instanceof Point) {
            return new Style({
              image: new CircleStyle({
                radius: 3,
                fill: new Fill({ color: "#ff0000" }),
                stroke: new Stroke({ color: "#fff", width: 1 })
              })
            });
          } else if (geom instanceof Polygon) {
            return new Style({
              stroke: new Stroke({ color: "#0000ff", width: 1.5 }),
              fill: new Fill({ color: "rgba(0,0,255,0.1)" })
            });
          } else if (geom instanceof MultiPoint) {
            return new Style({
              image: new CircleStyle({
                radius: 3,
                fill: new Fill({ color: "#ff0000" }),
                stroke: new Stroke({ color: "#fff", width: 1 })
              })
            });
          }
          return undefined;
        }
      });
      mapRef.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
    }

    const source = vectorLayerRef.current.getSource();
    if (!source) return;

    if (drawPoints.length > 0) {
      let polygonFeature = source.getFeatures().find(f => f.get("type") === "polygon");
      if (!polygonFeature) {
        polygonFeature = new Feature(new Polygon([[]]));
        polygonFeature.set("type", "polygon");
        source.addFeature(polygonFeature);
      }

      if (drawPoints.length > 2) {
        const coords = [...drawPoints, drawPoints[0]];
        polygonFeature.setGeometry(new Polygon([coords]));
      }

      // points
      let pointsFeature = source.getFeatures().find(f => f.get("type") === "points");
      if (!pointsFeature) {
        pointsFeature = new Feature(new MultiPoint([]));
        pointsFeature.set("type", "points");
        source.addFeature(pointsFeature);
      }
      pointsFeature.setGeometry(new MultiPoint(drawPoints));
    } else {
      source.clear(); // plus rien à afficher
    }
  }, [drawPoints]);

  // ==================== SNAP TO FEATURES ====================
  useEffect(() => {
    if (!mapRef.current || !fabOpen) return;
    const map = mapRef.current;
    const view = map.getView();

    let crosshairRadiusPx = 20;
    const crosshairEl = document.querySelector(".cross-symbol") as HTMLElement;
    if (crosshairEl) {
      const styles = getComputedStyle(crosshairEl);
      crosshairRadiusPx = Math.max(parseFloat(styles.width), parseFloat(styles.height)) / 2;
    }

    const snapToClosestFeature = () => {
      const center = view.getCenter();
      if (!center) return;

      let snapPoint: number[] | null = null;
      let minDistPx = Infinity;

      const snapLayers = [parcellesSourceRef.current, ...Object.values(geoJsonLayersRef.current)];
      snapLayers.forEach((layer: any) => {
        if (!layer || !layerVisibility[layer.get("name")]) return;
        layer.getSource()?.getFeatures().forEach((f: Feature) => {
          const geom = f.getGeometry();
          if (!geom) return;

          let candidate: number[] | null = null;
          if (geom instanceof Point) candidate = geom.getCoordinates();
          else if (geom instanceof Polygon) candidate = geom.getClosestPoint(center);
          if (!candidate) return;

          const pixelCandidate = map.getPixelFromCoordinate(candidate);
          const pixelCenter = map.getPixelFromCoordinate(center);
          if (!pixelCandidate || !pixelCenter) return;

          const dx = pixelCandidate[0] - pixelCenter[0];
          const dy = pixelCandidate[1] - pixelCenter[1];
          const distPx = Math.sqrt(dx * dx + dy * dy);

          if (distPx <= crosshairRadiusPx && distPx < minDistPx) {
            minDistPx = distPx;
            snapPoint = candidate;
          }
        });
      });

      if (snapPoint) {
        view.animate({ center: snapPoint, duration: 100 });
      }
    };

    // ⚡ Throttle: limite l'exécution à 1 fois toutes les 300ms
    let lastCall = 0;
    const throttledSnap = () => {
      const now = Date.now();
      if (now - lastCall > 300) {
        lastCall = now;
        snapToClosestFeature();
      }
    };

    map.on("moveend", throttledSnap);
    return () => map.un("moveend", throttledSnap);
  }, [fabOpen, geojsons, layerVisibility]);

  const readBounds = useCallback((db: any): number[] => {
    let bounds: number[] = [];
    let stmt: any; // ← déclarer ici pour qu'il soit visible dans finally
    try {
      stmt = db.prepare("SELECT value FROM metadata WHERE name = 'bounds'");
      if (stmt.step()) {
        const value = stmt.getAsObject().value as string;
        const parts = value.split(",").map(parseFloat);
        if (parts.length === 4) bounds = parts;
      } else {
        throw new Error("Aucun bounds trouvé");
      }
    } catch (err) {
      console.error("⚠️ Erreur lecture bounds:", err);
      throw err;
    } finally {
      stmt?.free?.();
    }
    return bounds;
  }, []);

  const createMbTilesSource = useCallback((db: any) =>
    new XYZ({
      tileSize: 256,
      minZoom: 0,
      maxZoom: 18,
      tileUrlFunction: (tileCoord) => `mbtiles://${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`,
      tileLoadFunction: (imageTile, src) => {
        const tileCoord = imageTile.getTileCoord();
        if (!tileCoord) return;
        const [z, x, y_ol] = tileCoord;
        const y = (1 << z) - 1 - y_ol;
        const image = imageTile.getImage() as HTMLImageElement;
        const stmt = db.prepare("SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?");
        stmt.bind([z, x, y]);
        if (stmt.step()) {
          const blob = new Blob([stmt.getAsObject().tile_data], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          image.onload = () => URL.revokeObjectURL(url); // ⚡ évite fuite mémoire
          image.src = url;
        } else image.src = "";
        stmt.free();
      }
    }), []);


  const createVectorLayers = useCallback(() => {
    const parcellesSource = new VectorSource();
    const parcellesLayer = new VectorLayer({
      source: parcellesSource,
      style: styleByType,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
    });
    parcellesLayer.setZIndex(layerOrder.length + 1);
    parcellesSourceRef.current = parcellesSource;
    parcellesLayer.set("name", "parcelle");
    parcellesLayerRef.current = parcellesLayer;
    const layers: VectorLayer<any>[] = [parcellesLayer];
    layerOrder.forEach((name, i) => {
      const src = new VectorSource();
      const layer = new VectorLayer({
        source: src,
        style: styleByType,
        zIndex: i + 1,
        updateWhileAnimating: false,
        updateWhileInteracting: false,
        visible: true,
      });
      layer.set("name", name);
      geoJsonLayersRef.current[name] = layer;
      layers.push(layer);
    });
    return layers;
  }, [styleByType, layerOrder]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    setLoadingMap(true);
    const map = new Map({
      target: mapElement.current,
      view: new View({ center: fromLonLat([46.8, -18.8]), zoom: 6, maxZoom: 28 }),
      controls: [
        new ScaleLine({ units: "metric", bar: true, steps: 1, text: true }),
        new Rotate({ autoHide: false, className: "ol-rotate ol-custom-bottom-left" })
      ],
      loadTilesWhileAnimating: false,
      loadTilesWhileInteracting: false,
      moveTolerance: 5
    });

    mapRef.current = map;
    const vectorLayers = createVectorLayers();
    vectorLayers.forEach(layer => map.addLayer(layer));

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) setCenterCoordsProjected(transform(center, "EPSG:3857", "EPSG:29702"));
    });

    setLoadingMap(false);
  }, []);

  const addMbTilesLayer = useCallback(
    async (database: Database) => {
      if (!mapRef.current || !database) return;
      setLoadingMap(true);
      try {
        const bounds = readBounds(database);
        const mbTilesSource = createMbTilesSource(database);
        const mbTilesLayer = new TileLayer({ source: mbTilesSource });
        mbTilesLayer.set("name", "fond");
        localLayerRef.current = mbTilesLayer;
        mapRef.current.addLayer(mbTilesLayer);
        mbTilesSource.refresh();
        mapRef.current
          .getView()
          .setCenter(
            fromLonLat([
              (bounds[0] + bounds[2]) / 2,
              (bounds[1] + bounds[3]) / 2,
            ])
          );
        mapRef.current.getView().setZoom(11);
      } catch (err) {
        console.error("Erreur ajout MBTiles:", err);
      } finally {
        setLoadingMap(false);
      }
    },
    [readBounds, createMbTilesSource]
  );

  useEffect(() => {
    if (!mapRef.current || geojsons.length === 0) return;
    const format = new GeoJSON();
    Object.keys(geoJsonLayersRef.current).forEach((n) =>
      geoJsonLayersRef.current[n].getSource().clear()
    );
    geojsons.forEach((g) => {
      const fts = format.readFeatures(g, { featureProjection: "EPSG:3857" });
      if (fts.length > 0) {
        const type = fts[0].get("name")?.toLowerCase();
        if (type && geoJsonLayersRef.current[type]) {
          geoJsonLayersRef.current[type].getSource().addFeatures(fts);
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
          transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
        );
        if (pts.length > 2) {
          const f = new Feature(new Polygon([pts]));
          f.set("code", p.code);
          f.set("name", "parcelle");
          features.push(f);
        }
      })
    );
    parcellesSourceRef.current.addFeatures(features);
  }, [parcelles]);

  const toggleLayer = (keys: (keyof typeof layerVisibility) | (keyof typeof layerVisibility)[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    setLayerVisibility(prev => {
      const newVisibility = !prev[keysArray[0]];
      const updated = { ...prev };
      keysArray.forEach(k => {
        updated[k] = newVisibility;
        const layer = mapRef.current?.getLayers().getArray().find(l => l.get("name") === k);
        if (layer) layer.setVisible(newVisibility);
      });
      return updated;
    });
  };

  const gpsCard = useCallback(() => setShowGPS((prev) => !prev), []);

  const searchGPS = useCallback(() => {
    const x = parseFloat(longitude);
    const y = parseFloat(latitude);
    if (isNaN(x) || isNaN(y)) return setToastMessage("Coordonnées invalides");
    const coords3857 = transform([x, y], "EPSG:29702", "EPSG:3857");
    const map = mapRef.current;
    if (!map) return;
    map.getView().animate({ center: coords3857, zoom: 17, duration: 1000 });
    const marker = new Feature({ geometry: new Point(coords3857) });
    if (!fabOpen) {
      const style1 = new Style({ image: new CircleStyle({ radius: 6, fill: new Fill({ color: "red" }), stroke: new Stroke({ color: "#fff", width: 2 }) }) });
      const style2 = new Style({ image: new CircleStyle({ radius: 6, fill: new Fill({ color: "rgba(30,255,0,1)" }), stroke: new Stroke({ color: "#fff", width: 2 }) }) });
      let visible = true;
      marker.setStyle(style1);
      const interval = setInterval(() => {
        visible = !visible;
        marker.setStyle(visible ? style1 : style2);
      }, 500);
      setTimeout(() => clearInterval(interval), intervalDuration);
    }
    const vectorSource = new VectorSource({ features: [marker] });
    const markerLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(markerLayer);
    setTimeout(() => map.removeLayer(markerLayer), intervalDuration);
  }, [fabOpen, latitude, longitude]);

  const stateSearch = useCallback(() => setShowSearch(prev => !prev), []);

  const blinkFeature = useCallback((feature: Feature) => {
    if (!mapRef.current) return;
    if (highlightLayerRef.current) mapRef.current.removeLayer(highlightLayerRef.current);
    const highlightSource = new VectorSource({ features: [feature] });
    let visible = true;
    const highlightStyle = (visible: boolean) =>
      new Style({
        stroke: new Stroke({
          color: visible ? "rgba(81, 255, 0, 0.63)" : "rgba(255, 255, 255, 0.63)",
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
    }, 5000);
  }, []);
  // ==================== SEARCH & ZOOM ====================
  const searchAndZoom = useCallback((searchTerm: string) => {
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
          if (typeof props[key] === "string" && props[key].toLowerCase().includes(term)) {
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
            transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
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
        mapRef.current.getView().fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
        blinkFeature(foundFeature);
      }
    } else {
      setToastMessage(`Aucune parcelle trouvée pour : ${searchTerm}`);
    }
  }, [blinkFeature, parcelles]);

  // ==================== GPS & TRACKING ====================
  const toggleTracking = async () => {
    if (!tracking) {
      try {
        setGpsStatus(1);
        if (Capacitor.getPlatform() === "web") {
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              const { longitude: lon, latitude: lat, accuracy } = pos.coords;
              setGpsAccuracy(accuracy);
              setGpsStatus(2);
              mapRef.current?.getView().animate({ center: fromLonLat([lon, lat]), zoom: 21, duration: 1000 });
            },
            (err) => {
              console.error("Erreur GPS Web:", err);
              setGpsStatus(err.code === 2 ? 1 : 3);
              if (err.code !== 2) setToastMessage("Erreur GPS : " + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== "granted") {
            const request = await Geolocation.requestPermissions();
            if (request.location !== "granted") {
              setToastMessage("Permission GPS refusée");
              setGpsStatus(3);
              return;
            }
          }
          watchId.current = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            (pos, err) => {
              if (err) {
                console.error("Erreur GPS mobile:", err);
                setGpsStatus(err.code === 2 ? 1 : 3);
                if (err.code !== 2) setToastMessage("Erreur GPS : " + JSON.stringify(err));
                return;
              }
              if (pos && mapRef.current) {
                const { longitude: lon, latitude: lat, accuracy } = pos.coords;
                setGpsAccuracy(accuracy);
                setGpsStatus(2);
                mapRef.current.getView().animate({ center: fromLonLat([lon, lat]), zoom: 21, duration: 1000 });
              }
            }
          );
        }
        setTracking(true);
      } catch (e) {
        console.error("Erreur lors du démarrage du tracking:", e);
        setToastMessage("Erreur lors du démarrage du tracking: " + e);
        setGpsStatus(3);
      }
    } else {
      if (watchId.current) {
        if (Capacitor.getPlatform() === "web") navigator.geolocation.clearWatch(watchId.current as number);
        else await Geolocation.clearWatch({ id: watchId.current as string });
        watchId.current = null;
      }
      setGpsAccuracy(null);
      setGpsStatus(0);
      setTracking(false);
    }
  };
  useEffect(() => () => {
    if (!watchId.current) return;
    if (Capacitor.getPlatform() === "web") navigator.geolocation.clearWatch(watchId.current as number);
    else Geolocation.clearWatch({ id: watchId.current as string });
  }, []);
  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons slot="start" className="glass-btn">
            <IonMenuButton />
          </IonButtons>

          {currentParcelle != null && (
            <IonTitle className="glass-label">
              Croquis du parcelle {currentParcelle.code}
            </IonTitle>
          )}

          <IonButtons onClick={stateSearch} slot="end" className="glass-btn">
            <IonIcon icon={search} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonLoading
          isOpen={loadingMap}
          message={"Initialisation de la carte..."}
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
                    const target = e.target as HTMLInputElement;
                    const val = target.value;
                    if (val && val.trim()) {
                      searchAndZoom(val.trim());
                    }
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

        {currentParcelle && showCard && (
          <div className="glass-card-bottom">
            <div className="glass-card-header">
              <h4 style={{ margin: 0 }}>
                <label className="fs-6">{currentParcelle.code}</label>
              </h4>
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setShowCard(false)}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: "20px" }} />
              </IonButton>
            </div>

            <div className="glass-card-content">
              <p>
                <label>Date de création :</label>{" "}
                {currentParcelle.dateCreation || "N/A"}
              </p>
              <p>
                <label>Consistance :</label>{" "}
                {currentParcelle.consistance || "Aucune"}
              </p>
              <p>
                <label>Opposition :</label>{" "}
                {currentParcelle.oppossition ? "Oui" : "Non"}
              </p>
              <p>
                <label>Revandication :</label>{" "}
                {currentParcelle.revandication ? "Oui" : "Non"}
              </p>
              <p>
                <label>Observation :</label>{" "}
                {currentParcelle.observation || "Aucune"}
              </p>
            </div>
          </div>
        )}

        {showGPS && (
          <div className="gps-container">
            <div className="gps-search">
              <div className="gps-header">
                <label>Aller à (X, Y)</label>
                <IonButton
                  fill="clear"
                  size="small"
                  color="danger"
                  onClick={() => setShowGPS(false)}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: "20px" }} />
                </IonButton>
              </div>

              <div className="gps-glass-card">
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
                <IonButton expand="block" onClick={searchGPS}>
                  Valider
                </IonButton>
              </div>
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
            <IonButton
              fill="clear"
              className="glass-btn"
              onClick={() => setFabOpen((prev) => !prev)}
            >
              <IonIcon color="danger" icon={pencilOutline}></IonIcon>
            </IonButton>
          )}

          {currentParcelle && (
            <IonButton
              className="glass-btn"
              fill="clear"
              onClick={() => setShowCard(true)}
            >
              <IonIcon color="dark" icon={information} />
            </IonButton>
          )}
          <IonButton className="glass-btn" fill="clear" onClick={gpsCard}>
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

          <IonButton
            fill="clear"
            className="glass-btn"
            onClick={() => setShowLocalTiles((prev) => !prev)}
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