// db.ts
import localforage from "localforage";
import { Parcelle } from "../parcelle/Parcelle";
import { Demandeur } from "../parcelle/Demandeur";

// ✅ Créer / configurer les bases
const parcelleStore = localforage.createInstance({
  name: "parcelles",
});

const demandeurStore = localforage.createInstance({
  name: "demandeurs",
});

// ➕ Insert / Update Parcelle
export async function insertParcelle(parcelle: Parcelle) {
  const allParcelles: Parcelle[] = (await parcelleStore.getItem("allParcelles")) || [];
  const index = allParcelles.findIndex((p) => p.code === parcelle.code);

  if (index !== -1) {
    allParcelles[index] = parcelle; // update
  } else {
    allParcelles.push(parcelle); // insert
  }

  await parcelleStore.setItem("allParcelles", allParcelles);
  return parcelle;
}

// 🔍 Récupérer toutes les parcelles
export async function getAllParcelles(): Promise<Parcelle[]> {
  return (await parcelleStore.getItem("allParcelles")) || [];
}

// ➕ Insert / Update Demandeur
export async function insertDemandeur(demandeur: Demandeur) {
  const allDemandeurs: Demandeur[] = (await demandeurStore.getItem("allDemandeurs")) || [];
  const index = allDemandeurs.findIndex((d) => d.id === demandeur.id);

  if (index !== -1) {
    allDemandeurs[index] = demandeur; // update
  } else {
    allDemandeurs.push(demandeur); // insert
  }

  await demandeurStore.setItem("allDemandeurs", allDemandeurs);

  // 🔄 Mettre à jour les parcelles contenant ce demandeur
  const parcelles: Parcelle[] = (await parcelleStore.getItem("allParcelles")) || [];
  let changed = false;

  parcelles.forEach((parcelle) => {
    const dIndex = parcelle.demandeurs.findIndex((d) => d.id === demandeur.id);
    if (dIndex !== -1) {
      parcelle.demandeurs[dIndex] = demandeur;
      changed = true;
    }
  });

  if (changed) {
    await parcelleStore.setItem("allParcelles", parcelles);
  }

  return demandeur;
}

// 🔍 Récupérer tous les demandeurs
export async function getAllDemandeurs(): Promise<Demandeur[]> {
  return (await demandeurStore.getItem("allDemandeurs")) || [];
}

// ✅ Export stores si besoin
export { parcelleStore, demandeurStore };