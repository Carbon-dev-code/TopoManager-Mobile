// DbSchema.tsx
import { checkParcelle, Parcelle } from "../parcelle/Parcelle";
import { checkDemandeur, Demandeur } from "../parcelle/DemandeurDTO";
import { Demandeur as DemandeurDTO } from "../Demandeur/Demandeur";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";
import { initDatabase } from "./Database";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { PersonnePhysique } from "../Demandeur/PersonnePhysique";
import { PersonneMorale } from "../Demandeur/PersonneMorale";

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

// ─── Demandeurs ───────────────────────────────────────────────────────────────
function departagerTypePersonne(
  demandeur: Demandeur,
):
  | { table: "personnephysique"; data: PersonnePhysique }
  | { table: "personnemoral"; data: PersonneMorale } {
  if (demandeur.type === 0) {
    const personne: PersonnePhysique = {
      id: demandeur.id,
      nom: demandeur.nom,
      prenom: demandeur.prenom,
      neVers: demandeur.neVers,
      dateNaissance: demandeur.dateNaissance,
      lieuNaissance: demandeur.lieuNaissance,
      sexe: demandeur.sexe,
      adresse: demandeur.adresse,
      nomPere: demandeur.nomPere,
      nomMere: demandeur.nomMere,
      situation: demandeur.situation,
      nomConjoint: demandeur.nomConjoint,
      cin: demandeur.cin ?? null,
      acte: demandeur.acte ?? null,
      photos: demandeur.photos,
      indexPhoto: demandeur.indexPhoto ?? null,
    };
    return { table: "personnephysique", data: personne };
  } else {
    const morale: PersonneMorale = {
      id: demandeur.id,
      denomination: demandeur.denomination,
      typeMorale: demandeur.typeMorale,
      dateCreation: demandeur.dateCreation,
      siege: demandeur.siege,
      observations: demandeur.observations,
      representant: [],
    };
    return { table: "personnemoral", data: morale };
  }
}

export async function insertDemandeur(
  demandeur: Demandeur,
): Promise<Demandeur> {
  try {
    checkDemandeur(demandeur);
    const database = await initDatabase();

    const { table, data } = departagerTypePersonne(demandeur);
    await database[table].upsert(JSON.parse(JSON.stringify(data)));

    console.log("✅ Demandeur upsert avec succès");
    return demandeur;
  } catch (error) {
    console.error("❌ Erreur insertDemandeur:", error);
    throw error;
  }
}

export async function insertDemandeurParcelle(demandeur: DemandeurDTO) {
  try {
    const database = await initDatabase();
    const cleanDemandeur = JSON.parse(
      JSON.stringify({
        id: demandeur.id,
        type: demandeur.type,
        personnePhysiqueId: demandeur.personnePhysiqueId,
        personneMoraleId: demandeur.personneMoraleId,
        representants: demandeur.representants ?? [],
      }),
    );
    await database.demandeur.upsert(cleanDemandeur);
    console.log("✅ DemandeurParcelle upsert avec succès");
  } catch (error) {
    console.error("❌ Erreur insertDemandeurParcelle:", error);
    throw error;
  }
}

export async function getAllDemandeurs(): Promise<Demandeur[]> {
  try {
    const database = await initDatabase();
    const docs = await database.personnephysique.find().exec();
    const docsM = await database.personnemorale.find().exec();

    const physiques: Demandeur[] = docs.map((doc) => {
      const pp = doc.toJSON() as PersonnePhysique;
      const dto = Demandeur.init();
      dto.id = pp.id;
      dto.type = 0;
      dto.nom = pp.nom;
      dto.prenom = pp.prenom;
      dto.neVers = pp.neVers;
      dto.dateNaissance = pp.dateNaissance;
      dto.lieuNaissance = pp.lieuNaissance;
      dto.sexe = pp.sexe;
      dto.adresse = pp.adresse;
      dto.nomPere = pp.nomPere;
      dto.nomMere = pp.nomMere;
      dto.situation = pp.situation;
      dto.nomConjoint = pp.nomConjoint;
      dto.cin = pp.cin;
      dto.acte = pp.acte;
      dto.photos = pp.photos;
      dto.indexPhoto = pp.indexPhoto;
      return dto;
    });

    const morales: Demandeur[] = docsM.map((doc) => {
      const pm = doc.toJSON() as PersonneMorale;
      const dto = Demandeur.init();
      dto.id = pm.id;
      dto.type = 1;
      dto.denomination = pm.denomination;
      dto.typeMorale = pm.typeMorale;
      dto.dateCreation = pm.dateCreation;
      dto.siege = pm.siege;
      dto.observations = pm.observations;
      return dto;
    });

    return [...physiques, ...morales];
  } catch (error) {
    console.error("❌ Erreur getAllDemandeurs:", error);
    return [];
  }
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export async function statisiqueParcelles(): Promise<DashboardStats> {
  try {
    const { data: parcelles, total } = await getAllParcelles();
    const totalDemandeurs = (await getAllDemandeurs()).length;

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
