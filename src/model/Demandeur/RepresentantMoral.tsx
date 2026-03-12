import { PersonnePhysique } from "./PersonnePhysique";

export class RepresentantMoral {
  personnePhysique: PersonnePhysique;
  role: "representant";

  constructor(personnePhysique: PersonnePhysique, role: "representant") {
    this.personnePhysique = personnePhysique;
    this.role = role;
  }
}