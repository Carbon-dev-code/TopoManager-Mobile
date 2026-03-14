import { Hameau } from "./Hameau";

export class Fokontany {
  idfokontany: number;
  codefokontany: string;
  nomfokontany: string;
  hameaux: Hameau[];

  constructor(id: number, code: string, nom: string, hameau?: Hameau[]){
    this.idfokontany = id;
    this.codefokontany = code;
    this.nomfokontany = nom;
    this.hameaux = hameau?? [];
  }
}
