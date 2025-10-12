export function positionSize(equity, riskPct=1, stopDist){
  const risk = equity * (riskPct/100);
  if (!stopDist || stopDist<=0) return 0;
  return Number((risk/stopDist).toFixed(4));
}
