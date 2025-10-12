import { withCORS } from '../_cors';

const SYS_PROMPT = `You are a disciplined market analyst. 
Return JSON with fields: direction ("up"|"down"|"flat"), confidence (0-100), 
span {min,avg,max}, and reasons (string[3]). Keep it short and actionable.`;

export const onRequest = withCORS(async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Use POST', { status: 405 });
  }
  const { symbol = 'AAPL', price, span = {} } = await request.json().catch(()=> ({}));

  // --- fallback demo bez API klíče ---
  if (!env.OPENAI_API_KEY) {
    const avg = span.avg ?? price ?? 200;
    const out = {
      direction: avg >= (price ?? avg) ? 'up' : 'flat',
      confidence: span.conf ?? 60,
      span: { min: span.min ?? Math.round(avg*0.7), avg, max: span.max ?? Math.round(avg*1.3) },
      reasons: [
        'Demo: bez LLM vracím rule-based výstup.',
        `Základní pásmo z UI: ${span.min ?? '-'} / ${avg} / ${span.max ?? '-'}.`,
        'Zapni OPENAI_API_KEY pro skutečný AI výpočet.'
      ]
    };
    return json(out);
  }

  // --- reálné volání OpenAI (Cloudflare fetch) ---
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYS_PROMPT },
      { role: 'user', content: `Symbol: ${symbol}\nPoslední cena: ${price}\nSpan z UI: ${JSON.stringify(span)}` }
    ],
    response_format: { type: 'json_object' }
  };

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const msg = await r.text();
    return json({ error: 'openai_failed', details: msg }, 502);
  }

  const data = await r.json();
  // výsledek je v data.choices[0].message.content jako JSON string
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  return json(parsed);
});

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
