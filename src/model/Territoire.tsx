import { District } from "./limite/District";

// types.ts
export class Territoire {
    idregion: number;
    coderegion: string;
    nomregion: string;
    districts: District[];

    constructor(id:number, code: string, nom: string, district?: District[]){
        this.idregion = id;
        this.coderegion = code;
        this.nomregion = nom;
        this.districts = district ?? []
    }

}