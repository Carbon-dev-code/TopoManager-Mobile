import { v4 as uuidv4 } from "uuid";
import { CIN } from "../../parcelle/model/CIN";
import { ActeNaissance } from "../../parcelle/model/ActeNaissance";

export function checkPersonnePhysique(personne: PersonnePhysique): void {
  if (!personne.nom?.trim()) throw new Error("Le nom est requis");
  
  if (!personne.neVers && !personne.dateNaissance?.trim()) {
    throw new Error("La date de naissance est requise");
  }

  if (personne.neVers && !personne.dateNeVers?.trim()) {
    throw new Error("L'année de naissance approximative est requise");
  }
  if (!personne.lieuNaissance?.trim()) throw new Error("Le lieu de naissance est requis");
  if (!personne.adresse?.trim()) throw new Error("l'adresse requis");
  if (!personne.nomPere && !personne.nomMere) throw new Error("Le nom de vos parent sont requis");

  if (personne.cin) {
    if (!personne.cin.numero?.trim()) throw new Error("Le numéro de CIN est requis");
    if (!personne.cin.date) throw new Error("La date de délivrance du CIN est requise");
    if (!personne.cin.lieu?.trim()) throw new Error("Le lieu de délivrance du CIN est requis");
  }

  if (personne.acte) {
    if (!personne.acte.numero?.trim()) throw new Error("Le numéro d'acte de naissance est requis");
    if (!personne.acte.date) throw new Error("La date de délivrance de l'acte de naissance est requise");
    if (!personne.acte.lieu?.trim()) throw new Error("Le lieu de délivrance de l'acte de naissance est requis");
  }
}

export class PersonnePhysique {
  id: string;
  nom: string | null;
  prenom: string | null;
  neVers: boolean;
  dateNeVers: string | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  sexe: number;
  adresse: string;
  nomPere: string;
  nomMere: string;
  situation: string;
  nomConjoint: string;
  cin: CIN | null;
  acte: ActeNaissance | null;
  photos: string[];
  indexPhoto: number | null;

  constructor(
    id: string,
    nom: string | null,
    prenom: string | null,
    neVers: boolean,
    dateNeVers: string | null,
    dateNaissance: string | null,
    lieuNaissance: string | null,
    sexe: number,
    adresse: string,
    nomPere: string,
    nomMere: string,
    situation: string,
    nomConjoint: string,
    cin: CIN | null,
    acte: ActeNaissance | null,
    photos: string[],
    indexPhoto: number | null,
  ) {
    this.id = id;
    this.nom = nom;
    this.prenom = prenom;
    this.neVers = neVers;
    this.dateNeVers = dateNeVers;
    this.dateNaissance = dateNaissance;
    this.lieuNaissance = lieuNaissance;
    this.sexe = sexe;
    this.adresse = adresse;
    this.nomPere = nomPere;
    this.nomMere = nomMere;
    this.situation = situation;
    this.nomConjoint = nomConjoint;
    this.cin = cin;
    this.acte = acte;
    this.photos = photos;
    this.indexPhoto = indexPhoto;
  }

  static init(): PersonnePhysique {
    return new PersonnePhysique(
      uuidv4(), null, null, false, null, null, null, 0, "", "", "", "0", "", null,  null, [], null,
    );
  }
}
