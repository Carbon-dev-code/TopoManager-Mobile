// schema.ts
import { toTypedRxJsonSchema, ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, } from 'rxdb';

// ─── PARCELLE ─────────────────────────────────────────────────────────────────
const parcelleSchemaLiteral = {
  version: 0,
  primaryKey: 'code',
  type: 'object',
  properties: {
    code:                { type: 'string', maxLength: 100 },
    id_personne:         { type: 'string' },
    dateCreation:        { type: 'string' },
    status:              { type: ['number', 'null'] },
    anneeOccup:          { type: ['number', 'null'] },
    categorie:           { type: ['string', 'null'] },
    consistance:         { type: ['string', 'null'] },
    oppossition:         { type: 'boolean', default: false },
    revandication:       { type: 'boolean', default: false },
    observation:         { type: 'string',  default: '' },
    synchronise:         { type: 'number',  default: 0 },  // 0 non sync | 1 sync | 2 erreur
    syncError:           { type: 'string',  default: '' },
    lastSync:            { type: 'string',  default: '' },
    syncing:             { type: 'boolean', default: false },

    // Objets imbriqués stockés tels quels — NoSQL natif
    demandeurs:          { type: 'array',          items: { type: 'object' } },
    riverin:             { type: 'array',          items: { type: 'object' } },
    polygone:            { type: 'array',          items: { type: 'object' } },
    photos:              { type: 'array',          items: { type: 'string' } },
    parametreTerritoire: { type: ['object', 'null'] },
  },
  required: ['code', 'id_personne', 'dateCreation'],
  indexes: ['id_personne', 'synchronise', 'dateCreation'],
} as const;

const parcelleTyped = toTypedRxJsonSchema(parcelleSchemaLiteral);
export type ParcelleDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof parcelleTyped>;
export const parcelleSchema: RxJsonSchema<ParcelleDocType> = parcelleSchemaLiteral;


// ─── DEMANDEUR ────────────────────────────────────────────────────────────────
// Stocké séparément pour permettre les recherches par nom / CIN / etc.
// sans avoir à charger toutes les parcelles
const demandeurSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:             { type: 'string', maxLength: 100 },
    parcelle_code:  { type: 'string' },        // référence souple vers Parcelle.code
    type:           { type: 'number' },         // 0 physique | 1 morale
    nom:            { type: ['string', 'null'] },
    prenom:         { type: ['string', 'null'] },
    neVers:         { type: 'boolean', default: false },
    dateNaissance:  { type: ['string', 'null'] },
    lieuNaissance:  { type: ['string', 'null'] },
    sexe:           { type: 'number',  default: 0 },
    adresse:        { type: 'string',  default: '' },
    nomPere:        { type: 'string',  default: '' },
    nomMere:        { type: 'string',  default: '' },
    situation:      { type: 'string',  default: '0' },
    nomConjoint:    { type: 'string',  default: '' },
    piece:          { type: 'number',  default: 2 },   // 1 CIN | 2 Acte | 3 rien
    denomination:   { type: 'string',  default: '' },
    typeMorale:     { type: 'number',  default: 0 },
    dateCreation:   { type: 'string',  default: '' },
    siege:          { type: 'string',  default: '' },
    observations:   { type: 'string',  default: '' },
    indexPhoto:     { type: ['number', 'null'] },

    // CIN et ActeNaissance stockés en tant qu'objets imbriqués
    cin:    { type: ['object', 'null'] },
    acte:   { type: ['object', 'null'] },
    photos: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'parcelle_code', 'type'],
  indexes: ['parcelle_code', 'nom'],
} as const;

const demandeurTyped = toTypedRxJsonSchema(demandeurSchemaLiteral);
export type DemandeurDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof demandeurTyped>;
export const demandeurSchema: RxJsonSchema<DemandeurDocType> = demandeurSchemaLiteral;