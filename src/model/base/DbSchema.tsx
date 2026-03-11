// DbSchema.tsx
import { checkParcelle, Parcelle } from "../parcelle/Parcelle";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";
import { initDatabase } from "./Database";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { PersonnePhysique } from "../Demandeur/PersonnePhysique";
import { PersonneMorale } from "../Demandeur/PersonneMorale";
import { Demandeur } from "../Demandeur/Demandeur";

// ─── Photos ───────────────────────────────────────────────────────────────────
export async function deletePhotos(photos: string[]): Promise<void> {
  for (const fileName of photos) {
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Data,
      });
    } catch (err) {
      console.error(`❌ Erreur suppression fichier photo ${fileName}:`, err);
    }
  }
}

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
    await database.personnephysique.find().remove();
    await database.personnemorale.find().remove();
    // ← supprimer database.demandeur.find().remove() si la collection n'existe plus
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

export async function getAllParcelles(
  page?: number,
  limit: number = 2,
): Promise<{ data: Parcelle[]; total: number }> {
  try {
    const database = await initDatabase();
    const { value: sessionId } = await Preferences.get({ key: "id_session" });

    const selector = sessionId === "0" ? {} : { id_personne: sessionId };

    // Sans paramètre → tout retourner
    if (page === undefined) {
      const docs = await database.parcelle.find({ selector }).exec();
      const data = docs.map((doc) => doc.toJSON() as Parcelle);
      return { data, total: data.length };
    }

    // Avec pagination
    const [docs, total] = await Promise.all([
      database.parcelle
        .find({
          selector,
          skip: (page - 1) * limit,
          limit,
        })
        .exec(),
      database.parcelle.count({ selector }).exec(),
    ]);

    return {
      data: docs.map((doc) => doc.toJSON() as Parcelle),
      total,
    };
  } catch (error) {
    console.error("❌ Erreur récupération parcelles RxDB:", error);
    return { data: [], total: 0 };
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

    // ← nettoie les fichiers photos avant de supprimer le doc
    await deletePhotos(doc.toJSON().photos ?? []);

    await doc.remove();
    console.log(`✅ Parcelle ${code} supprimée`);
    return true;
  } catch (error) {
    console.error("❌ Erreur suppression parcelle:", error);
    throw error;
  }
}

// ─── PersonnePhysique ─────────────────────────────────────────────────────────

export async function insertPersonnePhysique(
  personne: PersonnePhysique,
): Promise<PersonnePhysique> {
  try {
    const database = await initDatabase();
    const cleanData = JSON.parse(JSON.stringify(personne));
    await database.personnephysique.upsert(cleanData);
    console.log("✅ PersonnePhysique upsert avec succès");
    return personne;
  } catch (error) {
    console.error("❌ Erreur insertPersonnePhysique:", error);
    throw error;
  }
}

export async function getAllPersonnesPhysiques(): Promise<PersonnePhysique[]> {
  try {
    const database = await initDatabase();
    const docs = await database.personnephysique.find().exec();
    return docs.map((doc) => doc.toJSON() as PersonnePhysique);
  } catch (error) {
    console.error("❌ Erreur getAllPersonnesPhysiques:", error);
    return [];
  }
}

// ─── PersonneMorale ───────────────────────────────────────────────────────────

export async function insertPersonneMorale(
  personne: PersonneMorale,
): Promise<PersonneMorale> {
  try {
    const database = await initDatabase();
    const cleanData = JSON.parse(JSON.stringify(personne));
    await database.personnemorale.upsert(cleanData);
    console.log("✅ PersonneMorale upsert avec succès");
    return personne;
  } catch (error) {
    console.error("❌ Erreur insertPersonneMorale:", error);
    throw error;
  }
}

export async function getAllPersonnesMorales(): Promise<PersonneMorale[]> {
  try {
    const database = await initDatabase();
    const docs = await database.personnemorale.find().exec();
    return docs.map((doc) => doc.toJSON() as PersonneMorale);
  } catch (error) {
    console.error("❌ Erreur getAllPersonnesMorales:", error);
    return [];
  }
}

export async function insertDemandeur(
  demandeur: Demandeur,
): Promise<Demandeur> {
  try {
    if (demandeur.type === 0) {
      await insertPersonnePhysique(demandeur.personnePhysique);
    } else {
      await insertPersonneMorale(demandeur.personneMorale);
    }
    console.log("✅ Demandeur upsert avec succès");
    return demandeur;
  } catch (error) {
    console.error("❌ Erreur insertDemandeur:", error);
    throw error;
  }
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export async function statisiqueParcelles(): Promise<DashboardStats> {
  try {
    const { data: parcelles, total } = await getAllParcelles();

    const [physiques, morales] = await Promise.all([
      getAllPersonnesPhysiques(),
      getAllPersonnesMorales(),
    ]);
    const totalDemandeurs = physiques.length + morales.length;

    return {
      parcellesCreeParUser: total,
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
    const { data: parcelles } = await getAllParcelles();
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
