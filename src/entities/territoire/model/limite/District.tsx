import { Commune } from "./Commune";

export class District {
  iddistrict: number;
  codedistrict: string;
  nomdistrict: string;
  communes: Commune[];

   constructor(id: number, code: string, nom: string, communes?: Commune[]){
      this.iddistrict = id;
      this.codedistrict = code;
      this.nomdistrict = nom;
      this.communes = communes ?? [];
    }
}
