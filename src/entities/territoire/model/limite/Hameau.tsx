export class Hameau {
  idhameau: number;
  codehameau: string;
  nomhameau: string;

  constructor(id: number, code: string, nom: string){
    this.idhameau = id;
    this.codehameau = code;
    this.nomhameau = nom;
  }
}
