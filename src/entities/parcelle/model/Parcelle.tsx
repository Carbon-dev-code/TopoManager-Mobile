import { Preferences } from "@capacitor/preferences";
import { ParametreTerritoire } from "../../territoire/model/ParametreTerritoire";
import { Polygone } from "../../../shared/lib/vecteur/Polygone";
import { Demandeur } from "../../demandeur/model/Demandeur";
import { Riverin } from "./Riverin";

export async function checkParcelle(parcelle: Parcelle): Promise<void> {
    const result = await Preferences.get({ key: "id_session" });
    if (!result.value) {
        throw new Error("Utilisateur non connecté ou session invalide");
    }
    parcelle.id_personne = result.value;
    parcelle.code = parcelle.code?.trim() ?? '';
    parcelle.observation = parcelle.observation?.trim() ?? '';

    if (!parcelle.code) throw new Error("Code parcelle requis");
    if (!parcelle.dateCreation) throw new Error("Date de création vide");
    
    if (!parcelle.origine) throw new Error("Origine require !");
    
    if (!parcelle.anneeOccup) throw new Error("Veuillez insérer l'année d'occupation");
    else if (parcelle.anneeOccup<= 1) throw new Error("l'année d'occupation doit etre superieur a 1 an minimun");

    if (parcelle.demandeurs.length <= 0) throw new Error("Veuillez sélectionner au moins 1 demandeur");
    if (parcelle.riverin.length <= 0) throw new Error("Veuillez sélectionner au moins 1 riverin");  
}

export class Parcelle {
    code: string | null;
    id_personne: string | null;
    dateCreation: string | null;
    status: number | null;
    origine: string | null;
    anneeOccup: number | null;
    categorie: string | null;
    consistance: string | null;
    oppossition: boolean;
    observationOpposition: string | null;;
    revandication: boolean;
    observationRevendication: string | null;;
    observation: string;
    demandeurs: Demandeur[];
    parametreTerritoire: ParametreTerritoire | null;
    riverin: Riverin[];
    synchronise?: number;
    syncError?: string;
    lastSync?: string;
    syncing?: boolean;
    polygone: Polygone[]
    photos: string[];

    constructor(code: string | null, dateCreation: string | null, status: number | null, origine: string | null,
        anneeOccup: number | null, categorie: string | null, consistance: string | null, opposition: boolean, observationOpposition: string, revandication: boolean, observationRevendication: string, 
        observation: string, demandeurs: Demandeur[], parametreterritoire: ParametreTerritoire | null, riverin: Riverin[],
        synchronise: number, syncError: string, lastSync: string, syncing: boolean,
        polygone: Polygone[], photos: string[] = [], id_personne: string | null = null
    ) {
        this.code = code;
        this.dateCreation = dateCreation;
        this.status = status;
        this.origine = origine;
        this.anneeOccup = anneeOccup
        this.demandeurs = demandeurs;
        this.parametreTerritoire = parametreterritoire;
        this.categorie = categorie;
        this.consistance = consistance;
        this.oppossition = opposition;
        this.observationOpposition = observationOpposition;
        this.revandication = revandication;
        this.observationRevendication = observationRevendication;
        this.observation = observation;
        this.riverin = riverin;
        this.synchronise = synchronise;
        this.syncError = syncError;
        this.lastSync = lastSync;
        this.syncing = syncing
        this.polygone = polygone
        this.photos = photos;
        this.id_personne = id_personne;
    }

    static init(): Parcelle {
        return new Parcelle(null, null, null, null, null, null, null, false, '', false, '', '', [], null, [], 0, '', '', false, [], [], null);
    }
}
