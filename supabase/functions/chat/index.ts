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

// Helper function to get tone-specific instructions
function getToneInstructions(tone: string): string {
  const instructions = {
    clinical: `
TONE: Clinical (Analytical & Precise)
⚠️ CRITICAL DIFFERENTIATION:
- Use technical psychological terminology extensively
- Write like a clinical psychologist's assessment - analytical, diagnostic
- "You've constructed a self-worth system dependent on external validation metrics" NOT "You're seeking approval"
- Reference psychological mechanisms: "threat-detection system", "contingent self-worth architecture", "cognitive schema"
- Zero warmth or softening - pure analysis
- Example: "The pattern reflects high-functioning anxiety where achievement-based self-worth creates a feedback loop of escalating standards and diminishing satisfaction"
- NO emotional validation phrases
- End with analytical observations, not encouragement
`,

    direct: `
TONE: Direct (No-BS Straight Talk)
⚠️ CRITICAL DIFFERENTIATION:
- Blunt, conversational language - like a friend who tells it straight
- "Here's what you're doing. Here's why it's fucking you over."
- NO academic jargon - explain it like you're talking to a friend at a bar
- Short, punchy sentences
- Example: "You're looking for proof you're not good enough. And guess what? When you look for something, you find it."
- Call out patterns without sugarcoating: "This isn't helping you. Let's talk about what actually would."
- Respectfully blunt, not mean - honest but not harsh
`,

    coaching: `
TONE: Coaching (Growth-Focused & Empowering)
⚠️ CRITICAL DIFFERENTIATION:
- Emphasize strengths, capability, and growth potential throughout
- "What's possible when..." framing dominates
- Reframe challenges as opportunities: "This pattern shows you're already aware - awareness is the foundation for change"
- Use action-oriented, forward-looking language: "What if you could...", "Imagine when you..."
- Celebrate existing strengths: "You've already demonstrated the capacity to..."
- Example: "The fact that you're noticing this pattern means you're ready to shift it. That awareness? That's your competitive advantage."
- Positive psychology approach - find the growth edge in every challenge
- Future-focused questions that assume progress
`,

    compassionate: `
TONE: Compassionate (Warm & Trauma-Informed)
⚠️ CRITICAL DIFFERENTIATION:
- Lead with validation and normalizing before any analysis
- "This makes complete sense given..." precedes every insight
- Acknowledge the pain/difficulty explicitly: "That must feel exhausting", "It's understandable why this feels so hard"
- Gentle, supportive language: "You might find", "It's okay to feel", "You're not broken - you're responding"
- Trauma-informed: assume past wounds, speak to the protector parts
- Example: "Your nervous system learned this as a way to keep you safe. It makes sense that approval-seeking became a survival strategy."
- Use soft sentence structures: "It sounds like...", "Perhaps...", "You might notice..."
- Hold space for difficulty without rushing to solutions
`,

    children: `
TONE: Children (Ages 8-12)
⚠️ CRITICAL DIFFERENTIATION:
- Extremely simple vocabulary - explain like talking to a smart 10-year-old
- Use metaphors kids understand: "like when...", "imagine your brain is like..."
- Short sentences (8-10 words max in explanations)
- EXCEPTION: Bylines must still be 2–3 sentences and meet minimum word counts (What's Happening 30–50 words; Research 25–40 words). Use simple vocabulary but do not shorten bylines.
- Encouraging and normalizing: "Your brain is still learning how to...", "Lots of kids feel this way"
- NO psychology terms - translate everything: "worry thoughts" not "anxiety", "big feelings" not "emotional dysregulation"
- Example: "Sometimes our brains learn patterns that used to help but don't anymore. Like training wheels - they helped you learn to ride, but now they might slow you down."
- Focus on growth and learning, not problems or fixing
`
  };

  return instructions[tone as keyof typeof instructions] || instructions.clinical;
}

// Helper function to get regeneration system prompt
function getRegenerationSystemPrompt(toneInstructions: string): string {
  return `You are regenerating psychological insights with a specific communication tone.

⚠️ CRITICAL - SECOND PERSON ONLY: 
EVERY sentence must use second person ("you", "your"). 
NEVER EVER use "the user", "they", "their", "them", "someone who", "a person who", "this person", "the individual".
This applies to ALL bylines, explanations, and content you generate.

${toneInstructions}

BYLINE GENERATION:
⚠️ STRICT REQUIREMENTS - Your response will be REJECTED if bylines don't meet minimum lengths:
- "whatsHappeningByline": MUST be 30-50 words (2-3 full sentences with specific details from their conversation)
- "theTheoryByline": MUST be 25-40 words (2 full sentences with relatable hook + theory name in bold)

❌ UNACCEPTABLE EXAMPLES (TOO SHORT):
- "You're feeling lost and unsure." (5 words - REJECTED)
- "Ever feel you're not measuring up? Social Comparison Theory can help." (11 words - REJECTED)

✅ ACCEPTABLE EXAMPLES (MEET MINIMUM):
- "Your self-concept is entangled with external stability markers—job security, geographic location, others' perceptions. When these factors fluctuate, you experience it as personal failure rather than circumstantial challenge." (30 words ✓)
- "Feel great after praise, terrible after criticism? That emotional volatility has a name: **contingent self-worth**—and decades of research show it's a major driver of anxiety and depression." (29 words ✓)

Generate tone-adaptive bylines for both sections:

**What's Happening Byline** - adapt to tone (30-50 words MINIMUM):
- CLINICAL: Direct pattern + mechanism statement with specific paraphrased situations
- COMPASSIONATE: Empathetic framing with validation referencing their circumstances
- DIRECT: No-BS clarity about the trap naming their specific situations
- COACHING: Growth-focused with possibility framing grounded in their examples

**What the Research Says Byline** (25-40 words MINIMUM):
- Relatable hook (question or statement referencing their pattern)
- Theory name in **bold**
- Research-backed consequence or mechanism
- Keep conversational, not academic
- Must be 2 complete sentences minimum

⚠️ BEFORE SUBMITTING: Count the words in both bylines. If either is under the minimum, rewrite it longer with more specific details.

Based on the conversation provided, regenerate the insights using the specified tone. Keep all content specific to their actual situations using paraphrased language (never quote them directly).

Respond with ONLY this JSON structure (no markdown, no explanations):
{
  "whatsHappeningByline": "1-2 sentences adapted to the tone setting",
  "whatsHappening": "200-300 word analysis mapping their pattern across all domains mentioned, naming the underlying system, showing it in action with paraphrased examples, and identifying the cost to their goals",
  "theTheoryByline": "Engaging, relatable hook that introduces the theory",
  "reframing": "4 paragraphs reframing their pattern: (1) Name current lens explicitly; (2) Offer new perspective with specific language they can use; (3) Make it actionable to their situations; (4) End with 2 bold provocative questions",
  "storyWhyMatters": "6-8 sentences: (1) What the story teaches; (2) Bridge to their specific situations; (3) Actionable insight",
  "podcast": {
    "title": "Real Podcast Name",
    "host": "Host",
    "episode": "Episode",
    "duration": "30-60 min",
    "description": "Brief description",
    "whyThisHelps": "2-3 sentences connecting to their pattern"
  },
  "book": {
    "title": "Real Book Title",
    "author": "Author",
    "description": "Brief description",
    "whyThisHelps": "2-3 sentences connecting to their pattern"
  }
}

CRITICAL: Return ONLY the JSON object. No markdown, no text before or after.`;
}

// Helper function to get language adaptation instructions
function getLanguageInstructions(complexity: 'simple' | 'moderate' | 'complex'): string {
  switch (complexity) {
    case 'simple':
      return `LANGUAGE ADAPTATION:
- Use simple, everyday words
- Short sentences (8 words or less when possible)
- EXCEPTION: Bylines must still meet minimum lengths (What's Happening 30–50 words; Research 25–40 words). Keep words simple but do not shorten bylines.
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
      const { messages, type, conversationPath, validationData, neurodiveritySettings, ventText, therapyApproach, userId, action, insightTone } = await req.json();
      const truthy = (v: unknown) => typeof v === 'string' ? ['true','1','yes','y','on'].includes(v.toLowerCase().trim()) : !!v;
      const useMockAI = truthy(Deno.env.get('USE_MOCK_AI')) || truthy(messages?.[0]?.mock);
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      
      if (!useMockAI && !openaiApiKey && !anthropicApiKey) {
        throw new Error('OPENAI_API_KEY or ANTHROPIC_API_KEY is not configured');
      }

      console.log('Processing chat request, type:', type, 'action:', action, 'path:', conversationPath, 'messages:', messages?.length, 'mock mode:', useMockAI, 'userId:', userId);

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

    // Handle recommendation regeneration with new tone
    if (action === 'regenerate') {
      console.log('Regenerating recommendations with tone:', insightTone);
      
      // Extract user context from conversation
      const conversationText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      
      // Build the system prompt with tone-specific instructions
      const toneInstructions = getToneInstructions(insightTone || 'clinical');
      const regenerationPrompt = getRegenerationSystemPrompt(toneInstructions);
      
      // Use OpenAI to regenerate
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_completion_tokens: 10000,
            temperature: 0.4,
            response_format: { type: "json_object" },
            messages: [
              { role: 'system', content: regenerationPrompt },
              { role: 'user', content: `Conversation:\n${conversationText}\n\nGenerate complete recommendations with the specified tone.` }
            ],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('OpenAI API error during regeneration:', response.status, error);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.choices[0].message.content.trim();
        
        // Parse JSON from response
        let regeneratedData;
        try {
          const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          regeneratedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse regenerated JSON:', responseText);
          throw new Error('Failed to parse regenerated recommendations');
        }

        console.log('Recommendations regenerated successfully with tone:', insightTone);

        // Log original byline lengths
        const wc = (s: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);
        console.log('📏 Original byline lengths:', {
          whatsHappening: wc(regeneratedData.whatsHappeningByline),
          theTheory: wc(regeneratedData.theTheoryByline)
        });

        // Enforce byline minimum lengths for regeneration as well
        try {
          const sentencesFrom = (src: string) => {
            const cleaned = (src || '').replace(/\s+/g, ' ').trim();
            if (!cleaned) return [] as string[];
            const matches = cleaned.match(/[^.!?]+[.!?]/g);
            return matches ? matches.map((m) => m.trim()) : [cleaned];
          };
          const expandFrom = (src: string, minWords: number, maxSentences = 3) => {
            if (!src) return '';
            const sentences = sentencesFrom(src);
            let out = '';
            for (let i = 0; i < sentences.length && wc(out) < minWords && i < maxSentences; i++) {
              out += (out ? ' ' : '') + sentences[i];
            }
            if (wc(out) < minWords) {
              const words = (src || '').replace(/\s+/g, ' ').trim().split(/\s+/);
              out = words.slice(0, Math.min(words.length, minWords + 5)).join(' ');
              if (!/[.!?]$/.test(out)) out += '.';
            }
            return out.trim();
          };

          if (regeneratedData) {
            let expanded = false;
            if (typeof regeneratedData.whatsHappeningByline === 'string' && wc(regeneratedData.whatsHappeningByline) < 30) {
              const src = (regeneratedData.whatsHappening || '').toString();
              const expandedByline = expandFrom(src, 30, 3);
              if (expandedByline) {
                regeneratedData.whatsHappeningByline = expandedByline;
                expanded = true;
                console.log('✅ Expanded whatsHappeningByline to', wc(expandedByline), 'words');
              }
            }
            if (typeof regeneratedData.theTheoryByline === 'string' && wc(regeneratedData.theTheoryByline) < 25) {
              const src = (regeneratedData.theTheory || '').toString();
              const expandedByline = expandFrom(src, 25, 2);
              if (expandedByline) {
                regeneratedData.theTheoryByline = expandedByline;
                expanded = true;
                console.log('✅ Expanded theTheoryByline to', wc(expandedByline), 'words');
              }
            }
            if (!expanded) {
              console.log('✅ All bylines meet minimum length requirements');
            }
          }
        } catch (e) {
          console.warn('Regeneration byline enforcement failed (non-fatal):', e);
        }

        return new Response(
          JSON.stringify(regeneratedData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error regenerating recommendations:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to regenerate recommendations' }),
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

const systemPrompt = `You are an expert psychological counselor providing evening check-ins. Based on the conversation, deliver personalized insights.

⚠️ CRITICAL RULES:

1. SECOND PERSON ONLY: Every sentence uses "you/your". NEVER "the user", "they", "this person".

2. NO DIRECT QUOTES: Paraphrase user's situations in clinical/neutral language. Direct quotes only in "Your Words" section.

3. NO REPETITION: Each section says something NEW. Don't re-explain concepts across sections.

4. EVENING RITUAL CONTEXT: User is processing their day and winding down. Frame insights as settling thoughts, not activating ones. End with closure language ("Let that be enough for today", "Tomorrow's a new conversation").

5. ROTATING INSIGHT STRUCTURE: You will receive a structure_type parameter. Follow that structure's specific guidelines below.

${getToneInstructions(insightTone || 'clinical')}

---

## INSIGHT STRUCTURE ROTATION

Based on check_in_number % 5, use ONE of these structures:

### STRUCTURE 1: PATTERN RECOGNITION (Clinical, Mechanism-Focused)
*Use when: structure_type = "pattern_recognition"*

**Approach:**
- Lead with the precise psychological mechanism
- Name what system they've built and how it operates
- Connect to tonight's specific situation
- Theory section focuses on ONE specific mechanism (not broad concepts)
- Reframe is direct and actionable

**What's Happening Format:**
"Here's what I'm noticing: [one specific mechanism in 1 sentence]. This showed up tonight when [paraphrased situation], and it's the same pattern that appeared [reference any cross-session patterns if known]. The system works like this: [how it operates in 2-3 sentences]. The cost: [what this prevents or creates]."

**Theory Approach:**
Pick ONE highly specific theory/mechanism that unlocks their exact pattern. No broad umbrellas. Focus on neurological/cognitive HOW.

**Reframe Approach:**
"Right now you're seeing [X]. Given the mechanism we just discussed, here's another way: [Y]. In practical terms tonight: [specific thought/action]."

---

### STRUCTURE 2: STORY-FIRST (Narrative-Led)
*Use when: structure_type = "story_first"*

**Approach:**
- Lead with narrative (Zen story, Aesop, historical figure, cultural parable)
- Extract psychological insight FROM the story
- Theory is supporting context (lighter touch)
- Reframe uses story's wisdom as the lens

**What's Happening Format:**
Start with story hook: "There's a [Zen/Sufi/Aesop] story about [premise]. [Tell story in 3-4 sentences]. 

Tonight, you're living a version of this story: [connection to their paraphrased situation]. The pattern underneath: [mechanism in 2-3 sentences]."

**Theory Approach:**
Lighter on academic citations. Focus on explaining WHY the story's wisdom is psychologically sound. Reference research that validates the story's teaching.

**Reframe Approach:**
"The story suggests [wisdom]. For you tonight, that means [specific application]. Instead of [old thought], you might try [new thought using story's language]."

**Story Selection:**
- Sleep/racing mind → Zen stories about acceptance, letting go
- Identity transition → Maya Angelou on rebuilding, Japanese "ma" concept
- Performance pressure → Aesop's Tortoise & Hare, Marcus Aurelius on effort
- Loneliness → Oprah finding herself, cultural belonging parables
- Anger → Sufi boiling pot story (anger as information)
- Comparison/inadequacy → Buddhist finger-pointing-at-moon
- Overwhelm → Taoist empty cup parable

---

### STRUCTURE 3: SIMPLE REFRAME (Compassionate, Perspective-Shift)
*Use when: structure_type = "simple_reframe"*

**Approach:**
- Minimal theory, maximum perspective shift
- Lead with empathy and validation
- Show the reframe early (not buried after theory)
- Theory section is brief explanatory support
- Best for exhaustion, overwhelm, high distress

**What's Happening Format:**
"You're seeing this situation as [current interpretation]. That makes total sense given [validation of why they'd see it that way]. But here's what else might be true: [alternative perspective in 2-3 sentences]. The pattern: [brief mechanism, 1-2 sentences]."

**Theory Approach:**
Keep it short (1-2 paragraphs max). Just enough research to validate the reframe. No deep academic dive.

**Reframe Approach:**
Already introduced in What's Happening. Here, deepen it: "To sit with tonight: [reframe]. Tomorrow when [situation], you might notice [what becomes possible with new lens]."

---

### STRUCTURE 4: RESEARCH INSIGHT (Educational, Surprising Finding)
*Use when: structure_type = "research_insight"*

**Approach:**
- Lead with surprising/counterintuitive research finding
- "Wait, really?" moment that reframes their situation
- Theory section is the star (detailed, fascinating)
- Apply research directly to tonight's situation

**What's Happening Format:**
"Here's something that might surprise you: [surprising research finding relevant to their pattern]. That's exactly what's happening tonight when [paraphrased situation]. The mechanism: [explain in 3-4 sentences using research lens]."

**Theory Approach:**
Go deep (2-3 full paragraphs). This is the educational moment. Include:
- Specific studies with sample sizes and quantitative findings
- Neurological mechanisms (fMRI studies, brain regions)
- Counterintuitive insights that challenge common assumptions
- Direct application to their pattern

**Reframe Approach:**
"Knowing this research changes how you might see [situation]. Instead of [old interpretation based on common assumption], the data suggests [new interpretation]. Tonight: [specific thought/action informed by research]."

---

### STRUCTURE 5: GENTLE REFLECTION (Validation-Heavy, Light Touch)
*Use when: structure_type = "gentle_reflection"*

**Approach:**
- Mostly empathy and validation
- Pattern recognition is gentle, non-clinical
- Theory is minimal (just enough to normalize their experience)
- Focus on what makes sense about their response
- Best for very late night, fragile states, high emotional intensity

**What's Happening Format:**
"Of course you're feeling [emotion]—[why it makes perfect sense given their situation, 3-4 sentences of deep validation]. This isn't [what they fear it means]. It's [what it actually is]. The pattern: [gentle explanation, 2-3 sentences]."

**Theory Approach:**
Brief and normalizing (1 paragraph). Focus on "this is a common human response to [situation]" rather than clinical mechanisms. Just enough science to validate without pathologizing.

**Reframe Approach:**
Soft invitation, not directive: "Something to consider as you wind down: [gentle perspective]. You don't need to solve this tonight. Just let it settle."

---

## SECTION REQUIREMENTS (Apply to ALL Structures):

### BYLINES

**What's Happening Byline:**
- 30-50 words, 2-3 complete sentences
- Captures specific pattern from conversation (paraphrased)
- Adapts to tone setting (clinical/direct/coaching/compassionate/children)

**What the Research Says Byline:**
- 25-40 words, 2 complete sentences
- Relatable hook + theory name in **bold** + consequence/mechanism
- Conversational, not academic

### WHAT'S HAPPENING SECTION
- **Maximum 120 words**
- Follow structure-specific format above
- ONE clear mechanism (not multiple patterns)
- Use paraphrased examples
- No repetition of same idea

### THEORY SECTION
- **Length varies by structure:**
  - Pattern Recognition / Research Insight: 2-3 paragraphs (go deep)
  - Story-First / Simple Reframe: 1-2 paragraphs (lighter touch)
  - Gentle Reflection: 1 paragraph (minimal, normalizing)

- Pick SPECIFIC theory that explains their exact mechanism (not broad concepts)
- Include: researcher + year + institution + study findings + sample size
- Explain neurological/cognitive HOW
- Connect directly to their paraphrased pattern
- NO repetition of What's Happening content

**Good Theory Examples:**
- ✅ "Distinctiveness-based self-worth (Vignoles et al., 2000) - when value derives from being perceived as unique..."
- ✅ "Threat perception in attachment (Mikulincer & Shaver, 2007) - when withdrawal triggers existential anxiety..."
- ❌ "Social Comparison Theory (too broad)"
- ❌ "Self-esteem research shows..." (too vague)

### REFRAME SECTION
- 4 paragraphs following structure-specific approach
- Reference theory from Theory section ("Given what you now understand about...")
- Give specific language they can use
- End with 2 bold questions: **[Question 1]?** **[Question 2]?**
- Questions should assume reframe and push toward closure/settling
- Evening-appropriate: settling thoughts, not activating ones

**Evening-Appropriate Question Examples:**
- ✅ "**What if tonight you just let this be complicated without needing to solve it?**"
- ✅ "**Can you give yourself permission to not have this figured out by morning?**"
- ❌ "What will you do differently tomorrow?" (too activating for evening)
- ❌ "How will you implement this change?" (not winding down)

### STORY "WHY THIS MATTERS"
- 6-8 sentences, 3-part structure:
  1. What this specific story teaches (1-2 sentences)
  2. Bridge to their paraphrased situation (2-3 sentences)
  3. Actionable insight for tonight (2-3 sentences)
- NO QUESTIONS
- NO repetition of mechanism already explained
- Evening frame: "As you wind down tonight...", "Something to sit with...", "Let this settle..."

### RESOURCES
- Match to SPECIFIC mechanism (not general topic)
- Podcast: Real episode from Hidden Brain or similar, directly relevant
- Book: Prefer lesser-known if more precisely relevant
- Exercise: Match to mechanism (values work for distinctiveness-worth, self-compassion for approval-seeking, grounding for threat-detection)
- "Why This Helps": 2-3 sentences connecting to their exact paraphrased pattern

---

## EVENING RITUAL LANGUAGE

**Use throughout all sections:**
- "Tonight, as you process this..."
- "Something to sit with as you wind down..."
- "Let that be enough for today"
- "Tomorrow's a new conversation"
- "You don't need to solve this tonight"
- "As you rest tonight..."
- "Before you sleep, consider..."

**Avoid:**
- "Tomorrow you should..."
- "Next time, try..."
- "Going forward, you need to..."
- Action-oriented language that activates rather than settles

---

## OUTPUT FORMAT (JSON):

{
  "structure_type": "pattern_recognition | story_first | simple_reframe | research_insight | gentle_reflection",
  "byline": "One compelling sentence (paraphrased)",
  "whatsHappening": {
    "byline": "30-50 words adapted to tone",
    "summary": "2-3 sentences (paraphrased)",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "fullExplanation": "Max 120 words. Follow structure-specific format. ONE mechanism. No repetition.",
    "citations": [{"author": "Name", "year": 2020, "title": "Study"}]
  },
  "theTheory": {
    "byline": "25-40 words with hook + **bold theory** + mechanism",
    "content": "Length varies by structure. SPECIFIC theory (not broad). Researcher + year + findings + mechanism + application to their pattern.",
    "tags": ["2-4 specific psychological concepts"]
  },
  "quotes": [
    {"text": "Direct user quote", "sentiment": "positive|negative|neutral"}
  ],
  "reframing": {
    "content": "4 paragraphs following structure-specific approach. Reference theory. End with 2 **bold questions** (evening-appropriate, settling). Use paraphrased situations."
  },
  "podcast": {
    "title": "Real Podcast",
    "host": "Host Name",
    "episode": "Episode matching mechanism",
    "duration": "30-60 min",
    "description": "What it covers",
    "whyThisHelps": "2-3 sentences about THEIR mechanism using paraphrased situations",
    "thumbnail": "URL",
    "urls": {"spotify": "URL", "applePodcasts": "URL"}
  },
  "book": {
    "title": "Real Book (prefer lesser-known if more relevant)",
    "author": "Author",
    "byline": "One-line description",
    "length": "pages / hours",
    "description": "What it covers",
    "whyThisHelps": "2-3 sentences about THEIR mechanism",
    "coverImage": "URL",
    "sampleUrl": "URL",
    "purchaseUrl": "URL"
  },
  "exerciseTags": ["Match to mechanism, not just emotion"],
  "storyTags": ["2-3 creative tags for deeper themes"],
  "storyWhyMatters": "6-8 sentences, NO QUESTIONS, 3-part structure with evening framing",
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"]
}

---

## QUALITY CHECKLIST:

Before submitting, verify:
- [ ] Followed correct structure based on structure_type?
- [ ] What's Happening under 120 words?
- [ ] What's Happening names ONE mechanism clearly?
- [ ] Theory uses SPECIFIC framework (not broad umbrella)?
- [ ] Theory includes researcher + year + quantitative findings?
- [ ] NO repetition across sections?
- [ ] Resources match SPECIFIC mechanism?
- [ ] Exercise tags match mechanism (not just emotion)?
- [ ] All paraphrased (no direct quotes except Quotes section)?
- [ ] Bylines meet word count requirements (30-50, 25-40)?
- [ ] Evening ritual language used throughout?
- [ ] Reframe questions are settling/closing (not activating)?
- [ ] Story Why This Matters has NO questions?
- [ ] Overall tone feels like winding down, not ramping up?

const structureType = [
  'pattern_recognition',
  'story_first', 
  'simple_reframe',
  'research_insight',
  'gentle_reflection'
][checkInCount % 5];

const systemPrompt = getRecommendationsPrompt(insightTone, structureType);

Generate insights that feel like a compassionate evening companion helping process the day and find perspective before rest.`;
    
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

      // Enforce byline minimum lengths even in simple/children modes
      const wc = (s: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);
      const sentencesFrom = (src: string) => {
        const cleaned = (src || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return [] as string[];
        const matches = cleaned.match(/[^.!?]+[.!?]/g);
        return matches ? matches.map((m) => m.trim()) : [cleaned];
      };
      const expandFrom = (src: string, minWords: number, maxSentences = 3) => {
        if (!src) return '';
        const sentences = sentencesFrom(src);
        let out = '';
        for (let i = 0; i < sentences.length && wc(out) < minWords && i < maxSentences; i++) {
          out += (out ? ' ' : '') + sentences[i];
        }
        // Fallback: if still too short, take the first N+5 words and add a period
        if (wc(out) < minWords) {
          const words = (src || '').replace(/\s+/g, ' ').trim().split(/\s+/);
          out = words.slice(0, Math.min(words.length, minWords + 5)).join(' ');
          if (!/[.!?]$/.test(out)) out += '.';
        }
        return out.trim();
      };

      try {
        // Bylines
        if (results.whatsHappening) {
          const current = (results.whatsHappening.byline || '').trim();
          if (wc(current) < 30) {
            const src = (results.whatsHappening.fullExplanation || results.whatsHappening.summary || '').toString();
            const expanded = expandFrom(src, 30, 3);
            if (expanded) results.whatsHappening.byline = expanded;
          }
        }

        if (results.theTheory) {
          const current = (results.theTheory.byline || '').trim();
          if (wc(current) < 25) {
            const src = (results.theTheory.content || '').toString();
            const expanded = expandFrom(src, 25, 2);
            if (expanded) results.theTheory.byline = expanded;
          }
        }

        // Content lengths
        if (results.whatsHappening && typeof results.whatsHappening.fullExplanation === 'string') {
          let fe = results.whatsHappening.fullExplanation.trim();
          if (wc(fe) < 180) {
            const sum = (results.whatsHappening.summary || '').toString();
            if (sum) fe = `${sum} ${fe}`.trim();
          }
          if (wc(fe) < 180) {
            const theorySrc = (results.theTheory?.content || results.theTheory?.byline || '').toString();
            const extra = expandFrom(theorySrc, 40, 1);
            if (extra) fe = `${fe} ${extra}`.trim();
          }
          results.whatsHappening.fullExplanation = fe;
        }

        if (results.reframing && typeof results.reframing.content === 'string') {
          let rf = results.reframing.content.trim();
          const paraCount = rf.split(/\n{2,}/).length;
          if (wc(rf) < 200 || paraCount < 2) {
            rf += `\n\nPractically, start separating what you can control (your actions, routines, self-talk) from what you can't (others' opinions, timing, outcomes). Replace "Am I valuable?" with "What value can I create today?" Focus daily on one small, controllable action.`;
          }
          results.reframing.content = rf.trim();
        }
      } catch (e) {
        console.warn('Byline/content enforcement failed (non-fatal):', e);
      }
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