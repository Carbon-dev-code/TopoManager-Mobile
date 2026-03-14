import { useCallback } from "react";
import OLMap from "ol/Map";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import { transform } from "ol/proj";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";
import { Parcelle } from "../../../entities/parcelle";

const INTERVAL_DURATION = 10000;

interface UseMapSearchOptions {
  mapRef: React.MutableRefObject<OLMap | null>;
  geoJsonLayersRef: React.MutableRefObject<Record<string, VectorLayer<any>>>;
  parcelles: Parcelle[];
  highlightLayerRef: React.MutableRefObject<VectorLayer<VectorSource> | null>;
  onError?: (message: string) => void;
}

interface UseMapSearchReturn {
  searchAndZoom: (searchTerm: string) => void;
  blinkFeature: (feature: Feature, duration?: number) => void;
  addMarkerWithBlink: (coords: number[], duration?: number) => void;
}

const createCircleStyle = (color: string, radius = 6, strokeWidth = 2) =>
  new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#fff", width: strokeWidth }),
    }),
  });

export function useMapSearch({
  mapRef,
  geoJsonLayersRef,
  parcelles,
  highlightLayerRef,
  onError,
}: UseMapSearchOptions): UseMapSearchReturn {
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
    [mapRef]
  );

  const blinkFeature = useCallback(
    (feature: Feature, duration = 5000) => {
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
            color: visible
              ? "rgba(255, 255, 255, 1)"
              : "rgba(81, 255, 0, 0.63)",
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
    },
    [mapRef, highlightLayerRef]
  );

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
          mapRef.current
            .getView()
            .fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
          blinkFeature(foundFeature);
        }
      } else {
        onError?.(`Aucune parcelle trouvée pour : ${searchTerm}`);
      }
    },
    [mapRef, geoJsonLayersRef, parcelles, blinkFeature, onError]
  );

  return { searchAndZoom, blinkFeature, addMarkerWithBlink };
}