// types.ts
export interface ParametreTerritoire {
  region: {
    id: number;
    code: string;
    nom: string;
  };
  district: {
    id: number;
    code: string;
    nom: string;
  };
  commune: {
    id: number;
    code: string;
    nom: string;
  };
  fokontany: {
    id: number;
    code: string;
    nom: string;
  };
  hameau: {
    id: number;
    code: string;
    nom: string;
  };
  code_parcelle: number; // Ajouté ici
  dateSelection: string;
}