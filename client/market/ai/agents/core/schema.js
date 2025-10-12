// Jednotné schéma, které dostává UI (graf, karty, Jarvis panel)
export const VerdictSchema = {
  type: 'object',
  required: ['direction','confidence','span','scenarios','reasons','invalidations'],
  properties: {
    direction: { enum: ['up','down','flat'] },
    confidence: { type:'number' },
    span: {
      type:'object', required:['min','avg','max'],
      properties:{ min:{type:'number'}, avg:{type:'number'}, max:{type:'number'} }
    },
    scenarios: { type:'array' },
    reasons: { type:'array', items:{type:'string'} },
    invalidations: { type:'array', items:{type:'string'} }
  }
};
