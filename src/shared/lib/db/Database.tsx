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

    await database.addCollections({
      parcelle: {
        schema: {
          title: "parcelle schema",
          version: 0,
          type: "object",
          primaryKey: "code",
          properties: {
            code: { type: "string", maxLength: 50 },
            id_personne: { type: ["string", "null"] },
            dateCreation: { type: "string", maxLength: 50, default: "" },
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
            polygone: { type: "array", items: { type: "object" } },
            demandeurs: { type: "array", items: { type: "object", additionalProperties: true } },
            parametreTerritoire: { type: ["object", "null"] },
            riverin: { type: "array", items: { type: "object", additionalProperties: true } },
            synchronise: { type: ["number", "null"] },
            syncError: { type: ["string", "null"] },
            lastSync: { type: ["string", "null"] },
            syncing: { type: "boolean" },
            photos: { type: "array", items: { type: "string" } },
          },
          required: ["code", "id_personne", "dateCreation", "demandeurs", "riverin"],
          indexes: ["dateCreation"],
          additionalProperties: false,
        },
      },
    });

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
            personnePhysiqueId: { type: "string" },
            personneMoraleId: { type: "string" },
            representantType: { type: "string" },
          },
          required: ["id", "type"],
          additionalProperties: false,
        },
      },
    });

    await database.addCollections({
      personnephysique: {
        schema: {
          title: "Personne physique schema",
          version: 0,
          type: "object",
          primaryKey: "id",
          properties: {
            id: { type: "string", maxLength: 100 },
            nom: { type: "string", default: "", maxLength: 200 },
            prenom: { type: "string", default: "", maxLength: 200 },
            neVers: { type: "boolean" },
            dateNeVers: { type: ["string", "null"] },
            dateNaissance: { type: ["string", "null"] },
            lieuNaissance: { type: ["string", "null"] },
            sexe: { type: "number" },
            adresse: { type: "string" },
            nomPere: { type: "string" },
            nomMere: { type: "string" },
            situation: { type: "string" },
            nomConjoint: { type: "string" },
            piece: { type: "number" },
            cin: { type: ["object", "null"] },
            acte: { type: ["object", "null"] },
            photos: { type: "array", items: { type: "string" } },
            indexPhoto: { type: ["number", "null"] },
          },
          required: ["id", "adresse", "nomPere", "nomMere", "nom", "prenom"],
          indexes: ["nom", "prenom"],
          additionalProperties: false,
        },
      },
    });

    await database.addCollections({
      personnemorale: {
        schema: {
          title: "personne moral schema",
          version: 0,
          type: "object",
          primaryKey: "id",
          properties: {
            id: { type: "string", maxLength: 100 },
            denomination: { type: "string", maxLength: 200, default: ""},
            typeMorale: { type: "number" },
            dateCreation: { type: "string" },
            siege: { type: "string" },
            observations: { type: "string" },
            representant: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  personnePhysiqueId: { type: "string" },
                  role: { type: "string" },
                },
                required: ["personnePhysiqueId", "role"],
                additionalProperties: false,
              },
            },
          },
          required: ["id", "denomination", "dateCreation", "siege"],
          indexes: ["denomination"],
          additionalProperties: false,
        },
      },
    });

    console.log("✅ RxDB : Collections enregistrées");
    return database;
  })();

  return dbPromise;
}
