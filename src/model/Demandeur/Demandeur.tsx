import { v4 as uuidv4 } from "uuid";
import { PersonnePhysique } from "../Demandeur/PersonnePhysique";
import { PersonneMorale } from "../Demandeur/PersonneMorale";

export class Demandeur {
  id: string;
  type: 0 | 1 | null;
  personnePhysique: PersonnePhysique;
  personneMorale: PersonneMorale;
  representanType: string | null;

  constructor(
    id: string,
    type: 0 | 1 | null,
    personnePhysique: PersonnePhysique,
    personneMorale: PersonneMorale,
    representanType: string | null,
  ) {
    this.id = id;
    this.type = type;
    this.personnePhysique = personnePhysique;
    this.personneMorale = personneMorale;
    this.representanType = representanType;
  }

  static init(): Demandeur {
    return new Demandeur(
      uuidv4(),
      null,
      PersonnePhysique.init(),
      PersonneMorale.init(),
      null,
    );
  }
}