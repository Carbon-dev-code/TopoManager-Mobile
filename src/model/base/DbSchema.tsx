// DbSchema.tsx
import { checkParcelle, Parcelle } from "../parcelle/Parcelle";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";
import { initDatabase } from "./Database";
import { Directory, Filesystem } from "@capacitor/filesystem";
import {
  checkPersonnePhysique,
  PersonnePhysique,
} from "../Demandeur/PersonnePhysique";
import {
  checkPersonneMorale,
  PersonneMorale,
} from "../Demandeur/PersonneMorale";
import { Demandeur } from "../Demandeur/Demandeur";
import { RepresentantMoral } from "../Demandeur/RepresentantMoral";
import { Riverin } from "../parcelle/Riverin";

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

    // ─── Mapper demandeurs → IDs ─────────────────────────────────
    const demandeursClean = parcelle.demandeurs.map((d) => ({
      id: d.id,
      type: Number(d.type),
      representantType: d.representanType ?? "proprietaire",
      personnePhysiqueId: d.type === 0 ? d.personnePhysique.id : "",
      personneMoraleId: d.type === 1 ? d.personneMorale.id : "",
    }));

    // ─── Mapper riverin → IDs ────────────────────────────────────
    const riverinClean = parcelle.riverin.map((r) => ({
      repere: r.repere ?? "",
      type: r.type,
      nom: r.nom ?? null,
      typePersonne: r.typePersonne ?? null,
      personnePhysiqueId:
        r.typePersonne === 0 ? r.personnePhysique?.id ?? "" : "",
      personneMoraleId: r.typePersonne === 1 ? r.personneMorale?.id ?? "" : "",
      observation: r.observation ?? "",
    }));

    const cleanData = {
      ...JSON.parse(JSON.stringify(parcelle)),
      demandeurs: demandeursClean,
      riverin: riverinClean,
    };

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
  limit: number = 10,
): Promise<{ data: Parcelle[]; total: number }> {
  try {
    const database = await initDatabase();
    const { value: sessionId } = await Preferences.get({ key: "id_session" });
    const selector = sessionId === "0" ? {} : { id_personne: sessionId };

    let docs: any[];
    let total: number;

    if (page !== undefined) {
      [docs, total] = await Promise.all([
        database.parcelle
          .find({ selector, skip: (page - 1) * limit, limit })
          .exec(),
        database.parcelle.count({ selector }).exec(),
      ]);
    } else {
      docs = await database.parcelle.find({ selector }).exec();
      total = docs.length;
    }

    // ─── Reconstituer Parcelle avec objets complets ──────────────
    const data: Parcelle[] = await Promise.all(
      docs.map(async (doc) => {
        const raw = doc.toJSON();

        // ─── Reconstituer demandeurs ─────────────────────────────
        const demandeurs: Demandeur[] = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (raw.demandeurs ?? []).map(async (d: any) => {
            let pp = PersonnePhysique.init();
            let pm = PersonneMorale.init();

            if (d.type === 0 && d.personnePhysiqueId) {
              const ppDoc = await database.personnephysique
                .findOne(d.personnePhysiqueId)
                .exec();
              if (ppDoc) pp = ppDoc.toJSON() as PersonnePhysique;
            }
            if (d.type === 1 && d.personneMoraleId) {
              const pmDoc = await database.personnemorale
                .findOne(d.personneMoraleId)
                .exec();
              if (pmDoc) pm = pmDoc.toJSON() as PersonneMorale;
            }

            return new Demandeur(
              d.id,
              d.type,
              pp,
              pm,
              d.representantType || null,
            );
          }),
        );

        // ─── Reconstituer riverin ────────────────────────────────
        const riverin: Riverin[] = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (raw.riverin ?? []).map(async (r: any) => {
            let pp: PersonnePhysique | null = null;
            let pm: PersonneMorale | null = null;

            if (r.typePersonne === 0 && r.personnePhysiqueId) {
              const ppDoc = await database.personnephysique
                .findOne(r.personnePhysiqueId)
                .exec();
              if (ppDoc) pp = ppDoc.toJSON() as PersonnePhysique;
            }
            if (r.typePersonne === 1 && r.personneMoraleId) {
              const pmDoc = await database.personnemorale
                .findOne(r.personneMoraleId)
                .exec();
              if (pmDoc) pm = pmDoc.toJSON() as PersonneMorale;
            }

            return new Riverin(
              r.repere,
              r.type,
              r.nom,
              pp,
              pm,
              r.typePersonne,
              r.observation,
            );
          }),
        );

        return { ...raw, demandeurs, riverin } as Parcelle;
      }),
    );

    return { data, total };
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

export async function insertPersonnePhysique(
  personne: PersonnePhysique,
): Promise<PersonnePhysique> {
  try {
    checkPersonnePhysique(personne); // ← avant tout
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

export async function deletePersonnePhysique(id: string): Promise<void> {
  try {
    const database = await initDatabase();

    // ─── Rattaché comme demandeur ─────────────────────────────────
    const parcellesDemandeur = await database.parcelle
      .find({
        selector: { demandeurs: { $elemMatch: { personnePhysiqueId: id } } },
      })
      .exec();

    if (parcellesDemandeur.length > 0) {
      const codes = parcellesDemandeur.map((p) => p.get("code")).join("\n");
      throw new Error(
        `Impossible de supprimer \n rattachée comme demandeur aux parcelles :\n${codes}`,
      );
    }

    // ─── Rattaché comme riverin ───────────────────────────────────
    const parcellesRiverin = await database.parcelle
      .find({
        selector: { riverin: { $elemMatch: { personnePhysiqueId: id } } },
      })
      .exec();

    if (parcellesRiverin.length > 0) {
      const codes = parcellesRiverin.map((p) => p.get("code")).join("\n");
      throw new Error(
        `Impossible de supprimer \n rattachée comme riverin aux parcelles :\n${codes}`,
      );
    }

    // ─── Rattaché comme représentant d'une PersonneMorale ─────────
    const morales = await database.personnemorale
      .find({
        selector: { representant: { $elemMatch: { personnePhysiqueId: id } } },
      })
      .exec();

    if (morales.length > 0) {
      const denominations = morales
        .map((m) => m.get("denomination"))
        .join("\n");
      throw new Error(
        `Impossible de supprimer \n rattachée comme représentant de :\n${denominations}`,
      );
    }

    const doc = await database.personnephysique.findOne(id).exec();
    await doc?.remove();
    console.log("✅ PersonnePhysique supprimée");
  } catch (error) {
    console.error("❌ Erreur deletePersonnePhysique:", error);
    throw error;
  }
}

//------personne moral

export async function deletePersonneMorale(id: string): Promise<void> {
  try {
    const database = await initDatabase();

    // ─── Rattaché comme demandeur ─────────────────────────────────
    const parcellesDemandeur = await database.parcelle
      .find({
        selector: { demandeurs: { $elemMatch: { personneMoraleId: id } } },
      })
      .exec();

    if (parcellesDemandeur.length > 0) {
      const codes = parcellesDemandeur.map((p) => p.get("code")).join("\n");
      throw new Error(
        `Impossible de supprimer \n rattachée comme demandeur aux parcelles :\n${codes}`,
      );
    }

    // ─── Rattaché comme riverin ───────────────────────────────────
    const parcellesRiverin = await database.parcelle
      .find({
        selector: { riverin: { $elemMatch: { personneMoraleId: id } } },
      })
      .exec();

    if (parcellesRiverin.length > 0) {
      const codes = parcellesRiverin.map((p) => p.get("code")).join("\n");
      throw new Error(
        `Impossible de supprimer \n rattachée comme riverin aux parcelles ${codes}`,
      );
    }

    const doc = await database.personnemorale.findOne(id).exec();
    await doc?.remove();
    console.log("✅ PersonneMorale supprimée");
  } catch (error) {
    console.error("❌ Erreur deletePersonneMorale:", error);
    throw error;
  }
}

export async function insertPersonneMorale(
  personne: PersonneMorale,
): Promise<PersonneMorale> {
  try {
    checkPersonneMorale(personne);
    const database = await initDatabase();
    // 1. Insérer les PersonnePhysique des représentants si présents
    if (personne.representant?.length > 0) {
      for (const r of personne.representant) {
        await insertPersonnePhysique(r.personnePhysique);
      }
    }
    // 2. Insérer PersonneMorale avec représentants réduits à id + role
    const cleanData = {
      ...JSON.parse(JSON.stringify(personne)),
      typeMorale: Number(personne.typeMorale),
      representant: personne.representant.map((r) => ({
        personnePhysiqueId: r.personnePhysique.id,
        role: r.role,
      })),
    };

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

    const morales = await Promise.all(
      docs.map(async (doc) => {
        const data = doc.toJSON();

        // ─── Reconstruire les représentants avec PersonnePhysique ──
        const representant: RepresentantMoral[] = await Promise.all(
          (data.representant ?? []).map(
            async (r: { personnePhysiqueId: string; role: string }) => {
              const ppDoc = await database.personnephysique
                .findOne(r.personnePhysiqueId)
                .exec();
              const pp = ppDoc
                ? (ppDoc.toJSON() as PersonnePhysique)
                : PersonnePhysique.init();
              return new RepresentantMoral(pp, r.role as "representant");
            },
          ),
        );
        return new PersonneMorale(
          data.id,
          data.denomination,
          data.typeMorale,
          data.dateCreation,
          data.siege,
          data.observations,
          representant,
        );
      }),
    );

    return morales;
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
