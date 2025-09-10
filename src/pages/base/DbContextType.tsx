import { createContext, useContext, useState, ReactNode } from 'react';
import initSqlJs, { Database } from 'sql.js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Http } from '@capacitor-community/http';

interface DbContextProps {
  db: Database | null;
  setDb: (db: Database) => void;
  loadMBTiles: () => Promise<void>;
}

const DbContext = createContext<DbContextProps | undefined>(undefined);

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error('useDb must be used within a DbProvider');
  return context;
};

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database | null>(null);

  const loadMBTiles = async () => {
    try {
      console.log('⏳ Chargement de sql.js...');

      const SQL = await initSqlJs({ locateFile: (f) => `/sql-wasm/${f}` });

      // Récupérer l'URI du fichier
      const fileUri = await Filesystem.getUri({
        directory: Directory.Documents,
        path: 'mbtiles/amb.mbtiles',
      });

      const localFile = fileUri.uri; // ex: file:///storage/emulated/0/Documents/mbtiles/amb.mbtiles

      // Lecture binaire via Capacitor HTTP (plutôt que fetch)
      const result = await Http.request({
        method: 'GET',
        url: localFile,
        responseType: 'arraybuffer'
      });
      const db = new SQL.Database(new Uint8Array(result.data));
      
      setDb(db);
      console.log('✅ MBTiles chargé depuis Documents !');
    } catch (err) {
      console.error('❌ Erreur MBTiles:', err);
    }
  };



  return (
    <DbContext.Provider value={{ db, setDb, loadMBTiles }}>
      {children}
    </DbContext.Provider>
  );
};
