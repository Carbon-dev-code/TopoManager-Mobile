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
import { Geolocation } from '@capacitor/geolocation';
import { Polygone } from "../model/vecteur/Polygone";
import { PointC } from "../model/vecteur/PointC";
import Point from "ol/geom/Point";
import CircleStyle from "ol/style/Circle";
import Rotate from "ol/control/Rotate";
import { Capacitor } from "@capacitor/core";
import { useDb } from "../model/base/DbContextType";

// ---- CRS Madagascar ----
proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

// ---- Constantes ----
const STORAGE_KEY = "parcelles_data";
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
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const { db, loadMBTiles } = useDb();
  const [loadingMap, setLoadingMap] = useState(true); // état pour loader
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const localLayerRef = useRef<TileLayer | null>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const parcellesLayerRef = useRef<VectorLayer | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer>>({});
  const styleCache = useRef<Record<string, Style>>({});
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<number[] | null>(null);
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const [geojsons, setGeojsons] = useState<any[]>([]);
  const intervalDuration = 10000;
  //---Modal/Fab----------
  const [showCard, setShowCard] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  //---------Variable----------/
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  //---Routeur--------
  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");
  //Croquis polygone
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  //message de retour var
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // GPS
  const [tracking, setTracking] = useState(false); // état actif / inactif
  const watchId = useRef<string | number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<number>(0); // 0=arrêt,1=en cours,2=ok,3=erreur

  // -- load mbtiles ---
  useEffect(() => {
    if (!db) {
      loadMBTiles(); // charge la base si pas encore chargé
    }
  }, [db, loadMBTiles]);

  // ---- Load Parcelles & GeoJSON ----
  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
    const result = await Preferences.get({ key: STORAGE_KEY });
    if (!result.value) return [];
    try {
      const parsed = JSON.parse(result.value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error(e);
    }
    return [];
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

  //--- routeur du tab2 -------------------
  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);
      if (from === "tab1" && action === "croquis" && codeParcelle) {
        const found = savedParcelles.find((p) => p.code === codeParcelle);
        setCurrentParcelle(found || null);
      } else {
        setCurrentParcelle(null);
        setFabOpen(false)
      }
    };
    load();
  }, [from, action, codeParcelle, loadParcellesFromStorage]);
  // ---- Style par type et zoom ----

  const styleByType = useCallback((feature: Feature): Style => {
    if (!mapRef.current) return new Style();
    const zoom = mapRef.current.getView().getZoom() || 0;

    const type = feature.get("name")?.toLowerCase();
    let labelText = "";
    switch (type) {
      case "requisition":
        labelText = feature.get("num_requisition") || "";
        break;
      case "certificat":
        labelText = feature.get("numerocertificat") || "";
        break;
      case "ipss":
        labelText = feature.get("code_parcelle") || "";
        break;
      case "demandecf":
        labelText = feature.get("numdemande") || "";
        break;
      case "titre":
        labelText = feature.get("titres_req") || "";
        break;
      case "parcelle":
        labelText = feature.get("code") || "";
        break; // Parcelles custom
      default:
        labelText = feature.get("name") || "";
    }

    if (zoom < 15) labelText = "";

    const cacheKey = `${type}_${labelText}_${zoom}`;
    if (styleCache.current[cacheKey]) return styleCache.current[cacheKey];

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
        stroke: new Stroke({ color: "rgba(148,52,211,1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(148,52,211,0.3)" }),
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

    const baseStyle =
      styleMap[type]?.clone() ||
      new Style({
        stroke: new Stroke({ color: "#7f7f7f", width: 1 }),
        fill: new Fill({ color: "rgba(127,127,127,0.2)" }),
      });

    if (labelText) {
      baseStyle.setText(
        new Text({
          text: labelText,
          font: "12px Arial",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({ color: "#fff", width: 1.5 }),
          overflow: true,
          placement: "point",
        })
      );
    }

    styleCache.current[cacheKey] = baseStyle;
    return baseStyle;
  }, []);

  /****Dessin du polygone ********/
  const addPolygone = useCallback(async () => {
    if (!currentParcelle) {
      setToastMessage("Aucune parcelle sélectionnée !")
      return;
    }

    if (drawPoints.length < 3) {
      console.table(drawPoints);
      setToastMessage("Un polygone a besoin d'au moins 3 points.")
      return;
    }

    const first = drawPoints[0];
    const last = drawPoints[drawPoints.length - 1];
    const isClosed = first[0] === last[0] && first[1] === last[1];

    const closedPoints = isClosed ? drawPoints : [...drawPoints, first];

    const points = closedPoints.map(([x, y]) => {
      const [tx, ty] = transform([x, y], "EPSG:3857", "EPSG:29702") as [
        number,
        number
      ];
      return new PointC(tx, ty);
    });

    const newPolygone = new Polygone(points);

    const updatedParcelle: Parcelle = {
      ...currentParcelle,
      polygone: [newPolygone],
    };

    const updatedParcelles = parcelles.map((p) =>
      p.code === updatedParcelle.code ? updatedParcelle : p
    );

    setCurrentParcelle(updatedParcelle);
    setParcelles(updatedParcelles);
    setDrawPoints([]);
    setFabOpen(false);

    await Preferences.set({
      key: "parcelles_data",
      value: JSON.stringify(updatedParcelles),
    });

    // 🔹 Ajouter seulement ce nouveau polygone au layer existant
    const vectorLayer = vectorLayerRef.current;
    if (vectorLayer) {
      const source = vectorLayer.getSource();

      // Transformer points EPSG:29702 -> EPSG:3857
      const featurePoints = points.map((p) =>
        transform([p.x, p.y], "EPSG:29702", "EPSG:3857")
      );

      const polygon = new Polygon([featurePoints]);
      const feature = new Feature(polygon);

      feature.set("name", "parcelle"); // Indispensable pour styleByType
      feature.set("code", updatedParcelle.code);

      feature.setStyle(styleByType);
      feature.set("code", updatedParcelle.code);
      source.addFeature(feature);
    }
  }, [currentParcelle, drawPoints, parcelles, styleByType]);

  // dessiner le polwgone du addPolygone
  useEffect(() => {
    if (!mapRef.current) return;
    const source = new VectorSource();

    if (drawPoints.length > 2) {
      const polygon = new Polygon([[...drawPoints, drawPoints[0]]]);
      source.addFeature(new Feature(polygon));
    }

    drawPoints.forEach((pt) => {
      source.addFeature(new Feature({ geometry: new Point(pt) }));
    });

    if (vectorLayerRef.current)
      mapRef.current.removeLayer(vectorLayerRef.current);

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

  // ---- Load data depuis storage ----
  useEffect(() => {
    const loadData = async () => {
      setParcelles(await loadParcellesFromStorage());
      setGeojsons(await loadGeoJsonFromStorage()); // 👉 stocke seulement
    };
    loadData();
  }, [loadParcellesFromStorage, loadGeoJsonFromStorage]);

  // ---- Init Map ----
  // --- 1. Lire bounds depuis metadata ---
  const readBounds = useCallback((db: any): number[] => {
    let bounds: number[] = [];
    try {
      const stmt = db.prepare("SELECT value FROM metadata WHERE name = 'bounds'");
      if (stmt.step()) {
        const value = stmt.getAsObject().value as string;
        const parts = value.split(",").map(parseFloat);
        if (parts.length === 4) bounds = parts;
      } else {
        throw new Error("Aucun bounds trouvé");
      }
      stmt.free();
    } catch (err) {
      console.error("⚠️ Erreur lecture bounds:", err);
      throw err;
    }
    return bounds;
  }, []);

  // --- 2. Création source MBTiles avec cache --- 
  const createMbTilesSource = useCallback((db: any) =>
    new XYZ({
      tileSize: 256,
      minZoom: 0,
      maxZoom: 18,
      tileUrlFunction: (tileCoord) => `mbtiles://${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`, // fake URL
      tileLoadFunction: (imageTile, src) => {
        const tileCoord = imageTile.getTileCoord();
        if (!tileCoord) return;
        const z = tileCoord[0];
        const x = tileCoord[1];
        const y_ol = tileCoord[2];
        const y = (1 << z) - 1 - y_ol;
        const image = imageTile.getImage() as HTMLImageElement;
        const stmt = db.prepare(
          "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?"
        );
        stmt.bind([z, x, y]);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          const blob = new Blob([row.tile_data], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          image.src = url;
        } else {
          image.src = "";
        }
        stmt.free();
      },
    }),
    []
  );

  // --- 3. Création des couches vecteurs ---
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
      geoJsonLayersRef.current[name] = layer;
      layers.push(layer);
    });
    return layers;
  }, [styleByType, layerOrder]);

  // --- 4. Hook principal ---
  useEffect(() => {
    if (!mapElement.current || !db || mapRef.current) return;
    setLoadingMap(true); // show loader
    const bounds = readBounds(db);
    const vectorLayers = createVectorLayers();
    const mbTilesSource = createMbTilesSource(db);
    const mbTilesLayer = new TileLayer({ source: mbTilesSource });
    const map = new Map({
      target: mapElement.current,
      layers: [mbTilesLayer, ...vectorLayers],
      view: new View({
        center: fromLonLat([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]),
        zoom: 11,
        maxZoom: 21,
      }),
      controls: [
        new ScaleLine({ units: "metric", bar: true, steps: 1, text: true }),
        new Rotate({
          autoHide: false,
          className: "ol-rotate ol-custom-bottom-left",
        }),
      ],
    });
    mapRef.current = map;
    // --- Gestion moveend ---
    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center)
        setCenterCoordsProjected(transform(center, "EPSG:3857", "EPSG:29702"));
    });

    localLayerRef.current = mbTilesLayer;
    mbTilesSource.refresh();

    console.log("✅ Carte initialisée avec cache MBTiles");
    setLoadingMap(false); // show loader
  }, [db, readBounds, createMbTilesSource, createVectorLayers]);

  // ---- Injecter les GeoJSON dans les layers quand map prête ----
  useEffect(() => {
    if (!mapRef.current || geojsons.length === 0) return;
    const format = new GeoJSON();
    // Nettoyage des anciennes features
    Object.keys(geoJsonLayersRef.current).forEach((n) =>
      geoJsonLayersRef.current[n].getSource().clear()
    );
    // Ajout des nouvelles features
    geojsons.forEach((g) => {
      const fts = format.readFeatures(g, { featureProjection: "EPSG:3857" });
      if (fts.length > 0) {
        const type = fts[0].get("name")?.toLowerCase();
        if (type && geoJsonLayersRef.current[type]) {
          geoJsonLayersRef.current[type].getSource().addFeatures(fts);
        }
      }
    });
    console.log("✅ GeoJSON injecté dans les couches");
  }, [geojsons, mapRef.current]);

  // ---- Draw Parcelles ----
  useEffect(() => {
    if (!parcellesSourceRef.current) return;
    parcellesSourceRef.current.clear();
    const features: Feature[] = [];
    parcelles.forEach((p) =>
      p.polygone?.forEach((pg) => {
        const pts = pg.points.map(
          (pt) =>
            transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857") as [
              number,
              number
            ]
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

  // ---- Toggle local tiles ----
  const toggleLocalTiles = useCallback(() => setShowLocalTiles((prev) => !prev), []);
  // --- seach zoom Coords
  const gpsCard = useCallback(() => setShowGPS((prev) => !prev), []);

  const searchGPS = useCallback(() => {
    const x = parseFloat(longitude);
    const y = parseFloat(latitude);

    if (isNaN(x) || isNaN(y)) {
      setToastMessage("Coordonnées invalides");
      return;
    }

    const coords3857 = transform([x, y], "EPSG:29702", "EPSG:3857");

    const map = mapRef.current;
    if (!map) return;

    // Centrer et zoomer
    const view = map.getView();
    view.animate({
      center: coords3857,
      zoom: 17,
      duration: 1000,
    });

    // Création du point vert
    const marker = new Feature({
      geometry: new Point(coords3857),
    });

    if (!fabOpen) {
      const markerStyle1 = new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "red" }),
          stroke: new Stroke({ color: "white", width: 2 }),
        }),
      });

      const markerStyle2 = new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "rgba(30, 255, 0, 1)" }),
          stroke: new Stroke({ color: "white", width: 2 }),
        }),
      });

      let visible = true;
      marker.setStyle(markerStyle1); // Style initial

      const interval = setInterval(() => {
        visible = !visible;
        marker.setStyle(visible ? markerStyle1 : markerStyle2);
      }, 500); // Changement toutes les 500ms

      // Stop scintillement après 1 minute (60000ms)
      setTimeout(() => { clearInterval(interval); }, intervalDuration);
    }
    // Source et couche temporaire
    const vectorSource = new VectorSource({
      features: [marker],
    });
    const markerLayer = new VectorLayer({
      source: vectorSource,
    });
    map.addLayer(markerLayer);
    // Supprimer après 30 secondes
    setTimeout(() => { map.removeLayer(markerLayer); }, intervalDuration); // 30 s
  }, [fabOpen, latitude, longitude]);

  // recherche function, detail
  const stateSearch = useCallback(() => {
    if (showSearch) {
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  }, [showSearch]);

  const blinkFeature = useCallback((feature: Feature) => {
    if (!mapRef.current) return;

    // Supprimer ancien highlight
    if (highlightLayerRef.current) {
      mapRef.current.removeLayer(highlightLayerRef.current);
    }

    const highlightSource = new VectorSource({
      features: [feature],
    });

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

    // Intervalle clignotant
    const blinkInterval = setInterval(() => {
      visible = !visible;
      vectorLayer.setStyle(highlightStyle(visible));
    }, 500); // 500ms ON/OFF

    // Stop après 5 secondes
    setTimeout(() => {
      clearInterval(blinkInterval);
      if (mapRef.current && highlightLayerRef.current) {
        mapRef.current.removeLayer(highlightLayerRef.current);
        highlightLayerRef.current = null;
      }
    }, 5000);
  }, []);

  const searchAndZoom = useCallback(
    (searchTerm: string) => {
      if (!mapRef.current) return;

      const term = searchTerm.trim().toLowerCase();
      if (!term) return;

      // 🔍 Parcourir toutes les couches GeoJSON
      const geoJsonLayers = Object.values(geoJsonLayersRef.current);
      let foundFeature: Feature | null = null;

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

      // 🔍 Si non trouvé, essayer dans les parcelles
      if (!foundFeature && parcelles.length > 0) {
        parcelles.forEach((p) => {
          if (p.code?.toLowerCase().includes(term) && p.polygone?.length) {
            const points = p.polygone[0].points.map((pt) =>
              transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
            );
            const polygon = new Polygon([points]);
            foundFeature = new Feature(polygon);
          }
        });
      }

      // 📌 Zoomer si trouvé
      if (foundFeature) {
        const extent = foundFeature.getGeometry()?.getExtent();
        if (extent) {
          mapRef.current
            .getView()
            .fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
          blinkFeature(foundFeature);
        }
      } else {
        setToastMessage(`Aucun parcelle trouvé pour : ${searchTerm}`);
      }
    },
    [blinkFeature, parcelles]
  );

  useEffect(() => {
    if (localLayerRef.current) localLayerRef.current.setVisible(showLocalTiles);
  }, [showLocalTiles]);

  // --- Toggle GPS Tracking ---
  const toggleTracking = async () => {
    if (!tracking) {
      try {
        setGpsStatus(1); // acquisition en cours

        if (Capacitor.getPlatform() === 'web') {
          // --- Web ---
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              const lon = pos.coords.longitude;
              const lat = pos.coords.latitude;

              setGpsAccuracy(pos.coords.accuracy);
              setGpsStatus(2); // acquis ✅

              if (mapRef.current) {
                mapRef.current.getView().animate({
                  center: fromLonLat([lon, lat]),
                  zoom: 21,
                  duration: 1000,
                });
              }
            },
            (err) => {
              console.error("Erreur GPS Web:", err);

              if (err.code === 2) {
                // POSITION_UNAVAILABLE → garder en acquisition
                setGpsStatus(1);
              } else {
                // permission refusée ou autre
                setGpsStatus(3);
                setToastMessage("Erreur GPS : " + err.message);
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000, // 10s max
              maximumAge: 0,
            }
          );
        } else {
          // --- Mobile natif Capacitor ---
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
            {
              enableHighAccuracy: true,
              timeout: 10000, // 10s max
              maximumAge: 0,
            },
            (pos, err) => {
              if (err) {
                console.error("Erreur GPS mobile:", err);

                // POSITION_UNAVAILABLE → rester en acquisition
                if (err.code === 2) {
                  setGpsStatus(1);
                } else {
                  setGpsStatus(3);
                  setToastMessage("Erreur GPS : " + JSON.stringify(err));
                }
                return;
              }

              if (pos && mapRef.current) {
                const lon = pos.coords.longitude;
                const lat = pos.coords.latitude;

                setGpsAccuracy(pos.coords.accuracy);
                setGpsStatus(2); // acquis ✅

                mapRef.current.getView().animate({
                  center: fromLonLat([lon, lat]),
                  zoom: 21,
                  duration: 1000,
                });
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
      // --- Stop tracking ---
      if (watchId.current) {
        if (Capacitor.getPlatform() === "web") {
          navigator.geolocation.clearWatch(watchId.current as number);
        } else {
          await Geolocation.clearWatch({ id: watchId.current as string });
        }
        watchId.current = null;
      }

      // reset states
      setGpsAccuracy(null);
      setGpsStatus(0);
      setTracking(false);
    }
  };

  // --- Cleanup auto si le composant est démonté ---
  useEffect(() => {
    return () => {
      if (watchId.current) {
        if (Capacitor.getPlatform() === 'web') {
          navigator.geolocation.clearWatch(watchId.current as number);
        } else {
          Geolocation.clearWatch({ id: watchId.current as string });
        }
      }
    };
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
                {/* Coordonnées */}
                <div>
                  X: {centerCoordsProjected[0].toFixed(6)} Y:{" "}
                  {centerCoordsProjected[1].toFixed(6)}
                </div>

                {/* Affichage en fonction du gpsStatus */}
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
          <IonButton
            fill="clear"
            className="glass-btn"
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
