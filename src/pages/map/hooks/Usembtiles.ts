import { useCallback, useRef } from "react";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import { transformExtent } from "ol/proj";
import { Capacitor } from "@capacitor/core";
import OLMap from "ol/Map";

const MAX_CACHE_SIZE = 250;

interface UseMbTilesOptions {
  mapRef: React.MutableRefObject<OLMap | null>;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

interface UseMbTilesReturn {
  localLayerRef: React.MutableRefObject<TileLayer | null>;
  addMbTilesLayer: (database: any) => Promise<void>;
}

export function useMbTiles({
  mapRef,
  onLoadStart,
  onLoadEnd,
}: UseMbTilesOptions): UseMbTilesReturn {
  const localLayerRef = useRef<TileLayer | null>(null);
  const tileCache = useRef(new Map<string, string>());

  const readBounds = useCallback(async (db: any): Promise<number[]> => {
    let bounds: number[] = [];
    try {
      if (typeof db.query === "function") {
        const res = await db.query(
          "SELECT value FROM metadata WHERE name = ?",
          ["bounds"]
        );
        if (!res.values?.length) throw new Error("Aucun bounds trouvé");
        const value = String(res.values[0].value);
        const parts = value.split(",").map((v) => Number(v.trim()));
        if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v)))
          throw new Error("Bounds invalide: " + value);
        bounds = transformExtent(
          parts as [number, number, number, number],
          "EPSG:4326",
          "EPSG:3857"
        );
      } else if (typeof db.prepare === "function") {
        const stmt = db.prepare(
          "SELECT value FROM metadata WHERE name = 'bounds'"
        );
        if (stmt.step()) {
          const value = stmt.getAsObject().value as string;
          const parts = value.split(",").map((v) => Number(v.trim()));
          if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v)))
            throw new Error("Bounds invalide: " + value);
          bounds = transformExtent(
            parts as [number, number, number, number],
            "EPSG:4326",
            "EPSG:3857"
          );
        } else {
          throw new Error("Aucun bounds trouvé");
        }
        stmt.free();
      } else {
        throw new Error("Driver SQLite non supporté");
      }
    } catch (err) {
      console.error("⚠️ Erreur lecture bounds:", err);
      throw err;
    }
    return bounds;
  }, []);

  const readMaxZoom = useCallback(async (db: any): Promise<number> => {
    let maxZoom = 21;
    try {
      if (typeof db.query === "function") {
        const res = await db.query(
          "SELECT value FROM metadata WHERE name = ?",
          ["maxzoom"]
        );
        if (res.values?.length)
          maxZoom = parseInt(String(res.values[0].value), 10);
      } else if (typeof db.prepare === "function") {
        const stmt = db.prepare(
          "SELECT value FROM metadata WHERE name = 'maxzoom'"
        );
        if (stmt.step())
          maxZoom = parseInt(String(stmt.getAsObject().value), 10);
        stmt.free();
      }
    } catch (err) {
      console.warn("⚠️ Impossible de lire maxzoom, valeur par défaut (21):", err);
    }
    if (!Number.isFinite(maxZoom) || maxZoom < 1 || maxZoom > 25) maxZoom = 21;
    return maxZoom;
  }, []);

  const createMbTilesSource = useCallback((db: any) => {
    return new XYZ({
      url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      cacheSize: 512,
      tileLoadFunction: async (tile, src) => {
        const imageTile = tile as any;
        const tileCoord = imageTile.getTileCoord();
        const [z, x, y_ol] = tileCoord;
        const y = (1 << z) - 1 - y_ol;
        const image = imageTile.getImage() as HTMLImageElement;
        const cacheKey = `${z}-${x}-${y}`;

        if (tileCache.current.has(cacheKey)) {
          image.src = tileCache.current.get(cacheKey)!;
          return;
        }

        try {
          if (Capacitor.isNativePlatform() && db) {
            const res = await db.query(
              "SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?",
              [z, x, y]
            );
            if (res?.values?.length > 0) {
              const bytes = res.values[0].tile_data;
              const blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
              const url = URL.createObjectURL(blob);
              if (tileCache.current.size >= MAX_CACHE_SIZE) {
                const firstKey = tileCache.current.keys().next().value;
                if (firstKey !== undefined) tileCache.current.delete(firstKey);
              }
              tileCache.current.set(cacheKey, url);
              image.src = url;
            } else {
              image.src = src;
            }
          } else if (db) {
            const stmt = db.prepare(
              "SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?"
            );
            stmt.bind([z, x, y]);
            if (stmt.step()) {
              const tileData = stmt.getAsObject().tile_data;
              const blob = new Blob([tileData], { type: "image/png" });
              const url = URL.createObjectURL(blob);
              tileCache.current.set(cacheKey, url);
              image.src = url;
            } else {
              image.src = src;
            }
            stmt.free();
          } else {
            image.src = src;
          }
        } catch (err) {
          console.log(err);
          image.src = src;
        }
      },
    });
  }, []);

  const addMbTilesLayer = useCallback(
    async (database: any) => {
      if (!mapRef.current || !database) return;
      onLoadStart?.();
      try {
        const bounds4326 = await readBounds(database);
        const maxZoom = await readMaxZoom(database);
        const mbTilesSource = createMbTilesSource(database);
        const mbTilesLayer = new TileLayer({ source: mbTilesSource });
        mbTilesLayer.set("name", "fond");
        localLayerRef.current = mbTilesLayer;
        mapRef.current.addLayer(mbTilesLayer);
        mbTilesSource.refresh();
        mapRef.current.getView().setMaxZoom(maxZoom);
        mapRef.current.getView().fit(bounds4326, {
          padding: [50, 50, 50, 50],
          maxZoom,
          duration: 1000,
        });
      } catch (err) {
        console.error("Erreur ajout MBTiles:", err);
      } finally {
        onLoadEnd?.();
      }
    },
    [mapRef, readBounds, readMaxZoom, createMbTilesSource, onLoadStart, onLoadEnd]
  );

  return { localLayerRef, addMbTilesLayer };
}