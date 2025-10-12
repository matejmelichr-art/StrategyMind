import { withCORS } from '../_cors';

const SYS_PROMPT = `You are an "AI ekonom". 
Summarize latest macro + company context for the ticker.
Return JSON: { summary: string, bullets: string[] } in Czech, concise.`;

export const onRequest = withCORS(async ({ request, env }) => {
  if (request.method !== 'POST') return new Response('Use POST', { status: 405 });
  const { symbol = 'AAPL', horizon = 'W', locale = 'cs' } = await request.json().catch(()=> ({}));

  if (!env.OPENAI_API_KEY) {
    return json({
      summary: `Demo shrnutí (${symbol} • ${horizon}). Přidej OPENAI_API_KEY pro skutečné zprávy.`,
      bullets: [
        'Makro: demo — žádná online data.',
        'Firma: demo — žádný živý zdroj.',
        'Doporučení: zapnout AI v Cloudflare Pages → Vars.'
      ]
    });
  }

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYS_PROMPT },
      { role: 'user', content: `Ticker: ${symbol}\nHorizont: ${horizon}\nJazyk: ${locale}` }
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
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  return json(parsed);
});

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
