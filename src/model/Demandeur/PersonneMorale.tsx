import { v4 as uuidv4 } from 'uuid';
import { RepresentantMoral } from "./RepresentantMoral";

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
    return new PersonneMorale( uuidv4(),  "", 0, "", "", "", []);
  }
}