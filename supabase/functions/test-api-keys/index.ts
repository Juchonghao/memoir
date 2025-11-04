Deno.serve(async (req) => {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  return new Response(JSON.stringify({
    hasGeminiKey: !!geminiKey,
    geminiKeyLength: geminiKey?.length || 0,
    hasOpenAIKey: !!openaiKey,
    openaiKeyLength: openaiKey?.length || 0,
    geminiKeyPrefix: geminiKey?.substring(0, 10) || 'N/A'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
