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
    const { messages, type, mock, conversationPath } = await req.json();
    const truthy = (v: unknown) => typeof v === 'string' ? ['true','1','yes','y','on'].includes(v.toLowerCase().trim()) : !!v;
    const useMockAI = truthy(Deno.env.get('USE_MOCK_AI')) || truthy(mock);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!useMockAI && !openaiApiKey && !anthropicApiKey) {
      throw new Error('OPENAI_API_KEY or ANTHROPIC_API_KEY is not configured');
    }

    console.log('Processing chat request, type:', type, 'path:', conversationPath, 'messages:', messages.length, 'mock mode:', useMockAI);

    // Handle validation data extraction
    if (type === 'extract_validation') {
      const conversationText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      
      const extractionPrompt = `You are analyzing a mental health check-in conversation. Extract the following structured data from the conversation below.

Conversation:
${conversationText}

Please extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "emotions": ["array of emotions mentioned - e.g., Anxious, Frustrated, Overwhelmed, etc."],
  "stressLevel": 7,
  "mainStressors": ["brief array of main stressors mentioned"],
  "contributingFactors": ["array of IDs from: work, sleep, caffeine, relationships, physical, life-changes, financial, isolation"],
  "desiredSupport": [],
  "patternAccuracy": null,
  "aiGeneratedPattern": "A 2-3 sentence summary of the pattern you see in their stress/anxiety. Be specific about what's happening and why it's hard."
}

Important: Return ONLY the JSON object, no other text.`;

      // Mock mode
      if (useMockAI) {
        const mockValidation = {
          emotions: ['Anxious', 'Overwhelmed', 'Exhausted'],
          stressLevel: 7,
          mainStressors: ['Work', 'Sleep', 'Relationships'],
          contributingFactors: ['work', 'sleep', 'relationships'],
          desiredSupport: [],
          patternAccuracy: null,
          aiGeneratedPattern: "You're juggling multiple demands while running on insufficient rest. The stress isn't just about one thing—it's the cumulative load of everything happening at once while your body is signaling it needs recovery."
        };
        
        console.log('Returning mock validation data');
        return new Response(
          JSON.stringify(mockValidation),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: extractionPrompt
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`);
        }

        const result = await response.json();
        const extractedText = result.content[0].text.trim();
        
        // Parse JSON from response
        let validationData;
        try {
          // Remove markdown code blocks if present
          const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          validationData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse validation JSON:', extractedText);
          throw parseError;
        }

        return new Response(
          JSON.stringify(validationData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error extracting validation data:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to extract validation data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For conversation mode
    if (type === 'conversation') {
      const exchangeCount = Math.floor(messages.filter((m: any) => m.role === 'user').length);
      
      // Mock mode - return realistic responses without calling API
      if (useMockAI) {
        const userMessage = messages[messages.length - 1].content.toLowerCase();
        let mockResponse = '';

        // Check if this is path selection
        if (userMessage.includes('nightly routine') || userMessage.includes('vent')) {
          if (userMessage.includes('nightly routine')) {
            mockResponse = "Got it. How are you feeling right now? Just one or two words.";
          } else {
            mockResponse = "I'm here. Go ahead.";
          }
        } else if (exchangeCount === 1) {
          // First interaction - offer path selection (reflect + offer)
          if (userMessage.includes('stress') || userMessage.includes('anxious') || userMessage.includes('overwhelmed')) {
            mockResponse = "That sounds exhausting.\n\nWould you like to:\n→ Do your nightly routine (helps you process and wind down)\n→ Just vent right now (I'm here to listen)";
          } else if (userMessage.includes('fine') || userMessage.includes('okay')) {
            mockResponse = "Got it—'fine' can mean a lot of things.\n\nWould you like to:\n→ Do your nightly routine (helps you process and wind down)\n→ Just vent right now (I'm here to listen)";
          } else if (userMessage.includes('tired') || userMessage.includes('exhausted')) {
            mockResponse = "You sound worn out.\n\nWould you like to:\n→ Do your nightly routine (helps you process and wind down)\n→ Just vent right now (I'm here to listen)";
          } else {
            mockResponse = "I hear you.\n\nWould you like to:\n→ Do your nightly routine (helps you process and wind down)\n→ Just vent right now (I'm here to listen)";
          }
        } else if (conversationPath === 'nightly_routine') {
          // Structured nightly routine responses
          if (exchangeCount === 2) {
            mockResponse = "What's one thing that stood out today—good or hard?";
          } else if (exchangeCount === 3) {
            mockResponse = "What about that moment made it stick with you?";
          } else if (exchangeCount === 4) {
            mockResponse = "What's on your mind for tomorrow—anything you're worried about?";
          } else if (exchangeCount === 5) {
            const concern = userMessage.match(/\b(meeting|presentation|deadline|conversation|interview)\b/)?.[0] || 'that';
            mockResponse = `What's the part about ${concern} that's making you most anxious?`;
          } else if (exchangeCount === 6) {
            mockResponse = "How's your body doing—sleep, energy, anything physical?";
          } else {
            mockResponse = "Thanks for checking in tonight. Give me a sec to pull some thoughts together for you.";
          }
        } else if (conversationPath === 'venting_session') {
          // Venting session responses - minimal until they finish
          if (exchangeCount === 2) {
            mockResponse = "I'm listening.";
          } else if (exchangeCount === 3) {
            mockResponse = "Keep going.";
          } else if (exchangeCount === 4) {
            mockResponse = "So it sounds like you're carrying a lot right now. What's the main thing weighing on you the most?";
          } else {
            mockResponse = "Got it. I hear you.";
          }
        } else {
          mockResponse = "Tell me more.";
        }

        console.log('Returning mock response for exchange:', exchangeCount, 'path:', conversationPath);
        return new Response(
          JSON.stringify({ content: mockResponse }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build context of previous exchanges for continuity
      const previousExchanges = messages.slice(0, -1).map((m: any) => 
        `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`
      ).join('\n');

      // Determine conversation mode
      let systemPrompt = '';
      
      if (conversationPath === 'nightly_routine') {
        // Structured 4-phase routine
        const userExchanges = messages.filter((m: any) => m.role === 'user').length;
        const phase = Math.min(4, userExchanges);
        
        systemPrompt = `You are guiding a nightly routine check-in. User selected structured routine.

${previousExchanges ? `Previous conversation:\n${previousExchanges}\n` : ''}

PHASE ${phase} OF 4:
${phase === 1 ? '1. EMOTION CHECK-IN: Ask "How are you feeling right now? Just one or two words."' : ''}
${phase === 2 ? '2. DAILY HIGHLIGHT/LOWLIGHT: Ask "What\'s one thing that stood out today—good or hard?" Then follow up with "What about that moment made it stick with you?"' : ''}
${phase === 3 ? '3. WORRY PROCESSING: Ask "What\'s on your mind for tomorrow—anything you\'re worried about?" Follow up: "What\'s the part making you most anxious?" Then validate: "So it sounds like [X]—does that feel right?"' : ''}
${phase === 4 ? '4. LIFESTYLE PULSE: Ask "How\'s your body doing—sleep, energy, anything physical?" Connect it: "That might be why you\'re feeling [emotion]—your body is running on fumes."' : ''}

RESPONSE STYLE RULES:
✅ DO:
- REFLECT FIRST, THEN ASK: Acknowledge what they said before moving forward
  Example: "That sounds exhausting." [pause] "What made it feel that way?"
- ASK OPEN-ENDED FOLLOW-UPS: "What's the part making you most anxious?" NOT "Did that stress you out?"
- CONNECT DOTS: If they mention multiple things, link them: "It sounds like A and B drained you, so you didn't have energy for C"
- VALIDATE COLLABORATIVELY: Reflect back and check: "So it sounds like [X]—does that feel right?"
- KEEP IT CONVERSATIONAL: Use "Got it" / "That makes sense" / "I hear you"
- SHORT RESPONSES: 1-2 sentences per turn

❌ DON'T:
- Give advice: "You should try to get more sleep"
- Ask yes/no questions: "Did the stress affect your focus?"
- Use therapy jargon: "Let's unpack that" / "How does that land?"
- Be overly effusive: "That's amazing!" / "I'm so sorry!"
- Ask multiple questions at once`;

      } else if (conversationPath === 'venting_session') {
        // Free-form venting mode
        systemPrompt = `You are listening to someone vent. User selected venting session.

${previousExchanges ? `Previous conversation:\n${previousExchanges}\n` : ''}

YOUR ROLE:
- Let them talk freely
- Don't interrupt or ask questions initially
- Track emotions, stressors, and worries mentioned
- After they finish (or pause), reflect: "So it sounds like you're carrying [summarize]... What's the main thing weighing on you most?"

RESPONSE STYLE RULES:
✅ DO:
- REFLECT FIRST: "That sounds painful" or "Got it—work was rough"
- ASK OPEN-ENDED FOLLOW-UPS: "What's the part that's making you most anxious?"
- CONNECT DOTS: "It sounds like work stress and date anxiety drained you—you didn't have energy for your workout. Which one feels heavier?"
- VALIDATE COLLABORATIVELY: "So it sounds like the real worry is being seen as not good enough—does that feel right?"
- KEEP IT CONVERSATIONAL: Use "Got it" / "That makes sense" / "I hear you"
- SHORT RESPONSES: 1-2 sentences per turn

❌ DON'T:
- Give advice: "It's important to take care of it" / "You should..."
- Ask yes/no questions: "Did that stress you out?" / "Were you able to relax?"
- Use therapy jargon: "Let's unpack that" / "What's coming up for you?"
- Be overly effusive: "That's amazing!" / "I'm so sorry you're going through this!"
- Ask multiple questions at once
- Focus on understanding, not solving`;

      } else {
        // Initial conversation before path selection
        systemPrompt = `You are a compassionate evening check-in coach. This is the first interaction.

FIRST RESPONSE ONLY:
1. Give empathetic reflection of what they shared (1-2 sentences)
   - Use conversational language: "That sounds exhausting" NOT "I hear you're feeling stressed"
   - Avoid therapy-speak and overly effusive language
2. Then offer path selection:
   "Would you like to:
   → Do your nightly routine (helps you process and wind down)
   → Just vent right now (I'm here to listen)"

STYLE:
- Warm but not clinical
- Brief reflection (1-2 sentences max)
- Natural conversational tone`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          temperature: 0.7,
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
      console.log('OpenAI response received:', JSON.stringify(data));
      console.log('Choices:', data.choices);
      console.log('Message content:', data.choices?.[0]?.message?.content);
      
      let content = data.choices?.[0]?.message?.content as string | undefined;
      if (!content || !content.trim()) {
        const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? '';
        content = lastUser
          ? `I hear you. It sounds like ${lastUser.slice(0, 120)}... Can you tell me a bit more about what's feeling heaviest right now?`
          : "I'm here. Can you share a bit more about what's on your mind?";
        console.warn('Assistant content was empty. Returning safe fallback instead of empty string.');
      }
      
      return new Response(
        JSON.stringify({ content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For results generation
    if (type === 'results') {
      // Mock mode - return realistic psychological analysis
      if (useMockAI) {
        const mockResults = {
          userQuote: "I'm drowning in everything",
          patterns: [
            "Sleep deprivation (4 hours) → heightened emotional reactivity",
            "Work pressure + exhaustion → snapping at your partner",
            "Guilt about the conflict → more stress → worse sleep (reinforcing cycle)"
          ],
          cbt: {
            distortion: "Catastrophizing",
            userThought: "I'm going to fail at work and ruin my relationship",
            reframe: "You're juggling a lot right now, and one rough week doesn't define your competence or your relationship. Your partner knows you're stressed. Your boss hasn't said you're failing. You're extrapolating from feeling overwhelmed to total collapse, but that's the anxiety talking, not reality.",
            practice: "Before bed tonight, text your partner one specific thing you appreciate about them. Tomorrow at work, identify one task you can delegate or push to next week. You can't do everything - pick what matters most right now."
          },
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

      const systemPrompt = `You are an expert psychological counselor. Based on the conversation, provide a personalized analysis using the user's EXACT language.

CRITICAL: Use their own words, not therapy-speak. If they said "I'm drowning," use that. If they said "My boss is an asshole," quote it.

Provide:
1. userQuote: Pull a direct quote (2-15 words) from the user that captures their core struggle. Use EXACTLY what they said.

2. patterns: 3-4 bullet points connecting the dots between factors (sleep → irritability → work conflict). Be specific to their situation, not generic.

3. cbt: Applied CBT analysis with:
   - distortion: Name ONE specific cognitive distortion (catastrophizing, all-or-nothing thinking, mind reading, overgeneralization, etc.)
   - userThought: Quote a thought pattern they revealed in the conversation (their EXACT words or close paraphrase)
   - reframe: Specific reframe using details from their life. Not "think positively" - show them a different lens using their situation
   - practice: One clear action they can take tonight or tomorrow. Concrete, not vague.

4. Keep legacy fields for compatibility:
   - reflection: 2-3 sentence empathetic reflection
   - framework: Psychological concept explaining their experience
   - recommendations: podcast, article, technique
   - story: Relevant parable

Format as JSON:
{
  "userQuote": "string (their exact words)",
  "patterns": ["string", "string", "string"],
  "cbt": {
    "distortion": "string",
    "userThought": "string (quoted from conversation)",
    "reframe": "string (specific to their situation)",
    "practice": "string (concrete action)"
  },
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
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.7,
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
            userQuote: "I'm drowning in everything",
            patterns: [
              "Sleep deprivation (4 hours) → heightened emotional reactivity",
              "Work pressure + exhaustion → snapping at your partner",
              "Guilt about the conflict → more stress → worse sleep (reinforcing cycle)"
            ],
            cbt: {
              distortion: "Catastrophizing",
              userThought: "I'm going to fail at work and ruin my relationship",
              reframe: "You're juggling a lot right now, and one rough week doesn't define your competence or your relationship. Your partner knows you're stressed. Your boss hasn't said you're failing. You're extrapolating from feeling overwhelmed to total collapse, but that's the anxiety talking, not reality.",
              practice: "Before bed tonight, text your partner one specific thing you appreciate about them. Tomorrow at work, identify one task you can delegate or push to next week. You can't do everything - pick what matters most right now."
            },
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
          userQuote: "I'm struggling with a lot right now",
          patterns: [
            "Multiple demands on your energy and attention",
            "Stress building up without clear release",
            "Need for more intentional rest and boundaries"
          ],
          cbt: {
            distortion: "All-or-nothing thinking",
            userThought: "I have to handle everything perfectly or I'm failing",
            reframe: "You can be doing your best while also struggling. Progress isn't about perfection - it's about taking the next right step, even when you're tired.",
            practice: "Tonight, write down one thing you did well today, no matter how small. Then pick one thing you can let go of or delegate tomorrow."
          },
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
