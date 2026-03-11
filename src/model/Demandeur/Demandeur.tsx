import { Representant } from "./Representant";

export class Demandeur {
  id!: string;
  type: 0 | 1 = 0;
  personnePhysiqueId?: string; // → PersonnePhysique.id  (si type = "physique")
  personneMoraleId?: string; // → PersonneMorale.id    (si type = "morale")
  representants?: Representant[]; // renseigné si mineur/incapable
}
