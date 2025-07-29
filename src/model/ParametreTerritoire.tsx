import { District } from './limite/District';
import { Commune } from './limite/Commune';
import { Fokontany } from './limite/Fokontany';
import { Hameau } from './limite/Hameau';
import { Territoire } from './Territoire';

export class ParametreTerritoire {
  id: string;
  region: Territoire;
  district: District;
  commune: Commune;
  fokontany: Fokontany;
  hameau: Hameau;
  code_parcelle: number;
  increment: number;
  dateSelection: string;

  constructor(data: {id: string, region: any; district: District; commune: Commune; fokontany: Fokontany; hameau: Hameau; increment: number; dateSelection: string; code_parcelle: number;}) {
    this.code_parcelle = data.code_parcelle;
    this.increment = data.increment;
    this.id = data.id;
    this.region = data.region;
    this.district = data.district;
    this.commune = data.commune;
    this.fokontany = data.fokontany;
    this.hameau = data.hameau;
    this.dateSelection = data.dateSelection;
  }
}
