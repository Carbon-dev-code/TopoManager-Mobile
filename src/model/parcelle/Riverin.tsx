import { Demandeur } from "./Demandeur";

export class Riverin {
    repere: string | null;
    observation: string;
    demandeur: Demandeur | null;

    constructor(repere: string | null, observation: string, demandeur: Demandeur | null) {
        this.repere = repere;
        this.observation = observation;
        this.demandeur = demandeur;

    }

    static init(): Riverin {
        return new Riverin(null,  '', null);
    }

}