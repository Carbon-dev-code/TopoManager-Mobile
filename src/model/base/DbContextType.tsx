import { createContext, useContext, useState, ReactNode } from "react";
import initSqlJs, { Database } from "sql.js";
import { File } from "@awesome-cordova-plugins/file";
import { Capacitor } from "@capacitor/core";

interface DbContextProps {
  db: Database | null;
  setDb: (db: Database) => void;
  loadMBTiles: () => Promise<void>;
}

const DbContext = createContext<DbContextProps | undefined>(undefined);

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error("useDb must be used within a DbProvider");
  return context;
};

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database | null>(null);

  const loadMBTiles = async () => {
    try {
      console.log("⏳ Chargement de sql.js...");
      const SQL = await initSqlJs({ locateFile: (f) => `/sql-wasm/${f}` });

      if (Capacitor.isNativePlatform()) {
        const filePath = File.externalRootDirectory + "Documents/mbtiles/amb.mbtiles";
        console.log("📍 Fichier:", filePath);
        const fileEntry = (await File.resolveLocalFilesystemUrl(filePath)) as any;
        fileEntry.file((file: any) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            const db = new SQL.Database(new Uint8Array(buffer));
            setDb(db);
            console.log("✅ MBTiles chargé depuis Documents !");
          };
          reader.readAsArrayBuffer(file);
        });
      } else {
        // 🌍 Mode web → lecture depuis public/mbtiles
        const response = await fetch("/mbtiles/amb.mbtiles");
        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        setDb(db);
        console.log("✅ MBTiles chargé depuis public/mbtiles !");
      }
    } catch (err) {
      console.error("❌ Erreur MBTiles:", err);
    }
  };

  return (
    <DbContext.Provider value={{ db, setDb, loadMBTiles }}>
      {children}
    </DbContext.Provider>
  );
};
