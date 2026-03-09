// Database.tsx
import { addRxPlugin, createRxDatabase, RxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { disableWarnings } from "rxdb/plugins/dev-mode";

disableWarnings();
addRxPlugin(RxDBDevModePlugin);

let dbPromise: Promise<RxDatabase> | null = null;

export async function initDatabase(): Promise<RxDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const database = await createRxDatabase({
      name: "topomanager",
      storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
      multiInstance: false,
      ignoreDuplicate: true,
    });

    // ✅ Collection parcelle
    await database.addCollections({
      parcelle: {
        schema: {
          title: "parcelle schema",
          version: 0,
          type: "object",
          primaryKey: "code",
          properties: {
            code: { type: "string", maxLength: 50 }, // ✅ obligatoire et string
            id_personne: { type: ["string", "null"] },
            dateCreation: { type: ["string", "null"] },
            origine: { type: ["string", "null"] },
            status: { type: ["number", "null"] },
            anneeOccup: { type: ["number", "null"] },
            categorie: { type: ["string", "null"] },
            consistance: { type: ["string", "null"] },
            oppossition: { type: "boolean" },
            observationOpposition: { type: ["string", "null"] },
            revandication: { type: "boolean" },
            observationRevendication: { type: ["string", "null"] },
            observation: { type: "string" },
            polygone: {
              type: "array",
              items: { type: "object" }, // Polygone object, tu peux préciser les props si nécessaire
            },
            demandeurs: {
              type: "array",
              items: { type: "object", additionalProperties: true}, // Demandeur object, même logique
              
            },
            parametreTerritoire: { type: ["object", "null"] },
            riverin: {
              type: "array",
              items: { type: "object", additionalProperties: true }, // Riverin object 
            },
            synchronise: { type: ["number", "null"] },
            syncError: { type: ["string", "null"] },
            lastSync: { type: ["string", "null"] },
            syncing: { type: "boolean" },
            photos: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "code",
            "id_personne",
            "dateCreation",
            "demandeurs",
            "riverin",
          ],
          additionalProperties: false,
        },
      },
    });

    // ✅ Collection demandeur
    await database.addCollections({
      demandeur: {
        schema: {
          title: "demandeur schema",
          version: 0,
          type: "object",
          primaryKey: "id",
          properties: {
            id: { type: "string", maxLength: 100 },
            type: { type: "number" },
            nom: { type: ["string", "null"] },
            prenom: { type: ["string", "null"] },
            neVers: { type: "boolean" },
            dateNaissance: { type: ["string", "null"] },
            lieuNaissance: { type: ["string", "null"] },
            sexe: { type: "string" },
            adresse: { type: "string" },
            nomPere: { type: "string" },
            nomMere: { type: "string" },
            situation: { type: "string" },
            nomConjoint: { type: "string" },
            piece: { type: "number" },
            cin: { type: ["object", "null"] },
            acte: { type: ["object", "null"] },
            denomination: { type: "string" },
            typeMorale: { type: "number" },
            dateCreation: { type: "string" },
            siege: { type: "string" },
            observations: { type: "string" },
            photos: { type: "array", items: { type: "string" } },
            indexPhoto: { type: ["number", "null"] },
          },
          required: ["id", "type", "adresse", "nomPere", "nomMere"],
          additionalProperties: false,
        },
      },
    });

    console.log("✅ RxDB : Collections enregistrées");
    return database;
  })();

  return dbPromise;
}
