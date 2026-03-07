// database.ts
import { createRxDatabase, addRxPlugin, RxDatabase, RxCollection } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import {parcelleSchema,ParcelleDocType,demandeurSchema,DemandeurDocType,} from "./Schema";

// ─── Plugins ──────────────────────────────────────────────────────────────────
addRxPlugin(RxDBQueryBuilderPlugin); // requêtes avancées (mango query)
addRxPlugin(RxDBUpdatePlugin); // mise à jour partielle $set / $push
addRxPlugin(RxDBMigrationPlugin); // migration de schéma future

// ─── Types ────────────────────────────────────────────────────────────────────
export type ParcelleCollection = RxCollection<ParcelleDocType>;
export type DemandeurCollection = RxCollection<DemandeurDocType>;

export type AppDatabase = RxDatabase<{
  parcelles: ParcelleCollection;
  demandeurs: DemandeurCollection;
}>;

// ─── Singleton ────────────────────────────────────────────────────────────────
let dbInstance: AppDatabase | null = null;

export async function initDatabase(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance;

  const db = await createRxDatabase<{
    parcelles: ParcelleCollection;
    demandeurs: DemandeurCollection;
  }>({
    name: "parcelles_db",
    storage: getRxStorageDexie(), // IndexedDB via Dexie — parfait pour Capacitor
    ignoreDuplicate: true,
  });

  await db.addCollections({
    parcelles: { schema: parcelleSchema },
    demandeurs: { schema: demandeurSchema },
  });

  dbInstance = db;
  console.log("[RxDB] Base de données initialisée");
  return db;
}

// Appel rapide depuis n'importe quel service
export async function getDB(): Promise<AppDatabase> {
  return dbInstance ?? (await initDatabase());
}
