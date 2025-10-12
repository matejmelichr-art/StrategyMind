// Jednotný wrapper na GPT-4o s JSON “strict mode” přes system prompt
export async function askLLM({prompt, schema, apiKey}) {
  // v client demu jen mock – reálné volání dej později na server
  return { ok:true, content: JSON.stringify({ note:'demo-llm' }) };
}
