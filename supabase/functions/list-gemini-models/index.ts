Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'No API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 尝试v1版本
    const v1Response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`
    );
    const v1Data = await v1Response.json();

    // 尝试v1beta版本
    const v1betaResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
    );
    const v1betaData = await v1betaResponse.json();

    return new Response(JSON.stringify({
      v1: {
        status: v1Response.status,
        data: v1Data
      },
      v1beta: {
        status: v1betaResponse.status,
        data: v1betaData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
