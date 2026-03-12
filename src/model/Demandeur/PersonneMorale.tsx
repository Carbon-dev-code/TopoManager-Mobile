import { v4 as uuidv4 } from "uuid";
import { RepresentantMoral } from "./RepresentantMoral";

export function checkPersonneMorale(personne: PersonneMorale): void {
  if (!personne.denomination?.trim())
    throw new Error("La dénomination est requise");
  if (!personne.dateCreation?.trim())
    throw new Error("La date de création est requise");
  if (!personne.siege?.trim()) 
    throw new Error("Le siège social est requis");
  if (isNaN(Number(personne.typeMorale)))
    throw new Error("Le type de personne morale est invalide");
}

export class PersonneMorale {
  id: string;
  denomination: string;
  typeMorale: number;
  dateCreation: string;
  siege: string;
  observations: string;
  representant: RepresentantMoral[];

  constructor(
    id: string,
    denomination: string,
    typeMorale: number,
    dateCreation: string,
    siege: string,
    observations: string,
    representant: RepresentantMoral[],
  ) {
    this.id = id;
    this.denomination = denomination;
    this.typeMorale = typeMorale;
    this.dateCreation = dateCreation;
    this.siege = siege;
    this.observations = observations;
    this.representant = representant;
  }

  static init(): PersonneMorale {
    return new PersonneMorale(uuidv4(), "", 0, "", "", "", []);
  }
}
