// Výpočty základních indikátorů (bez knihoven, zatím demo)
export function sma(values, period) {
  if (values.length < period) return [];
  const out=[]; let sum=0;
  for (let i=0;i<values.length;i++){
    sum += values[i];
    if (i>=period) sum -= values[i-period];
    if (i>=period-1) out.push(sum/period);
  }
  return out;
}

export function rsi(closes, period=14){
  if (closes.length < period+1) return null;
  let gains=0, losses=0;
  for (let i=1;i<=period;i++){
    const diff = closes[i]-closes[i-1];
    if (diff>=0) gains += diff; else losses -= diff;
  }
  let rs = (gains/period)/((losses/period)||1e-9);
  let rsi = 100 - 100/(1+rs);
  return Number(rsi.toFixed(2));
}
