// DbSchema.tsx
import localforage from "localforage";
import { checkParcelle, Parcelle } from "../parcelle/Parcelle";
import { checkDemandeur, Demandeur } from "../parcelle/Demandeur";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";

// ✅ Créer / configurer les bases
const parcelleStore = localforage.createInstance({
  name: "parcelles",
});

const demandeurStore = localforage.createInstance({
  name: "demandeurs",
});

//Verification des données
export async function verifIDDevice(): Promise<void> {
  try {
    const idTablettePref = await Preferences.get({ key: "device_id" });
    if (!idTablettePref.value) throw new Error("Veuillez configurer l'identifiant de la tablette. Contacter l'administrateur pour plus d'informations.");
  } catch (error) {
    throw error;
  }
}
export async function verifyDatabase(): Promise<void> {
  try {
    //Verification de l'id du tablette si configurer
    await verifIDDevice();

    //Verification des paremetre territoriaux
    const parametrePref = await Preferences.get({ key: "parametreActuel" });
    if (!parametrePref.value) throw new Error("Veuillez configurer les paramètres territoriaux avant de créer une parcelle");

    const parametreActuel = JSON.parse(parametrePref.value);
    if (!parametreActuel.region || !parametreActuel.district || !parametreActuel.commune || !parametreActuel.fokontany) {
      throw new Error("Paramètres territoriaux incomplets");
    }
  } catch (error) {
    throw error;
  }
}

// Vide le databases
export async function clearDatabase(): Promise<void> {
  try {
    await parcelleStore.clear();
    await demandeurStore.clear();
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la base de données:", error);
    throw error;
  }
}

// suppression de parcelle
export async function deleteParcelle(code: string): Promise<boolean> {
  try {
    const parcelles = await getAllParcelles();

    // Cherche la parcelle à supprimer
    const parcelleToDelete = parcelles.find(p => p.code === code);
    if (!parcelleToDelete) return false; // Pas trouvée

    // Si déjà synchronisée, on refuse la suppression
    if (parcelleToDelete.synchronise === 1) {
      console.warn("Suppression refusée : parcelle déjà synchronisée.");
      return false;
    }

    // Filtre et sauvegarde
    const filtered = parcelles.filter(p => p.code !== code);
    await parcelleStore.setItem("allParcelles", filtered);

    return true;
  } catch (error) {
    console.error("Erreur suppression parcelle:", error);
    throw error;
  }
}
// ➕ Insert / Update Parcelle

export async function insertParcelle(parcelle: Parcelle): Promise<Parcelle> {
  try {
    checkParcelle(parcelle);

    const allParcelles = await getAllParcelles();
    const index = allParcelles.findIndex((p) => p.code === parcelle.code);

    if (index !== -1) {
      allParcelles[index] = parcelle;
    } else {
      allParcelles.push(parcelle);
    }

    await parcelleStore.setItem("allParcelles", allParcelles);
    return parcelle;
  } catch (error) {
    console.error("Erreur insertion parcelle:", error);
    throw error;
  }
}

export async function getAllParcelles(): Promise<Parcelle[]> {
  try {
    const { value: sessionId } = await Preferences.get({ key: "id_session" });
    const allParcelles: Parcelle[] = (await parcelleStore.getItem<Parcelle[]>("allParcelles")) || [];

    if (sessionId === "0") return allParcelles;
    else return allParcelles.filter(p => p.id_personne === sessionId);

  } catch (error) {
    console.error("Erreur récupération parcelles utilisateur:", error);
    return [];
  }
}

// ➕ Insert / Update Demandeur
export async function insertDemandeur(demandeur: Demandeur): Promise<Demandeur> {
  try {
    checkDemandeur(demandeur);

    const allDemandeurs = await getAllDemandeurs();
    const index = allDemandeurs.findIndex((d) => d.id === demandeur.id);

    if (index !== -1) {
      allDemandeurs[index] = demandeur;
    } else {
      allDemandeurs.push(demandeur);
    }

    await demandeurStore.setItem("allDemandeurs", allDemandeurs);

    // Synchroniser avec les parcelles
    await syncDemandeurInParcelles(demandeur);

    return demandeur;
  } catch (error) {
    console.error("Erreur insertion demandeur:", error);
    throw error;
  }
}

export async function getAllDemandeurs(): Promise<Demandeur[]> {
  try {
    return (await demandeurStore.getItem<Demandeur[]>("allDemandeurs")) || [];
  } catch (error) {
    console.error("Erreur récupération demandeurs:", error);
    return [];
  }
}

async function syncDemandeurInParcelles(demandeur: Demandeur): Promise<void> {
  try {
    const parcelles = await getAllParcelles();
    let hasChanges = false;

    parcelles.forEach((parcelle) => {
      const dIndex = parcelle.demandeurs.findIndex((d) => d.id === demandeur.id);
      if (dIndex !== -1) {
        parcelle.demandeurs[dIndex] = demandeur;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await parcelleStore.setItem("allParcelles", parcelles);
    }
  } catch (error) {
    console.error("Erreur synchronisation demandeur:", error);
  }
}

export async function statisiqueParcelles(): Promise<DashboardStats> {
  try {
    const parcelles = await getAllParcelles();
    const totalParcelleUser = parcelles.length;

    const totalDemandeurs = (await getAllDemandeurs()).length;

    const synchronise = parcelles.filter(p => p.synchronise === 1).length;
    const erreur = parcelles.filter(p => p.synchronise === 2).length;

    return { parcellesCreeParUser: totalParcelleUser, demandeursTotalTablette: totalDemandeurs, parcellesSyncParUser: synchronise, parcellesSyncErreur: erreur };
  } catch (error) {
    console.error("Erreur calcul statistiques:", error);
    return { parcellesCreeParUser: 0, demandeursTotalTablette: 0, parcellesSyncParUser: 0, parcellesSyncErreur: 0 };
  }
}

export async function parcellesParJourSemaine(dateReference: Date = new Date()): Promise<number[]> {
  try {
    const parcelles = await getAllParcelles();
    const jours: number[] = [0, 0, 0, 0, 0, 0, 0];

    // Calcul du lundi de la semaine de la dateReference
    const jourSemaine = dateReference.getDay();
    const diffLundi = jourSemaine === 0 ? -6 : 1 - jourSemaine;
    const debutSemaine = new Date(dateReference);
    debutSemaine.setDate(dateReference.getDate() + diffLundi);
    debutSemaine.setHours(0, 0, 0, 0);

    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);
    finSemaine.setHours(23, 59, 59, 999);

    parcelles.forEach((p) => {
      if (p.dateCreation) {
        const date = new Date(p.dateCreation);
        if (date >= debutSemaine && date <= finSemaine) {
          let day = date.getDay();
          day = day === 0 ? 6 : day - 1;
          jours[day] += 1;
        }
      }
    });

    return jours;
  } catch (error) {
    console.error("Erreur calcul parcelles par jour:", error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

// ✅ Export stores si besoin
export { parcelleStore, demandeurStore };