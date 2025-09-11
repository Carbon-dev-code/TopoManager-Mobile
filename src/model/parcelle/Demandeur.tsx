import { ActeNaissance } from "./ActeNaissance";
import { CIN } from "./CIN";
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export class Demandeur {
  id: string;
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

  // 🔹 Nouvelle propriété pour stocker les photos
  // On stocke une liste d'URI ou Base64 pour gérer plusieurs photos
  photos: string[];

  constructor(
    id: string,
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
    observations: string,
    photos: string[] = [] // 🔹 valeur par défaut = tableau vide
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
    this.photos = photos; // 🔹 initialisation de la liste de photos
  }

  // 🔹 Méthode statique pour initialiser un Demandeur vide
  static init(): Demandeur {
    return new Demandeur(
      uuidv4(), 0, '', '', false, null, '', 0, '', '', '', '0', '', 2,
      null, null, '', 0, '', '', '',
      [] // 🔹 initialisation des photos vide
    );
  }

  // 🔹 Méthodes utilitaires pour manipuler les photos
  addPhoto(photo: string) {
    this.photos.push(photo); // ajoute une photo
  }

  removePhoto(index: number) {
    if (index >= 0 && index < this.photos.length) {
      this.photos.splice(index, 1); // supprime une photo spécifique
    }
  }

  clearPhotos() {
    this.photos = []; // supprime toutes les photos
  }
}