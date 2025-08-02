export class ActeNaissance {
  numero: string;
  date: Date;
  lieu: string;

  constructor(numero: string, date: Date, lieu: string){
    this.numero = numero;
    this.date = date;
    this.lieu = lieu
  }
}