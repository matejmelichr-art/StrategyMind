// Přijímá pole headline/notes, vrací 3–5 “co to znamená pro investory”
export function summarizeNews(items=[]) {
  const top = items.slice(0,5);
  if (top.length===0) return ['Zprávy zatím chybí.'];
  return top.map(t => t.replace(/^\s*[-•]\s*/,'')).slice(0,3);
}
