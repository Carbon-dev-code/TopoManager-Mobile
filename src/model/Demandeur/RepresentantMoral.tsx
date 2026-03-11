import { PersonnePhysique } from "./PersonnePhysique"

export class RepresentantMoral {
  personnePhysique!: PersonnePhysique
  role!: "dirigeant" | "gerant" | "mandataire"
}