import { ParametreTerritoire } from "../ParametreTerritoire";
import { Demandeur } from "./Demandeur";
import { Riverin } from "./Riverin";

export class Parcelle {
    code: string;
    dateCreation: Date;
    status: number;
    anneeOccup:number;
    categorie:number;
    consistance:string;
    oppossition:boolean;
    revandication:boolean;
    observation:string;
    demandeurs: Demandeur[];
    parametreTerritoire: ParametreTerritoire;
    riverin: Riverin[]

    constructor(code: string, dateCreation: Date, status: number, 
        anneeOccup: number, categorie: number, consistance: string, opposition: boolean, revandication: boolean,
        observation: string, demandeurs: Demandeur[], parametreterritoire: ParametreTerritoire, riverin: Riverin[]){
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

}