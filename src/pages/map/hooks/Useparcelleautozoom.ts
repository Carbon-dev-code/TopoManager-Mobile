import { useEffect, useRef } from "react";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { transform } from "ol/proj";
import OLMap from "ol/Map";
import { Parcelle } from "../../../entities/parcelle";

interface UseParcelleAutoZoomOptions {
  mapRef: React.MutableRefObject<OLMap | null>;
  parcelles: Parcelle[];
  from: string | null;
  action: string | null;
  codeParcelle: string | null;
  setCurrentParcelle: (p: Parcelle | null) => void;
  setShowCard: (v: boolean) => void;
  setFabOpen: (v: boolean) => void;
  blinkFeature: (feature: Feature, duration?: number) => void;
  onError?: (message: string) => void;
}

export function useParcelleAutoZoom({
  mapRef,
  parcelles,
  from,
  action,
  codeParcelle,
  setCurrentParcelle,
  setShowCard,
  setFabOpen,
  blinkFeature,
  onError,
}: UseParcelleAutoZoomOptions) {
  const lastAutoZoomCodeRef = useRef<string | null>(null);

  // Sélection de la parcelle courante selon les query params
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
  }, [from, action, codeParcelle, parcelles, setCurrentParcelle, setFabOpen]);

  // Auto-zoom + blink sur la parcelle trouvée
  useEffect(() => {
    if (
      from === "tab1" &&
      action === "croquis" &&
      codeParcelle &&
      parcelles.length > 0 &&
      mapRef.current
    ) {
      const found = parcelles.find((p) => p.code === codeParcelle);

      if (found) {
        setCurrentParcelle(found);
        setShowCard(true);

        const shouldAutoZoom = lastAutoZoomCodeRef.current !== codeParcelle;
        if (shouldAutoZoom && found.polygone && found.polygone.length > 0) {
          const firstPolygon = found.polygone[0];
          const points = firstPolygon.points.map((pt) =>
            transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
          );

          if (points.length > 2) {
            const polygon = new Polygon([points]);
            const extent = polygon.getExtent();

            mapRef.current.getView().fit(extent, {
              duration: 1000,
              padding: [100, 100, 100, 100],
              maxZoom: 19,
            });
            lastAutoZoomCodeRef.current = codeParcelle;

            const feature = new Feature(polygon);
            feature.set("name", "parcelle");
            feature.set("code", found.code);

            setTimeout(() => {
              blinkFeature(feature, 5000);
            }, 1000);
          }
        }
      } else {
        setCurrentParcelle(null);
        onError?.(`Parcelle ${codeParcelle} introuvable`);
      }
    } else if (!codeParcelle) {
      setCurrentParcelle(null);
      setFabOpen(false);
      lastAutoZoomCodeRef.current = null;
    }
  }, [
    from,
    action,
    codeParcelle,
    parcelles,
    mapRef,
    blinkFeature,
    setCurrentParcelle,
    setShowCard,
    setFabOpen,
    onError,
  ]);
}