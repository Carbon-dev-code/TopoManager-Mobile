export class Riverin {
    repere: number | null;
    observation: string;

    constructor(repere: number | null, observation: string) {
        this.repere = repere;
        this.observation = observation;

    }

    static init(): Riverin {
        return new Riverin(null,  '');
    }

}