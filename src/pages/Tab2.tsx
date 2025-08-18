import {
  IonContent, IonHeader, IonPage, IonToolbar, IonIcon,
  IonButtons, IonMenuButton, IonButton
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
import { eyeOffOutline, eyeOutline, search } from "ionicons/icons";
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

// ---- CRS Madagascar ----
proj4.defs("EPSG:29702", "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs");
register(proj4);

// ---- Constantes ----
const STORAGE_KEY = "parcelles_data";
const STORAGE_KEY_GEOJSON = "plofData";
const layerOrder = ["region", "district", "commune", "fokontany", "ipss", "demandecf", "requisition", "titre", "certificat", "cadastre", "demandefn"];

const Tab2: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const localLayerRef = useRef<TileLayer | null>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const parcellesLayerRef = useRef<VectorLayer | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer>>({});
  const tileCache = useRef<Record<string, string | null | undefined>>({});
  const styleCache = useRef<Record<string, Style>>({});

  // ---- Style par type et zoom ----
  const styleByType = useCallback((feature: Feature): Style => {
    if (!mapRef.current) return new Style();
    const zoom = mapRef.current.getView().getZoom() || 0;

    const type = feature.get("name")?.toLowerCase();
    let labelText = "";
    switch (type) {
      case "requisition": labelText = feature.get("num_requisition") || ""; break;
      case "certificat": labelText = feature.get("numerocertificat") || ""; break;
      case "ipss": labelText = feature.get("code_parcelle") || ""; break;
      case "demandecf": labelText = feature.get("numdemande") || ""; break;
      case "titre": labelText = feature.get("titres_req") || ""; break;
      case "parcelle": labelText = feature.get("code") || ""; break; // Parcelles custom
      default: labelText = feature.get("name") || "";
    }

    if (zoom < 15) labelText = "";

    const cacheKey = `${type}_${labelText}_${zoom}`;
    if (styleCache.current[cacheKey]) return styleCache.current[cacheKey];

    const styleMap: Record<string, Style> = {
      ipss: new Style({ stroke: new Stroke({ color: "rgba(5, 59, 255,1)", width: 1.5 }), fill: new Fill({ color: "rgba(5,59,255,0.3)" }) }),
      certificat: new Style({ stroke: new Stroke({ color: "rgba(251,255,0,1)", width: 1.5 }), fill: new Fill({ color: "rgba(251,255,0,0.3)" }) }),
      demandecf: new Style({ stroke: new Stroke({ color: "rgba(148,52,211,1)", width: 1.5 }), fill: new Fill({ color: "rgba(148,52,211,0.3)" }) }),
      requisition: new Style({ stroke: new Stroke({ color: "rgba(148,52,211,1)", width: 1.5 }), fill: new Fill({ color: "rgba(148,52,211,0.3)" }) }),
      titre: new Style({ stroke: new Stroke({ color: "rgba(255,0,0,1)", width: 1.5 }), fill: new Fill({ color: "rgba(255,0,0,0.3)" }) }),
      region: new Style({ stroke: new Stroke({ color: "rgba(0, 100, 0, 1)", width: 2 }), fill: new Fill({ color: "rgba(0, 100, 0, 0.1)" }) }),
      district: new Style({ stroke: new Stroke({ color: "rgba(0, 150, 0, 1)", width: 1.5 }), fill: new Fill({ color: "rgba(0, 150, 0, 0.1)" }) }),
      commune: new Style({ stroke: new Stroke({ color: "rgba(0, 200, 0, 1)", width: 1 }), fill: new Fill({ color: "rgba(0, 200, 0, 0.1)" }) }),
      fokontany: new Style({ stroke: new Stroke({ color: "rgba(0, 250, 0, 1)", width: 0.5 }), fill: new Fill({ color: "rgba(0, 250, 0, 0.1)" }) }),
      cadastre: new Style({ stroke: new Stroke({ color: "rgba(200, 100, 0, 1)", width: 1 }), fill: new Fill({ color: "rgba(200, 100, 0, 0.2)" }) }),
      demandefn: new Style({ stroke: new Stroke({ color: "rgba(100, 0, 200, 1)", width: 1.5 }), fill: new Fill({ color: "rgba(100, 0, 200,0.3)" }) }),
      parcelle: new Style({ stroke: new Stroke({ color: "rgba(5,59,255,1)", width: 1 }), fill: new Fill({ color: "rgba(5,59,255,0.2)" }) }),
    };

    const baseStyle = styleMap[type]?.clone() || new Style({
      stroke: new Stroke({ color: "#7f7f7f", width: 1 }),
      fill: new Fill({ color: "rgba(127,127,127,0.2)" }),
    });

    if (labelText) {
      baseStyle.setText(new Text({
        text: labelText,
        font: "12px Arial",
        fill: new Fill({ color: "#000" }),
        stroke: new Stroke({ color: "#fff", width: 1.5 }),
        overflow: true,
        placement: "point",
      }));
    }

    styleCache.current[cacheKey] = baseStyle;
    return baseStyle;
  }, []);

  // ---- Load Parcelles & GeoJSON ----
  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
    const result = await Preferences.get({ key: STORAGE_KEY });
    if (!result.value) return [];
    try { const parsed = JSON.parse(result.value); if (Array.isArray(parsed)) return parsed; } catch (e) { console.error(e); }
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
          const file = await Filesystem.readFile({ path: l.path, directory: Directory.Data, encoding: Encoding.UTF8 });
          all.push(JSON.parse(file.data));
        }
      }
      return all;
    } catch (e) { console.error(e); return []; }
  }, []);

  // ---- Tile loader ----
  const refreshLocalTiles = useCallback(() => { if (localLayerRef.current) localLayerRef.current.getSource()?.refresh(); }, []);
  const getTileUrl = useCallback(async (z: number, x: number, y: number): Promise<string | null> => {
    const key = `${z}/${x}/${y}`;
    const cached = tileCache.current[key];
    if (cached && cached !== null) return cached;
    if (cached === null) return null;
    tileCache.current[key] = null;
    try {
      const file = await Filesystem.readFile({ path: `tiles/fond/${key}.png`, directory: Directory.Data });
      const url = `data:image/png;base64,${file.data}`;
      tileCache.current[key] = url;
      refreshLocalTiles();
      return url;
    } catch { tileCache.current[key] = ""; return ""; }
  }, [refreshLocalTiles]);

  // ---- Init Map ----
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const tileSource = new XYZ({
      tileUrlFunction: ([z, x, y]) => {
        const key = `${z}/${x}/${y}`;
        const c = tileCache.current[key]; 
        if (c) return c; 
        if (c === undefined) getTileUrl(z, x, y); 
        return "";
      }
    });

    const tileLayer = new TileLayer({ source: tileSource });

    const parcellesSource = new VectorSource();
    const parcellesLayer = new VectorLayer({ source: parcellesSource, style: styleByType, updateWhileAnimating: false, updateWhileInteracting: false });
    parcellesLayer.setZIndex(layerOrder.length + 1);
    parcellesSourceRef.current = parcellesSource;
    parcellesLayerRef.current = parcellesLayer;

    const allLayers = [tileLayer, parcellesLayer];

    layerOrder.forEach((name, i) => {
      const src = new VectorSource();
      const layer = new VectorLayer({ source: src, style: styleByType, zIndex: i + 1, updateWhileAnimating: false, updateWhileInteracting: false, visible: true });
      geoJsonLayersRef.current[name] = layer;
      allLayers.push(layer);
    });

    mapRef.current = new Map({
      target: mapElement.current,
      layers: allLayers,
      view: new View({ center: fromLonLat([46.383814, -25.041426]), zoom: 15, minZoom: 11, maxZoom: 17 }),
      controls: [new ScaleLine({ units: "metric", bar: true, steps: 1, text: true, minWidth: 135, maxWidth: 200 })]
    });

    localLayerRef.current = tileLayer;
    tileSource.refresh();
  }, [getTileUrl, styleByType]);

  // ---- Load data ----
  useEffect(() => {
    const loadData = async () => {
      setParcelles(await loadParcellesFromStorage());
      const geojsons = await loadGeoJsonFromStorage();
      const format = new GeoJSON();
      Object.keys(geoJsonLayersRef.current).forEach(n => geoJsonLayersRef.current[n].getSource().clear());
      geojsons.forEach(g => {
        const fts = format.readFeatures(g, { featureProjection: "EPSG:3857" });
        if (fts.length > 0) {
          const type = fts[0].get("name")?.toLowerCase();
          if (type && geoJsonLayersRef.current[type]) geoJsonLayersRef.current[type].getSource().addFeatures(fts);
        }
      });
    };
    loadData();
  }, [loadParcellesFromStorage, loadGeoJsonFromStorage]);

  // ---- Draw Parcelles ----
  useEffect(() => {
    if (!parcellesSourceRef.current) return;
    parcellesSourceRef.current.clear();
    const features: Feature[] = [];
    parcelles.forEach(p => p.polygone?.forEach(pg => {
      const pts = pg.points.map(pt => transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857") as [number, number]);
      if (pts.length > 2) {
        const f = new Feature(new Polygon([pts]));
        f.set("code", p.code);
        f.set("name", "parcelle");
        features.push(f);
      }
    }));
    parcellesSourceRef.current.addFeatures(features);
  }, [parcelles]);

  // ---- Toggle local tiles ----
  const toggleLocalTiles = useCallback(() => setShowLocalTiles(prev => !prev), []);
  useEffect(() => { if (localLayerRef.current) localLayerRef.current.setVisible(showLocalTiles); }, [showLocalTiles]);

  return <IonPage>
    <IonHeader className="custom-header">
      <IonToolbar className="custom-toolBar">
        <IonButtons slot="start" className="glass-btn"><IonMenuButton /></IonButtons>
        <IonButtons slot="end" className="glass-btn"><IonIcon icon={search} /></IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
      <div ref={mapElement} className="map-container"></div>
      <div className="map-controls">
        <IonButton fill="clear" className="glass-btn" onClick={toggleLocalTiles}>
          <IonIcon color="dark" icon={showLocalTiles ? eyeOffOutline : eyeOutline} />
        </IonButton>
      </div>
    </IonContent>
  </IonPage>;
};

export default Tab2;