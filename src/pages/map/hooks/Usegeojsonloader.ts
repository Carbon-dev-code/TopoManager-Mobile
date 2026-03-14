import { useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";

const STORAGE_KEY_GEOJSON = "plofData";

export function useGeoJsonLoader() {
  const loadGeoJsonFromStorage = useCallback(async (): Promise<any[]> => {
    try {
      const plofDataStr = await Preferences.get({ key: STORAGE_KEY_GEOJSON });
      if (!plofDataStr.value) return [];
      const structure = JSON.parse(plofDataStr.value);
      const all: any[] = [];
      for (const ds of structure.datastores) {
        for (const l of ds.layers) {
          const file = await Filesystem.readFile({
            path: l.path,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          all.push(JSON.parse(file.data as string));
        }
      }
      return all;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  return { loadGeoJsonFromStorage };
}