import { useEffect } from "react";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { transform } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Parcelle } from "../../../entities/parcelle";

interface UseParcelleLayerOptions {
  parcelles: Parcelle[];
  parcellesSourceRef: React.MutableRefObject<VectorSource | null>;
}

export function useParcelleLayer({
  parcelles,
  parcellesSourceRef,
}: UseParcelleLayerOptions) {
  useEffect(() => {
    if (!parcellesSourceRef.current) return;
    parcellesSourceRef.current.clear();

    const features: Feature[] = [];

    parcelles.forEach((p) =>
      p.polygone?.forEach((pg) => {
        const pts = pg.points.map((pt) =>
          transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
        );
        const rings: [number, number][][] =
          pts.length > 2 ? [[...pts, pts[0]] as [number, number][]] : [];

        const holes = (pg as any).holes as
          | { x: number; y: number }[][]
          | undefined;
        if (holes?.length) {
          holes.forEach((h: { x: number; y: number }[]) => {
            const h3857 = h.map((pt: { x: number; y: number }) =>
              transform([pt.x, pt.y], "EPSG:29702", "EPSG:3857")
            );
            if (h3857.length > 2)
              rings.push([...h3857, h3857[0]] as [number, number][]);
          });
        }

        if (rings.length > 0) {
          const f = new Feature(new Polygon(rings));
          f.set("code", p.code);
          f.set("name", "parcelle");
          features.push(f);
        }
      })
    );

    parcellesSourceRef.current.addFeatures(features);
  }, [parcelles, parcellesSourceRef]);
}