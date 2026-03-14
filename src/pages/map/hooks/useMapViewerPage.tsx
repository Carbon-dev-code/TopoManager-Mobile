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
import "../MapViewerPage.css";
import { useCallback, useEffect, useRef, useState } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import { fromLonLat, transform } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import VectorImageLayer from "ol/layer/VectorImage";
import ScaleLine from "ol/control/ScaleLine";
import "ol/ol.css";
import {
  addOutline,
  checkmark,
  closeOutline,
  handLeftOutline,
  information,
  layersOutline,
  locateOutline,
  magnetOutline,
  navigateSharp,
  pencilOutline,
  removeOutline,
  search,
  searchSharp,
  stopSharp,
} from "ionicons/icons";
import { Parcelle } from "../../../entities/parcelle";
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
import Rotate from "ol/control/Rotate";
import { useDb } from "../../../shared/lib/db/DbContext";
import {
  getAllParcelles,
  insertParcelle,
} from "../../../shared/lib/db/DbSchema";
import Cube from "../../../shared/ui/Cube";
import CardGlass from "../../../shared/ui/CardGlass";
import { FeatureLike } from "ol/Feature";
import { useParcelleDrawing } from "./useParcelleDrawing";
import { useGpsTracking } from "./Usegpstracking";
import { useGeoJsonLoader } from "./Usegeojsonloader";
import { useMbTiles } from "./Usembtiles";
import { useLayerVisibility } from "./Uselayervisibility";
import { useMapSearch } from "./Usemapsearch";
import { useParcelleLayer } from "./Useparcellelayer";
import { useParcelleAutoZoom } from "./Useparcelleautozoom";

proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs",
);
register(proj4);

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
  parcelle: { stroke: "rgb(255, 147, 5)", fill: "rgba(255, 147, 5, 0.2)" },
};

const LABEL_MAP = {
  requisition: "num_requisition",
  certificat: "numerocertificat",
  ipss: "code_parcelle",
  demandecf: "numdemande",
  titre: "titres_req",
  parcelle: "code",
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const useMapViewerPage = () => {
  const mapRef = useRef<OLMap | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer>>({});
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const styleCache = useRef<Record<string, Style>>({});

  const { db, loadMBTiles } = useDb();
  const [loadingMap, setLoadingMap] = useState(true);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [geojsons, setGeojsons] = useState<any[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<
    number[] | null
  >(null);
  const [showCard, setShowCard] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const { searchAndZoom, blinkFeature, addMarkerWithBlink } = useMapSearch({
    mapRef,
    geoJsonLayersRef,
    parcelles,
    highlightLayerRef,
    onError: setToastMessage,
  });

  const { layerVisibility, layerVisibilityRef, toggleLayer } = useLayerVisibility({
    mapRef,
  });

  const { tracking, gpsAccuracy, gpsStatus, toggleTracking } = useGpsTracking({
    mapRef,
    onError: (message) => setToastMessage(message),
  });

  const { loadGeoJsonFromStorage } = useGeoJsonLoader();
  const { localLayerRef, addMbTilesLayer } = useMbTiles({
    mapRef,
    onLoadStart: () => setLoadingMap(true),
    onLoadEnd: () => setLoadingMap(false),
  });

  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");

  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
    const { data } = await getAllParcelles();
    return data;
  }, []);

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
      const f = feature as Feature;
      const type = f.get("name")?.toLowerCase() || "default";
      const labelText = getLabelText(f, type);

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
            overflow: true,
            placement: "point",
          })
          : undefined,
      });

      styleCache.current[cacheKey] = newStyle;
      return newStyle;
    },
    [getLabelText],
  );

  const {
    drawPoints,
    setDrawPoints,
    surface,
    isEditMode,
    setIsEditMode,
    snapEnabled,
    setSnapEnabled,
    selectedPointIndex,
    setSelectedPointIndex,
    getRealPointsCount,
    savePolygonEdit,
    cancelEdit,
    addPolygone,
    moveSelectedPointToCenter,
    deleteSelectedPoint,
    addPointInEditMode,
    addPointInCreateMode,
    performSnap,
  } = useParcelleDrawing({
    mapRef,
    vectorLayerRef,
    parcellesSourceRef,
    geoJsonLayersRef: geoJsonLayersRef as any,
    fabOpen,
    setFabOpen,
    currentParcelle,
    setCurrentParcelle,
    parcelles,
    setParcelles,
    insertParcelle,
    styleByType,
    setToastMessage,
  });
  
  useParcelleAutoZoom({
    mapRef,
    parcelles,
    from,
    action,
    codeParcelle,
    setCurrentParcelle,
    setShowCard,
    setFabOpen,
    blinkFeature,
    onError: setToastMessage,
  });


  const createVectorLayers = useCallback(() => {
    const parcellesSource = new VectorSource();
    const parcellesLayer = new VectorLayer({
      source: parcellesSource,
      style: styleByType,
      declutter: true,
      renderBuffer: 200,
    });
    parcellesLayer.setZIndex(LAYER_ORDER.length + 1);
    parcellesLayer.set("name", "parcelle");
    parcellesSourceRef.current = parcellesSource;

    const layers: (VectorLayer<any> | VectorImageLayer<any>)[] = [
      parcellesLayer,
    ];

    LAYER_ORDER.forEach((name, i) => {
      const src = new VectorSource();
      const layer = new VectorImageLayer({
        source: src,
        style: styleByType,
        zIndex: i + 1,
        declutter: true,
        imageRatio: 1,
      });
      layer.set("name", name);
      geoJsonLayersRef.current[name] = layer as any;
      layers.push(layer);
    });
    return layers;
  }, [styleByType]);

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
        console.error("Erreur chargement MapViewerPage:", err);
      } finally {
        setLoadingMap(false);
      }
    };
    loadDataOnEnter();
  });

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = new OLMap({
      target: mapElement.current,
      view: new View({
        center: fromLonLat([46.8, -18.8]),
        zoom: 13,
        maxZoom: 21,
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
        setCenterCoordsProjected(
          transform(center, "EPSG:3857", "EPSG:29702"),
        );
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

  useParcelleLayer({ parcelles, parcellesSourceRef });

  function formatSurface(m2: number): string {
    const ha = Math.floor(m2 / 10000);
    const reste = m2 % 10000;
    const a = Math.floor(reste / 100);
    const ca = Math.floor(reste % 100);

    return `${ha} ha ${a} a ${ca.toString().padStart(2, "0")} ca`;
  }

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
        {fabOpen && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              backgroundColor: isEditMode
                ? "rgba(255, 152, 0, 0.95)"
                : "rgba(5, 59, 255, 0.95)",
              color: "white",
              padding: "8px 20px",
              borderRadius: "25px",
              fontSize: "11px",
              fontWeight: "bold",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              letterSpacing: "0.8px",
              pointerEvents: "none",
            }}
          >
            {isEditMode
              ? `MODIFICATION${selectedPointIndex !== null
                ? ` (Point ${selectedPointIndex + 1})`
                : ""
              }`
              : "CRÉATION"}
          </div>
        )}

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
                onClick={isEditMode ? savePolygonEdit : addPolygone}
              >
                <IonIcon color="success" icon={checkmark} />
              </IonButton>

              {isEditMode ? (
                <>
                  <IonButton
                    className="glass-btn"
                    fill="clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      addPointInEditMode();
                    }}
                  >
                    <IonIcon color="primary" icon={addOutline} />
                  </IonButton>

                  <IonButton
                    className="glass-btn"
                    fill={selectedPointIndex !== null ? "solid" : "clear"}
                    color={selectedPointIndex !== null ? "primary" : "medium"}
                    onClick={moveSelectedPointToCenter}
                    disabled={selectedPointIndex === null}
                  >
                    <IonIcon icon={handLeftOutline} />
                  </IonButton>

                  <IonButton
                    className="glass-btn"
                    fill={selectedPointIndex !== null ? "solid" : "clear"}
                    color={selectedPointIndex !== null ? "danger" : "medium"}
                    onClick={deleteSelectedPoint}
                    disabled={
                      selectedPointIndex === null ||
                      getRealPointsCount(drawPoints) <= 2
                    }
                  >
                    <IonIcon icon={removeOutline} />
                  </IonButton>

                  <IonButton
                    className="glass-btn"
                    fill="clear"
                    onClick={() => setSelectedPointIndex(null)}
                    disabled={selectedPointIndex === null}
                  >
                    <IonIcon color="medium" icon={closeOutline} />
                  </IonButton>
                </>
              ) : (
                <>
                  <IonButton
                    className="glass-btn"
                    fill="clear"
                    onClick={addPointInCreateMode}
                  >
                    <IonIcon color="primary" icon={addOutline} />
                  </IonButton>

                  <IonButton
                    className="glass-btn"
                    fill="clear"
                    onClick={() =>
                      setDrawPoints((prev) => prev.slice(0, -1))
                    }
                    disabled={drawPoints.length === 0}
                  >
                    <IonIcon color="danger" icon={removeOutline} />
                  </IonButton>
                </>
              )}

              <IonButton
                className="glass-btn"
                fill={snapEnabled ? "solid" : "clear"}
                color={snapEnabled ? "tertiary" : "medium"}
                onClick={() => {
                  const newSnapState = !snapEnabled;
                  setSnapEnabled(newSnapState);
                  if (newSnapState) {
                    performSnap();
                  }
                }}
              >
                <IonIcon icon={magnetOutline} />
              </IonButton>

              <IonButton
                className="glass-btn"
                fill="clear"
                onClick={cancelEdit}
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
                onClick={() => {
                  if (!fabOpen) {
                    const hasPolygon =
                      currentParcelle.polygone &&
                      currentParcelle.polygone.length > 0;

                    if (hasPolygon) {
                      const points = currentParcelle.polygone[0].points.map(
                        (pt) =>
                          transform(
                            [pt.x, pt.y],
                            "EPSG:29702",
                            "EPSG:3857",
                          ) as [number, number],
                      );
                      setDrawPoints(points);
                      setIsEditMode(true);
                      setSelectedPointIndex(null);
                      setFabOpen(true);
                      setToastMessage(
                        "Mode édition - Modifiez les points existants",
                      );
                    } else {
                      setDrawPoints([]);
                      setIsEditMode(false);
                      setSelectedPointIndex(null);
                      setFabOpen(true);
                      setToastMessage("Mode création - Ajoutez des points");
                    }
                  } else {
                    setDrawPoints([]);
                    setFabOpen(false);
                    setIsEditMode(false);
                    setSelectedPointIndex(null);
                  }
                }}
              >
                <IonIcon
                  color={fabOpen ? "dark" : "danger"}
                  icon={pencilOutline}
                />
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
                  checked={layerVisibility.parcelle}
                  onIonChange={() => toggleLayer(["parcelle"])}
                />
                <Cube color="orange" /> Parcelle
              </IonItem>
              <IonItem className="glass-item border-bottom" lines="none">
                <IonCheckbox
                  slot="start"
                  checked={layerVisibility.ipss}
                  onIonChange={() => toggleLayer(["ipss"])}
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
                Surface {formatSurface(surface)}
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