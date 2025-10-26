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
      
      const extractionPrompt = `You are analyzing a mental health check-in conversation. Extract the following structured data from the conversation below.

Conversation:
${conversationText}

Please extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
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
        
        if (neurodiveritySettings.usePlainLanguage) {
          instructions.push('- Use plain, literal language. Avoid metaphors, idioms, and figurative speech');
          instructions.push('- Be direct and concrete in your responses');
        }
        
        if (neurodiveritySettings.includeContentWarnings) {
          instructions.push('- Before discussing heavy or potentially distressing topics, provide a brief content warning');
          instructions.push('- Example: "I\'m about to ask about stress—let me know if you\'d rather skip this"');
        }
        
        if (neurodiveritySettings.oneQuestionPerMessage) {
          instructions.push('- CRITICAL: Ask only ONE question per message, never multiple');
          instructions.push('- Wait for the user to answer before asking follow-up questions');
        }
        
        if (neurodiveritySettings.explainQuestions) {
          instructions.push('- CRITICAL: You MUST explain why you\'re asking each question. Add a brief reason in parentheses after every question.');
          instructions.push('- Format: "Question here? (Reason: This helps me understand X)"');
          instructions.push('- Example: "What happened at work today? (This helps me understand what\'s weighing on you)"');
          instructions.push('- Example: "How did that make you feel? (I want to understand the emotional impact)"');
        }
        
        if (instructions.length > 0) {
          neuroInstructions = `\n\nNEURODIVERSITY ADAPTATIONS:\n${instructions.join('\n')}`;
        }
      }
      
      console.log('Neurodiversity settings applied:', neurodiveritySettings);
      
      if (conversationPath === 'nightly_routine') {
        // Structured 5-question routine - append to therapy-specific base prompt
        const userExchanges = messages.filter((m: any) => m.role === 'user').length;
        const questionNum = Math.min(5, userExchanges);
        
        systemPrompt += `\n\n# CURRENT CONVERSATION MODE: NIGHTLY ROUTINE
You are guiding a structured nightly routine check-in. Ask questions ONE AT A TIME.

${previousExchanges ? `Previous conversation:\n${previousExchanges}\n` : ''}

QUESTION ${questionNum} OF 5:
${questionNum === 1 ? 'Q1: Ask "How much sleep did you get last night?" - Keep it simple, just ask for hours.' : ''}
${questionNum === 2 ? 'Q2: Ask "Did you move your body today?" - Brief response, then move on.' : ''}
${questionNum === 3 ? 'Q3: Ask "What was your biggest stressor today?" - Let them share, reflect briefly.' : ''}
${questionNum === 4 ? 'Q4: Ask "Any conflicts or tension with people?" - Brief acknowledgment only.' : ''}
${questionNum === 5 ? 'Q5: Ask "On a scale 1-10, how stressed do you feel?" - Final question, acknowledge their answer warmly then say "Thanks for checking in tonight. Give me a sec to pull some thoughts together for you."' : ''}

${languageInstructions}
${neuroInstructions}

RESPONSE STYLE RULES:
✅ DO:
- VARY YOUR RESPONSE TYPES to avoid interrogation feel:
  * Reflective statement: "That connection with your brother sounds really meaningful." [No question]
  * Open invitation: "I'd love to hear more about that, if you want to share."
  * Direct question: "What made that moment stick with you?" [Only when truly needed]
- REFLECT FIRST, THEN ASK: Acknowledge what they said before moving forward
  Example: "That sounds exhausting." [pause] "What made it feel that way?"
- ASK OPEN-ENDED FOLLOW-UPS: "What's the part making you most anxious?" NOT "Did that stress you out?"
- CONNECT DOTS: If they mention multiple things, link them: "It sounds like A and B drained you, so you didn't have energy for C"
- VALIDATE COLLABORATIVELY: Reflect back and check: "So it sounds like [X]—does that feel right?"
- KEEP IT CONVERSATIONAL: Use "Got it" / "That makes sense" / "I hear you"
- SHORT RESPONSES: 1-2 sentences per turn
- USE "..." to invite continuation without asking a question

❌ DON'T:
- End every message with a question—alternate with statements and invitations
- Give advice: "You should try to get more sleep"
- Ask yes/no questions: "Did the stress affect your focus?"
- Use therapy jargon: "Let's unpack that" / "How does that land?"
- Be overly effusive: "That's amazing!" / "I'm so sorry!"
- Ask multiple questions at once`;

      } else if (conversationPath === 'venting_session') {
        // Free-form venting mode - append to therapy-specific base prompt
        systemPrompt += `\n\n# CURRENT CONVERSATION MODE: VENTING SESSION
You are listening to someone vent. User selected venting session.

${previousExchanges ? `Previous conversation:\n${previousExchanges}\n` : ''}

YOUR ROLE:
- Let them talk freely
- Don't interrupt or ask questions initially
- Track emotions, stressors, and worries mentioned
- After they finish (or pause), reflect: "So it sounds like you're carrying [summarize]... What's the main thing weighing on you most?"

${languageInstructions}
${neuroInstructions}

RESPONSE STYLE RULES:
✅ DO:
- VARY YOUR RESPONSE TYPES to avoid interrogation feel:
  * Reflective statement: "That sounds painful" [No question]
  * Open invitation: "I'm here if you want to talk more about that"
  * Direct question: "What's the part that's making you most anxious?" [Only when needed]
- REFLECT FIRST: "That sounds painful" or "Got it—work was rough"
- ASK OPEN-ENDED FOLLOW-UPS: "What's the part that's making you most anxious?"
- CONNECT DOTS: "It sounds like work stress and date anxiety drained you—you didn't have energy for your workout. Which one feels heavier?"
- VALIDATE COLLABORATIVELY: "So it sounds like the real worry is being seen as not good enough—does that feel right?"
- KEEP IT CONVERSATIONAL: Use "Got it" / "That makes sense" / "I hear you"
- SHORT RESPONSES: 1-2 sentences per turn
- USE "..." to invite continuation without asking

❌ DON'T:
- End every message with a question—use statements and invitations too
- Give advice: "It's important to take care of it" / "You should..."
- Ask yes/no questions: "Did that stress you out?" / "Were you able to relax?"
- Use therapy jargon: "Let's unpack that" / "What's coming up for you?"
- Be overly effusive: "That's amazing!" / "I'm so sorry you're going through this!"
- Ask multiple questions at once
- Focus on understanding, not solving`;

      } else {
        // Initial conversation before path selection - append to therapy-specific base prompt
        systemPrompt += `\n\n# CURRENT CONVERSATION MODE: INITIAL CHECK-IN
You are a compassionate evening check-in coach. This is the first interaction.

${languageInstructions}
${neuroInstructions}

FIRST RESPONSE ONLY:
1. Give empathetic reflection of what they shared (1-2 sentences)
   - Use conversational language: "That sounds exhausting" NOT "I hear you're feeling stressed"
   - Avoid therapy-speak and overly effusive language
   - VARY RESPONSE TYPE: Sometimes end with a reflective statement, sometimes with an open invitation, rarely with a direct question
2. Then offer path selection:
   "Would you like to:
   → Do your nightly routine (helps you process and wind down)
   → Just vent right now (I'm here to listen)"

STYLE:
- Warm but not clinical
- Brief reflection (1-2 sentences max)
- Natural conversational tone
- Don't end every message with a question`;
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
          byline: "You're carrying the weight of uncertainty while trying to perform at your best",
          whatsHappening: {
            summary: "You're experiencing what psychologists call 'anticipatory anxiety' - the stress of waiting for an outcome you can't control. This is compounded by comparison with colleagues, creating a constant state of competitive vigilance that's exhausting your nervous system.",
            themes: ["Career pressure", "Uncertainty", "Social comparison"],
            fullExplanation: "When we face uncertainty about important outcomes, our brain's threat detection system stays activated, constantly scanning for signs of danger or failure. This is what you're experiencing with the promotion uncertainty.\n\nThe ambient competition you described is particularly draining because it creates a state called 'social comparison anxiety.' Your nervous system interprets every colleague's success as a potential threat to your own advancement, keeping you in a heightened state of stress.\n\nThis chronic stress directly impacts sleep quality through elevated cortisol levels, which then creates a feedback loop: poor sleep → increased anxiety → worse sleep. Your body is essentially stuck in 'fight or flight' mode, making it nearly impossible to relax even when you want to.",
            citations: [
              { author: "Grupe & Nitschke", year: "2013", title: "Uncertainty and anticipation in anxiety: an integrated neurobiological and psychological perspective" },
              { author: "Buunk & Gibbons", year: "2007", title: "Social comparison: The end of a theory and the emergence of a field" }
            ]
          },
          quotes: [
            { text: "Not knowing if I'll get the promotion or not!", sentiment: "negative" as const },
            { text: "Everyone else might get it", sentiment: "negative" as const }
          ],
          reframing: {
            content: "The silence from uncertainty feels personal - and that makes sense. But uncertainty often says more about the situation than about your worthiness. Your colleagues aren't your enemies; they're fellow travelers in the same anxious waiting room.\n\nIn moments like these, it can be helpful to remember that we're all navigating similar challenges. Just as a storm can obscure the sun, our feelings can sometimes cloud our understanding of reality. Yet beyond the clouds, clarity still waits to break through.\n\nYour worth isn't determined by this one promotion. Your career is a long journey, and this is just one step. What you can control - your effort, your integrity, your growth - matters more than what you can't."
          },
          podcast: {
            title: "The Anxiety Coaches Podcast",
            host: "Gina Ryan",
            episode: "Managing Workplace Anxiety and Career Pressure",
            duration: "42 min",
            description: "Practical strategies for handling career uncertainty and competitive work environments without burning out.",
            whyThisHelps: "This episode specifically addresses the promotion anxiety you're experiencing and offers concrete tools for managing the waiting period while maintaining your performance.",
            thumbnail: "https://via.placeholder.com/400x400?text=Anxiety+Coaches",
            urls: {
              spotify: "https://open.spotify.com/show/4fTTVSTrgXKhZTgjxiF5kp",
              applePodcasts: "https://podcasts.apple.com/us/podcast/the-anxiety-coaches-podcast/id1439613688"
            }
          },
          book: {
            title: "The Upside of Stress",
            author: "Kelly McGonigal",
            byline: "Why Stress Is Good for You, and How to Get Good at It",
            length: "304 pages / 6-hour read",
            description: "A groundbreaking look at how changing your mindset about stress can transform it from something harmful into something that helps you thrive.",
            whyThisHelps: "This book will help you reframe the promotion stress you're experiencing, turning it from something that's draining you into fuel for better performance.",
            coverImage: "https://via.placeholder.com/300x450?text=The+Upside+of+Stress",
            sampleUrl: "https://www.amazon.com/Upside-Stress-Why-Good-You-ebook/dp/B00PWCTP8Y",
            purchaseUrl: "https://www.amazon.com/Upside-Stress-Why-Good-You/dp/1101982934"
          },
          exercise: {
            title: "Box Breathing for Sleep",
            description: "A simple breathing technique to calm your nervous system and prepare for restful sleep, especially effective when work anxiety is keeping you awake.",
            duration: "5-10 minutes",
            steps: [
              "Lie in bed and close your eyes. Place one hand on your chest and one on your belly.",
              "Breathe in slowly through your nose for 4 counts, feeling your belly rise.",
              "Hold your breath for 4 counts, staying relaxed.",
              "Exhale slowly through your mouth for 4 counts, letting your belly fall.",
              "Hold empty for 4 counts.",
              "Repeat this cycle 8-10 times, or until you feel your body relaxing.",
              "If thoughts about work arise, acknowledge them and return to counting your breath."
            ]
          },
          story: {
            title: "The Farmer and the Horse",
            culturalOrigin: "Chinese Taoist Parable",
            content: "There's an old story of a farmer whose horse ran away. His neighbor said, 'Such bad luck!' The farmer replied, 'Maybe.'\n\nThe next day, the horse returned with three wild horses. 'How wonderful!' said the neighbor. 'Maybe,' said the farmer.\n\nWhen his son tried to tame one of the wild horses and broke his leg, the neighbor exclaimed, 'How terrible!' The farmer simply said, 'Maybe.'\n\nThe next week, officers came to draft young men into the army, but the son was excused because of his broken leg. The neighbor congratulated the farmer on his good fortune, to which the farmer responded, 'Maybe.'",
            whyThisMatters: "Right now, not knowing about the promotion feels like 'bad luck' - but you don't yet know how this will unfold. Whether you get this promotion or not, you can't see the full picture of how it will affect your career path. The 'maybe' mindset helps you stay present instead of catastrophizing about unknown outcomes."
          },
          cbt: {
            distortion: "catastrophizing",
            userThought: "Not knowing if I'll get the promotion or not! It's tough, everyone else might get it.",
            reframe: "The uncertainty is uncomfortable, but it doesn't mean disaster. You can't control the decision, but you can control how you prepare and perform. Your worth isn't determined by this one promotion - your career is a long game, and this is just one move.",
            practice: "Tonight before bed: Write down 3 things you did well at work this week. Tomorrow: Identify one task you can complete that's fully within your control, and focus your energy there instead of the promotion outcome."
          },
          reflection: "You're experiencing the collision of high stakes (career advancement) and zero control (waiting for a decision). That combination is uniquely stressful, and it makes sense that it's affecting your sleep and nerves.",
          patterns: [
            "Promotion uncertainty → constant vigilance → nervous system activation",
            "Workplace competition → comparison anxiety → feeling under threat",
            "Chronic stress → poor sleep → heightened anxiety (feedback loop)",
            "Loss of control → catastrophic thinking → more stress"
          ]
        };

        console.log('Returning mock results');
        return new Response(
          JSON.stringify(mockResults),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `You are an expert psychological counselor. Based on the conversation, provide a personalized analysis using the user's EXACT language.

CRITICAL: Use their own words, not therapy-speak. If they said "I'm drowning," use that. If they said "My boss is an asshole," quote it.

Format as JSON with this EXACT structure:
{
  "byline": "One compelling sentence capturing their core challenge",
  "whatsHappening": {
    "summary": "2-3 sentence empathetic explanation of what's happening psychologically (use warm, validating language)",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "fullExplanation": "Detailed 3-4 paragraph explanation connecting their experiences to psychological concepts. Use their specific situation.",
    "citations": [
      {"author": "Researcher Name", "year": "2020", "title": "Study Title relevant to their situation"}
    ]
  },
  "quotes": [
    {"text": "Direct quote from user", "sentiment": "positive|negative|neutral"},
    {"text": "Another impactful quote", "sentiment": "positive|negative|neutral"}
  ],
  "reframing": {
    "content": "3-4 paragraphs offering a thoughtful perspective shift using CBT, ACT, and therapeutic methods. NOT preachy, but gently expansive. Use their specific details (names, situations, actual events they mentioned). Connect their experience to broader human themes. Make them feel seen AND appropriately challenged. Use their own language and references."
  },
  "podcast": {
    "title": "Podcast Name",
    "host": "Host Name",
    "episode": "Episode Title (relevant to their issue)",
    "duration": "45 min",
    "description": "What this episode covers",
    "whyThisHelps": "Specific reason this helps their situation",
    "thumbnail": "https://via.placeholder.com/400x400?text=Podcast",
    "urls": {
      "spotify": "https://open.spotify.com/show/...",
      "applePodcasts": "https://podcasts.apple.com/..."
    }
  },
  "book": {
    "title": "Book Title",
    "author": "Author Name",
    "byline": "One-line book description",
    "length": "200 pages / 4-hour read",
    "description": "What this book covers",
    "whyThisHelps": "Specific reason this helps their situation",
    "coverImage": "https://via.placeholder.com/300x450?text=Book",
    "sampleUrl": "https://www.amazon.com/...",
    "purchaseUrl": "https://www.amazon.com/..."
  },
  "exercise": {
    "title": "Exercise Name",
    "description": "Brief description of the exercise",
    "duration": "5-10 minutes",
    "steps": [
      "Step 1 instruction",
      "Step 2 instruction",
      "Step 3 instruction"
    ]
  },
  "story": {
    "title": "Story Title",
    "culturalOrigin": "Cultural tradition (e.g., 'Cherokee Nation', 'Buddhist Parable', 'West African Folktale', 'Greek Mythology')",
    "content": "The full story text (2-3 paragraphs). Choose from diverse cultural traditions: African proverbs, Buddhist parables, Indigenous wisdom, Greek myths, Taoist stories, etc. Match the theme to their emotional situation.",
    "whyThisMatters": "Connect the story's wisdom to their specific situation. Use their actual details and help them see their experience in a new light through the story's lens."
  },
  "cbt": {
    "distortion": "Name of cognitive distortion",
    "userThought": "Quote their exact thought",
    "reframe": "Reframe using their situation",
    "practice": "Concrete action for tonight/tomorrow"
  },
  "reflection": "2-3 sentence empathetic reflection",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]
}

IMPORTANT: 
- All podcast/book URLs should be real and relevant (test that Spotify links go to Spotify, book links to Amazon/Bookshop.org)
- Use placeholder images only for thumbnails/covers
- Ensure diversity: No author should appear in multiple resource types
- Include diverse perspectives and voices in recommendations
- Make reframing SPECIFIC to their situation, not generic templates`;

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
        // Fallback to a basic structure matching the expected format
        results = {
          byline: "You're navigating a challenging time",
          whatsHappening: {
            summary: "You're experiencing stress from multiple sources that are compounding on each other. This is creating a pattern where each challenge makes the others feel heavier.",
            themes: ["Stress", "Overwhelm", "Coping"],
            fullExplanation: "When we face multiple stressors simultaneously, our capacity to cope becomes stretched. This isn't a sign of weakness - it's a natural response to being pulled in many directions at once.\n\nYour body and mind are signaling that they need support, which is why you're here tonight. That awareness is actually a strength, not a failure.\n\nThe key is understanding that you don't have to solve everything at once. Small, intentional steps toward rest and boundary-setting can create positive ripple effects across all areas of stress.",
            citations: [
              { author: "Lazarus & Folkman", year: "1984", title: "Stress, Appraisal, and Coping" }
            ]
          },
          quotes: [
            { text: "I'm struggling with a lot right now", sentiment: "negative" }
          ],
          reframing: {
            content: "What you're feeling isn't weakness - it's your system saying it needs care. Just as a tree doesn't grow all at once but through countless small moments, you don't have to solve everything tonight.\n\nThe challenges you're facing are real, and they deserve acknowledgment. But so do your efforts to show up, even when it's hard. That takes courage.\n\nRemember: progress doesn't require perfection. It requires showing up with compassion for yourself, one day at a time."
          },
          podcast: {
            title: "The Happiness Lab",
            host: "Dr. Laurie Santos",
            episode: "Managing Stress Through Self-Compassion",
            duration: "38 min",
            description: "Evidence-based strategies for handling overwhelming periods with kindness toward yourself.",
            whyThisHelps: "This episode offers practical tools for managing stress when you're feeling stretched thin.",
            thumbnail: "https://via.placeholder.com/400x400?text=Happiness+Lab",
            urls: {
              spotify: "https://open.spotify.com/show/3i5TCKhc6GY42pOWkpWveG",
              applePodcasts: "https://podcasts.apple.com/us/podcast/the-happiness-lab-with-dr-laurie-santos/id1474244606"
            }
          },
          book: {
            title: "The Upside of Stress",
            author: "Kelly McGonigal",
            byline: "Why Stress Is Good for You, and How to Get Good at It",
            length: "304 pages / 6-hour read",
            description: "A science-backed approach to transforming your relationship with stress.",
            whyThisHelps: "This book helps reframe stress as something that can strengthen you rather than just drain you.",
            coverImage: "https://via.placeholder.com/300x450?text=Upside+of+Stress",
            sampleUrl: "https://www.amazon.com/Upside-Stress-Why-Good-You-ebook/dp/B00PWCTP8Y",
            purchaseUrl: "https://www.amazon.com/Upside-Stress-Why-Good-You/dp/1101982934"
          },
          exercise: {
            title: "4-7-8 Breathing",
            description: "A calming breath technique that helps activate your parasympathetic nervous system and prepare for sleep.",
            duration: "5 minutes",
            steps: [
              "Sit or lie comfortably and place your tongue behind your upper front teeth.",
              "Exhale completely through your mouth, making a whoosh sound.",
              "Close your mouth and inhale quietly through your nose for 4 counts.",
              "Hold your breath for 7 counts.",
              "Exhale completely through your mouth for 8 counts, making a whoosh sound.",
              "Repeat this cycle 3-4 times total.",
              "Notice how your body feels more relaxed with each cycle."
            ]
          },
          story: {
            title: "The Cracked Pot",
            culturalOrigin: "Buddhist Parable",
            content: "A water bearer in India had two large pots, each hung on opposite ends of a pole he carried across his neck. One pot was perfect, while the other had a crack that leaked water along the path.\n\nFor two years, the water bearer made this trip daily. The perfect pot was proud of its accomplishments, but the cracked pot was ashamed of its imperfection. One day, it spoke to the bearer: 'I am ashamed of my flaw. I leak water, and you only get half of what I carry.'\n\nThe water bearer smiled and pointed to the path. 'Do you see the beautiful flowers on your side of the path? I've always known about your flaw, so I planted flower seeds on your side. Every day while we walk back, you water them. For two years, I've been able to pick these beautiful flowers to decorate my table. Without you being just the way you are, I wouldn't have this beauty.'",
            whyThisMatters: "Right now, you might feel like that cracked pot - imperfect, struggling, not measuring up. But your challenges have taught you things others don't know. Your sensitivity, your awareness, your ability to feel deeply - these aren't flaws. They're part of what makes you uniquely able to understand, to connect, to grow. You don't have to be perfect to be valuable."
          },
          cbt: {
            distortion: "All-or-nothing thinking",
            userThought: "I have to handle everything perfectly or I'm failing",
            reframe: "You can be doing your best while also struggling. Progress isn't about perfection - it's about taking the next right step, even when you're tired.",
            practice: "Tonight, write down one thing you did well today, no matter how small. Then pick one thing you can let go of or delegate tomorrow."
          },
          reflection: "You're navigating a challenging time, and it's understandable to feel overwhelmed. The fact that you're here seeking support shows strength and self-awareness.",
          patterns: [
            "Multiple stressors creating cumulative load",
            "Need for intentional rest and boundary-setting",
            "Body and mind signaling need for support"
          ]
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
