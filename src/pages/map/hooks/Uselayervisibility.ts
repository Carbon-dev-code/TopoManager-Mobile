import { useCallback, useRef, useState } from "react";
import OLMap from "ol/Map";

const DEFAULT_VISIBILITY = { fond: true, ipss: true, parcelle: true,  titre: true,  requisition: true,  demandecf: true, certificat: true,};

export type LayerVisibilityState = typeof DEFAULT_VISIBILITY;

interface UseLayerVisibilityOptions {
  mapRef: React.MutableRefObject<OLMap | null>;
}

interface UseLayerVisibilityReturn {
  layerVisibility: LayerVisibilityState;
  layerVisibilityRef: React.MutableRefObject<LayerVisibilityState>;
  toggleLayer: (
    keys:
      | keyof LayerVisibilityState
      | (keyof LayerVisibilityState)[]
  ) => void;
}

export function useLayerVisibility({ mapRef}: UseLayerVisibilityOptions): UseLayerVisibilityReturn {
  const layerVisibilityRef = useRef<LayerVisibilityState>(DEFAULT_VISIBILITY);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>(DEFAULT_VISIBILITY);

  const toggleLayer = useCallback(( keys: | keyof LayerVisibilityState | (keyof LayerVisibilityState)[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      setLayerVisibility((prev) => {
        const newVisibility = !prev[keysArray[0]];
        const updated = { ...prev };
        keysArray.forEach((k) => {
          updated[k] = newVisibility;
          const layer = mapRef.current?.getLayers().getArray().find((l) => l.get("name") === k);
          if (layer) layer.setVisible(newVisibility);
        });
        layerVisibilityRef.current = updated;
        return updated;
      });
    },
    [mapRef]
  );

  return { layerVisibility, layerVisibilityRef, toggleLayer };
}