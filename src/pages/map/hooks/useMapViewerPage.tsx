import { useIonViewDidEnter } from "@ionic/react";
import { useCallback, useEffect, useRef } from "react";

import OLMap from "ol/Map";
import View from "ol/View";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, transform } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import VectorImageLayer from "ol/layer/VectorImage";
import ScaleLine from "ol/control/ScaleLine";
import "ol/ol.css";
import Rotate from "ol/control/Rotate";
import VectorSource from "ol/source/Vector";
import Feature, { FeatureLike } from "ol/Feature";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Text from "ol/style/Text";

import { useParcelleDrawing } from "./useParcelleDrawing";
import { useGpsTracking } from "./Usegpstracking";
import { useMbTiles } from "./Usembtiles";
import { useLayerVisibility } from "./Uselayervisibility";
import { useMapSearch } from "./Usemapsearch";
import { useParcelleLayer } from "./Useparcellelayer";
import { useParcelleAutoZoom } from "./Useparcelleautozoom";
import { MapViewerLayout } from "../components/MapViewerLayout";
import { useLocation } from "react-router";
import VectorLayer from "ol/layer/Vector";
import { useMapState } from "./useMapState";
import { useMapUI } from "./useMapUI";
import { LABEL_MAP, LAYER_ORDER, STYLE_CONFIG } from "../constants/layerConfig";
import { SearchInterface } from "../components/SearchInterface";
import { GPSInterface } from "../components/GPSInterface";
import { MapControls } from "../components/MapControls";
import { formatSurface } from "../utils/formatters";
import { insertParcelle } from "../../../shared/lib/db/DbSchema";

import "../MapViewerPage.css";

proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs",
);
register(proj4);


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const useMapViewerPage = () => {
  const mapRef = useRef<OLMap | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const parcellesSourceRef = useRef<VectorSource | null>(null);
  const geoJsonLayersRef = useRef<Record<string, VectorLayer | VectorImageLayer<any>>>({});
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const styleCache = useRef<Record<string, Style>>({});
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const mapState = useMapState();
  const mapUI = useMapUI();

  const { loadingMap, setLoadingMap, showLocalTiles, setShowLocalTiles, parcelles, setParcelles,  geojsons, currentParcelle,  setCurrentParcelle, centerCoordsProjected,  setCenterCoordsProjected, toastMessage, setToastMessage, db, loadMBTiles, loadData, } = mapState;

  const {
    showCard,
    setShowCard,
    fabOpen,
    setFabOpen,
    showSearch,
    setShowSearch,
    showGPS,
    setShowGPS,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
  } = mapUI;

  const { searchAndZoom, blinkFeature, addMarkerWithBlink } = useMapSearch({
    mapRef,
    geoJsonLayersRef,
    parcelles,
    highlightLayerRef,
    onError: setToastMessage,
  });

  const { layerVisibility, toggleLayer } = useLayerVisibility({
    mapRef,
  });

  const { tracking, gpsAccuracy, gpsStatus, toggleTracking } = useGpsTracking({
    mapRef,
    onError: (message) => setToastMessage(message),
  });

  const { localLayerRef, addMbTilesLayer } = useMbTiles({
    mapRef,
    onLoadStart: () => setLoadingMap(true),
    onLoadEnd: () => setLoadingMap(false),
  });

  const query = useQuery();
  const from = query.get("from");
  const action = query.get("action");
  const codeParcelle = query.get("code");

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
    geoJsonLayersRef: geoJsonLayersRef,
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

    const layers: (VectorLayer | VectorImageLayer)[] = [
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
      geoJsonLayersRef.current[name] = layer;
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
  }, [fabOpen, latitude, longitude, addMarkerWithBlink, setToastMessage]);

  useIonViewDidEnter(() => {
    const init = async () => {
      try {
        await loadData();
        const database = db || (await loadMBTiles());
        if (!localLayerRef.current) await addMbTilesLayer(database);
      } catch (err) {
        console.error("Erreur chargement MapViewerPage:", err);
      }
    };
    init();
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
  }, [createVectorLayers, setCenterCoordsProjected]);

  useEffect(() => {
    if (!mapRef.current || geojsons.length === 0) return;
    const format = new GeoJSON();
    Object.keys(geoJsonLayersRef.current).forEach((n) =>
      geoJsonLayersRef.current[n].getSource()?.clear(),
    );
    geojsons.forEach((g: any) => {
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

  const handleEditToggle = () => {
    if (!fabOpen) {
      const hasPolygon =
        currentParcelle?.polygone &&
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
  };

  return (
    <MapViewerLayout
      mapElement={mapElement}
      loadingMap={loadingMap}
      currentParcelle={currentParcelle}
      showCard={showCard}
      setShowCard={setShowCard}
      showSearch={showSearch}
      setShowSearch={setShowSearch}
      toastMessage={toastMessage}
      setToastMessage={setToastMessage}
    >
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

      {showSearch && (
        <SearchInterface onSearch={searchAndZoom} />
      )}

      {showGPS && (
        <GPSInterface
          latitude={latitude}
          longitude={longitude}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          onSearch={searchGPS}
          onClose={() => setShowGPS(false)}
        />
      )}

      <MapControls
        fabOpen={fabOpen}
        isEditMode={isEditMode}
        selectedPointIndex={selectedPointIndex}
        snapEnabled={snapEnabled}
        tracking={tracking}
        currentParcelle={currentParcelle}
        showLocalTiles={showLocalTiles}
        layerVisibility={layerVisibility}
        drawPoints={drawPoints}
        surface={surface}
        getRealPointsCount={getRealPointsCount}
        setShowLocalTiles={setShowLocalTiles}
        setShowGPS={setShowGPS}
        toggleLayer={toggleLayer}
        savePolygonEdit={savePolygonEdit}
        addPolygone={addPolygone}
        addPointInEditMode={addPointInEditMode}
        addPointInCreateMode={addPointInCreateMode}
        moveSelectedPointToCenter={moveSelectedPointToCenter}
        deleteSelectedPoint={deleteSelectedPoint}
        setSelectedPointIndex={setSelectedPointIndex}
        performSnap={performSnap}
        setSnapEnabled={setSnapEnabled}
        cancelEdit={cancelEdit}
        toggleTracking={toggleTracking}
        onEditToggle={handleEditToggle}
        onShowCard={() => setShowCard(true)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "absolute", bottom: "20px", right: "20px" }}>
        {fabOpen && drawPoints.length >= 3 && (
          <div className="surface-parcelle">
            Surface {formatSurface(surface)}
          </div>
        )}
      </div>
    </MapViewerLayout>
  );
};