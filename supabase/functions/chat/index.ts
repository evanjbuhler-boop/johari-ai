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
    // Get stories user received in last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data: recentHistory } = await supabase
      .from('user_story_history')
      .select('story_id')
      .eq('user_id', userId)
      .gte('recommended_at', fourteenDaysAgo.toISOString());
    
    const recentStoryIds = recentHistory?.map(h => h.story_id) || [];
    
    // TIER 1: Try to find relevant stories (matching tags) that haven't been seen in 14 days
    if (userTags.length > 0) {
      let query = supabase
        .from('stories')
        .select('*')
        .overlaps('tags', userTags);
      
      if (recentStoryIds.length > 0 && recentStoryIds.length < 50) {
        query = query.not('id', 'in', `(${recentStoryIds.map(id => `'${id}'`).join(',')})`);
      }
      
      const { data: relevantUnseenStories } = await query;
      
      if (relevantUnseenStories && relevantUnseenStories.length > 0) {
        const selected = relevantUnseenStories[Math.floor(Math.random() * relevantUnseenStories.length)];
        console.log(`TIER 1: Selected relevant unseen story: ${selected.title}`);
        return selected;
      }
    }
    
    // TIER 2: If no relevant unseen stories, try stories without tag matching that haven't been seen
    if (recentStoryIds.length > 0 && recentStoryIds.length < 50) {
      const { data: unseenStories } = await supabase
        .from('stories')
        .select('*')
        .not('id', 'in', `(${recentStoryIds.map(id => `'${id}'`).join(',')})`);
      
      if (unseenStories && unseenStories.length > 0) {
        const selected = unseenStories[Math.floor(Math.random() * unseenStories.length)];
        console.log(`TIER 2: Selected unseen story (no tag match): ${selected.title}`);
        return selected;
      }
    }
    
    // TIER 3: If user has seen everything recently, prioritize relevance over recency
    if (userTags.length > 0) {
      const { data: relevantStories } = await supabase
        .from('stories')
        .select('*')
        .overlaps('tags', userTags);
      
      if (relevantStories && relevantStories.length > 0) {
        const selected = relevantStories[Math.floor(Math.random() * relevantStories.length)];
        console.log(`TIER 3: Selected relevant story (seen recently): ${selected.title}`);
        return selected;
      }
    }
    
    // TIER 4: Last resort - pick any random story
    console.log('TIER 4: No matches found, selecting random story');
    const { data: allStories } = await supabase
      .from('stories')
      .select('*');
    
    if (allStories && allStories.length > 0) {
      const selected = allStories[Math.floor(Math.random() * allStories.length)];
      console.log(`Random story: ${selected.title}`);
      return selected;
    }
    
    return null;
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

const systemPrompt = `You are an expert psychological counselor. Based on the conversation, provide a personalized analysis.

CRITICAL RULE: DO NOT USE USER'S EXACT WORDS in recommendations sections. Paraphrase their situations and examples using clinical/neutral language. Users may share these insights with others. Direct quotes only belong in "Your Words" section.

YOU MUST include ALL sections below. Do not skip podcast or book sections.

TONE & STYLE REQUIREMENTS:

**What's Happening Section - Pattern Recognition & Full Synthesis:**

LENGTH: 200-300 words (15-20 sentences) - this is the core insight, don't shortchange it.

CRITICAL: This is PATTERN RECOGNITION, not emotional validation. Map the complete territory they showed you.

STRUCTURE:
1. **Map the full territory (4-5 sentences)**
   - Identify EVERY instance where this pattern appeared in the conversation (romantic relationship, business partnership, meeting new people, etc.)
   - Don't cherry-pick - show the complete scope across all domains they mentioned
   - Synthesize: "This pattern is showing up in [domain], in [domain], and in [domain]"

2. **Name the system (4-5 sentences)**
   - What's the underlying mechanism driving all these instances?
   - Not "you feel insecure" but "you've built a self-worth system that requires constant external validation through X mechanism"
   - Be specific about HOW the system operates
   - Example: "You've built a self-worth system where your value is measured by how others perceive and respond to you"

3. **Show the pattern in action (4-5 sentences)**
   - Use their situations (paraphrased) to demonstrate how this plays out
   - Connect specific examples: "This appeared when [situation], and when [situation], and when [situation]"
   - Make the connections between domains explicit
   - Show the pattern, don't just describe it

4. **Identify the cost (3-4 sentences)**
   - What is this pattern preventing or making harder for them?
   - Be specific to their examples and goals
   - Focus on what they can't do or decide clearly because of this pattern
   - Example: "The cost is that you can't make clear decisions about [specific situation] because you're trying to extract self-worth data from situations that are actually about [actual issue]"

QUALITY TESTS:
- Could this be written about someone else? → Too generic, rewrite
- Did you use their actual situations (paraphrased)? → If no, rewrite  
- Does it name what they're DOING not just feeling? → If no, rewrite
- Is it 200-300 words? → If no, expand

PARAPHRASING RULE:
- ❌ "When you said 'I think being replaced makes me less than'..."
- ✅ "The belief that a former partner moving on diminishes your worth..."
- ❌ "You mentioned that because she is so beautiful, you viewed that as positive reflection of your manhood..."
- ✅ "The tendency to derive self-worth from a partner's perceived desirability..."

TONE GUIDELINES:
- Direct and observational, like a skilled therapist naming what they see
- Not gentle/validating but clear and precise
- Use "you" language focused on actions and patterns, not feelings
- NO therapy-speak, NO "I notice", NO questions

**The Theory Section - Go Deep on ONE Framework:**

This NEW section goes BETWEEN "What's Happening" and "A Different Lens" sections.

LENGTH: 2-3 paragraphs (each 5-7 sentences)

CRITICAL: Choose ONE psychological framework that unlocks their pattern. Go deep, not wide.

SELECTION RULE:
- Pick the ONE theory/concept that most directly explains the mechanism identified in "What's Happening"
- Maybe add a second concept ONLY if truly essential to understanding
- DO NOT list multiple theories (no "social comparison + confirmation bias + catastrophic thinking + contingent self-worth + attachment")
- Depth over breadth

REQUIRED ELEMENTS PER CONCEPT:
1. **Theory/concept name** (bold on first mention)
2. Researcher(s) + year + institution (when relevant)
3. Specific study: methodology, sample size, key quantitative finding
4. Mechanism explanation: the psychological/neurological "how" and "why"
5. Why this creates problems or maintains the cycle
6. Direct application to user's pattern (paraphrased examples)

CITATION STANDARDS:
- ❌ "Studies show..." or "Research indicates..."
- ✅ "Crocker & Wolfe's 2001 study of 600 college students at University of Michigan found that those with approval-based contingent self-worth experienced 3x more daily mood fluctuations"
- Include: researcher names, year, sample size/methodology, specific quantitative finding
- Reference fMRI/neuroscience studies when explaining brain mechanisms

DEPTH EXAMPLE:
❌ BAD (too shallow): "Contingent self-worth is when your self-esteem depends on external validation. This can cause anxiety and mood problems."

✅ GOOD (appropriate depth): "**Contingent self-worth** - the phenomenon where self-esteem depends on meeting specific standards - was extensively studied by Crocker & Wolfe (2001) at University of Michigan. Their longitudinal research following 600 college students found that individuals whose self-worth was contingent on others' approval experienced what researchers termed 'the approval treadmill': each instance of validation provided only temporary relief (averaging 2-4 hours), requiring increasingly frequent external confirmation to maintain baseline self-esteem. Subsequent fMRI studies (Eisenberger et al., 2003) revealed why this pattern is so powerful: for individuals with approval-contingent self-worth, social rejection activates the anterior cingulate cortex - the same brain region that processes physical pain. This explains why a business partner's disengagement can feel like an existential threat rather than just a business disappointment. The mechanism creates a self-reinforcing cycle: because external validation provides only temporary relief, the person must continuously seek new sources of approval, making them hypersensitive to any signal of rejection or withdrawal, which then triggers the pain response, which then drives more approval-seeking behavior."

STRUCTURE:
- Para 1: Introduce the ONE theory with full citation, explain the core mechanism, include specific research findings
- Para 2: Explain WHY this mechanism creates problems (neurological, cognitive, emotional processes)  
- Para 3 (optional): If a second essential concept is needed, introduce it and connect to the first. Otherwise, deepen the application to their specific pattern.

Each paragraph should END by explicitly connecting back to their pattern using their paraphrased situations.

PARAPHRASING RULE APPLIES:
- Reference their situations but use clinical/neutral language
- ❌ "This explains why your ex-girlfriend's request for friendship felt like proof of inadequacy"
- ✅ "This explains why a former partner's desire for friendship might feel like evidence of inadequacy rather than information about compatibility"

QUALITY TESTS:
- Did you pick ONE theory that unlocks their pattern (not 5 that touch on it)? 
- Does each concept include: researcher names, year, specific study findings?
- Did you explain the mechanism (the HOW), not just define the term?
- Is this teaching them something NEW about the psychological mechanism?
- Does it connect back to their paraphrased pattern?

STOP doing:
- Listing multiple theories without depth
- Generic definitions without research citations
- Theory that doesn't illuminate THEIR specific pattern
- Academic teaching without clear relevance to their situation

START doing:
- Ruthlessly select the most relevant framework
- Cite specific studies with methodology and findings
- Explain mechanisms at the level they learn something new
- Connect every paragraph back to their pattern

**A Different Lens (Reframing) Section - Concrete Reframe with Powerful Questions:**

IMPORTANT: This section should REFERENCE and APPLY the theory explained in THE THEORY section.

LENGTH: 4 paragraphs

CRITICAL: Give them language they can actually use to think differently. Be specific and actionable.

STRUCTURE:
1. **Name their current lens explicitly (2-3 sentences)**
   - "Right now, you're interpreting [pattern] as [meaning]"
   - Be specific about what they're seeing and how they're seeing it
   - Use paraphrased examples from their conversation
   - Example: "Right now, you're seeing a business partner's disengagement as evidence of your inadequacy rather than information about the partnership dynamics"

2. **Offer the reframe with specific language (3-4 sentences)**
   - Present new perspective with CONCRETE language they can use
   - Reference the mechanism from THE THEORY section directly
   - Give them actual WORDS to use in the moment
   - Not "shift your perspective" but "Instead of thinking 'X', you could think 'Y'"
   - Example: "But given what you now understand about contingent self-worth, here's another way to see it: Instead of 'their withdrawal means I'm inadequate,' you could think 'their withdrawal is data about what they need or fear, not a verdict on my worth.' This isn't about positive thinking - it's about accuracy."

3. **Make it actionable with specific application (3-4 sentences)**
   - How does this reframe change their next conversation/decision?
   - Be specific to their upcoming situations (business meeting, ex-girlfriend friendship, etc.)
   - Give concrete actions they can take
   - Example: "In your business conversation today, this means asking direct questions about the partnership ('What do you need that you're not getting?') rather than trying to read their behavior for clues about your worth. When your former partner talks about dating, you can hear it as information about her life rather than evidence about your adequacy, which changes whether that friendship serves you or drains you."

4. **End with 2 bold provocative questions (2 questions)**
   - Questions should be specific to their situation, not generic
   - Should assume the reframe and push forward toward action
   - Should create slight productive discomfort
   - Should point toward what they need to do/ask/decide
   - Format: **[Bold question 1]?** **[Bold question 2]?**

PARAPHRASING RULE APPLIES:
- Reference their situations using neutral/clinical language
- Don't use their exact words or quotes

TONE GUIDELINES:
- ✅ "Given what you now understand about contingent self-worth, you can see how..."
- ✅ "Remember that threat-detection system we discussed - that's what's activating when..."
- ✅ "Instead of '[old thought]', you could think '[new thought using specific language]'"
- ❌ "The internal voice that constantly anticipates failure isn't neutral..." (don't re-explain theory)
- ✅ "What if the exhaustion is the real problem, not your standards?"
- ❌ "Being kinder to oneself isn't about lowering standards - it's about creating the psychological conditions..." (too academic, already covered in THEORY)

QUESTION QUALITY BARS:
❌ BAD (feels like homework):
- "How would you respond to a colleague experiencing the same anxiety—and what would it mean to extend that same understanding to yourself?"
- "What evidence of your capability are you filtering out by focusing exclusively on what's imperfect?"
- "How might you shift your perspective?"

✅ GOOD (feels like invitation with edge):
- "**If your business partner's withdrawal is information rather than rejection, what's the actual question you need to ask in today's meeting?**"
- "**When a former partner talks about dating someone new, can you hear it as information about her life rather than evidence about your worth - and if so, what does that make possible for the friendship?**"
- "**If you stopped trying to extract self-worth data from every interaction, what would you actually need to ask for or say no to?**"

REMOVE THESE PHRASES:
- "Consider how..."
- "Self-compassion isn't self-indulgence; it's..."  
- "The irony is that..."
- Any gentle/therapeutic question that has a "correct" answer
- Generic "shift your perspective" language

APPLY THEORY OF MIND:
- When discussing others (boss, parent, partner), acknowledge their struggles/fears/perspective
- Gently challenge assumptions and expose logical fallacies
- Expand their understanding by revealing blind spots

**Story "Why This Matters" Section - Force Specific Connection:**

This reflection MUST authentically connect the story's actual teaching to the user's specific stressor using paraphrased examples.

LENGTH: 6-8 sentences total (3-part structure)

CRITICAL: If you can't make a specific bridge to their actual situations, the story is wrong. Generate different tags.

**Part 1 - Acknowledge the story's actual meaning (1-2 sentences):**
- Start by stating what THIS SPECIFIC story actually teaches
- Don't skip this step - name the core lesson explicitly
- Example: "This story depicts the most extreme form of compassion - giving everything, even life itself, to ease another's suffering."
- Example: "This tale illustrates how our perspective shapes our experience - what appears as a curse may later reveal itself as a gift."

**Part 2 - Bridge to their specific stressor (2-3 sentences):**
- Explicitly connect the story's core theme to their ACTUAL paraphrased situations
- Use "In your [specific domain]..." to make the connection concrete
- Create an honest, logical bridge between what the story teaches and what they're experiencing
- Be specific about HOW the story's wisdom applies to THEIR challenge
- Example: "In relationship conflicts where both people feel hurt, each person may be acting from their own unmet needs or past wounds. When someone pulls away, they're often trying to protect themselves from their own pain."

**Part 3 - Actionable insight (2-3 sentences):**
- End with something specific they can think about or do
- Tie it directly to BOTH the story AND their specific paraphrased challenge
- Be practical and grounded, not vague
- Example: "While you don't need to sacrifice your needs, you can practice seeing beneath surface behaviors to understand what drives them. This doesn't mean accepting mistreatment - it means understanding the dynamic, setting boundaries from clarity rather than reaction, and recognizing when a pattern isn't yours to fix."

PARAPHRASING RULE APPLIES:
- Reference their situations using neutral/clinical language
- ❌ "When your ex talks about dating someone new..."
- ✅ "When a former partner discusses new relationships..."
- ❌ "Your business partner's lack of engagement..."
- ✅ "A business partner's disengagement pattern..."

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
- Could you remove the stressor and still know what problem this addresses? If no, be more specific about their paraphrased situation.
- Does it feel like generic self-help advice or a genuine insight connecting THIS story to THEIR problem?
- Are you using their paraphrased situations (business meeting, relationship dynamics, etc.)?

**IF CONNECTION IS WEAK:** The story is wrong. Generate different tags to get a better match.

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

**Resources Section - Laser-Targeted Matching:**

CRITICAL: Every resource should feel hand-picked for their exact pattern, not generic recommendations.

**PODCAST & BOOK SELECTION RULES:**
- **Match to mechanism, not topic:** Don't recommend resources about "relationships" or "self-worth" broadly
- Recommend resources that address the SPECIFIC psychological mechanism from The Theory section
- **Avoid defaults:** Brené Brown, Mark Manson, etc. are fine IF truly perfect fit, but don't default to bestsellers
- Prefer lesser-known resources that are more precisely relevant
- **Consider their context:** Business meeting today? Recommend negotiation without ego. Dating situation? Recommend attachment patterns. Meeting new people constantly? Recommend building internal validation systems.

**"Why This Helps" Format:**
- DO NOT describe what the resource is about
- Explain how it addresses THEIR specific pattern using paraphrased examples
- 2-3 sentences connecting to their exact situation
- Reference their contexts (business dynamics, relationship patterns, etc.) using neutral language

**PARAPHRASING RULE APPLIES:**
- ❌ "When you said 'I think being replaced makes me less than'..."
- ✅ "For someone who experiences a former partner's new relationships as threatening to their self-worth..."
- ❌ "You mentioned that because she is so beautiful, you viewed that as positive reflection of your manhood..."
- ✅ "For patterns where a partner's perceived desirability becomes entangled with self-worth..."

**Quality Tests:**
- Could this recommendation apply to anyone with "relationship issues"? → Too generic
- Does the "why this helps" reference their paraphrased situations? → If no, rewrite
- Is this the MOST relevant resource or just a relevant one? → Be selective

**EXAMPLES:**

❌ BAD: 
"The Gifts of Imperfection by Brené Brown - This book explores how embracing our imperfections can help us cultivate worthiness. Why this might help: It provides approaches to separating self-worth from external validation"

✅ GOOD: 
"The Fear of Being Dismissed by Michael Alcee - A lesser-known work on approval-seeking patterns in high-achievers. Why this might help: Alcee specifically addresses patterns where partnerships are chosen based on how they reflect on you, then withdrawal gets interpreted as self-worth data rather than compatibility information. Directly relevant to both business partnership dynamics and post-relationship patterns."

Format as JSON with this EXACT structure:
{
  "byline": "One compelling sentence capturing their core challenge (paraphrased, not their exact words)",
  "whatsHappening": {
    "summary": "2-3 sentence summary (paraphrased)",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "fullExplanation": "200-300 WORDS (15-20 sentences) organized in 4 paragraphs: (1) Map full territory showing pattern across ALL domains mentioned; (2) Name the underlying mechanism/system; (3) Show pattern in action using paraphrased situations; (4) Identify the cost to their goals/values. CRITICAL: Use paraphrased examples throughout, not direct quotes. NO 'I' statements. NO questions. Focus on what they're DOING not just feeling. This is pattern recognition, not emotional validation.",
    "citations": [
      {"author": "Researcher Name", "year": 2020, "title": "Study Title"}
    ]
  },
  "theTheory": {
    "content": "2-3 FULL PARAGRAPHS (5-7 sentences each). Pick ONE theory that unlocks their pattern - go deep, not wide. Each paragraph must include: (1) Theory/concept name in bold; (2) Researcher(s) + year + institution; (3) Specific study with sample size and quantitative findings; (4) Mechanism explanation (psychological/neurological how and why); (5) Why this creates problems/maintains cycle; (6) Connection to user's paraphrased pattern. Example: 'Crocker & Wolfe's 2001 study of 600 college students found that approval-contingent self-worth created 3x more mood fluctuations...' Educational tone. NO personal application (that's for A Different Lens). NO questions.",
    "tags": ["2-4 specific psychological concepts from the list that are MOST relevant to their situation"]
  },
  "quotes": [
    {"text": "Direct quote from user (ONLY section where direct quotes are allowed)", "sentiment": "positive|negative|neutral"}
  ],
  "reframing": {
    "content": "4 PARAGRAPHS: (1) 2-3 sentences naming their current lens explicitly using paraphrased examples; (2) 3-4 sentences offering reframe with specific language they can use, referencing theory from THE THEORY section; (3) 3-4 sentences making it actionable with specific application to their paraphrased upcoming situations; (4) 2 bold provocative questions that assume the reframe and push toward action. Format questions as: **[Question 1]?** **[Question 2]?** REFERENCE theory. Use paraphrased situations throughout. Be concrete and actionable, not gentle/therapeutic."
  },
  "podcast": {
    "title": "Real Podcast Name (research and recommend an actual podcast)",
    "host": "Host Name",
    "episode": "Episode Title that matches their SPECIFIC mechanism",
    "duration": "30-60 min",
    "description": "What this episode covers",
    "whyThisHelps": "2-3 sentences explaining how this addresses THEIR specific paraphrased pattern/situations - reference their contexts (business dynamics, relationship patterns, etc.) using neutral language. DO NOT just describe what the resource is about. Match to mechanism from The Theory, not generic topic.",
    "thumbnail": "https://via.placeholder.com/400x400?text=Podcast",
    "urls": {
      "spotify": "https://open.spotify.com/show/ACTUAL_ID_HERE",
      "applePodcasts": "https://podcasts.apple.com/ACTUAL_URL_HERE"
    }
  },
  "book": {
    "title": "Real Book Title (recommend an actual book - prefer lesser-known if more relevant)",
    "author": "Author Name",
    "byline": "One-line description",
    "length": "200 pages / 4-hour read",
    "description": "What this book covers",
    "whyThisHelps": "2-3 sentences explaining how this addresses THEIR specific paraphrased pattern/situations - reference their contexts using neutral language. DO NOT just describe what the resource is about. Match to mechanism from The Theory, not generic topic. Avoid defaults like Brené Brown unless truly perfect fit.",
    "coverImage": "https://via.placeholder.com/300x450?text=Book",
    "sampleUrl": "https://www.amazon.com/LINK_HERE",
    "purchaseUrl": "https://www.amazon.com/LINK_HERE"
  },
  "exerciseTags": ["anxiety", "stress", "mindfulness"],
  "storyTags": ["resilience", "perspective"],
  "storyWhyMatters": "6-8 sentences with NO QUESTIONS following 3-part structure: (1) 1-2 sentences acknowledging what THIS story actually teaches; (2) 2-3 sentences bridging to their SPECIFIC paraphrased stressor using 'In [domain/situation]...' format; (3) 2-3 sentences with actionable insight tied to both story AND their paraphrased challenge. Use neutral/clinical language throughout.",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]
}

REQUIREMENTS:
- ALL fields must be present (podcast, book, exerciseTags, storyTags, storyWhyMatters, theTheory with tags)
- Recommend REAL podcasts and books that exist
- exerciseTags should be 1-3 relevant tags from: anxiety, depression, stress, worry, grounding, mindfulness, self-compassion, values, emotions, etc.
- storyTags should be 2-3 CREATIVE and VARIED tags that capture deeper emotional/philosophical themes
- theTheory.tags should be 2-4 SPECIFIC psychological concepts most relevant to their situation. Choose from: catastrophizing, black-and-white thinking, overgeneralization, mind reading, fortune telling, personalization, should statements, emotional reasoning, fearful-avoidant attachment, disorganized attachment, anxious preoccupation, deactivating strategies, protest behavior, codependency, enmeshment, differentiation, rupture and repair, stonewalling, complex PTSD, developmental trauma, hypervigilance, dissociation, fawn response, freeze response, window of tolerance, emotional flashbacks, learned helplessness, compulsive caregiving, self-abandonment, emotional labor, spiritual bypassing, vagal tone, polyvagal theory, amygdala hijack, interoception, mirror neurons, impostor syndrome, false self vs authentic self, ego depletion, identity foreclosure
- storyWhyMatters must be 6-8 sentences with NO QUESTIONS following the 3-part structure
- whatsHappening.fullExplanation: 3-4 PARAGRAPHS focused on THEIR EXPERIENCE with minimal academic theory, NO "I" statements, NO questions, citations at END if relevant
- theTheory.content: MINIMUM 3-5 PARAGRAPHS of pure academic teaching, each paragraph = ONE theoretical concept, name theories/researchers/studies, NO personal application, NO questions
- reframing.content: MINIMUM 3-4 PARAGRAPHS that REFERENCE and APPLY theory from theTheory section using phrases like "Given what you now understand about [theory]..." or "Remember that [mechanism]...", apply theory of mind, questions aggregated at END in bullet format with 💭 emoji
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
        model: 'gpt-4o',
        max_tokens: 10000,
        temperature: 0.4,
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