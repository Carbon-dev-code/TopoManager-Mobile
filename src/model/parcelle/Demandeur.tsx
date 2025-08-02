import { ActeNaissance } from "./ActeNaissance";
import { CIN } from "./CIN";

export class Demandeur {
  type: number; // 0 personne physique, 1 personne morale
  nom: string;
  prenom: string;
  neVers: boolean;
  dateNaissance: Date;
  lieuNaissance: string;
  sexe: number;
  adresse: string;
  nomPere: string;
  nomMere: string;
  situation: string;
  nomConjoint: string;
  piece: number; // 1 cin, 2 acte, 3 rien
  cin: CIN;
  acte: ActeNaissance;
  denomination: string;
  typeMorale: number;
  dateCreation: string;
  siege: string;
  observations: string;

  constructor(
    type: number,
    nom: string,
    prenom: string,
    neVers: boolean,
    dateNaissance: Date,
    lieuNaissance: string,
    sexe: number,
    adresse: string,
    nomPere: string,
    nomMere: string,
    situation: string,
    nomConjoint: string,
    piece: number,
    cin: CIN,
    acte: ActeNaissance,
    denomination: string,
    typeMorale: number,
    dateCreation: string,
    siege: string,
    observations: string
  ) {
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
  }
}