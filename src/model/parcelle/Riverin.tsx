import { PersonnePhysique } from "../Demandeur/PersonnePhysique";
import { PersonneMorale } from "../Demandeur/PersonneMorale";

export type TypeRiverin = "personne" | "autre";

export class Riverin {
  repere: string | null;
  type: TypeRiverin;
  nom: string | null;
  personnePhysique: PersonnePhysique | null;
  personneMorale: PersonneMorale | null;
  typePersonne: 0 | 1 | null;  // ← pour savoir lequel afficher
  observation: string;

  constructor(
    repere: string | null,
    type: TypeRiverin = "personne",
    nom: string | null = null,
    personnePhysique: PersonnePhysique | null = null,
    personneMorale: PersonneMorale | null = null,
    typePersonne: 0 | 1 | null = null,
    observation: string = "",
  ) {
    this.repere = repere;
    this.type = type;
    this.nom = nom;
    this.personnePhysique = personnePhysique;
    this.personneMorale = personneMorale;
    this.typePersonne = typePersonne;
    this.observation = observation;
  }

  static init(): Riverin {
    return new Riverin(null, "personne", null, null, null, null, "");
  }
}