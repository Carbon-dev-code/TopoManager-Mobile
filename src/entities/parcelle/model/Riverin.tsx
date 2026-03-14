import { PersonnePhysique } from "../../demandeur/model/PersonnePhysique";
import { PersonneMorale } from "../../demandeur/model/PersonneMorale";

export type TypeRiverin = "personne" | "autre";

export function checkRiverin(riverin: Riverin): void {
  if (!riverin.repere?.trim())
    throw new Error("Le repère du riverin est requis");

  if (riverin.type === "personne") {
    if (!riverin.personnePhysique && !riverin.personneMorale) {
      throw new Error("Veuillez sélectionner une personne pour le riverin");
    }
  }

  if (riverin.type === "autre") {
    if (!riverin.nom?.trim()) throw new Error("La désignation du riverin est requis");
  }
}

export class Riverin {
  repere: string | null;
  type: TypeRiverin;
  nom: string | null;
  personnePhysique: PersonnePhysique | null;
  personneMorale: PersonneMorale | null;
  typePersonne: 0 | 1 | null;
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
