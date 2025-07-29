import { Fokontany } from "./Fokontany";

export class Commune {
  idcommune: number;
  codecommune: string;
  nomcommune: string;
  fokontany: Fokontany[];

  constructor(id: number, code: string, nom: string, fokontany?: Fokontany[]) {
    this.idcommune = id;
    this.codecommune = code;
    this.nomcommune = nom;
    this.fokontany = fokontany ?? [];
  }
}