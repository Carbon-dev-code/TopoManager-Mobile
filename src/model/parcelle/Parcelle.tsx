import { ParametreTerritoire } from "../ParametreTerritoire";
import { Demandeur } from "./Demandeur";
import { Riverin } from "./Riverin";

export class Parcelle {
    code: string | null;
    dateCreation: string | null;
    status: number | null;
    anneeOccup: number | null;
    categorie: number | null;
    consistance: string | null;
    oppossition: boolean;
    revandication: boolean;
    observation: string;
    demandeurs: Demandeur[];
    parametreTerritoire: ParametreTerritoire | null;
    riverin: Riverin[];

    constructor(code: string | null, dateCreation: string | null, status: number | null,
        anneeOccup: number | null, categorie: number | null, consistance: string | null, opposition: boolean, revandication: boolean,
        observation: string, demandeurs: Demandeur[], parametreterritoire: ParametreTerritoire | null, riverin: Riverin[]) {
        this.code = code;
        this.dateCreation = dateCreation;
        this.status = status;
        this.anneeOccup = anneeOccup
        this.demandeurs = demandeurs;
        this.parametreTerritoire = parametreterritoire,
        this.categorie = categorie;
        this.consistance = consistance;
        this.oppossition = opposition;
        this.revandication = revandication;
        this.observation = observation;
        this.riverin = riverin;
    }

    static init(): Parcelle {
        return new Parcelle(null, null, null, null, null, null, false, false, '', [], null, [])
    }

}