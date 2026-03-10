import { v4 as uuidv4 } from 'uuid';

export class PersonneMorale {
  id: string;
  denomination: string;
  typeMorale: number;
  dateCreation: string;
  siege: string;
  adresse: string;
  observations: string;
  photos: string[];
  indexPhoto: number | null;

  constructor(
    id: string,
    denomination: string,
    typeMorale: number,
    dateCreation: string,
    siege: string,
    adresse: string,
    observations: string,
    photos: string[],
    indexPhoto: number | null,
  ) {
    this.id = id;
    this.denomination = denomination;
    this.typeMorale = typeMorale;
    this.dateCreation = dateCreation;
    this.siege = siege;
    this.adresse = adresse;
    this.observations = observations;
    this.photos = photos;
    this.indexPhoto = indexPhoto;
  }

  static init(): PersonneMorale {
    return new PersonneMorale(
      uuidv4(),
      "", 0, "", "", "", "", [], null,
    );
  }
}