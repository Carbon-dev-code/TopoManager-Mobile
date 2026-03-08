import {createContext,useContext,ReactNode,useRef,useEffect,useState,} from "react";
import initSqlJs, { Database } from "sql.js";
import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite,SQLiteConnection,SQLiteDBConnection } from "@capacitor-community/sqlite";
import { initDatabase } from "./Database"; // ✅ import RxDB

interface DbContextProps {
  db: Database | SQLiteDBConnection | null;
  loadMBTiles: () => Promise<Database | SQLiteDBConnection>;
  resetMBTiles: () => Promise<void>;
  rxdbReady: boolean; // ✅ état RxDB exposé si besoin
}

const DbContext = createContext<DbContextProps | undefined>(undefined);

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error("useDb must be used within a DbProvider");
  return context;
};

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  let sqlite: SQLiteConnection | null = null;
  const dbRef = useRef<Database | SQLiteDBConnection | null>(null);
  const dbPromiseRef = useRef<Promise<Database | SQLiteDBConnection> | null>(
    null,
  );
  const [, setReady] = useState(false);
  const [rxdbReady, setRxdbReady] = useState(false); // ✅ état RxDB

  useEffect(() => {
    initDatabase() .then(() => { setRxdbReady(true);
        console.log("✅ RxDB initialisé");
      }).catch((err) => {
        console.error("❌ Erreur init RxDB:", err);
      });
  }, []);

  const resetMBTiles = async () => {
    if (dbRef.current) {
      try {
        if (Capacitor.isNativePlatform()) {
          const db = dbRef.current as SQLiteDBConnection;
          await db.close();
          console.log("✅ Connexion SQLite native fermée");
        } else {
          const db = dbRef.current as Database;
          db.close();
          console.log("✅ Base sql.js fermée");
        }
      } catch (err) {
        console.error("❌ Erreur lors de la fermeture de la DB:", err);
      }
    }

    dbRef.current = null;
    dbPromiseRef.current = null;
    setReady(false);
  };

  const loadMBTiles = async (): Promise<Database | SQLiteDBConnection> => {
    if (dbRef.current) return dbRef.current;
    if (dbPromiseRef.current) return dbPromiseRef.current;

    dbPromiseRef.current = (async () => {
      let loadedDb: Database | SQLiteDBConnection;

      if (Capacitor.isNativePlatform()) {
        try {
          console.log("📦 Initialisation SQLite native...");

          if ( Capacitor.getPlatform() === "android" || Capacitor.getPlatform() === "ios" ) {
            if (!window.cordova) {
              console.warn("⚠️ Cordova deviceready pas encore dispo");
            }
          }

          if (!sqlite) {
            sqlite = new SQLiteConnection(CapacitorSQLite);
          }

          let db: SQLiteDBConnection;
          const consistency = await sqlite.checkConnectionsConsistency();
          const isConn = (await sqlite.isConnection("amb", false)).result;

          if (consistency.result && isConn) {
            db = await sqlite.retrieveConnection("amb", false);
            console.log("♻️ Connexion récupérée");
          } else {
            db = await sqlite.createConnection("amb",false,"no-encryption",1,false);
            console.log("🆕 Connexion créée");
          }

          await db.open();
          dbRef.current = db;
          loadedDb = db;
          console.log("✅ SQLite native initialisé");
        } catch (err) {
          console.error("❌ Erreur SQLite native:", err);
          throw err;
        }
      } else {
        try {
          const SQL = await initSqlJs({ locateFile: (f) => `/sql-wasm/${f}` });
          const response = await fetch("/mbtiles/amb.mbtiles");
          const buffer = await response.arrayBuffer();
          loadedDb = new SQL.Database(new Uint8Array(buffer));
          dbRef.current = loadedDb;
          console.log("✅ sql.js initialisé");
        } catch (err) {
          console.error("❌ Erreur sql.js:", err);
          throw err;
        }
      }
      setReady(true);
      return loadedDb;
    })();

    return dbPromiseRef.current;
  };

  // Préchargement MBTiles au startup
  useEffect(() => {
    const init = async () => {
      if (Capacitor.getPlatform() === "android" || Capacitor.getPlatform() === "ios") {
        document.addEventListener("deviceready", async () => {
          try {
            await loadMBTiles();
            console.log("MBTiles préchargé ✔️");
          } catch (err) {
            console.error("Erreur chargement MBTiles:", err);
          }
        });
      } else {
        await loadMBTiles();
      }
    };
    init();
  }, []);

  return (
    <DbContext.Provider
      value={{ db: dbRef.current, loadMBTiles, resetMBTiles, rxdbReady }}
    >
      {children}
    </DbContext.Provider>
  );
};