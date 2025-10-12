// Spojí technické scénáře + news do jednoho verdiktu
export function fuse({scenarios, reasons, span, confidence}){
  const direction = span.avg >= span.min && span.avg <= span.max
    ? (span.avg >= span.min + (span.max-span.min)/2 ? 'up' : 'flat')
    : 'flat';
  return {
    direction,
    confidence,
    scenarios,
    reasons
  };
}
