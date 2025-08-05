import { ParametreTerritoire } from "../ParametreTerritoire";
import { Polygone } from "../vecteur/Polygone";
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
    synchronise?: number; // 0 non sync 1 sync 2 misy blem
    syncError?: string;
    lastSync?: string;
    syncing?: boolean; // etat du spinner
    polygone: Polygone[]


    constructor(code: string | null, dateCreation: string | null, status: number | null,
        anneeOccup: number | null, categorie: number | null, consistance: string | null, opposition: boolean, revandication: boolean,
        observation: string, demandeurs: Demandeur[], parametreterritoire: ParametreTerritoire | null, riverin: Riverin[],
        synchronise: number, syncError: string, lastSync:string, syncing: boolean,
        polygone: Polygone[]
    ) {
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
        this.synchronise = synchronise;
        this.syncError = syncError;
        this.lastSync = lastSync;
        this.syncing = syncing
        this.polygone = polygone
    }

    static init(): Parcelle {
        return new Parcelle(null, null, null, null, null, null, false, false, '', [], null, [], 0, '', '', false,[])
    }

}