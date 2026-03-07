// DbSchema.tsx
import { checkParcelle, Parcelle } from "../parcelle/Parcelle";
import { checkDemandeur, Demandeur } from "../parcelle/Demandeur";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";
import { initDatabase } from "./Database";

// ─── Vérifications ────────────────────────────────────────────────────────────

export async function verifIDDevice(): Promise<void> {
  const { value } = await Preferences.get({ key: "device_id" });
  if (!value)
    throw new Error(
      "Veuillez configurer l'identifiant de la tablette. Contacter l'administrateur pour plus d'informations.",
    );
}

export async function verifyDatabase(): Promise<void> {
  await verifIDDevice();

  const { value } = await Preferences.get({ key: "parametreActuel" });
  if (!value)
    throw new Error(
      "Veuillez configurer les paramètres territoriaux avant de créer une parcelle",
    );

  const p = JSON.parse(value);
  if (!p.region || !p.district || !p.commune || !p.fokontany)
    throw new Error("Paramètres territoriaux incomplets");
}

// ─── Clear ────────────────────────────────────────────────────────────────────

export async function clearDatabase(): Promise<void> {
  try {
    const database = await initDatabase();
    await database.parcelle.find().remove();
    await database.demandeur.find().remove();
    console.log("✅ Base de données RxDB vidée avec succès");
  } catch (error) {
    console.error("❌ Erreur clearDatabase:", error);
    throw error;
  }
}

// ─── Parcelles ────────────────────────────────────────────────────────────────

export async function insertParcelle(parcelle: Parcelle): Promise<Parcelle> {
  try {
    await checkParcelle(parcelle);
    const database = await initDatabase();
    const cleanData = JSON.parse(JSON.stringify(parcelle));
    await database.parcelle.upsert(cleanData);
    console.log(`✅ Parcelle ${parcelle.code} upsert dans RxDB`);
    return parcelle;
  } catch (error) {
    console.error("❌ Erreur insertion parcelle RxDB:", error);
    throw error;
  }
}

export async function getAllParcelles(): Promise<Parcelle[]> {
  try {
    const database = await initDatabase();
    const { value: sessionId } = await Preferences.get({ key: "id_session" });

    const query =
      sessionId === "0"
        ? database.parcelle.find()
        : database.parcelle.find({ selector: { id_personne: sessionId } });

    const docs = await query.exec();
    return docs.map((doc) => doc.toJSON() as Parcelle);
  } catch (error) {
    console.error("❌ Erreur récupération parcelles RxDB:", error);
    return [];
  }
}

export async function deleteParcelle(code: string): Promise<boolean> {
  try {
    const database = await initDatabase();
    const doc = await database.parcelle.findOne(code).exec();

    if (!doc) {
      console.warn(`Parcelle ${code} introuvable.`);
      return false;
    }

    if (doc.get("synchronise") === 1) {
      console.warn("Suppression refusée : parcelle déjà synchronisée.");
      return false;
    }

    await doc.remove();
    console.log(`✅ Parcelle ${code} supprimée`);
    return true;
  } catch (error) {
    console.error("❌ Erreur suppression parcelle:", error);
    throw error;
  }
}

// ─── Demandeurs ───────────────────────────────────────────────────────────────

export async function insertDemandeur(demandeur: Demandeur): Promise<Demandeur> {
  try {
    checkDemandeur(demandeur);
    const database = await initDatabase();
    const cleanData = JSON.parse(JSON.stringify(demandeur));
    await database.demandeur.upsert(cleanData);

    // Dénormalisation : mettre à jour le demandeur dans sa parcelle parente
    await syncDemandeurInParcelles(demandeur);

    console.log("✅ Demandeur upsert avec succès");
    return demandeur;
  } catch (error) {
    console.error("❌ Erreur insertDemandeur:", error);
    throw error;
  }
}

async function syncDemandeurInParcelles(demandeur: Demandeur): Promise<void> {
  try {
    const database = await initDatabase();
    const allDocs = await database.parcelle.find().exec();

    for (const doc of allDocs) {
      const demandeurs: Demandeur[] = JSON.parse(
        JSON.stringify(doc.toJSON().demandeurs ?? [])
      );
      const idx = demandeurs.findIndex((d) => d.id === demandeur.id);

      if (idx !== -1) {
        demandeurs[idx] = demandeur;
        await doc.patch({ demandeurs });
      }
    }
  } catch (error) {
    console.error("❌ Erreur syncDemandeurInParcelles:", error);
  }
}

export async function getAllDemandeurs(): Promise<Demandeur[]> {
  try {
    const database = await initDatabase();
    const docs = await database.demandeur.find().exec();
    return docs.map((doc) => doc.toJSON() as Demandeur);
  } catch (error) {
    console.error("❌ Erreur getAllDemandeurs:", error);
    return [];
  }
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export async function statisiqueParcelles(): Promise<DashboardStats> {
  try {
    const parcelles = await getAllParcelles();
    const totalDemandeurs = (await getAllDemandeurs()).length;

    return {
      parcellesCreeParUser: parcelles.length,
      demandeursTotalTablette: totalDemandeurs,
      parcellesSyncParUser: parcelles.filter((p) => p.synchronise === 1).length,
      parcellesSyncErreur: parcelles.filter((p) => p.synchronise === 2).length,
    };
  } catch (error) {
    console.error("❌ Erreur calcul statistiques:", error);
    return {
      parcellesCreeParUser: 0,
      demandeursTotalTablette: 0,
      parcellesSyncParUser: 0,
      parcellesSyncErreur: 0,
    };
  }
}

export async function parcellesParJourSemaine(
  dateReference: Date = new Date(),
): Promise<number[]> {
  try {
    const parcelles = await getAllParcelles();
    const jours: number[] = [0, 0, 0, 0, 0, 0, 0];

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
    console.error("❌ Erreur parcellesParJourSemaine:", error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}