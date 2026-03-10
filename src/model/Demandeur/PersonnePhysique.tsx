import { v4 as uuidv4 } from 'uuid';
import { CIN } from "../parcelle/CIN";
import { ActeNaissance } from "../parcelle/ActeNaissance";

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
  piece: number; // 0 cin, 1 acte, 2 neant
  cin: CIN | null;
  acte: ActeNaissance | null;
  observations: string;
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
    piece: number,
    cin: CIN | null,
    acte: ActeNaissance | null,
    observations: string,
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
    this.piece = piece;
    this.cin = cin;
    this.acte = acte;
    this.observations = observations;
    this.photos = photos;
    this.indexPhoto = indexPhoto;
  }

  static init(): PersonnePhysique {
    return new PersonnePhysique(
      uuidv4(), null, null, false, null, null, 0, "", "", "", "0", "", 2, null, null, "", [], null,
    );
  }
}