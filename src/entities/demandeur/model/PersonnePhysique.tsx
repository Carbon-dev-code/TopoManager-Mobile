import { v4 as uuidv4 } from "uuid";
import { CIN } from "../../parcelle/model/CIN";
import { ActeNaissance } from "../../parcelle/model/ActeNaissance";

export function checkPersonnePhysique(personne: PersonnePhysique): void {
  if (!personne.nom?.trim())
    throw new Error("Le nom est requis");
  if (!personne.prenom?.trim())
    throw new Error("Le prénom est requis");
  if (!personne.dateNaissance && !personne.neVers)
    throw new Error("La date de naissance est requise");
  if (!personne.lieuNaissance?.trim())
    throw new Error("Le lieu de naissance est requis");
  if (!personne.adresse?.trim())
    throw new Error("l'adresse requis");
  if (!personne.nomPere && !personne.nomMere)
    throw new Error("Le nom de vos parent sont requis");
}

export class PersonnePhysique {
  id: string;
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
  cin: CIN | null;
  acte: ActeNaissance | null;
  photos: string[];
  indexPhoto: number | null;

  constructor(
    id: string,
    nom: string | null,
    prenom: string | null,
    neVers: boolean,
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
      uuidv4(),
      null,
      null,
      false,
      null,
      null,
      0,
      "",
      "",
      "",
      "0",
      "",
      null,
      null,
      [],
      null,
    );
  }
}
