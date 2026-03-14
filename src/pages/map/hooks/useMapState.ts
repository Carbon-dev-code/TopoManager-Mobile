import { useState, useCallback } from "react";
import { Parcelle } from "../../../entities/parcelle";
import { useDb } from "../../../shared/lib/db/DbContext";
import { getAllParcelles } from "../../../shared/lib/db/DbSchema";
import { useGeoJsonLoader } from "./Usegeojsonloader";

export const useMapState = () => {
  const { db, loadMBTiles } = useDb();
  const [loadingMap, setLoadingMap] = useState(true);
  const [showLocalTiles, setShowLocalTiles] = useState(true);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [geojsons, setGeojsons] = useState<any[]>([]);
  const [currentParcelle, setCurrentParcelle] = useState<Parcelle | null>(null);
  const [centerCoordsProjected, setCenterCoordsProjected] = useState<
    number[] | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { loadGeoJsonFromStorage } = useGeoJsonLoader();

  const loadParcellesFromStorage = useCallback(async (): Promise<Parcelle[]> => {
    const { data } = await getAllParcelles();
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoadingMap(true);
    try {
      setGeojsons(await loadGeoJsonFromStorage());
      const data = await loadParcellesFromStorage();
      setParcelles(data);
    } finally {
      setLoadingMap(false);
    }
  }, [loadGeoJsonFromStorage, loadParcellesFromStorage]);

  return {
    // State
    loadingMap,
    setLoadingMap,
    showLocalTiles,
    setShowLocalTiles,
    parcelles,
    setParcelles,
    geojsons,
    setGeojsons,
    currentParcelle,
    setCurrentParcelle,
    centerCoordsProjected,
    setCenterCoordsProjected,
    toastMessage,
    setToastMessage,

    // Database
    db,
    loadMBTiles,

    // Functions
    loadData,
  };
};