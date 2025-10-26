import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getSystemPrompt, type TherapyApproach } from './therapy-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to analyze user message complexity
function analyzeComplexity(userMessages: any[]): 'simple' | 'moderate' | 'complex' {
  if (userMessages.length === 0) return 'moderate';
  
  // Analyze the last 3-5 user messages
  const recentMessages = userMessages.slice(-5);
  const allText = recentMessages.map(m => m.content).join(' ');
  
  // Calculate metrics
  const words = allText.split(/\s+/);
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const longWords = words.filter(w => w.length > 7).length;
  const longWordRatio = longWords / Math.max(words.length, 1);
  
  // Count psychological/academic terminology
  const complexTerms = [
    'cognitive', 'dissonance', 'empathetic', 'boundaries', 'professional',
    'experiencing', 'navigating', 'tension', 'maintaining', 'appropriate',
    'honoring', 'facilitate', 'discourse', 'metaphor', 'dialectical',
    'ambivalent', 'internalized', 'systemic', 'framework', 'conceptual'
  ];
  const complexTermCount = complexTerms.filter(term => 
    allText.toLowerCase().includes(term)
  ).length;
  
  // Determine complexity level
  if (avgWordsPerSentence < 8 && longWordRatio < 0.15 && complexTermCount === 0) {
    return 'simple';
  } else if (avgWordsPerSentence > 15 || longWordRatio > 0.25 || complexTermCount >= 2) {
    return 'complex';
  }
  return 'moderate';
}

// Helper function to get language adaptation instructions
function getLanguageInstructions(complexity: 'simple' | 'moderate' | 'complex'): string {
  switch (complexity) {
    case 'simple':
      return `LANGUAGE ADAPTATION:
- Use simple, everyday words
- Short sentences (8 words or less when possible)
- Avoid jargon, clinical terms, or complex vocabulary
- Example: "That sounds hard" NOT "That sounds challenging"
- Example: "What happened?" NOT "What about that situation stands out to you?"`;
    
    case 'complex':
      return `LANGUAGE ADAPTATION:
- Match the user's sophisticated vocabulary and complexity
- Use nuanced psychological terminology when appropriate
- Longer, more complex sentence structures are acceptable
- Example: "It sounds like you're navigating the tension between X and Y"
- Example: "That dissonance between your values and the situation seems significant"`;
    
    case 'moderate':
    default:
      return `LANGUAGE ADAPTATION:
- Use clear, conversational language
- Balance accessibility with depth
- Moderate sentence length (10-15 words)
- Example: "That sounds really difficult to navigate"
- Example: "What part of that feels hardest right now?"`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, conversationPath, validationData, neurodiveritySettings, ventText, therapyApproach } = await req.json();
    const truthy = (v: unknown) => typeof v === 'string' ? ['true','1','yes','y','on'].includes(v.toLowerCase().trim()) : !!v;
    const useMockAI = truthy(Deno.env.get('USE_MOCK_AI')) || truthy(messages?.[0]?.mock);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!useMockAI && !openaiApiKey && !anthropicApiKey) {
      throw new Error('OPENAI_API_KEY or ANTHROPIC_API_KEY is not configured');
    }

    console.log('Processing chat request, type:', type, 'path:', conversationPath, 'messages:', messages?.length, 'mock mode:', useMockAI);

    // Handle venting summary
    if (type === 'venting_summary') {
      const summaryPrompt = `Based on the venting session below, create an empathetic summary and identify key themes.

Venting text:
${ventText}

Return ONLY valid JSON in this format:
{
  "empathy": "A warm, empathetic 2-3 sentence response that acknowledges their feelings",
  "themes": ["Theme 1", "Theme 2", "Theme 3"]
}`;

      // Mock mode
      if (useMockAI) {
        const mockData = {
          empathy: "I heard that you're feeling overwhelmed and needed space to process everything. It sounds like you're carrying a lot right now.",
          themes: ["Feeling overwhelmed", "Processing emotions", "Need for support"]
        };
        
        console.log('Returning mock venting summary');
        return new Response(
          JSON.stringify(mockData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use OpenAI for venting summary
      try {
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
              { role: 'system', content: 'You are a compassionate, empathetic listener creating summaries of venting sessions. Be warm and understanding.' },
              { role: 'user', content: summaryPrompt }
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.choices[0].message.content.trim();
        
        // Parse JSON from response
        let summaryData;
        try {
          const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          summaryData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse venting summary JSON:', responseText);
          // Fallback
          summaryData = {
            empathy: "I heard that you needed space to express yourself. Thank you for sharing with me.",
            themes: ["Processing emotions", "Self-expression", "Seeking clarity"]
          };
        }

        console.log('Venting summary generated');
        return new Response(
          JSON.stringify(summaryData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error generating venting summary:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to generate venting summary' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle validation data extraction
    if (type === 'extract_validation') {
      const conversationText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      const therapyApproachUsed = therapyApproach || 'Person-Centered Therapy';
      
      const extractionPrompt = `You are analyzing a mental health check-in conversation. Extract structured data AND generate exactly 3 concise, impactful validation bullets.

Conversation:
${conversationText}

Therapy approach used during session: ${therapyApproachUsed}

VALIDATION BULLETS REQUIREMENTS:
- Generate EXACTLY 3 bullets (no more, no less)
- Bullet 1: Primary feeling + nuanced layer (e.g., "You're feeling a mix of frustration and uncertainty about your sister's choice")
- Bullet 2: Specific, actionable observation tied to context (e.g., "The family tension seems to amplify your self-doubt during her visit")
- Bullet 3: Therapeutic insight based on the ${therapyApproachUsed} approach applied during the session
- NO redundant emotions or overlapping descriptions
- Each bullet must be unique and add value
- Use empathetic but not generic phrasing
- Be specific to their actual situation

Please extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "validation_bullets": [
    "First bullet: Primary feeling + nuanced emotional layer",
    "Second bullet: Specific observation about their context",
    "Third bullet: Therapeutic insight from ${therapyApproachUsed}"
  ],
  "validation_line": "Empathetic validation line (e.g., 'These feelings make sense given what you're navigating')",
  "therapy_modality_applied": "${therapyApproachUsed}",
  "emotions": ["array of emotions - use SPECIFIC 2-4 word descriptions like: 'Overwhelmed and anxious', 'Mix of hope and uncertainty', 'Frustrated but hopeful', 'Drained and defeated', 'Cautiously optimistic'"],
  "stressLevel": 7,
  "mainStressors": ["Capitalize Like Titles - e.g., 'Work-Related Stress', 'Interacting With Ex', 'Financial Concerns', 'Family Dynamics', 'Sleep Deprivation'"],
  "sleepHours": null or number (extract if mentioned, otherwise null),
  "sleepQuality": "good quality" or "poor quality" or "moderate" (extract if mentioned, otherwise null),
  "contributingFactors": ["array of IDs from: work, sleep, caffeine, relationships, physical, life-changes, financial, isolation"],
  "desiredSupport": [],
  "patternAccuracy": null,
  "aiGeneratedPattern": "A 2-3 sentence summary of the pattern you see in their stress/anxiety. Be specific about what's happening and why it's hard.",
  "emotionReasoning": "2-3 sentences explaining how you determined the emotional state. Quote their exact words. Format: 'You said \"X\", which indicated Y'",
  "stressorReasoning": "2-3 sentences explaining how you identified the key stressors. Quote their exact words. Format: 'You mentioned \"X\", which suggests Y'",
  "sleepReasoning": "2-3 sentences about their physical state (sleep, energy, tiredness, physical symptoms). If they mentioned specific details like hours of sleep or feeling tired, quote them. If not mentioned, say 'You didn't mention specific physical concerns' - DO NOT make up information. Format: 'You said \"X\"' or 'You didn't mention physical state'",
  "supportReasoning": "1 sentence explaining what type of check-in they're doing based on the conversation path: ${conversationPath || 'general check-in'}",
  
  "emotional_state": ["anxious", "frustrated", "sad", "exhausted", "overwhelmed"] (detect from language patterns),
  "primary_stressors": ["work_deadline", "relationship_conflict", "sleep_deprivation", etc.],
  "sleep_hours": 5 or null,
  "sleep_quality": "poor" or "fair" or "good" or null,
  "exercise_today": true or false,
  "exercise_type": "walk" or "gym" or "yoga" or "none",
  "caffeine_intake": "none" or "moderate" or "high",
  "overwhelm_sources": ["too many tasks", "no support", "uncertainty"],
  "interpersonal_conflicts": true or false,
  "conflict_with": "partner" or "parent" or "coworker" or "friend" or null,
  "support_mentioned": ["brother", "therapist", "friend"] (array of people they mentioned as support),
  "isolation_signals": true or false (detect from language like "no one understands", "alone", "isolated"),
  "things_they_control": ["reaching out", "setting boundaries", "asking for help"] (things within their control),
  "things_outside_control": ["mom's responses", "partner's mood", "work deadline"] (things outside their control),
  "recurring_theme": "mother_relationship" or "work_stress" or "self_worth" or other pattern,
  "progress_indicators": ["set a boundary", "reached out to brother"] (positive actions they mentioned)
}

CRITICAL FORMATTING RULES:
1. emotions: Must be specific 2-4 word descriptions (not just single words like "anxious")
2. mainStressors: Capitalize Like Titles with professional phrasing
3. sleepReasoning: ONLY include information actually mentioned
4. Detect emotional_state from language patterns: anxious (racing thoughts, can't stop thinking, overwhelmed), frustrated (fed up, can't take it, done with), sad (don't care, empty, numb, hopeless), exhausted (so tired, drained, running on fumes), overwhelmed (too much, drowning, everything at once)

Important: Return ONLY the JSON object, no other text.`;

      // Mock mode
      if (useMockAI) {
        const mockValidation = {
          validation_bullets: [
            "You're feeling a mix of stress and exhaustion from juggling too many demands at once",
            "The lack of quality sleep is making everything harder to manage emotionally",
            "Your body is signaling that it needs rest, which aligns with how Acceptance and Commitment Therapy suggests honoring our physical limits"
          ],
          validation_line: "These feelings make sense given what you're navigating right now",
          therapy_modality_applied: therapyApproach || 'Person-Centered Therapy',
          emotions: ['Overwhelmed and drained'],
          stressLevel: 7,
          mainStressors: ['Work-Related Stress', 'Sleep Deprivation', 'Relationship Tension'],
          sleepHours: 5,
          sleepQuality: 'poor quality',
          contributingFactors: ['work', 'sleep', 'relationships'],
          desiredSupport: [],
          patternAccuracy: null,
          aiGeneratedPattern: "You're juggling multiple demands while running on insufficient rest. The stress isn't just about one thing—it's the cumulative load of everything happening at once while your body is signaling it needs recovery.",
          emotionReasoning: "You said you're feeling \"stressed and anxious\", which indicates emotional overwhelm from multiple pressures.",
          stressorReasoning: "You mentioned work deadlines and relationship concerns, which suggests competing demands on your time and energy.",
          sleepReasoning: "You said you're only getting \"about 5 hours of sleep\" and feeling \"exhausted\", indicating significant sleep deprivation.",
          supportReasoning: conversationPath === 'venting_session' ? "You chose venting mode for emotional release" : "You're doing a nightly routine check-in"
        };
        
        console.log('Returning mock validation data');
        return new Response(
          JSON.stringify(mockValidation),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use Anthropic if available, otherwise OpenAI
      if (anthropicApiKey) {
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

          console.log('Validation data extracted via Anthropic:', validationData);
          return new Response(
            JSON.stringify(validationData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error extracting validation data with Anthropic:', error);
          // Fall through to try OpenAI
        }
      }

      // Try OpenAI if Anthropic failed or not available
      if (openaiApiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              max_tokens: 1000,
              temperature: 0.3,
              messages: [
                { role: 'system', content: 'You are a mental health conversation analyzer. Extract structured data from conversations and return ONLY valid JSON with no markdown formatting.' },
                { role: 'user', content: extractionPrompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const result = await response.json();
          const extractedText = result.choices[0].message.content.trim();
          
          // Parse JSON from response
          let validationData;
          try {
            // Remove markdown code blocks if present
            const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            validationData = JSON.parse(jsonText);
          } catch (parseError) {
            console.error('Failed to parse validation JSON from OpenAI:', extractedText);
            throw parseError;
          }

          console.log('Validation data extracted via OpenAI:', validationData);
          return new Response(
            JSON.stringify(validationData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error extracting validation data with OpenAI:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to extract validation data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // If we get here, no API keys are available
      throw new Error('No AI API keys configured for validation extraction');
    }

    // Handle conversation summarization
    if (type === 'summarize') {
      const conversationText = messages.map((m: any) => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');
      
      const summaryPrompt = `Based on the conversation below, create a concise, structured summary in this exact format:

🎯 Main stressor: [Single sentence identifying primary issue]
💭 Their feelings: [2-3 key emotions with brief context]
🤔 Core tension: [The main internal conflict or dilemma they're facing]

Conversation:
${conversationText}

Return ONLY the formatted summary with the emojis. Be specific and use their own words where possible.`;

      // Mock mode
      if (useMockAI) {
        const mockSummary = `🎯 Main stressor: Work conflict and feeling misunderstood by boss
💭 Their feelings: Frustrated, guilty, but also defensive—feeling unfairly accused
🤔 Core tension: Wanting to communicate more effectively vs. feeling like explanations aren't being heard`;
        
        console.log('Returning mock summary');
        return new Response(
          JSON.stringify({ summary: mockSummary }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use OpenAI for summary
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 300,
            temperature: 0.5,
            messages: [
              { role: 'system', content: 'You are a compassionate therapist creating brief, structured conversation summaries.' },
              { role: 'user', content: summaryPrompt }
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const summary = result.choices[0].message.content.trim();

        console.log('Summary generated');
        return new Response(
          JSON.stringify({ summary }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error generating summary:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to generate summary' }),
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
          // Structured 5-question routine
          if (exchangeCount === 2) {
            mockResponse = "How much sleep did you get last night?";
          } else if (exchangeCount === 3) {
            mockResponse = "Did you move your body today?";
          } else if (exchangeCount === 4) {
            mockResponse = "What was your biggest stressor today?";
          } else if (exchangeCount === 5) {
            mockResponse = "Any conflicts or tension with people?";
          } else if (exchangeCount === 6) {
            mockResponse = "On a scale 1-10, how stressed do you feel?";
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

      // Determine conversation mode and load appropriate system prompt
      const approach: TherapyApproach = therapyApproach || 'blended';
      const baseSystemPrompt = getSystemPrompt(approach);
      console.log('Using therapy approach:', approach);
      
      // Analyze user message complexity for language adaptation
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const complexity = analyzeComplexity(userMessages);
      const languageInstructions = getLanguageInstructions(complexity);
      
      console.log('Detected complexity level:', complexity);
      
      let systemPrompt = baseSystemPrompt;
      
      // Build neurodiversity-specific instructions
      let neuroInstructions = '';
      if (neurodiveritySettings) {
        const instructions = [];
        
        if (neurodiveritySettings.geniusMode) {
          instructions.push('- **GENIUS MODE ACTIVATED**: Elevate discourse to an intellectually rigorous level');
          instructions.push('- Use advanced psychological and philosophical terminology');
          instructions.push('- Reference theoretical frameworks (e.g., Johari Window, Stoic philosophy, cognitive psychology models)');
          instructions.push('- Analyze situations through multiple theoretical lenses');
          instructions.push('- Challenge the user with deeper analytical prompts and complex reasoning');
          instructions.push('- Example: "It appears you\'re experiencing a profound dissonance between your external composure and internal frustration, likely rooted in the \'hidden\' quadrant of your Johari Window"');
        }
        
        if (neurodiveritySettings.usePlainLanguage) {
          instructions.push('- Use plain, literal language. Avoid metaphors, idioms, and figurative speech');
          instructions.push('- Be direct and concrete in your responses');
        }
        
        if (neurodiveritySettings.includeContentWarnings) {
          instructions.push('- Before discussing heavy or potentially distressing topics, provide a brief content warning');
          instructions.push('- Example: "I\'m about to ask about stress—let me know if you\'d rather skip this"');
        }
        
        if (neurodiveritySettings.explainQuestions) {
          instructions.push('- CRITICAL: You MUST explain why you\'re asking each question. Add a brief reason in parentheses after every question.');
          instructions.push('- Format: "Question here? (Reason: This helps me understand X)"');
          instructions.push('- Example: "What happened at work today? (This helps me understand what\'s weighing on you)"');
          instructions.push('- Example: "How did that make you feel? (I want to understand the emotional impact)"');
        }
        
        if (neurodiveritySettings.offerVisualCues) {
          instructions.push('- Include visual cues like emojis, bullet points, or simple formatting to highlight key points');
          instructions.push('- Example: "🔑 Key insight: ...", "• Main point: ...", "⚡ Action item: ..."');
          instructions.push('- Use clear section markers and structured formatting when appropriate');
        }
        
        if (instructions.length > 0) {
          neuroInstructions = `\n\nNEURODIVERSITY ADAPTATIONS:\n${instructions.join('\n')}`;
        }
      }
      
      console.log('Neurodiversity settings applied:', neurodiveritySettings);

      // Determine conversation context based on exchange count
let conversationContext = '';

// Simple progression: start therapy immediately
if (exchangeCount === 0) {
  // First interaction - start therapy
  conversationContext = `
# CURRENT CONTEXT:
This is the initial check-in (first interaction).

Begin the therapeutic conversation using your assigned approach.

RESPONSE STRUCTURE:
1. Brief empathetic reflection (1-2 sentences max)
2. Ask your first therapeutic question to begin exploration

Keep it natural and conversational.
`;
} else if (exchangeCount >= 1 && exchangeCount <= 5) {
  conversationContext = `
# CURRENT CONTEXT:
Early exploration phase (exchange ${exchangeCount} of ~5-7 total).

Continue deepening the exploration using your therapeutic approach.
Build on what they've shared so far.
`;
} else if (exchangeCount >= 6) {
  conversationContext = `
# CURRENT CONTEXT:
Deepening phase (exchange ${exchangeCount}).

You've established good rapport. Continue with deeper therapeutic work.
The conversation can naturally conclude after 7-8 exchanges.
`;
}

// Combine everything
systemPrompt = baseSystemPrompt + 
               '\n' + languageInstructions + 
               neuroInstructions + 
               conversationContext;

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
        byline: "You're carrying the weight of uncertainty while trying to perform at your best",
        whatsHappening: {
          summary: "You're experiencing what psychologists call 'anticipatory anxiety' - the stress of waiting for an outcome you can't control.",
          themes: ["Career pressure", "Uncertainty", "Social comparison"],
          fullExplanation: "When we face uncertainty about important outcomes, our brain's threat detection system stays activated...",
          citations: [
            { author: "Grupe & Nitschke", year: "2013", title: "Uncertainty and anticipation in anxiety" }
          ]
        },
        quotes: [
          { text: "Not knowing if I'll get the promotion or not!", sentiment: "negative" as const }
        ],
        reframing: {
          content: "The silence from uncertainty feels personal - and that makes sense..."
        },
        podcast: {
          title: "The Anxiety Coaches Podcast",
          host: "Gina Ryan",
          episode: "Managing Workplace Anxiety",
          duration: "42 min",
          description: "Practical strategies for handling career uncertainty",
          whyThisHelps: "This episode addresses promotion anxiety specifically",
          thumbnail: "https://via.placeholder.com/400x400?text=Podcast",
          urls: {
            spotify: "https://open.spotify.com/show/4fTTVSTrgXKhZTgjxiF5kp",
            applePodcasts: "https://podcasts.apple.com/us/podcast/the-anxiety-coaches-podcast/id1439613688"
          }
        },
        book: {
          title: "The Upside of Stress",
          author: "Kelly McGonigal",
          byline: "Why Stress Is Good for You",
          length: "304 pages / 6-hour read",
          description: "A groundbreaking look at transforming stress",
          whyThisHelps: "This book will help you reframe promotion stress",
          coverImage: "https://via.placeholder.com/300x450?text=Book",
          sampleUrl: "https://www.amazon.com/...",
          purchaseUrl: "https://www.amazon.com/..."
        },
        exercise: {
          title: "Box Breathing for Sleep",
          description: "A simple breathing technique to calm your nervous system",
          duration: "5-10 minutes",
          steps: [
            "Lie in bed and close your eyes",
            "Breathe in for 4 counts",
            "Hold for 4 counts",
            "Exhale for 4 counts",
            "Repeat 8-10 times"
          ]
        },
        story: {
          title: "The Farmer and the Horse",
          culturalOrigin: "Chinese Taoist Parable",
          content: "There's an old story of a farmer whose horse ran away...",
          whyThisMatters: "Right now, not knowing about the promotion feels like 'bad luck'..."
        },
        cbt: {
          distortion: "catastrophizing",
          userThought: "Not knowing if I'll get the promotion means disaster",
          reframe: "The uncertainty is uncomfortable, but it doesn't mean disaster",
          practice: "Tonight: Write down 3 things you did well this week"
        },
        reflection: "You're experiencing the collision of high stakes and zero control",
        patterns: [
          "Promotion uncertainty → constant vigilance",
          "Workplace competition → comparison anxiety",
          "Chronic stress → poor sleep"
        ]
      };

      console.log('Returning mock results');
      return new Response(
        JSON.stringify(mockResults),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

const systemPrompt = `You are an expert psychological counselor. Based on the conversation, provide a personalized analysis using the user's EXACT language.

CRITICAL: Use their own words, not therapy-speak. If they said "I'm drowning," use that.

YOU MUST include ALL sections below. Do not skip podcast, book, exercise, or story sections.

Format as JSON with this EXACT structure:
{
  "byline": "One compelling sentence capturing their core challenge",
  "whatsHappening": {
    "summary": "2-3 sentence empathetic explanation",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "fullExplanation": "Detailed 3-4 paragraph explanation",
    "citations": [
      {"author": "Researcher Name", "year": 2020, "title": "Study Title"}
    ]
  },
  "quotes": [
    {"text": "Direct quote from user", "sentiment": "positive|negative|neutral"}
  ],
  "reframing": {
    "content": "3-4 paragraphs offering perspective shift using CBT, ACT, therapeutic methods"
  },
  "podcast": {
    "title": "Real Podcast Name (research and recommend an actual podcast)",
    "host": "Host Name",
    "episode": "Episode Title that matches their situation",
    "duration": "30-60 min",
    "description": "What this episode covers",
    "whyThisHelps": "Specific reason this helps their situation",
    "thumbnail": "https://via.placeholder.com/400x400?text=Podcast",
    "urls": {
      "spotify": "https://open.spotify.com/show/ACTUAL_ID_HERE",
      "applePodcasts": "https://podcasts.apple.com/ACTUAL_URL_HERE"
    }
  },
  "book": {
    "title": "Real Book Title (recommend an actual book)",
    "author": "Author Name",
    "byline": "One-line description",
    "length": "200 pages / 4-hour read",
    "description": "What this book covers",
    "whyThisHelps": "Specific reason this helps their situation",
    "coverImage": "https://via.placeholder.com/300x450?text=Book",
    "sampleUrl": "https://www.amazon.com/LINK_HERE",
    "purchaseUrl": "https://www.amazon.com/LINK_HERE"
  },
  "exercise": {
    "title": "Exercise Name",
    "description": "Brief description",
    "duration": "5-10 minutes",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
  },
  "story": {
    "title": "Story Title",
    "culturalOrigin": "Cultural tradition (e.g., 'Buddhist Parable', 'African Folktale')",
    "content": "The full story text (2-3 paragraphs)",
    "whyThisMatters": "Connect the story to their situation"
  },
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]
}

REQUIREMENTS:
- ALL fields must be present (podcast, book, exercise, story)
- Recommend REAL podcasts and books that exist
- Make sure exercise has at least 5 steps
- Story should be meaningful and relevant`;

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
        max_tokens: 5000,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { 
            role: 'system', 
            content: systemPrompt + '\n\nYou MUST respond with valid JSON only. Do not include any markdown formatting or code blocks.'
          },
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Results API response received');

    const resultsText = data.choices[0].message.content.trim();
    console.log('Raw results text (first 200 chars):', resultsText.substring(0, 200));
    
    let results;

    try {
      // With json_object mode, response should be pure JSON
      results = JSON.parse(resultsText);
      console.log('Successfully parsed results JSON');
      console.log('📦 Results structure check:', {
        hasWhatsHappening: !!results.whatsHappening,
        hasQuotes: !!results.quotes,
        hasReframing: !!results.reframing,
        hasPodcast: !!results.podcast,
        hasBook: !!results.book,
        hasExercise: !!results.exercise,
        hasStory: !!results.story,
        hasPatterns: !!results.patterns
      });
    } catch (e) {
      console.error('Failed to parse results JSON:', e);
      console.error('Full response text:', resultsText);
      
      // Return error so we can see what's happening
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          rawResponse: resultsText.substring(0, 1000)
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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