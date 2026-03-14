export class CIN {
  numero?: string[];
  date?: Date | null;
  lieu?: string;

  constructor(numero?: string[], date?: Date | null, lieu?: string){
    this.numero = numero;
    this.date = date;
    this.lieu = lieu;
  }
}
