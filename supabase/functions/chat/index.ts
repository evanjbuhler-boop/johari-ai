import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    console.log('Processing chat request, type:', type, 'messages:', messages.length);

    // For conversation mode
    if (type === 'conversation') {
      const exchangeCount = Math.floor(messages.filter((m: any) => m.role === 'user').length);
      
      let systemPrompt = `You are a compassionate emotional wellness counselor. Have a natural, empathetic conversation with the user about their day and emotional state. 

Current exchange: ${exchangeCount}/5

Your goal is to:
1. Understand their emotional state (anxious, sad, frustrated, overwhelmed, exhausted, calm, motivated, etc.)
2. Gently extract information about: stress levels, sleep quality, exercise habits, diet, caffeine intake, and any conflicts or difficult interactions
3. Be conversational and natural - don't make it feel like an interrogation

Keep responses brief (2-3 sentences) and empathetic. Ask one question at a time.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          messages: messages,
          system: systemPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Claude API error:', response.status, error);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Claude response received');
      
      return new Response(
        JSON.stringify({ content: data.content[0].text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For results generation
    if (type === 'results') {
      const systemPrompt = `You are an expert psychological counselor. Based on the conversation, provide:

1. A 2-3 sentence empathetic reflection on what the person shared
2. A psychological framework or concept that explains what they're experiencing (be specific with the framework name)
3. Recommendations: a podcast episode, an article, and a coping technique
4. A relevant story or parable that relates to their situation

Format your response as JSON with this structure:
{
  "reflection": "string",
  "framework": "string",
  "recommendations": {
    "podcast": "string",
    "article": "string",
    "technique": "string"
  },
  "story": "string"
}`;

      const conversationSummary = messages.map((m: any) => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `Based on this conversation, provide the psychological analysis and recommendations:\n\n${conversationSummary}`
            }
          ],
          system: systemPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Claude API error:', response.status, error);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Results generated');
      
      // Parse the JSON response from Claude
      const resultsText = data.content[0].text;
      let results;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = resultsText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e) {
        console.error('Failed to parse results:', e);
        // Fallback to a basic structure
        results = {
          reflection: resultsText,
          framework: "General stress response theory",
          recommendations: {
            podcast: "Try 'The Happiness Lab' by Dr. Laurie Santos",
            article: "Search for 'The Science of Self-Care' on Greater Good Magazine",
            technique: "Practice the 3-3-3 Rule for anxiety: Name 3 things you see, 3 sounds you hear, and move 3 parts of your body."
          },
          story: "There's wisdom in taking one day at a time and being gentle with yourself during challenging periods."
        };
      }
      
      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid request type');

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
