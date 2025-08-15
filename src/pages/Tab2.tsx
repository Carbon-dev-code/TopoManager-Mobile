/* eslint-disable @typescript-eslint/no-unused-vars */
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
  useIonViewWillEnter,
  IonInput,
  IonToast,
} from "@ionic/react";
import { useLocation } from "react-router-dom";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import Map from "ol/Map";
import View from "ol/View";
import Text from "ol/style/Text";
import TileLayer from "ol/layer/Tile";
import ScaleLine from "ol/control/ScaleLine";
import { fromLonLat, transform } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { XYZ } from "ol/source";
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
  information,
  search,
} from "ionicons/icons";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
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

proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

const Tab2: React.FC = () => {
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const tileCache = useRef<Record<string, string>>({});
  const localLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const alreadyChecked = useRef(new Set<string>());
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<
    number[] | null
  >(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const [geoJsonLayers, setGeoJsonLayers] = useState<
    VectorLayer<VectorSource>[]
  >([]);
  const [showCard, setShowCard] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");
  const STORAGE_KEY = "parcelles_data";
  const STORAGE_KEY_GEOJSON = "plofData";
  const paramsRef = useRef<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const styleByType = (feature: Feature): Style => {
    const type = feature.get("name"); // ton attribut type

    // Fonction pour récupérer le label selon le type
    const getLabel = () => {
      switch (type) {
        case "requisition":
          return feature.get("num_requisition") || "";
        case "certificat":
          return feature.get("numerocertificat") || "";
        case "ipss":
          return feature.get("code_parcelle") || "";
        case "demandecf":
          return feature.get("numdemande") || "";
        case "titre":
          return feature.get("titres_req") || "";
        default:
          return feature.get("name") || "";
      }
    };

    const labelText = getLabel();

    const styleMap: Record<string, Style> = {
      ipss: new Style({
        stroke: new Stroke({ color: "rgba(5, 59, 255, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(5, 59, 255, 0.3)" }),
      }),
      certificat: new Style({
        stroke: new Stroke({ color: "rgba(251, 255, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(251, 255, 0, 0.3)" }),
      }),
      demandecf: new Style({
        stroke: new Stroke({ color: "rgba(148, 52, 211, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(148, 52, 211, 0.3)" }),
      }),
      requisition: new Style({
        stroke: new Stroke({ color: "rgba(148, 52, 211, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(148, 52, 211, 0.3)" }),
      }),
      titre: new Style({
        stroke: new Stroke({ color: "rgba(255, 0, 0, 1)", width: 1.5 }),
        fill: new Fill({ color: "rgba(255, 0, 0, 0.3)" }),
      }),
    };

    if (styleMap[type]) {
      const baseStyle = styleMap[type].clone();
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
      return baseStyle;
    }

    return new Style({
      stroke: new Stroke({ color: "#7f7f7f", width: 1 }),
      fill: new Fill({ color: "rgba(127, 127, 127, 0.2)" }),
      text: new Text({
        text: labelText,
        font: "12px Arial",
        fill: new Fill({ color: "#333" }),
        stroke: new Stroke({ color: "#fff", width: 1.5 }),
        overflow: true,
        placement: "point",
      }),
    });
  };

  const stateSearch = () => {
    if (showSearch) {
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  };

  const createVectorLayerFromGeoJSON = (
    geojson: unknown
  ): VectorLayer<VectorSource> => {
    const format = new GeoJSON();
    const features = format.readFeatures(geojson, {
      featureProjection: "EPSG:3857",
    });

    const vectorSource = new VectorSource({ features });

    const firstFeature = features[0];
    const type = firstFeature?.get("name")?.toLowerCase() || "";

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: styleByType, // ta fonction de style dynamique
    });

    // Définit le zIndex selon la position dans layerOrder
    const zIndex = layerOrder.indexOf(type);
    vectorLayer.setZIndex(zIndex === -1 ? 0 : zIndex);

    return vectorLayer;
  };

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

  const loadGeoJsonFromStorage = async () => {
    try {
      const plofDataStr = await Preferences.get({ key: STORAGE_KEY_GEOJSON });
      if (!plofDataStr.value) throw new Error("Aucune donnée PLOF trouvée");

      const structure = JSON.parse(plofDataStr.value);

      const allFeatures = [];

      for (const datastore of structure.datastores) {
        for (const layer of datastore.layers) {
          const file = await Filesystem.readFile({
            path: layer.path,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });

          const geojson = JSON.parse(file.data);
          allFeatures.push(geojson);
        }
      }

      return allFeatures; // tableau de GeoJSONs
    } catch (err) {
      console.error("Erreur lecture fichiers PLOF:", err);
      return [];
    }
  };

  const load = async () => {
    setParcelles(await loadParcellesFromStorage());

    const geojsons = await loadGeoJsonFromStorage(); // tableau de GeoJSON purs

    const vectorLayers = geojsons.map(createVectorLayerFromGeoJSON);

    setGeoJsonLayers(vectorLayers);    
  };

  useIonViewWillEnter(() => {
    load();
  });

  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);

      if (from === "tab1" && action === "croquis" && codeParcelle) {
        const found = savedParcelles.find((p) => p.code === codeParcelle);
        setCurrentParcelle(found || null);
      } else {
        setCurrentParcelle(null);
      }
    };
    load();
  }, [from, action, codeParcelle]);

  const drawPolygonesFromParcelles = useCallback(() => {
    if (!mapRef.current) return;

    const source = new VectorSource();

    parcelles.forEach((parcelle) => {
      parcelle.polygone?.forEach((polygone) => {
        const points = polygone.points.map(
          (p) =>
            transform([p.x, p.y], "EPSG:29702", "EPSG:3857") as [number, number]
        );

        if (points.length > 2) {
          const polygon = new Polygon([points]);
          const feature = new Feature(polygon);
          feature.set("code", parcelle.code);
          source.addFeature(feature);
        }
      });
    });

    const vectorLayer = new VectorLayer({
      source,
      style: (feature) => {
        const code = feature.get("code");
        return new Style({
          stroke: new Stroke({ color: "rgba(5, 59, 255, 1)", width: 1.5 }),
          fill: new Fill({ color: "rgba(5, 59, 255, 0.3)" }),
          text: new Text({
            text: code!,
            font: "12px Arial",
            fill: new Fill({ color: "#000" }),
            stroke: new Stroke({ color: "#fff", width: 1.5 }),
            overflow: true,
            placement: "point",
          }),
        })
      },
    });

    mapRef.current.addLayer(vectorLayer);
  }, [parcelles]);

  const updatePolygon = useCallback(() => {
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

  const addPolygone = async () => {
    if (!currentParcelle) {
      console.warn("Aucune parcelle sélectionnée !");
      return;
    }

    if (drawPoints.length < 3) {
      alert("Un polygone a besoin d'au moins 3 points.");
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

      feature.setStyle(
        new Style({
          stroke: new Stroke({ color: "rgba(5, 59, 255, 1)", width: 1.5 }),
          fill: new Fill({ color: "rgba(5, 59, 255, 0.3)" }),
          text: new Text({
            text: updatedParcelle.code!,
            font: "12px Arial",
            fill: new Fill({ color: "#000" }),
            stroke: new Stroke({ color: "#fff", width: 1.5 }),
            overflow: true,
            placement: "point",
          }),
        })
      );
      feature.set("code", updatedParcelle.code);
      source.addFeature(feature);
    }
    //eto tokn solona popup kely
    console.log("✅ Polygone fermé et enregistré");
  };

  // Charger parametreActuel une seule fois au montage
  useEffect(() => {
    (async () => {
      try {
        const { value } = await Preferences.get({ key: "parametreActuel" });
        if (value) paramsRef.current = JSON.parse(value);
      } catch {
        paramsRef.current = null;
      }
    })();
  }, []);

  const getTileUrl = useCallback(
    async (z: number, x: number, y: number): Promise<string> => {
      const cacheKey = `${z}/${x}/${y}`;

      if (tileCache.current[cacheKey] !== undefined) return tileCache.current[cacheKey];

      try {
        const file = await Filesystem.readFile({
          path: `tiles/fond/${z}/${x}/${y}.png`,
          directory: Directory.Data,
        });

        if (!file?.data) {
          tileCache.current[cacheKey] = "";
          return "";
        }

        // Conversion en data URL
        const url = `data:image/png;base64,${file.data}`;
        tileCache.current[cacheKey] = url;

        return url;
      } catch {
        // Marquer comme manquant pour éviter relances inutiles
        tileCache.current[cacheKey] = "";
        return "";
      }
    }, []);

  useEffect(() => {
    if (!mapElement.current) return;

    // Détection device
    const cores = navigator.hardwareConcurrency || 4;
    const isLowEnd = cores <= 4;
    const isMedium = cores <= 8 && cores > 4;

    // Throttle adaptatif pour refresh
    const refreshDelay = isLowEnd ? 200 : isMedium ? 100 : 50;

    const view = new View({
      center: fromLonLat([46.383814, -25.041426]),
      zoom: 15,
      minZoom: 11,
      maxZoom: 17,
    });

    const map = new Map({
      target: mapElement.current,
      view,
      controls: [
        new ScaleLine({
          units: "metric",
          bar: true,
          steps: 1,
          text: true,
          minWidth: 135,
          maxWidth: 200,
        }),
      ],
    });
    mapRef.current = map;

    map.on("moveend", () => {
      const center = map.getView().getCenter();
      if (center) setCenterCoordsProjected(transform(center, "EPSG:3857", "EPSG:29702"));
    });

    // Throttle refresh
    let refreshTimeout: NodeJS.Timeout | null = null;
    const scheduleRefresh = () => {
      if (!refreshTimeout) {
        refreshTimeout = setTimeout(() => {
          localSource.refresh();
          refreshTimeout = null;
        }, refreshDelay);
      }
    };

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
          getTileUrl(z, x, y).then((tileUrl) => {
            if (tileUrl) scheduleRefresh();
          });
        }

        return "assets/logo/logo3.png";
      },
    });

    const localLayer = new TileLayer({ source: localSource });
    map.addLayer(localLayer);
    localLayerRef.current = localLayer;

    // Refresh initial
    localSource.refresh();
    drawPolygonesFromParcelles(); // draw all
    geoJsonLayers.forEach((layer) => { if (!map.getLayers().getArray().includes(layer)) { map.addLayer(layer); } });


    return () => {
      map.setTarget(undefined);
      map.dispose();
      tileCache.current = {};
      alreadyChecked.current.clear();
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [geoJsonLayers, getTileUrl, setCenterCoordsProjected]);

  useEffect(() => {
    updatePolygon();
  }, [drawPoints, updatePolygon]);

  const toggleLocalTiles = useCallback(() => {
    if (!localLayerRef.current) return;

    const visible = !localLayerRef.current.getVisible();
    localLayerRef.current.setVisible(visible);
    setShowLocalTiles(visible);
  }, []);

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
          color: visible ? "rgba(0, 0, 0, 0.63)" : "rgba(255, 0, 0, 0.63)",
          width: 3,
        }),
        fill: new Fill({
          color: visible ? "rgba(255, 0, 0, 1)" : "rgba(0, 0, 0, 1)",
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

      let foundFeature: Feature | null = null;

      // 🔍 Parcourir toutes les couches GeoJSON
      for (const layer of geoJsonLayers) {
        const source = layer.getSource();
        if (!source) continue;

        source.forEachFeature((feature) => {
          const props = feature.getProperties();
          for (const key in props) {
            if (
              typeof props[key] === "string" &&
              props[key].toLowerCase().includes(term)
            ) {
              foundFeature = feature;
              return;
            }
          }
        });

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
    [geoJsonLayers, parcelles]
  );

  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons className="glass-btn" slot="start">
            <IonMenuButton />
          </IonButtons>
          {currentParcelle != null && (
            <IonLabel className="glass-label" slot="start">
              Croquis du parcelle {currentParcelle.code}
            </IonLabel>
          )}
          <IonButtons onClick={stateSearch} className="glass-btn" slot="end">
            <IonIcon icon={search} />
          </IonButtons>
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

        {currentParcelle && showCard && (
          <div className="glass-card-bottom">
            <div className="glass-card-header">
              <h3 style={{ margin: 0 }}>
                Parcelle <strong>{currentParcelle.code}</strong>
              </h3>
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setShowCard(false)}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: "24px" }} />
              </IonButton>
            </div>

            <div className="glass-card-content">
              <p>
                <strong>Date de création :</strong>{" "}
                {currentParcelle.dateCreation || "N/A"}
              </p>
              <p>
                <strong>Consistance :</strong>{" "}
                {currentParcelle.consistance || "Aucune"}
              </p>
              <p>
                <strong>Opposition :</strong>{" "}
                {currentParcelle.oppossition ? "Oui" : "Non"}
              </p>
              <p>
                <strong>Revandication :</strong>{" "}
                {currentParcelle.revandication ? "Oui" : "Non"}
              </p>
              <p>
                <strong>Observation :</strong>{" "}
                {currentParcelle.observation || "Aucune"}
              </p>
            </div>
          </div>
        )}

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

        <div className="map-controls">
          {fabOpen && (
            <div>
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