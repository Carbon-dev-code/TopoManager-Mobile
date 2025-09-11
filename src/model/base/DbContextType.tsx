import { createContext, useContext, ReactNode, useRef, useState } from "react";
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
  const [, setTick] = useState(0); // pour forcer rerender si besoin

  const resetMBTiles = () => {
    dbRef.current = null;
    setTick((t) => t + 1); // optionnel : force rerender pour rafraîchir db dans le contexte
  };

  const loadMBTiles = async (): Promise<Database> => {
    if (dbRef.current) return dbRef.current;

    const SQL = await initSqlJs({ locateFile: (f: any) => `/sql-wasm/${f}` });
    let loadedDb: Database;

    if (Capacitor.isNativePlatform()) {
      const filePath =
        File.externalRootDirectory + "Documents/TopoManager/mbtiles/amb.mbtiles";
      const fileEntry = (await File.resolveLocalFilesystemUrl(filePath)) as any;
      loadedDb = await new Promise((resolve, reject) => {
        fileEntry.file((file: any) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            const dbInstance = new SQL.Database(new Uint8Array(buffer));
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
      loadedDb = new SQL.Database(new Uint8Array(buffer));
      dbRef.current = loadedDb;
    }

    return loadedDb;
  };

  return (
    <DbContext.Provider value={{ db: dbRef.current, loadMBTiles, resetMBTiles }}>
      {children}
    </DbContext.Provider>
  );
};
