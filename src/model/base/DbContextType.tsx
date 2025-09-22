import { createContext, useContext, ReactNode, useRef, useEffect, useState } from "react";
import initSqlJs, { Database } from "sql.js";
import { File } from "@awesome-cordova-plugins/file";
import { Capacitor } from "@capacitor/core";

interface DbContextProps {
  db: Database | null;
  loadMBTiles: () => Promise<Database>;
  resetMBTiles: () => void;
}

const DbContext = createContext<DbContextProps | undefined>(undefined);

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error("useDb must be used within a DbProvider");
  return context;
};

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dbRef = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);

  const resetMBTiles = () => {
    dbRef.current = null;
    setReady(false);
  };

  const loadMBTiles = async (): Promise<Database> => {
    if (dbRef.current) return dbRef.current;

    const SQL = await initSqlJs({ locateFile: (f: unknown) => `/sql-wasm/${f}` });
    let loadedDb: Database;

    if (Capacitor.isNativePlatform()) {
      const filePath = File.externalRootDirectory + "Documents/TopoManager/mbtiles/amb.mbtiles";
      const fileEntry = (await File.resolveLocalFilesystemUrl(filePath)) as any;
      loadedDb = await new Promise((resolve, reject) => {
        fileEntry.file((file: any) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            const dbInstance = new SQL.Database(new Uint8Array(buffer), { useWorker: true });
            dbRef.current = dbInstance;
            resolve(dbInstance);
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      });
    } else {
      const response = await fetch("/mbtiles/amb.mbtiles");
      const buffer = await response.arrayBuffer();
      loadedDb = new SQL.Database(new Uint8Array(buffer), { useWorker: true });
      dbRef.current = loadedDb;
    }

    setReady(true);
    return loadedDb;
  };

  // Préchargement immédiat au startup de l'app
  useEffect(() => {
    (async () => {
      try {
        await loadMBTiles();
        console.log("MBTiles préchargé ✔️");
      } catch (err) {
        console.error("Erreur chargement MBTiles au startup:", err);
      }
    })();
  }, []);

  return (
    <DbContext.Provider value={{ db: dbRef.current, loadMBTiles, resetMBTiles }}>
      {children}
    </DbContext.Provider>
  );
};