import { ActeNaissance } from "./ActeNaissance";
import { CIN } from "./CIN";
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export function checkDemandeur(demandeur: Demandeur): void {
  // On trim directement les chaînes pour éviter les erreurs de espaces
  demandeur.nom = demandeur.nom?.trim() ?? '';
  demandeur.prenom = demandeur.prenom?.trim() ?? '';
  demandeur.lieuNaissance = demandeur.lieuNaissance?.trim() ?? '';
  demandeur.adresse = demandeur.adresse?.trim() ?? '';
  demandeur.nomPere = demandeur.nomPere?.trim() ?? '';
  demandeur.nomMere = demandeur.nomMere?.trim() ?? '';
  demandeur.nomConjoint = demandeur.nomConjoint?.trim() ?? '';
  demandeur.denomination = demandeur.denomination?.trim() ?? '';
  demandeur.siege = demandeur.siege?.trim() ?? '';

  if (demandeur.type === null || demandeur.type === undefined) {
    throw new Error("Quel est le type du demandeur");
  }

  if (demandeur.type === 0) { // personne physique
    if (!demandeur.nom) throw new Error("Veuillez insérer le nom du demandeur");
    if (!demandeur.dateNaissance) throw new Error("Veuillez insérer la date de naissance du demandeur");
    if (!demandeur.lieuNaissance) throw new Error("Veuillez insérer le lieu de naissance du demandeur");
    if (!demandeur.sexe) throw new Error("Veuillez sélectionner le sexe du demandeur");
    if (!demandeur.adresse) throw new Error("Veuillez insérer l'adresse du demandeur");
    if (["1", "2"].includes(demandeur.situation)) {
      if (!demandeur.nomConjoint) throw new Error("Veuillez insérer le nom du conjoint du demandeur");
    }
    if (!demandeur.nomPere) throw new Error("Veuillez insérer le nom du père du demandeur");
    if (!demandeur.nomMere) throw new Error("Veuillez insérer le nom de la mère du demandeur");
  } else if (demandeur.type === 1) { // personne morale
    if (demandeur.typeMorale === null || demandeur.typeMorale === undefined)
      throw new Error("Veuillez sélectionner le type de personne morale");
    if (!demandeur.denomination) throw new Error("Veuillez insérer la dénomination de la personne morale");
    if (!demandeur.dateCreation) throw new Error("Veuillez insérer la date de création de la personne morale");
    if (!demandeur.siege) throw new Error("Veuillez insérer le siège de la personne morale");
  }
}


export class Demandeur {
  id: string;
  type: number; // 0 personne physique, 1 personne morale
  nom: string | null;
  prenom: string | null;
  neVers: boolean;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  sexe: number;
  adresse: string;
  nomPere: string;
  nomMere: string;
  situation: string;
  nomConjoint: string;
  piece: number; // 1 cin, 2 acte, 3 rien
  cin: CIN | null;
  acte: ActeNaissance | null;
  denomination: string;
  typeMorale: number;
  dateCreation: string;
  siege: string;
  observations: string;

  // 🔹 Nouvelle propriété pour stocker les photos
  // On stocke une liste d'URI ou Base64 pour gérer plusieurs photos
  photos: string[];
  indexPhoto: number | null; // Indice de la photo profil affichée

  constructor(
    id: string,
    type: number,
    nom: string,
    prenom: string,
    neVers: boolean,
    dateNaissance: string | null,
    lieuNaissance: string,
    sexe: number,
    adresse: string,
    nomPere: string,
    nomMere: string,
    situation: string,
    nomConjoint: string,
    piece: number,
    cin: CIN | null,
    acte: ActeNaissance | null,
    denomination: string,
    typeMorale: number,
    dateCreation: string,
    siege: string,
    observations: string,
    photos: string[] = [],
    indexPhoto: number | null
  ) {
    this.id = id;
    this.type = type;
    this.nom = nom;
    this.prenom = prenom;
    this.neVers = neVers;
    this.dateNaissance = dateNaissance;
    this.lieuNaissance = lieuNaissance;
    this.sexe = sexe;
    this.adresse = adresse;
    this.nomPere = nomPere;
    this.nomMere = nomMere;
    this.situation = situation;
    this.nomConjoint = nomConjoint;
    this.piece = piece;
    this.cin = cin;
    this.acte = acte;
    this.denomination = denomination;
    this.typeMorale = typeMorale;
    this.dateCreation = dateCreation;
    this.siege = siege;
    this.observations = observations;
    this.photos = photos;
    this.indexPhoto = indexPhoto;
  }

  // 🔹 Méthode statique pour initialiser un Demandeur vide
  static init(): Demandeur {
    return new Demandeur(
      uuidv4(), 0, '', '', false, null, '', 0, '', '', '', '0', '', 2,
      null, null, '', 0, '', '', '',
      [], null
    );
  }
}