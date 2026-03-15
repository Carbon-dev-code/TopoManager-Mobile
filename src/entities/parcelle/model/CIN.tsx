export class CIN {
  numero?: string;
  date?: string | null;
  lieu?: string;

  constructor(numero?: string, date?: string | null, lieu?: string){
    this.numero = numero;
    this.date = date;
    this.lieu = lieu;
  }
}
