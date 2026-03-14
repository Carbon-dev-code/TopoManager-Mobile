export const LAYER_ORDER = [
  "region",
  "district",
  "commune",
  "fokontany",
  "ipss",
  "demandecf",
  "requisition",
  "titre",
  "certificat",
  "cadastre",
  "demandefn",
] as const;

export const STYLE_CONFIG = {
  ipss: { stroke: "rgba(5, 59, 255,1)", fill: "rgba(5,59,255,0.3)" },
  certificat: { stroke: "rgba(251,255,0,1)", fill: "rgba(251,255,0,0.3)" },
  demandecf: { stroke: "rgba(148,52,211,1)", fill: "rgba(148,52,211,0.3)" },
  requisition: { stroke: "rgba(76, 211, 52, 1)", fill: "rgba(76, 211, 52,0.3)"},
  titre: { stroke: "rgba(255,0,0,1)", fill: "rgba(255,0,0,0.3)" },
  region: { stroke: "rgba(0, 100, 0, 1)", fill: "rgba(0, 100, 0, 0.1)" },
  district: { stroke: "rgba(0, 150, 0, 1)", fill: "rgba(0, 150, 0, 0.1)" },
  commune: { stroke: "rgba(0, 200, 0, 1)", fill: "rgba(0, 200, 0, 0.1)" },
  fokontany: { stroke: "rgba(0, 250, 0, 1)", fill: "rgba(0, 250, 0, 0.1)" },
  cadastre: { stroke: "rgba(200, 100, 0, 1)", fill: "rgba(200, 100, 0, 0.2)" },
  demandefn: { stroke: "rgba(100, 0, 200, 1)", fill: "rgba(100, 0, 200,0.3)" },
  parcelle: { stroke: "rgb(255, 147, 5)", fill: "rgba(255, 147, 5, 0.2)" },
} as const;

export const LABEL_MAP = {
  requisition: "num_requisition",
  certificat: "numerocertificat",
  ipss: "code_parcelle",
  demandecf: "numdemande",
  titre: "titres_req",
  parcelle: "code",
} as const;
