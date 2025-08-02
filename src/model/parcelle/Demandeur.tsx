import { ActeNaissance } from "./ActeNaissance";
import { CIN } from "./CIN";
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export class Demandeur {
  id:string;
  type: number; // 0 personne physique, 1 personne morale
  nom: string | null;
  prenom: string | null;
  neVers: boolean;
  dateNaissance: Date | null;
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

  constructor(
    id:string,
    type: number,
    nom: string,
    prenom: string,
    neVers: boolean,
    dateNaissance: Date | null,
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
    observations: string
  ) {
    this.id = id; // ✅
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

  static init(): Demandeur {
    return new Demandeur(
      uuidv4(), 0, '', '', false, null, '', 0, '', '', '', '0', '', 2,
      null, null, '', 0, '', '', ''
    );
  }
}