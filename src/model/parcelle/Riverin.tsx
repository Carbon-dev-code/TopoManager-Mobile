import { Demandeur } from "./DemandeurDTO";

export type TypeRiverin = "personne" | "autre";

export class Riverin {
  repere: string | null;
  type: TypeRiverin;
  nom: string | null;
  demandeur: Demandeur | null;
  observation: string;

  constructor(
    repere: string | null,
    type: TypeRiverin = "personne",
    nom: string | null = null,
    demandeur: Demandeur | null = null,
    observation: string = "",
  ) {
    this.repere = repere;
    this.type = type;
    this.nom = nom;
    this.demandeur = demandeur;
    this.observation = observation;
  }

  static init(): Riverin {
    return new Riverin(null, "personne", null, null, "");
  }
}
