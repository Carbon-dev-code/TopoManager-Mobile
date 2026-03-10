import { v4 as uuidv4 } from "uuid";
import { PersonnePhysique } from "./PersonnePhysique";
import { PersonneMorale } from "./PersonneMorale";

// ─── Type de droit dans la parcelle ─────────────────────────────
export type TypeDroit =
  | "propriétaire"
  | "usufruitier"
  | "tuteur";

export type TypePersonne = "physique" | "morale";

export class Demandeur {
  id: string;
  typeDroit: TypeDroit;
  typePersonne: TypePersonne;
  personne: PersonnePhysique | PersonneMorale | null;

  constructor(
    id: string,
    typeDroit: TypeDroit,
    typePersonne: TypePersonne,
    personne: PersonnePhysique | PersonneMorale | null,
  ) {
    this.id = id;
    this.typeDroit = typeDroit;
    this.typePersonne = typePersonne;
    this.personne = personne;
  }

  // ─── Type guards ─────────────────────────────────────────────
  isPhysique(): this is Demandeur & { personne: PersonnePhysique } {
    return this.typePersonne === "physique";
  }

  isMorale(): this is Demandeur & { personne: PersonneMorale } {
    return this.typePersonne === "morale";
  }

  static init(): Demandeur {
    return new Demandeur(
      uuidv4(),
      "propriétaire",
      "physique",
      PersonnePhysique.init(),
    );
  }
}
