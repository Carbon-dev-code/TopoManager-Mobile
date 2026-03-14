import { useCallback, useEffect, useRef, useState } from "react";
import OLMap from "ol/Map";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";
import MultiPoint from "ol/geom/MultiPoint";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Text from "ol/style/Text";
import CircleStyle from "ol/style/Circle";
import { transform } from "ol/proj";
import { getArea } from "ol/sphere";

import { Parcelle } from "../../../entities/parcelle";
import { Polygone } from "../../../shared/lib/vecteur/Polygone";
import { PointC } from "../../../shared/lib/vecteur/PointC";

export type ParcelleDrawingDeps = {
  mapRef: React.MutableRefObject<OLMap | null>;
  vectorLayerRef: React.MutableRefObject<VectorLayer<VectorSource> | null>;
  parcellesSourceRef: React.MutableRefObject<VectorSource | null>;
  geoJsonLayersRef: React.MutableRefObject<Record<string, VectorLayer>>;

  fabOpen: boolean;
  setFabOpen: (open: boolean) => void;

  currentParcelle: Parcelle | null;
  setCurrentParcelle: (p: Parcelle | null) => void;
  parcelles: Parcelle[];
  setParcelles: (next: Parcelle[] | ((prev: Parcelle[]) => Parcelle[])) => void;

  insertParcelle: (p: Parcelle) => Promise<any>;
  styleByType: (f: FeatureLike) => Style;
  setToastMessage: (msg: string | null) => void;
};

type Coord = [number, number];

export type UseParcelleDrawingReturn = {
  drawPoints: Coord[];
  setDrawPoints: React.Dispatch<React.SetStateAction<Coord[]>>;
  surface: number;
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (v: boolean) => void;
  selectedPointIndex: number | null;
  setSelectedPointIndex: (v: number | null) => void;

  getRealPointsCount: (points: Coord[]) => number;

  savePolygonEdit: () => Promise<void>;
  cancelEdit: () => void;
  addPolygone: () => Promise<void>;
  moveSelectedPointToCenter: () => void;
  deleteSelectedPoint: () => void;
  undoDeletePoint: () => void;
  canUndoDeletePoint: boolean;
  addPointInEditMode: () => void;
  addPointInCreateMode: () => void;
  performSnap: () => boolean;
};

const CROSSHAIR_RADIUS_PX = 20;
const THROTTLE_DELAY = 150;

export function useParcelleDrawing(deps: ParcelleDrawingDeps): UseParcelleDrawingReturn {
  const {
    mapRef,
    vectorLayerRef,
    parcellesSourceRef,
    geoJsonLayersRef,
    fabOpen,
    setFabOpen,
    currentParcelle,
    setCurrentParcelle,
    parcelles,
    setParcelles,
    insertParcelle,
    styleByType,
    setToastMessage,
  } = deps;

  const [drawPoints, setDrawPoints] = useState<Coord[]>([]);
  const [surface, setSurface] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null,
  );

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

  const getDrawStyle = useCallback(
    (feature: FeatureLike) => {
      const geom = feature.getGeometry();
      const isPolygon = geom instanceof Polygon;
      const isPoint = geom instanceof Point || geom instanceof MultiPoint;

      if (isPolygon) {
        return new Style({
          stroke: new Stroke({ color: "#0000ff", width: 1.5 }),
          fill: new Fill({ color: "rgba(0,0,255,0.1)" }),
        });
      }

      if (isPoint) {
        const index = (feature as Feature).get("index") as number | undefined;
        const isSelected =
          index !== undefined && selectedPointIndex === index - 1;

        const baseCircle = new Style({
          image: new CircleStyle({
            radius: isSelected ? 6 : 4,
            fill: new Fill({ color: isSelected ? "#ff0000" : "#0059ff" }),
            stroke: isSelected
              ? new Stroke({ color: "#ffffff", width: 2 })
              : undefined,
          }),
        });

        const label =
          index !== undefined
            ? new Style({
                text: new Text({
                  text: String(index),
                  font: "bold 12px Arial",
                  fill: new Fill({ color: "#ffffff" }),
                  stroke: new Stroke({ color: "#000000", width: 3 }),
                  offsetY: -14,
                }),
              })
            : null;

        return label ? [baseCircle, label] : baseCircle;
      }

      return undefined;
    },
    [selectedPointIndex],
  );

  const getRealPointsCount = useCallback((points: Coord[]): number => {
    if (points.length === 0) return 0;
    if (points.length === 1) return 1;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]
      ? points.length - 1
      : points.length;
  }, []);

  const ensurePolygonClosure = useCallback((points: Coord[]): Coord[] => {
    if (points.length === 0) return points;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      return [...points, firstPoint];
    }

    return points;
  }, []);

  // Synchronise la couche de dessin avec drawPoints
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
        renderBuffer: 100,
      });
      mapRef.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
    }

    const source = vectorLayerRef.current?.getSource();
    if (!source) return;

    source.clear();

    const realPointsCount = getRealPointsCount(drawPoints);
    const realPoints = drawPoints.slice(0, realPointsCount);

    if (realPoints.length >= 3) {
      const closedCoords = [...realPoints, realPoints[0]];
      const polygonFeature = new Feature(new Polygon([closedCoords]));
      polygonFeature.set("type", "polygon");
      source.addFeature(polygonFeature);
    }

    realPoints.forEach((pt, index) => {
      const pointFeature = new Feature(new Point(pt));
      pointFeature.set("type", "point");
      pointFeature.set("index", index + 1);
      source.addFeature(pointFeature);
    });
  }, [drawPoints, getDrawStyle, getRealPointsCount, mapRef, vectorLayerRef]);

  useEffect(() => {
    if (!vectorLayerRef.current) return;
    vectorLayerRef.current.setStyle(getDrawStyle);
    vectorLayerRef.current.changed();
  }, [selectedPointIndex, getDrawStyle, vectorLayerRef]);

  // Gestion du click en mode édition pour sélectionner un point
  useEffect(() => {
    if (!mapRef.current || !fabOpen || !isEditMode) return;

    const map = mapRef.current;

    const handleClick = (evt: { pixel: [number, number] }) => {
      if (!drawPoints.length) return;

      const clickPixel = evt.pixel;
      let closestIndex: number | null = null;
      let minDist = Infinity;

      const realPointsCount = getRealPointsCount(drawPoints);
      const realPoints = drawPoints.slice(0, realPointsCount);

      realPoints.forEach((coord, idx) => {
        const px = map.getPixelFromCoordinate(coord);
        if (!px) return;
        const dx = px[0] - clickPixel[0];
        const dy = px[1] - clickPixel[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40 && dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      });

      setSelectedPointIndex(closestIndex);

      if (closestIndex !== null && mapRef.current) {
        const selectedPoint = realPoints[closestIndex];
        mapRef.current.getView().animate({
          center: selectedPoint,
          duration: 300,
          easing: (t: number) => t * (2 - t),
        });
      }
    };

    map.on("singleclick", handleClick as any);
    return () => {
      map.un("singleclick", handleClick as any);
    };
  }, [fabOpen, isEditMode, drawPoints, getRealPointsCount, mapRef]);

  const moveSelectedPointToCenter = useCallback(() => {
    if (!mapRef.current) return;
    if (selectedPointIndex === null) {
      setToastMessage("Aucun point sélectionné");
      return;
    }

    const center = mapRef.current.getView().getCenter();
    if (!center) return;

    setDrawPoints((prev) =>
      prev.map((p, idx) =>
        idx === selectedPointIndex ? (center as Coord) : p,
      ),
    );
  }, [selectedPointIndex, mapRef, setToastMessage]);

  const [lastDeletedPoint, setLastDeletedPoint] = useState<{
    index: number;
    point: Coord;
    previousPoints: Coord[];
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const deleteSelectedPoint = useCallback(() => {
    if (selectedPointIndex === null) {
      setToastMessage("Aucun point sélectionné");
      return;
    }

    const realPointsCount = getRealPointsCount(drawPoints);

    if (realPointsCount <= 3) {
      setToastMessage("Un polygone doit avoir au minimum 3 points");
      return;
    }

    if (selectedPointIndex >= realPointsCount) {
      setToastMessage("Impossible de supprimer le point de fermeture");
      setSelectedPointIndex(null);
      return;
    }

    const pointToDelete = drawPoints[selectedPointIndex];
    const previousPoints = [...drawPoints];

    setLastDeletedPoint({
      index: selectedPointIndex,
      point: pointToDelete,
      previousPoints,
    });

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setDrawPoints((prev) => {
      const realPoints = prev.slice(0, realPointsCount);
      const newRealPoints = realPoints.filter((_, idx) => idx !== selectedPointIndex);
      const closedPoints = ensurePolygonClosure(newRealPoints);
      setSelectedPointIndex(null);
      return closedPoints;
    });

    setToastMessage(
      `Point ${selectedPointIndex + 1} supprimé. Appuyez sur Annuler pour restaurer.`,
    );

    undoTimeoutRef.current = setTimeout(() => {
      setLastDeletedPoint(null);
      setToastMessage("Suppression confirmée");
    }, 3000);
  }, [selectedPointIndex, drawPoints, getRealPointsCount, ensurePolygonClosure, setToastMessage]);

  const undoDeletePoint = useCallback(() => {
    if (!lastDeletedPoint) {
      setToastMessage("Aucune suppression à annuler");
      return;
    }

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    setDrawPoints(lastDeletedPoint.previousPoints);
    setSelectedPointIndex(lastDeletedPoint.index);
    setLastDeletedPoint(null);

    if (mapRef.current) {
      mapRef.current.getView().animate({
        center: lastDeletedPoint.point,
        duration: 300,
        easing: (t: number) => t * (2 - t),
      });
    }

    setToastMessage(`Point ${lastDeletedPoint.index + 1} restauré`);
  }, [lastDeletedPoint, mapRef, setToastMessage]);

  const addPointInEditMode = useCallback(() => {
    const center = mapRef.current?.getView().getCenter();
    if (!center) return;

    setDrawPoints((prev) => {
      const realPointsCount = getRealPointsCount(prev);
      const realPoints = prev.slice(0, realPointsCount);

      let insertAt: number;

      if (selectedPointIndex === null) {
        insertAt = realPoints.length;
      } else if (selectedPointIndex >= realPoints.length) {
        insertAt = realPoints.length;
      } else {
        insertAt = selectedPointIndex + 1;
      }

      const newRealPoints = [
        ...realPoints.slice(0, insertAt),
        center as Coord,
        ...realPoints.slice(insertAt),
      ];

      const closedPoints = ensurePolygonClosure(newRealPoints);
      setSelectedPointIndex(null);
      return closedPoints;
    });
  }, [selectedPointIndex, getRealPointsCount, ensurePolygonClosure, mapRef]);

  const addPointInCreateMode = useCallback(() => {
    const center = mapRef.current?.getView().getCenter();
    if (!center) return;
    setDrawPoints((prev) => [...prev, center as Coord]);
    setSelectedPointIndex(null);
  }, [mapRef]);

  function formatSurface(m2: number): string {
    const ha = Math.floor(m2 / 10000);
    const reste = m2 % 10000;
    const a = Math.floor(reste / 100);
    const ca = Math.floor(reste % 100);

    return `${ha} ha ${a} a ${ca.toString().padStart(2, "0")} ca`;
  }

  const COORD_EPS = 1e-6;
  const sameCoordLocal = (a: Coord, b: Coord) =>
    Math.abs(a[0] - b[0]) <= COORD_EPS && Math.abs(a[1] - b[1]) <= COORD_EPS;

  const normalizePolygonPoints = (points: Coord[]): Coord[] => {
    if (points.length === 0) return points;

    const trimmed =
      points.length > 1 && sameCoordLocal(points[0], points[points.length - 1])
        ? points.slice(0, -1)
        : points;

    const out: Coord[] = [];
    for (const p of trimmed) {
      if (!out.length || !sameCoordLocal(out[out.length - 1], p)) out.push(p);
    }
    return out;
  };

  const onSegment = (p: Coord, q: Coord, r: Coord) =>
    q[0] <= Math.max(p[0], r[0]) &&
    q[0] >= Math.min(p[0], r[0]) &&
    q[1] <= Math.max(p[1], r[1]) &&
    q[1] >= Math.min(p[1], r[1]);

  const orientation = (p: Coord, q: Coord, r: Coord) => {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 1e-9) return 0;
    return val > 0 ? 1 : 2;
  };

  const segmentsIntersect = (p1: Coord, q1: Coord, p2: Coord, q2: Coord) => {
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  const isSelfIntersecting = (points: Coord[]): boolean => {
    const pts = normalizePolygonPoints(points);
    const n = pts.length;
    if (n < 4) return false;

    const segments: { a: Coord; b: Coord }[] = [];
    for (let i = 0; i < n - 1; i++) {
      segments.push({ a: pts[i], b: pts[i + 1] });
    }
    segments.push({ a: pts[n - 1], b: pts[0] });

    const segCount = segments.length;
    for (let i = 0; i < segCount; i++) {
      for (let j = i + 1; j < segCount; j++) {
        if (Math.abs(i - j) === 1) continue;
        if ((i === 0 && j === segCount - 1) || (j === 0 && i === segCount - 1))
          continue;

        const s1 = segments[i];
        const s2 = segments[j];

        const sharesEndpoint =
          sameCoordLocal(s1.a, s2.a) ||
          sameCoordLocal(s1.a, s2.b) ||
          sameCoordLocal(s1.b, s2.a) ||
          sameCoordLocal(s1.b, s2.b);
        if (sharesEndpoint) continue;

        if (segmentsIntersect(s1.a, s1.b, s2.a, s2.b)) {
          return true;
        }
      }
    }

    return false;
  };

  const savePolygonEdit = useCallback(async () => {
    if (!currentParcelle) {
      setToastMessage("Aucune parcelle sélectionnée !");
      return;
    }

    if (drawPoints.length < 3) {
      setToastMessage("Un polygone a besoin d'au moins 3 points.");
      return;
    }

    if (isSelfIntersecting(drawPoints)) {
      setToastMessage("Traçage invalide : le polygone se croise lui‑même.");
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
    setIsEditMode(false);

    await insertParcelle(updatedParcelle);

    if (parcellesSourceRef.current) {
      parcellesSourceRef.current.clear();
      const features: Feature[] = [];
      updatedParcelles.forEach((p) =>
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
    }

    setToastMessage("Polygone modifié avec succès !");
  }, [
    currentParcelle,
    drawPoints,
    parcelles,
    insertParcelle,
    parcellesSourceRef,
    setCurrentParcelle,
    setParcelles,
    setFabOpen,
    setToastMessage,
  ]);

  const cancelEdit = useCallback(() => {
    setDrawPoints([]);
    setFabOpen(false);
    setIsEditMode(false);
    setSelectedPointIndex(null);
    setToastMessage("Modification annulée");
  }, [setFabOpen, setToastMessage]);

  const addPolygone = useCallback(async () => {
    if (!currentParcelle) {
      setToastMessage("Aucune parcelle sélectionnée !");
      return;
    }

    if (drawPoints.length < 3) {
      setToastMessage("Un polygone a besoin d'au moins 3 points.");
      return;
    }

    if (isSelfIntersecting(drawPoints)) {
      setToastMessage("Traçage invalide : le polygone se croise lui‑même.");
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
  }, [
    currentParcelle,
    drawPoints,
    parcelles,
    insertParcelle,
    setCurrentParcelle,
    setParcelles,
    setFabOpen,
    setToastMessage,
    styleByType,
    vectorLayerRef,
  ]);

  const performSnap = useCallback(() => {
    if (!mapRef.current) return false;

    const map = mapRef.current;
    const view = map.getView();
    const center = view.getCenter();

    if (!center) return false;

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

    if (snapPoint) {
      view.animate({ center: snapPoint, duration: 100 });
      return true;
    }

    return false;
  }, [geoJsonLayersRef, mapRef, parcellesSourceRef]);

  useEffect(() => {
    if (!mapRef.current || !fabOpen || !snapEnabled) return;
    const map = mapRef.current;

    let lastCall = 0;
    const throttledSnap = () => {
      const now = Date.now();
      if (now - lastCall > THROTTLE_DELAY) {
        lastCall = now;
        performSnap();
      }
    };

    map.on("moveend", throttledSnap);
    return () => map.un("moveend", throttledSnap);
  }, [fabOpen, snapEnabled, performSnap, mapRef]);

  return {
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
    undoDeletePoint,
    canUndoDeletePoint: Boolean(lastDeletedPoint),
    addPointInEditMode,
    addPointInCreateMode,
    performSnap,
  };
}

