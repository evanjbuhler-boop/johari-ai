import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { messages, type, mock } = await req.json();
    const truthy = (v: unknown) => typeof v === 'string' ? ['true','1','yes','y','on'].includes(v.toLowerCase().trim()) : !!v;
    const useMockAI = truthy(Deno.env.get('USE_MOCK_AI')) || truthy(mock);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!useMockAI && !openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Processing chat request, type:', type, 'messages:', messages.length, 'mock mode:', useMockAI);

    // For conversation mode
    if (type === 'conversation') {
      const exchangeCount = Math.floor(messages.filter((m: any) => m.role === 'user').length);
      
      // Mock mode - return realistic responses without calling API
      if (useMockAI) {
        const userMessage = messages[messages.length - 1].content.toLowerCase();
        const previousMessages = messages.slice(0, -1);
        let mockResponse = '';

        if (exchangeCount === 1) {
          // Mirror and validate first
          if (userMessage.includes('stress') || userMessage.includes('anxious') || userMessage.includes('overwhelmed')) {
            mockResponse = "I'm hearing that stress is really weighing on you right now. That feeling of being anxious and overwhelmed - it's exhausting, isn't it? When did you first notice this intensity building up?";
          } else if (userMessage.includes('fine')) {
            mockResponse = "You say 'fine,' but I'm curious about what's beneath that word. Sometimes 'fine' can mean we're managing, but not necessarily thriving. What's been occupying your thoughts lately?";
          } else {
            mockResponse = "I'm picking up on what you're sharing - there's a lot happening for you right now. What part of your day has been sitting heaviest on your mind?";
          }
        } else if (exchangeCount === 2) {
          const context = userMessage.includes('work') ? 'work pressures' : 'what you are dealing with';
          mockResponse = `Okay, so you have got that going on. I'm noticing you mentioned earlier about ${context}. How has that been affecting your ability to rest? Are you actually getting restorative sleep, or just time in bed?`;
        } else if (exchangeCount === 3) {
          mockResponse = "I hear you on the rest piece. Now I'm wondering - when you think about how you are fueling yourself physically, how does that look? Not just what you are eating, but are you feeling energized or running on empty?";
        } else if (exchangeCount === 4) {
          const context = previousMessages.length > 2 ? 'some of the external stuff' : 'your situation';
          mockResponse = `That makes sense given everything you have shared. One thing I'm curious about - you mentioned ${context}. Have there been any specific interactions or conflicts with people that have stuck with you?`;
        } else {
          const context = userMessage.includes('conflict') ? 'those difficult interactions' : 'everything';
          mockResponse = `I'm getting a fuller picture now of what you are carrying. The way you have described ${context} - that's real, and it's affecting you. Let me reflect back what I'm hearing, and we will find some ways forward.`;
        }

        console.log('Returning mock response for exchange:', exchangeCount);
        return new Response(
          JSON.stringify({ content: mockResponse }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build context of previous exchanges for continuity
      const previousExchanges = messages.slice(0, -1).map((m: any) => 
        `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`
      ).join('\n');

      let systemPrompt = `You are a deeply empathetic emotional wellness counselor with training in reflective listening, psychological mirroring, and validation techniques.

CRITICAL RULES FOR ENGAGEMENT:

1. FIRST RESPONSE MUST DEEPLY ACKNOWLEDGE & MIRROR:
   - Repeat back specific phrases/words they used
   - Name the exact emotion you detect (not just "stressed" - be specific: "overwhelmed," "depleted," "restless")
   - Connect dots between what they shared
   - Read between the lines (e.g., "fine" often means not fine)
   - Validate BEFORE asking anything new
   
   Example: If they say "Fine, lots of exercise (2x a day yesterday); yes I've been getting enough rest"
   Response: "I hear you - you're taking care of the basics. Exercising twice a day and getting rest shows you're prioritizing your physical health. That's important. I'm curious though - when you say 'fine,' I'm sensing there might be more beneath the surface. What's been weighing on you lately?"

2. BUILD ON PREVIOUS EXCHANGES:
   ${previousExchanges ? `Previous conversation:\n${previousExchanges}\n\nYou MUST reference and build upon what was said before. Notice patterns. Use phrases like "You mentioned X earlier, and now Y - I'm noticing..." or "Going back to what you said about..."` : 'This is the first message - deeply acknowledge what they share.'}

3. APPLY PSYCHOLOGICAL TECHNIQUES NATURALLY (don't name them):
   - Reflection: "So what I'm hearing is..." 
   - Validation: "That makes complete sense given..."
   - Normalizing: "Many people feel this way when..."
   - Gentle challenging: "I notice you said X but also mentioned Y... help me understand..."

4. TONE - WARM BUT NOT CORNY:
   - NO: "I'm here for you!" "You're so brave!" "Let's explore this together!"
   - YES: Direct, warm, specific acknowledgment of what they actually said
   - Treat them like an intelligent adult
   - Match their communication style (casual if they're casual, serious if they're serious)

5. ASK GENUINE FOLLOW-UPS, NOT SURVEY QUESTIONS:
   Your questions should feel like genuine curiosity based on what they revealed, not like you're checking boxes.
   Connect current questions to previous answers.

Keep responses 3-4 sentences. Show you're truly listening by being specific about what they shared.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          max_completion_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', response.status, error);
        if (useMockAI) {
          const userMessage = messages[messages.length - 1].content.toLowerCase();
          let mockResponse = '';

          if (exchangeCount === 1) {
            if (userMessage.includes('stress') || userMessage.includes('anxious') || userMessage.includes('overwhelmed')) {
              mockResponse = "I hear that you're feeling stressed. That sounds really challenging. Can you tell me more about what's been weighing on you the most?";
            } else {
              mockResponse = "Thank you for sharing that with me. I'm here to listen. What aspect of your day has been on your mind the most?";
            }
          } else if (exchangeCount === 2) {
            mockResponse = "I appreciate you opening up about that. How have you been taking care of yourself lately? Have you been getting enough rest?";
          } else if (exchangeCount === 3) {
            mockResponse = "That's helpful to know. How about your daily routines - have you been able to maintain healthy eating habits and physical activity?";
          } else if (exchangeCount === 4) {
            mockResponse = "I see. And one last question - have there been any particular conflicts or difficult interactions that stood out to you recently?";
          } else {
            mockResponse = "Thank you for sharing all of that with me. I have a good understanding now.";
          }

          return new Response(
            JSON.stringify({ content: mockResponse }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenAI response received');
      
      return new Response(
        JSON.stringify({ content: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For results generation
    if (type === 'results') {
      // Mock mode - return realistic psychological analysis
      if (useMockAI) {
        const mockResults = {
          reflection: "It sounds like you're navigating a period of transition and growth. The stress you're experiencing seems to stem from balancing multiple responsibilities while trying to maintain your well-being. Your awareness of these challenges is already a positive step forward.",
          framework: "What you're experiencing aligns with the concept of 'cognitive load' - when our mental capacity is stretched across too many demands simultaneously. This is compounded by what psychologists call 'decision fatigue,' where the quality of our decisions deteriorates after making many decisions throughout the day. Your body and mind are signaling the need for more intentional rest and boundary-setting.",
          recommendations: {
            podcast: "Try 'The Happiness Lab' by Dr. Laurie Santos, particularly the episode on managing stress through realistic expectations.",
            article: "'The Science of Self-Care' on Greater Good Magazine explores evidence-based approaches to maintaining emotional balance.",
            technique: "Consider the '3-3-3 Rule' for anxiety: Name 3 things you see, 3 sounds you hear, and move 3 parts of your body. This grounds you in the present moment and interrupts the stress cycle."
          },
          story: "There's an old story of a farmer whose horse ran away. His neighbor said, 'Such bad luck!' The farmer replied, 'Maybe.' The next day, the horse returned with three wild horses. 'How wonderful!' said the neighbor. 'Maybe,' said the farmer. When his son tried to tame one of the wild horses and broke his leg, the neighbor exclaimed, 'How terrible!' The farmer simply said, 'Maybe.' The next week, officers came to draft young men into the army, but the son was excused because of his broken leg. The neighbor congratulated the farmer on his good fortune, to which the farmer responded, 'Maybe.' \n\nThis story reminds us that we can't always see the full picture of how events will unfold. What feels overwhelming today may lead to unexpected growth tomorrow. The key is maintaining perspective and being gentle with ourselves during uncertain times."
        };

        console.log('Returning mock results');
        return new Response(
          JSON.stringify(mockResults),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          max_completion_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Based on this conversation, provide the psychological analysis and recommendations:\n\n${conversationSummary}`
            }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', response.status, error);
        if (useMockAI) {
          const mockResults = {
            reflection: "It sounds like you're navigating a period of transition and growth. The stress you're experiencing seems to stem from balancing multiple responsibilities while trying to maintain your well-being. Your awareness of these challenges is already a positive step forward.",
            framework: "What you're experiencing aligns with the concept of 'cognitive load' - when our mental capacity is stretched across too many demands simultaneously. This is compounded by what psychologists call 'decision fatigue,' where the quality of our decisions deteriorates after making many decisions throughout the day. Your body and mind are signaling the need for more intentional rest and boundary-setting.",
            recommendations: {
              podcast: "Try 'The Happiness Lab' by Dr. Laurie Santos, particularly the episode on managing stress through realistic expectations.",
              article: "'The Science of Self-Care' on Greater Good Magazine explores evidence-based approaches to maintaining emotional balance.",
              technique: "Consider the '3-3-3 Rule' for anxiety: Name 3 things you see, 3 sounds you hear, and move 3 parts of your body. This grounds you in the present moment and interrupts the stress cycle."
            },
            story: "There's an old story of a farmer whose horse ran away. His neighbor said, 'Such bad luck!' The farmer replied, 'Maybe.' The next day, the horse returned with three wild horses. 'How wonderful!' said the neighbor. 'Maybe,' said the farmer. When his son tried to tame one of the wild horses and broke his leg, the neighbor exclaimed, 'How terrible!' The farmer simply said, 'Maybe.' The next week, officers came to draft young men into the army, but the son was excused because of his broken leg. The neighbor congratulated the farmer on his good fortune, to which the farmer responded, 'Maybe.' \n\nThis story reminds us that we can't always see the full picture of how events will unfold. What feels overwhelming today may lead to unexpected growth tomorrow. The key is maintaining perspective and being gentle with ourselves during uncertain times."
          };

          return new Response(
            JSON.stringify(mockResults),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Results generated');
      
      // Parse the JSON response from OpenAI
      const resultsText = data.choices[0].message.content;
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
