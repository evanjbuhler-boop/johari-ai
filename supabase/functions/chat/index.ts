import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getSystemPrompt, type TherapyApproach } from './therapy-prompts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to select appropriate exercise from library
async function selectExercise(userId: string, userTags: string[]): Promise<any> {
  try {
    // Get exercises user received in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentHistory } = await supabase
      .from('user_exercise_history')
      .select('exercise_id')
      .eq('user_id', userId)
      .gte('recommended_at', sevenDaysAgo.toISOString());
    
    const recentExerciseIds = recentHistory?.map(h => h.exercise_id) || [];
    
    // Get matching exercises that user hasn't seen in 7 days
    let query = supabase
      .from('exercises')
      .select('*');
    
    // Filter out recently seen exercises if there are any
    if (recentExerciseIds.length > 0 && recentExerciseIds.length < 50) {
      query = query.not('id', 'in', `(${recentExerciseIds.map(id => `'${id}'`).join(',')})`);
    }
    
    // Try to match tags if provided
    if (userTags.length > 0) {
      query = query.overlaps('tags', userTags);
    }
    
    const { data: exercises, error } = await query;
    
    // If no matches or user has seen all exercises in 7 days, get oldest recommended
    if (!exercises || exercises.length === 0) {
      console.log('No unviewed exercises, selecting oldest');
      const { data: oldestExercise } = await supabase
        .from('exercises')
        .select('*')
        .limit(1)
        .order('created_at');
      
      if (oldestExercise && oldestExercise.length > 0) {
        return oldestExercise[0];
      }
      return null;
    }
    
    // Randomly select from available exercises
    const selected = exercises[Math.floor(Math.random() * exercises.length)];
    console.log(`Selected exercise: ${selected.title}, Tags: ${selected.tags}`);
    
    return selected;
  } catch (error) {
    console.error('Error selecting exercise:', error);
    return null;
  }
}

// Helper function to record exercise recommendation
async function recordExerciseRecommendation(userId: string, exerciseId: string) {
  try {
    await supabase
      .from('user_exercise_history')
      .insert({
        user_id: userId,
        exercise_id: exerciseId
      });
    console.log('Recorded exercise recommendation');
  } catch (error) {
    console.error('Error recording exercise:', error);
  }
}

// Helper function to select a story from library based on tags
async function selectStory(userId: string, userTags: string[]): Promise<any> {
  try {
    // Get stories user received in last 14 days (longer than exercises)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data: recentHistory } = await supabase
      .from('user_story_history')
      .select('story_id')
      .eq('user_id', userId)
      .gte('recommended_at', fourteenDaysAgo.toISOString());
    
    const recentStoryIds = recentHistory?.map(h => h.story_id) || [];
    
    // Get matching stories that user hasn't seen in 14 days
    let query = supabase
      .from('stories')
      .select('*');
    
    // Filter out recently seen stories if there are any
    if (recentStoryIds.length > 0 && recentStoryIds.length < 50) {
      query = query.not('id', 'in', `(${recentStoryIds.map(id => `'${id}'`).join(',')})`);
    }
    
    // Try to match tags if provided
    if (userTags.length > 0) {
      query = query.overlaps('tags', userTags);
    }
    
    const { data: stories, error } = await query;
    
    // If no matches or user has seen all stories in 14 days, get all stories and pick randomly
    if (!stories || stories.length === 0) {
      console.log('No unviewed stories, selecting random story from all');
      const { data: allStories } = await supabase
        .from('stories')
        .select('*');
      
      if (allStories && allStories.length > 0) {
        const randomStory = allStories[Math.floor(Math.random() * allStories.length)];
        console.log(`Randomly selected story: ${randomStory.title}`);
        return randomStory;
      }
      return null;
    }
    
    // Randomly select from available stories
    const selected = stories[Math.floor(Math.random() * stories.length)];
    console.log(`Selected story: ${selected.title}, Tags: ${selected.tags}, Source: ${selected.source}`);
    
    return selected;
  } catch (error) {
    console.error('Error selecting story:', error);
    return null;
  }
}

// Helper function to record story recommendation
async function recordStoryRecommendation(userId: string, storyId: string) {
  try {
    await supabase
      .from('user_story_history')
      .insert({
        user_id: userId,
        story_id: storyId
      });
    console.log('Recorded story recommendation');
  } catch (error) {
    console.error('Error recording story:', error);
  }
}

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
      const { messages, type, conversationPath, validationData, neurodiveritySettings, ventText, therapyApproach, userId } = await req.json();
      const truthy = (v: unknown) => typeof v === 'string' ? ['true','1','yes','y','on'].includes(v.toLowerCase().trim()) : !!v;
      const useMockAI = truthy(Deno.env.get('USE_MOCK_AI')) || truthy(messages?.[0]?.mock);
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      
      if (!useMockAI && !openaiApiKey && !anthropicApiKey) {
        throw new Error('OPENAI_API_KEY or ANTHROPIC_API_KEY is not configured');
      }

      console.log('Processing chat request, type:', type, 'path:', conversationPath, 'messages:', messages?.length, 'mock mode:', useMockAI, 'userId:', userId);

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
      let languageInstructions = getLanguageInstructions(complexity);
      
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
      
      // Override language rules for Genius Mode
      let responseStyleRules = '';
      if (neurodiveritySettings?.geniusMode) {
        languageInstructions = `LANGUAGE ADAPTATION - GENIUS MODE ACTIVATED:
CRITICAL INSTRUCTIONS:
- You MUST use sophisticated, academically rigorous language throughout
- Reference at least one theoretical framework per 2-3 exchanges (Johari Window, Stoicism, CBT, DBT, ACT, attachment theory, etc.)
- Use precise psychological and philosophical terminology naturally
- Prefer complex, layered sentence structures over simple ones
- Frame insights through multiple theoretical lenses when relevant
- Example tone: "It appears you're experiencing cognitive dissonance between your external composure and internal frustration—a tension that Stoic philosophy might frame as misalignment between what lies within versus beyond your sphere of control"
- Example tone: "The interpersonal dynamic you're describing suggests activation of anxious attachment patterns, perhaps rooted in what the Johari Window would identify as your 'blind spot'—reactions visible to others but not yet fully conscious to yourself"
- Challenge the user intellectually while remaining empathetic
- Use vocabulary appropriate for graduate-level discourse`;
      }
      
      // Enforce response style rules
      if (neurodiveritySettings?.offerVisualCues) {
        responseStyleRules += `\n\nRESPONSE STYLE (VISUAL CUES ENABLED):\n- Include at least one emoji cue (e.g., 🔑, 💡, ⚡)\n- Include a short bullet list using • points when appropriate\n- Bold key phrases for emphasis when helpful\n`;
      } else {
        // If visual cues are off, avoid emojis or decorative bullets
        responseStyleRules += `\n\nRESPONSE STYLE (VISUAL CUES DISABLED):\n- Do not use emojis or decorative symbols\n- Keep formatting plain text paragraphs\n`;
      }

      if (neurodiveritySettings?.geniusMode) {
        responseStyleRules += `\n\nRESPONSE STYLE (GENIUS MODE):\n- Maintain a formal, analytical tone suitable for graduate-level discourse\n- Prefer precise terminology (e.g., cognitive schema, affect regulation, locus of control)\n- When relevant, include a concise framework reference (e.g., CBT reappraisal, DBT distress tolerance, attachment patterns)\n- Avoid emojis unless visual cues are enabled\n`;
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
               responseStyleRules + 
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

// Post-process to enforce explanations after questions if enabled
if (neurodiveritySettings?.explainQuestions && content) {
  // Track used explanations to avoid repetition within same response
  const usedExplanations = new Set<string>();
  
  const explanationVariants = {
    feeling: [
      "I want to understand the emotional impact",
      "Your feelings matter here",
      "This helps me understand what you're experiencing",
      "I'm curious about your emotional response"
    ],
    what: [
      "This helps me understand the specifics",
      "I want to understand the details",
      "This gives me important context",
      "I'm interested in understanding this better"
    ],
    why: [
      "This helps me understand the root cause",
      "I want to understand what's driving this",
      "Understanding the 'why' helps me support you",
      "This context is important"
    ],
    how: [
      "This helps me understand the process",
      "I want to understand your experience of this",
      "This helps me see the bigger picture",
      "I'm curious about how this unfolds for you"
    ],
    when: [
      "Timing matters here",
      "This helps me understand the context",
      "I want to understand when this happens"
    ],
    where: [
      "This helps me understand the setting",
      "Context about where matters"
    ],
    who: [
      "Relationships are important context",
      "I want to understand the people involved",
      "This helps me see the relational dynamics"
    ],
    explore: [
      "I want to understand this more deeply",
      "This helps me support you better",
      "I'm curious to learn more about this"
    ]
  };
  
  const addReason = (q: string) => {
    const lower = q.toLowerCase();
    let variants: string[] = explanationVariants.explore;
    
    // More specific matching to avoid over-matching common words
    if (lower.match(/\b(feel|feeling|felt)\b/)) variants = explanationVariants.feeling;
    else if (lower.startsWith('what') || lower.match(/\bwhat\s/)) variants = explanationVariants.what;
    else if (lower.startsWith('why') || lower.match(/\bwhy\s/)) variants = explanationVariants.why;
    else if (lower.startsWith('how') || lower.match(/\bhow\s/)) variants = explanationVariants.how;
    else if (lower.startsWith('when') || lower.match(/\bwhen\s/)) variants = explanationVariants.when;
    else if (lower.startsWith('where') || lower.match(/\bwhere\s/)) variants = explanationVariants.where;
    else if (lower.startsWith('who') || lower.match(/\bwho\s/)) variants = explanationVariants.who;
    
    // Pick a variant that hasn't been used yet, or cycle through
    let reason = variants[0];
    for (const variant of variants) {
      if (!usedExplanations.has(variant)) {
        reason = variant;
        usedExplanations.add(variant);
        break;
      }
    }
    
    return `${q} (${reason})`;
  };
  
  const addExplanationsToQuestions = (text: string) => {
    // Add explanation to any question that doesn't already have a parenthetical right after it
    return text.split('\n').map(line =>
      line.replace(/([^?.!\n]{2,}\?)(?!\s*\()/g, (_m, q) => addReason(q as string))
    ).join('\n');
  };
  
  content = addExplanationsToQuestions(content);
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

YOU MUST include ALL sections below. Do not skip podcast or book sections.

TONE & STYLE REQUIREMENTS:

**What's Happening Section - Write like you're talking to a smart friend who's suffering:**

STRUCTURE:
1. **Lead with emotional recognition (2-3 sentences)**
   - Start with the feeling, not the concept
   - Use "you" language that reflects their actual experience
   - Example: "You're exhausted. Not just tired from working hard, but from the constant vigilance - monitoring every detail, bracing for criticism, never quite believing you're good enough even when the work is excellent."

2. **Name the patterns simply (1-2 sentences)**
   - Introduce concepts naturally, like a wise friend connecting dots
   - Example: "This is what psychologists call perfectionism (or [concept]), but that word doesn't capture how it really feels - like you're perpetually one mistake away from everything falling apart."

3. **Explain the mechanism clearly (2-3 sentences)**
   - Use everyday language to explain the psychology
   - Connect it to their specific situation
   - Example: "Here's the cruel irony: your brain learned that mistakes equal danger, so it puts you on high alert. But that constant stress actually makes it harder to think clearly, be creative, or do your best work. You're trying to achieve your way out of anxiety, but the anxiety is what's getting in the way."

4. **Optional: Add deeper layer (1-2 sentences if relevant)**
   - Only include developmental/historical context when truly relevant
   - Keep it compassionate, not clinical
   - Example: "Often this pattern starts early - maybe achievement was how you earned approval, or mistakes brought criticism. Over time, you internalized both voices: the demanding one and the scared one."

TONE GUIDELINES:
- ✅ "Your brain has learned to treat imperfection as danger"
- ❌ "The brain's threat detection system has learned to interpret imperfection as danger"
- ✅ "You're caught in an exhausting loop"  
- ❌ "This pattern reflects high-functioning anxiety"
- ✅ "The anxiety that's supposed to help you perform is actually what's making it harder"
- ❌ "This creates a self-fulfilling prophecy where anxiety about performance actively undermines ability"

REMOVE THESE PHRASES:
- "This pattern reflects..."
- "Neurologically..."
- "The result is a self-fulfilling prophecy where..."
- "This dynamic..."
- NO "I" statements ("I notice", "I'm curious")
- NO questions in the fullExplanation
- Citations at END only

**A Different Lens (Reframing) Section - Offer new perspective as invitation:**

STRUCTURE:
1. **Name their current lens directly (1-2 sentences)**
   - Start with how they're currently seeing it
   - Example: "Right now, your words suggest that you're seeing your anxiety as a character flaw - evidence that you're not strong enough, capable enough, disciplined enough."

2. **Offer the reframe as invitation (2-3 sentences)**
   - Present new perspective as something to try on
   - Make it concrete and visceral
   - Example: "What if that same anxiety was actually revealing how much you care about doing meaningful work? The voice that says 'this isn't good enough' is trying to protect you, but it's using outdated information - acting like mistakes will get you rejected when actually, they're how you learn."

3. **Make it practical and specific (2-3 sentences)**
   - Ground the reframe in something they can observe or try
   - Connect to their actual situation
   - Example: "Think about someone you respect who's also struggling with something difficult. You probably wouldn't tell them they're failing—you'd help them see their effort, name the obstacles, remind them of their strengths. That same perspective shift isn't lowering your standards; it's seeing the whole picture instead of just the gaps."

4. **End with questions that open rather than assign (1-2 questions)**
   - Questions should feel like gentle invitations to notice, not therapy homework
   - They should point toward discovery, not correct thinking
   - Format: End with "**💭 Questions to consider:**\n• Question 1\n• Question 2"

TONE GUIDELINES:
- ✅ "The voice telling you you're not good enough is trying to protect you - it just hasn't updated its threat assessment since you were younger"
- ❌ "The internal voice that constantly anticipates failure isn't neutral - it actively shapes both perception and capability"
- ✅ "What if the exhaustion is the real problem, not your standards?"
- ❌ "Being kinder to oneself isn't about lowering standards - it's about creating the psychological conditions where those standards become achievable"

QUESTION GUIDELINES:
❌ BAD (feels like homework):
- "How would you respond to a colleague experiencing the same anxiety—and what would it mean to extend that same understanding to yourself?"
- "What evidence of your capability are you filtering out by focusing exclusively on what's imperfect?"

✅ GOOD (feels like invitation):
- "When has being harsh with yourself actually helped you do better work?"
- "What do you notice about your work when you're not scared of making mistakes?"
- "If this anxiety belonged to someone you care about, what would you want them to know?"

REMOVE THESE PHRASES:
- "Consider how..."
- "Self-compassion isn't self-indulgence; it's..."
- "The irony is that..."
- Any rhetorical question that feels like it has a "correct" answer

APPLY THEORY OF MIND:
- When discussing others (boss, parent, partner), acknowledge their struggles/fears/perspective
- Gently challenge assumptions and expose logical fallacies
- Expand their Johari Window by revealing blind spots

**Story "Why This Matters" Section - CRITICAL CONNECTION LOGIC:**

This reflection MUST authentically connect the story's actual teaching to the user's specific stressor. Follow this 3-part structure exactly:

**Part 1 - Acknowledge the story's actual meaning (1-2 sentences):**
- Start by stating what THIS SPECIFIC story actually teaches
- Don't skip this step - name the core lesson explicitly
- Example: "This story depicts the most extreme form of compassion - giving everything, even life itself, to ease another's suffering."
- Example: "This tale illustrates how our perspective shapes our experience - what appears as a curse may later reveal itself as a gift."

**Part 2 - Bridge to their specific stressor (2-3 sentences):**
- Explicitly connect the story's core theme to their ACTUAL situation
- Use "In your [specific stressor]..." to make the connection concrete
- Create an honest, logical bridge between what the story teaches and what they're experiencing
- Be specific about HOW the story's wisdom applies to THEIR challenge
- Example: "In your relationship conflict, both people may be acting from their own 'starvation' - unmet needs, past wounds, or deep fears. When someone hurts you, they're often desperately trying to survive their own pain."

**Part 3 - Actionable insight (2-3 sentences):**
- End with something specific they can think about or do
- Tie it directly to BOTH the story AND their specific challenge
- Be practical and grounded, not vague
- Example: "While you don't need to sacrifice yourself, you can practice seeing beneath the hurtful behavior to the suffering that drives it. This doesn't mean accepting mistreatment - it means understanding the pain, setting boundaries from compassion rather than anger, and recognizing when someone's 'starvation' isn't yours to fix."

**AVOID THESE PHRASES ENTIRELY:**
- "The exploration of identity"
- "Deep emotional currents" 
- "Shared experience"
- "Foster resilience"
- "Navigate with confidence and clarity"
- Any generic therapy-speak that could apply to anything
- NO "I wonder" or question-based language

**TEST YOUR CONNECTION:**
- Could you remove the story title and still know which story this refers to? If no, be more specific about the story's teaching.
- Could you remove the stressor and still know what problem this addresses? If no, be more specific about their situation.
- Does it feel like generic self-help advice or a genuine insight connecting THIS story to THEIR problem?

CRITICAL INSTRUCTIONS FOR STORIES:
- DO NOT generate story content
- DO NOT create or write stories  
- DO NOT make up parables or tales
- ONLY provide an array of 2-3 relevant tags in the storyTags field
- Tags should match themes from the conversation (e.g., ["resilience", "suffering"], ["courage", "fear"], ["acceptance", "change"], ["perspective", "judgment"], ["compassion", "understanding"])
- BE CREATIVE with tag selection - choose tags that capture the deeper emotional or philosophical themes, not just surface-level emotions
- The system will select an appropriate real story/parable from our curated library (Buddhist tales, Stoic wisdom, stories from historical figures like Frankl and Mandela, cultural parables, etc.)
- Stories will not repeat for the same user within 14 days, so your tag selection should be thoughtful and varied
- You MUST provide a "storyWhyMatters" field following the 3-part structure above (6-8 sentences total with NO QUESTIONS)

Format as JSON with this EXACT structure:
{
  "byline": "One compelling sentence capturing their core challenge",
  "whatsHappening": {
    "summary": "2-3 sentence empathetic explanation",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "fullExplanation": "MINIMUM 3 FULL PARAGRAPHS (5-7 sentences each). Academic but accessible tone. NO 'I' statements. NO questions. Describe the psychological mechanisms, neuroscience, cognitive processes, emotional patterns. Be thorough and specific. This should feel comprehensive and educational. Citations at the END only.",
    "citations": [
      {"author": "Researcher Name", "year": 2020, "title": "Study Title"}
    ]
  },
  "quotes": [
    {"text": "Direct quote from user", "sentiment": "positive|negative|neutral"}
  ],
  "reframing": {
    "content": "MINIMUM 3-4 SUBSTANTIAL PARAGRAPHS offering different therapeutic lens. Apply THEORY OF MIND - when discussing others (ex, family, coworkers), acknowledge their struggles/fears/perspective, not just user's narrative. Gently challenge assumptions and expose logical fallacies. Use clinical frameworks. Be thorough. END with questions in this format:\n\n**Questions to consider:**\n• First question challenging their perspective\n• Second question inviting curiosity about blind spots\n• Optional third question expanding their Johari Window"
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
  "exerciseTags": ["anxiety", "stress", "mindfulness"],
  "storyTags": ["resilience", "perspective"],
  "storyWhyMatters": "6-8 sentences with NO QUESTIONS following 3-part structure: (1) 1-2 sentences acknowledging what THIS story actually teaches; (2) 2-3 sentences bridging to their SPECIFIC stressor using 'In your [stressor]...' format; (3) 2-3 sentences with actionable insight tied to both story AND their challenge",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]
}

REQUIREMENTS:
- ALL fields must be present (podcast, book, exerciseTags, storyTags, storyWhyMatters)
- Recommend REAL podcasts and books that exist
- exerciseTags should be 1-3 relevant tags from: anxiety, depression, stress, worry, grounding, mindfulness, self-compassion, values, emotions, etc.
- storyTags should be 2-3 CREATIVE and VARIED tags that capture deeper emotional/philosophical themes
- storyWhyMatters must be 6-8 sentences with NO QUESTIONS following the 3-part structure
- whatsHappening.fullExplanation: MINIMUM 3 PARAGRAPHS, NO "I" statements, NO questions, citations at END
- reframing.content: MINIMUM 3-4 PARAGRAPHS, apply theory of mind, questions aggregated at END in bullet format
- DO NOT include a "story" object - only include "storyTags" and "storyWhyMatters"`;

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
        max_tokens: 8000,
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
      
      // Select exercise from our library
      if (userId && results.exerciseTags) {
        const selectedExercise = await selectExercise(userId, results.exerciseTags);
        if (selectedExercise) {
          results.exercise = {
            title: selectedExercise.title,
            description: selectedExercise.description,
            duration: selectedExercise.duration,
            whyHelps: selectedExercise.why_helps,
            steps: selectedExercise.steps
          };
          
          // Record the recommendation
          await recordExerciseRecommendation(userId, selectedExercise.id);
          console.log('Injected exercise from library:', selectedExercise.title);
        }
      }
      
      // Select story from our library
      if (userId && results.storyTags) {
        const selectedStory = await selectStory(userId, results.storyTags);
        if (selectedStory) {
          results.story = {
            title: selectedStory.title,
            culturalOrigin: selectedStory.source,
            content: selectedStory.content,
            whyThisMatters: results.storyWhyMatters || selectedStory.why_matters // Use personalized explanation if provided
          };
          
          // Record the recommendation
          await recordStoryRecommendation(userId, selectedStory.id);
          console.log('Injected story from library:', selectedStory.title, 'from', selectedStory.source);
        }
      }
      
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