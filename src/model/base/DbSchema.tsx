// db.ts
import PouchDB from "pouchdb-browser";
import { Parcelle } from "../parcelle/Parcelle";
import { Demandeur } from "../parcelle/Demandeur";

// ✅ Création / ouverture unique des bases
const parcelleDB = new PouchDB("parcelles");
const demandeurDB = new PouchDB("demandeurs");

// ➕ Insert parcelle
export async function insertParcelle(parcelle: Parcelle) {
  const doc = {
    _id: parcelle.code || new Date().toISOString(),
    ...parcelle,
  };
  return await parcelleDB.put(doc);
}

// 🔍 Récupérer toutes les parcelles
export async function getAllParcelles() {
  const result = await parcelleDB.allDocs({ include_docs: true });
  return result.rows.map((r) => r.doc);
}

// ➕ Insert demandeur
export async function insertDemandeur(demandeur: Demandeur) {
  const doc = {
    _id: demandeur.id || new Date().toISOString(),
    ...demandeur,
  };
  return await demandeurDB.put(doc);
}

// 🔍 Récupérer tous les demandeurs
export async function getAllDemandeurs() {
  const result = await demandeurDB.allDocs({ include_docs: true });
  return result.rows.map((r) => r.doc);
}

// ⚡ Update d’un demandeur + synchro dans toutes les parcelles
export async function updateDemandeur(updatedDemandeur: Demandeur) {
  // 1. Update dans la base demandeurs
  const existing = await demandeurDB.get(updatedDemandeur.id);
  await demandeurDB.put({
    ...existing,
    ...updatedDemandeur,
    _id: updatedDemandeur.id,
    _rev: existing._rev,
  });

  // 2. Chercher toutes les parcelles qui contiennent ce demandeur
  const parcelles = await parcelleDB.allDocs({ include_docs: true });

  for (const row of parcelles.rows) {
    const parcelle = row.doc as Parcelle;
    if (!parcelle || !parcelle.demandeurs) continue;

    let modified = false;

    const newDemandeurs = parcelle.demandeurs.map((d: Demandeur) => {
      if (d.id === updatedDemandeur.id) {
        modified = true;
        return { ...d, ...updatedDemandeur };
      }
      return d;
    });

    if (modified) {
      await parcelleDB.put({
        ...parcelle,
        demandeurs: newDemandeurs,
        _id: parcelle._id,
        _rev: parcelle._rev,
      });
    }
  }
}

// ✅ Export des bases si besoin
export { parcelleDB, demandeurDB };
