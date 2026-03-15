export class ActeNaissance {
  numero?: string | null;
  date?: string | null;
  lieu?: string | null;

  constructor(numero?: string | null, date?: string | null, lieu?: string | null){
    this.numero = numero;
    this.date = date;
    this.lieu = lieu;
  }
}
