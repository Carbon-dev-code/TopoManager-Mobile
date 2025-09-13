import { Demandeur } from "./Demandeur";

export class Riverin {
    repere: number | null;
    observation: string;
    demandeur: Demandeur | null;

    constructor(repere: number | null, observation: string, demandeur: Demandeur | null) {
        this.repere = repere;
        this.observation = observation;
        this.demandeur = demandeur;

    }

    static init(): Riverin {
        return new Riverin(null,  '', null);
    }

}