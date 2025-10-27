# Resources Links Implementation Guide

## Overview
This document explains how the Resources for You section works and how to make links dynamic with session data.

## Current Implementation (Verified Test Links)

### Hardcoded Links
The system currently uses verified, working links for testing:

**Podcast Example:** "Treating the Pain of a Broken Heart" from The Happiness Lab
- Spotify: `https://open.spotify.com/episode/6wxSMYOmM6ZjpiuJt5d9Rh`
- Apple Podcasts: `https://podcasts.apple.com/us/podcast/treating-the-pain-of-a-broken-heart/id1474245040?i=1000531508628`
- Universal Fallback: `https://podcastindex.org/universal-link?feed=https://feeds.simplecast.com/2z9hQ7jT&episode=6wxSMYOmM6ZjpiuJt5d9Rh`

**Book Example:** "Attached" by Amir Levine
- Bookshop.org: `https://bookshop.org/p/books/attached-the-new-science-of-adult-attachment-and-how-it-can-help-you-find-and-keep-love-amir-levine/9781585429134`
- Barnes & Noble: `https://www.barnesandnoble.com/w/attached-amir-levine/1102355415?ean=9781585429134`
- Amazon: `https://amazon.com/dp/1585429139`

### UTM Tracking
All links include UTM parameters:
- `utm_source=johari`
- `utm_medium=recs`
- `utm_campaign={sessionId}`

### Error Handling
- Uses `fetch()` with HEAD request to verify link accessibility
- Falls back to alternative URL if primary link fails
- Shows user-friendly error messages

## Making Links Dynamic

### Step 1: Update API Response Format

The edge function (`supabase/functions/chat/index.ts`) needs to return specific IDs instead of full URLs:

```typescript
// Current (returns full URLs)
podcast: {
  urls: {
    spotify: "https://open.spotify.com/show/...",
    applePodcasts: "https://...",
  }
}

// Dynamic (should return IDs)
podcast: {
  episodeId: "6wxSMYOmM6ZjpiuJt5d9Rh",  // Spotify episode ID
  feedUrl: "https://feeds.simplecast.com/2z9hQ7jT",  // RSS feed for universal link
  appleEpisodeId: "1000531508628",  // Apple Podcasts episode ID
  showId: "1474245040"  // Apple Podcasts show ID
}

book: {
  isbn: "9781585429134",  // ISBN-13
  asin: "1585429139",  // Amazon ASIN
}
```

### Step 2: Update Link Construction in ResultsDisplay.tsx

Replace the `VERIFIED_LINKS` constant with dynamic link builders:

```typescript
// Build links from API data
const buildPodcastLinks = (podcast: any) => ({
  spotify: `https://open.spotify.com/episode/${podcast.episodeId}`,
  apple: `https://podcasts.apple.com/us/podcast/${podcast.showId}?i=${podcast.appleEpisodeId}`,
  universal: `https://podcastindex.org/universal-link?feed=${podcast.feedUrl}&episode=${podcast.episodeId}`,
});

const buildBookLinks = (book: any) => ({
  bookshop: `https://bookshop.org/p/books/${book.slug}/${book.isbn}`,
  barnesNoble: `https://www.barnesandnoble.com/w/${book.slug}/${book.bnId}?ean=${book.isbn}`,
  amazon: `https://amazon.com/dp/${book.asin}`,
});
```

### Step 3: Update Type Definitions

Add new fields to `src/types/checkin.ts`:

```typescript
export interface CheckInResults {
  // ... existing fields ...
  
  podcast?: {
    title: string;
    host: string;
    episode: string;
    duration: string;
    description: string;
    whyThisHelps: string;
    thumbnail: string;
    // New dynamic fields
    episodeId: string;
    feedUrl?: string;
    appleEpisodeId?: string;
    showId?: string;
  };
  
  book?: {
    title: string;
    author: string;
    byline: string;
    description: string;
    length: string;
    whyThisHelps: string;
    coverImage: string;
    // New dynamic fields
    isbn: string;
    asin?: string;
    slug?: string;
    bnId?: string;
  };
}
```

### Step 4: Update AI Prompt

Modify the system prompt in `supabase/functions/chat/index.ts` to request IDs:

```typescript
const systemPrompt = `...
"podcast": {
  "title": "Real Podcast Name",
  "host": "Host Name",
  "episode": "Episode Title",
  "episodeId": "SPOTIFY_EPISODE_ID",
  "feedUrl": "RSS_FEED_URL",
  "appleEpisodeId": "APPLE_EPISODE_ID",
  "showId": "APPLE_SHOW_ID",
  ...
},
"book": {
  "title": "Real Book Title",
  "author": "Author Name",
  "isbn": "ISBN_13_NUMBER",
  "asin": "AMAZON_ASIN",
  ...
}
...`;
```

## Features

### Rating System
- Users can rate each recommendation (thumbs up/down)
- Ratings are stored in `recommendation_ratings` table
- One rating per recommendation type per session
- Ratings persist across sessions for the same user

### Personalization
- "Why this might help" sections now include session theme
- Theme extracted from validation data or results themes
- Example: "Why this might help for work stress"

### Accessibility
- All buttons open links in new tabs with `target="_blank"`
- Error handling provides fallback options
- Toast notifications for user feedback

## Database Schema

### recommendation_ratings Table
```sql
CREATE TABLE recommendation_ratings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  session_id TEXT NOT NULL,
  recommendation_type TEXT CHECK (IN ('podcast', 'book', 'exercise', 'story')),
  recommendation_title TEXT,
  rating TEXT CHECK (IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, session_id, recommendation_type)
);
```

## Testing Checklist

- [ ] Verify Spotify links open correct episodes
- [ ] Verify Apple Podcasts links open correct episodes
- [ ] Verify universal fallback works
- [ ] Verify Bookshop.org links open correct books
- [ ] Verify Barnes & Noble alternative works
- [ ] Verify Amazon alternative works
- [ ] Test error handling with broken links
- [ ] Verify UTM parameters are included
- [ ] Test rating system (thumbs up/down)
- [ ] Verify ratings persist in database
- [ ] Test session theme personalization
- [ ] Verify links open in new tabs

## Affiliate Program Setup (Optional)

### Bookshop.org
1. Sign up at https://bookshop.org/info/affiliates
2. Get your affiliate ID
3. Add to links: `?aid={YOUR_AFFILIATE_ID}`

### Barnes & Noble
1. Sign up at https://www.barnesandnoble.com/affiliates/
2. Get your CJ PID
3. Add to links: `?cm_mmc=AFFILIATES-_-Linkshare-_-{YOUR_CJ_PID}-_-10:1`

### Amazon Associates
1. Sign up at https://affiliate-program.amazon.com/
2. Get your associate tag
3. Add to links: `?tag={YOUR_ASSOCIATE_TAG}`

## Future Enhancements

1. **Link Validation Service**: Create an edge function to validate links before serving to users
2. **Link Analytics**: Track which platforms users prefer
3. **Smart Fallbacks**: Use link popularity and availability data to prioritize fallbacks
4. **Content Verification**: Verify that recommended content exists and is accessible
5. **A/B Testing**: Test different link presentation strategies
6. **Deep Linking**: Add deep links for mobile apps when available
