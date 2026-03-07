// DbSchema.ts
import { getDB } from "./Database";
import { Parcelle, checkParcelle } from "../parcelle/Parcelle";
import { Demandeur, checkDemandeur } from "../parcelle/Demandeur";
import { Preferences } from "@capacitor/preferences";
import { DashboardStats } from "../dashbord/dashbord";
import { RxDocument } from "rxdb";
import { ParcelleDocType, DemandeurDocType } from "./Schema";
import { Riverin } from "../parcelle/Riverin";
import { Polygone } from "../vecteur/Polygone";
import { ParametreTerritoire } from "../ParametreTerritoire";
import { CIN } from "../parcelle/CIN";
import { ActeNaissance } from "../parcelle/ActeNaissance";

type ParcelleDoc = RxDocument<ParcelleDocType>;
type DemandeurDoc = RxDocument<DemandeurDocType>;
// ─── Helper session ───────────────────────────────────────────────────────────

async function getSessionId(): Promise<string> {
  const { value } = await Preferences.get({ key: "id_session" });
  return value ?? "";
}

// ─── Utilitaire de sérialisation (une seule fois) ─────────────────────────────

function parcelleToDoc(parcelle: Parcelle) {
  return {
    ...parcelle,
    code: parcelle.code!,
    id_personne: parcelle.id_personne!,
    dateCreation: parcelle.dateCreation!,
    status: parcelle.status ?? undefined,
    anneeOccup: parcelle.anneeOccup ?? undefined,
    categorie: parcelle.categorie ?? undefined,
    consistance: parcelle.consistance ?? undefined,
    parametreTerritoire: parcelle.parametreTerritoire ?? undefined,
  } as unknown as ParcelleDocType;
}

// ─── Convertisseurs doc RxDB → instances métier ───────────────────────────────
function docToParcelle(doc: ParcelleDoc): Parcelle {
  const d = doc.toJSON();
  const p = Parcelle.init(); // ✅ base propre avec les valeurs par défaut

  // Remplit chaque champ depuis le document
  p.code = d.code;
  p.id_personne = d.id_personne;
  p.dateCreation = d.dateCreation;
  p.status = d.status ?? null;
  p.anneeOccup = d.anneeOccup ?? null;
  p.categorie = d.categorie ?? null;
  p.consistance = d.consistance ?? null;
  p.oppossition = d.oppossition ?? false;
  p.revandication = d.revandication ?? false;
  p.observation = d.observation ?? "";
  p.synchronise = d.synchronise ?? 0;
  p.syncError = d.syncError ?? "";
  p.lastSync = d.lastSync ?? "";
  p.syncing = d.syncing ?? false;
  p.demandeurs = (d.demandeurs ?? []) as unknown as Demandeur[];
  p.riverin = (d.riverin ?? []) as unknown as Riverin[];
  p.polygone = (d.polygone ?? []) as unknown as Polygone[];
  p.photos = [...(d.photos ?? [])];
  p.parametreTerritoire = (d.parametreTerritoire ??
    null) as unknown as ParametreTerritoire | null;

  return p;
}

function docToDemandeur(doc: DemandeurDoc): Demandeur {
  const d = doc.toJSON();
  const dem = Demandeur.init(); // ✅ base propre avec uuid déjà généré

  dem.id = d.id;
  dem.type = d.type;
  dem.nom = d.nom ?? "";
  dem.prenom = d.prenom ?? "";
  dem.neVers = d.neVers ?? false;
  dem.dateNaissance = d.dateNaissance ?? null;
  dem.lieuNaissance = d.lieuNaissance ?? "";
  dem.sexe = d.sexe ?? 0;
  dem.adresse = d.adresse ?? "";
  dem.nomPere = d.nomPere ?? "";
  dem.nomMere = d.nomMere ?? "";
  dem.situation = d.situation ?? "0";
  dem.nomConjoint = d.nomConjoint ?? "";
  dem.piece = d.piece ?? 2;
  dem.cin = (d.cin ?? null) as unknown as CIN | null;
  dem.acte = (d.acte ?? null) as unknown as ActeNaissance | null;
  dem.denomination = d.denomination ?? "";
  dem.typeMorale = d.typeMorale ?? 0;
  dem.dateCreation = d.dateCreation ?? "";
  dem.siege = d.siege ?? "";
  dem.observations = d.observations ?? "";
  dem.photos = [...(d.photos ?? [])];
  dem.indexPhoto = d.indexPhoto ?? null;

  return dem;
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
  const db = await getDB();
  await db.parcelles.find().remove();
  await db.demandeurs.find().remove();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARCELLES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Insère ou met à jour une parcelle.
 * Synchronise aussi chaque demandeur dans sa propre collection.
 */
export async function insertParcelle(parcelle: Parcelle): Promise<Parcelle> {
  await checkParcelle(parcelle);
  const db = await getDB();

  // Sérialisation complète — NoSQL = on stocke l'objet tel quel
  await db.parcelles.upsert(parcelleToDoc(parcelle));

  // Sync des demandeurs dans leur propre collection pour la recherche
  for (const demandeur of parcelle.demandeurs) {
    await db.demandeurs.upsert({
      ...demandeur,
      parcelle_code: parcelle.code!,
    } as Demandeur);
  }

  return parcelle;
}

/**
 * Retourne toutes les parcelles de l'utilisateur courant.
 * Si id_session === '0' (admin) → retourne tout.
 */
export async function getAllParcelles(): Promise<Parcelle[]> {
  const db = await getDB();
  const sessionId = await getSessionId();

  const docs =
    sessionId === "0"
      ? await db.parcelles.find({ sort: [{ dateCreation: "desc" }] }).exec()
      : await db.parcelles
          .find({
            selector: { id_personne: sessionId },
            sort: [{ dateCreation: "desc" }],
          })
          .exec();

  return docs.map(docToParcelle);
}

/**
 * Retourne une parcelle par son code métier.
 */
export async function getParcelleByCode(
  code: string,
): Promise<Parcelle | null> {
  const db = await getDB();
  const doc = await db.parcelles.findOne(code).exec();
  return doc ? docToParcelle(doc) : null;
}

/**
 * Supprime une parcelle et tous ses demandeurs liés.
 * Refuse si déjà synchronisée.
 */
export async function deleteParcelle(code: string): Promise<boolean> {
  const db = await getDB();
  const doc = await db.parcelles.findOne(code).exec();

  if (!doc) return false;

  if (doc.synchronise === 1) {
    console.warn("Suppression refusée : parcelle déjà synchronisée.");
    return false;
  }

  // Supprime les demandeurs liés, puis la parcelle
  await db.demandeurs.find({ selector: { parcelle_code: code } }).remove();
  await doc.remove();

  return true;
}

/**
 * Mise à jour partielle du statut de synchronisation uniquement.
 * Évite de réécrire tout l'objet parcelle.
 */
export async function updateSyncStatus(
  code: string,
  statut: 0 | 1 | 2,
  erreur: string = "",
): Promise<void> {
  const db = await getDB();
  const doc = await db.parcelles.findOne(code).exec();
  if (!doc) return;

  await doc.update({
    $set: {
      synchronise: statut,
      syncError: erreur,
      lastSync: new Date().toISOString(),
      syncing: false,
    },
  });
}

// ─── Requêtes avancées Parcelles ──────────────────────────────────────────────

/**
 * Pagination — adapté pour grande volumétrie.
 * Retourne les données + le total pour le composant de pagination.
 */
export async function getParcellesPaginees(
  page: number,
  limit: number = 20,
): Promise<{ data: Parcelle[]; total: number }> {
  const db = await getDB();
  const sessionId = await getSessionId();
  const selector = sessionId !== "0" ? { id_personne: sessionId } : {};

  const [docs, total] = await Promise.all([
    db.parcelles
      .find({
        selector,
        sort: [{ dateCreation: "desc" }],
        skip: page * limit,
        limit,
      })
      .exec(),
    db.parcelles.count({ selector }).exec(),
  ]);

  return {
    data: docs.map(docToParcelle),
    total,
  };
}

/**
 * Parcelles non synchronisées ou en erreur — file d'attente d'envoi.
 */
export async function getParcellesASync(): Promise<Parcelle[]> {
  const db = await getDB();
  const sessionId = await getSessionId();

  const docs = await db.parcelles
    .find({
      selector: {
        synchronise: { $in: [0, 2] },
        ...(sessionId !== "0" && { id_personne: sessionId }),
      },
      sort: [{ dateCreation: "asc" }], // les plus anciennes en premier
    })
    .exec();

  return docs.map(docToParcelle);
}

/**
 * Parcelles créées dans une plage de dates.
 */
export async function getParcellesEntreDates(
  debut: Date,
  fin: Date,
): Promise<Parcelle[]> {
  const db = await getDB();
  const sessionId = await getSessionId();

  const docs = await db.parcelles
    .find({
      selector: {
        dateCreation: {
          $gte: debut.toISOString(),
          $lte: fin.toISOString(),
        },
        ...(sessionId !== "0" && { id_personne: sessionId }),
      },
      sort: [{ dateCreation: "desc" }],
    })
    .exec();

  return docs.map(docToParcelle);
}

/**
 * Recherche textuelle sur code / catégorie / consistance.
 */
export async function rechercherParcelles(terme: string): Promise<Parcelle[]> {
  const db = await getDB();
  const sessionId = await getSessionId();
  const regex = { $regex: terme, $options: "i" };

  const docs = await db.parcelles
    .find({
      selector: {
        $or: [
          { code: regex },
          { categorie: regex },
          { consistance: regex },
          { observation: regex },
        ],
        ...(sessionId !== "0" && { id_personne: sessionId }),
      },
    })
    .exec();

  return docs.map(docToParcelle);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMANDEURS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Insère ou met à jour un demandeur standalone.
 * Met aussi à jour le demandeur dans la parcelle parente (dénormalisation).
 */
export async function insertDemandeur(demandeur: Demandeur,parcelleCode: string,): Promise<Demandeur> {
  checkDemandeur(demandeur);
  const db = await getDB();

  // 1. Upsert dans la collection demandeurs
  await db.demandeurs.upsert(demandeur);

  // 2. Mise à jour dans la parcelle parente (dénormalisation)
  const parcelleDoc = await db.parcelles.findOne(parcelleCode).exec();
  if (parcelleDoc) {
    const demandeurs: Demandeur[] =
      (parcelleDoc.demandeurs as Demandeur[]) ?? [];
    const idx = demandeurs.findIndex((d) => d.id === demandeur.id);

    const updated =
      idx !== -1
        ? demandeurs.map((d, i) => (i === idx ? demandeur : d))
        : [...demandeurs, demandeur];

    await parcelleDoc.update({ $set: { demandeurs: updated as Demandeur[] } });
  }

  return demandeur;
}

/**
 * Retourne tous les demandeurs de la tablette.
 */
export async function getAllDemandeurs(): Promise<Demandeur[]> {
  const db = await getDB();
  const docs = await db.demandeurs.find().exec();
  return docs.map(docToDemandeur);
}

/**
 * Retourne les demandeurs d'une parcelle spécifique, triés par nom.
 */
export async function getDemandeursByParcelle(
  parcelleCode: string,
): Promise<Demandeur[]> {
  const db = await getDB();
  const docs = await db.demandeurs
    .find({
      selector: { parcelle_code: parcelleCode },
      sort: [{ nom: "asc" }],
    })
    .exec();
  return docs.map(docToDemandeur);
}

/**
 * Recherche un demandeur par nom, prénom ou observations.
 */
export async function rechercherDemandeurs(
  terme: string,
): Promise<Demandeur[]> {
  const db = await getDB();
  const regex = { $regex: terme, $options: "i" };

  const docs = await db.demandeurs
    .find({
      selector: {
        $or: [
          { nom: regex },
          { prenom: regex },
          { denomination: regex },
          { observations: regex },
        ],
      },
    })
    .exec();

  return docs.map(docToDemandeur);
}

/**
 * Supprime un demandeur de sa collection ET de la parcelle parente.
 */
export async function deleteDemandeur(
  demandeurId: string,
  parcelleCode: string,
): Promise<boolean> {
  const db = await getDB();

  const doc = await db.demandeurs.findOne(demandeurId).exec();
  if (!doc) return false;

  // Retire aussi de la parcelle parente
  const parcelleDoc = await db.parcelles.findOne(parcelleCode).exec();
  if (parcelleDoc) {
    const filtered = ((parcelleDoc.demandeurs as Demandeur[]) ?? []).filter(
      (d: Demandeur) => d.id !== demandeurId,
    );
    await parcelleDoc.update({ $set: { demandeurs: filtered } });
  }

  await doc.remove();
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTIQUES
// ═══════════════════════════════════════════════════════════════════════════════

export async function statisiqueParcelles(): Promise<DashboardStats> {
  try {
    const db = await getDB();
    const sessionId = await getSessionId();
    const selector = sessionId !== "0" ? { id_personne: sessionId } : {};

    const [totalUser, totalDemandeurs, synchronise, erreur] = await Promise.all(
      [
        db.parcelles.count({ selector }).exec(),
        db.demandeurs.count({}).exec(),
        db.parcelles
          .count({ selector: { ...selector, synchronise: 1 } })
          .exec(),
        db.parcelles
          .count({ selector: { ...selector, synchronise: 2 } })
          .exec(),
      ],
    );

    return {
      parcellesCreeParUser: totalUser,
      demandeursTotalTablette: totalDemandeurs,
      parcellesSyncParUser: synchronise,
      parcellesSyncErreur: erreur,
    };
  } catch (error) {
    console.error("Erreur calcul statistiques:", error);
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
    const jourSemaine = dateReference.getDay();
    const diffLundi = jourSemaine === 0 ? -6 : 1 - jourSemaine;
    const debutSemaine = new Date(dateReference);
    debutSemaine.setDate(dateReference.getDate() + diffLundi);
    debutSemaine.setHours(0, 0, 0, 0);
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);
    finSemaine.setHours(23, 59, 59, 999);

    // Une seule requête RxDB filtrée par plage de dates
    const parcelles = await getParcellesEntreDates(debutSemaine, finSemaine);
    const jours: number[] = [0, 0, 0, 0, 0, 0, 0];

    parcelles.forEach((p) => {
      if (p.dateCreation) {
        let day = new Date(p.dateCreation).getDay();
        day = day === 0 ? 6 : day - 1; // Lundi=0 ... Dimanche=6
        jours[day] += 1;
      }
    });

    return jours;
  } catch (error) {
    console.error("Erreur calcul parcelles par jour:", error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}
