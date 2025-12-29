// ============================================================================
// INTELLIGENT ASSET RECOMMENDATION SERVICE
// ============================================================================

import { getAIClient } from './geminiService';
import { Type } from '@google/genai';
import {
  DEFAULT_RECOMMENDATION_CONFIG,
  RECOMMENDATION_CATEGORIES,
  STOCK_PROVIDERS
} from '../types/recommendation';
import type {
  RecommendedAsset,
  DesignAnalysis,
  RecommendationRequest,
  RecommendationResponse,
  UserPreferences,
  UserInteraction,
  PreferenceUpdate,
  ColorHarmony,
  PaletteRecommendation,
  FontPairing,
  LayoutSuggestion,
  SmartCollection,
  TrendData,
  AssetCategory,
  DesignContext,
  RecommendationReason,
  ConfidenceLevel,
  RecommendationConfig
} from '../types/recommendation';

const TEXT_MODEL = 'gemini-2.0-flash';

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  USER_PREFERENCES: 'lumina_user_preferences',
  INTERACTION_HISTORY: 'lumina_interaction_history',
  RECOMMENDATION_CACHE: 'lumina_recommendation_cache',
  TREND_CACHE: 'lumina_trend_cache'
};

// ============================================================================
// DESIGN ANALYSIS
// ============================================================================

/**
 * Analyze design context from various inputs
 */
export async function analyzeDesignContext(
  input: {
    imageUrl?: string;
    description?: string;
    existingColors?: string[];
    projectType?: string;
    currentAssets?: any[];
  }
): Promise<DesignAnalysis> {
  const ai = getAIClient();

  const prompt = `Analyze this design context and extract key characteristics:
${input.description ? `Description: ${input.description}` : ''}
${input.existingColors ? `Colors in use: ${input.existingColors.join(', ')}` : ''}
${input.projectType ? `Project type: ${input.projectType}` : ''}
${input.currentAssets ? `Current assets: ${JSON.stringify(input.currentAssets.map(a => ({ name: a.name, type: a.type, tags: a.tags })))}` : ''}

Return a JSON object with:
- projectType: one of "social_media", "presentation", "marketing", "branding", "web_design", "print", "video_production", "general"
- dominantColors: array of hex colors that would work well
- style: main visual style (e.g., "minimalist", "bold", "elegant", "playful")
- mood: emotional tone (e.g., "professional", "energetic", "calm", "luxurious")
- industry: relevant industry if applicable
- targetAudience: who this is for
- keywords: array of relevant search keywords for finding assets`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectType: { type: Type.STRING },
          dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
          style: { type: Type.STRING },
          mood: { type: Type.STRING },
          industry: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['projectType', 'dominantColors', 'style', 'mood', 'keywords']
      }
    }
  });

  const result = JSON.parse(response.text || '{}');

  return {
    projectType: result.projectType as DesignContext || 'general',
    dominantColors: result.dominantColors || [],
    style: result.style || 'modern',
    mood: result.mood || 'professional',
    industry: result.industry,
    targetAudience: result.targetAudience,
    keywords: result.keywords || [],
    existingAssets: input.currentAssets?.map(a => a.id) || []
  };
}

/**
 * Extract colors from an image URL
 */
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  const ai = getAIClient();

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Extract the 5 most dominant colors from this image as hex codes. Return only a JSON array of hex color strings.' },
          { inlineData: { mimeType: 'image/jpeg', data: imageUrl } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

// ============================================================================
// ASSET RECOMMENDATIONS
// ============================================================================

/**
 * Generate AI-powered asset recommendations
 */
export async function generateRecommendations(
  request: RecommendationRequest,
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG
): Promise<RecommendationResponse> {
  const ai = getAIClient();

  // Get user preferences for personalization
  const userPrefs = getUserPreferences();

  const prompt = `You are an expert design assistant. Generate asset recommendations based on this design context:

PROJECT CONTEXT:
- Type: ${request.context.projectType}
- Style: ${request.context.style}
- Mood: ${request.context.mood}
- Colors: ${request.context.dominantColors.join(', ')}
- Keywords: ${request.context.keywords.join(', ')}
${request.context.industry ? `- Industry: ${request.context.industry}` : ''}
${request.context.targetAudience ? `- Target Audience: ${request.context.targetAudience}` : ''}

USER PREFERENCES:
${userPrefs ? `- Preferred styles: ${userPrefs.preferredStyles.map(s => s.style).join(', ')}
- Preferred colors: ${userPrefs.preferredColors.map(c => c.color).join(', ')}` : 'No prior preferences'}

REQUESTED CATEGORIES: ${request.categories?.join(', ') || 'all'}
MAX RESULTS: ${request.limit || config.maxResults}

Generate ${request.limit || 10} highly relevant asset recommendations. For each asset, provide:
1. A descriptive name
2. The asset category
3. Relevant tags
4. A relevance score (0-100)
5. Confidence level (high/medium/low)
6. Reasons for recommendation
7. A human-readable explanation
8. Suggested colors that match
9. The visual style

Focus on variety while maintaining relevance to the design context.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                score: { type: Type.NUMBER },
                confidence: { type: Type.STRING },
                reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                reasonText: { type: Type.STRING },
                colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                style: { type: Type.STRING }
              },
              required: ['name', 'category', 'tags', 'score', 'confidence', 'reasons', 'reasonText']
            }
          },
          contextSummary: { type: Type.STRING }
        },
        required: ['recommendations', 'contextSummary']
      }
    }
  });

  const result = JSON.parse(response.text || '{"recommendations":[],"contextSummary":""}');

  // Transform to full RecommendedAsset objects with placeholder images
  const recommendations: RecommendedAsset[] = result.recommendations.map((rec: any, index: number) => ({
    id: `rec_${Date.now()}_${index}`,
    name: rec.name,
    category: rec.category as AssetCategory,
    thumbnailUrl: getPlaceholderImage(rec.category, rec.tags),
    previewUrl: getPlaceholderImage(rec.category, rec.tags, true),
    score: rec.score,
    confidence: rec.confidence as ConfidenceLevel,
    reasons: rec.reasons as RecommendationReason[],
    reasonText: rec.reasonText,
    tags: rec.tags,
    colors: rec.colors,
    style: rec.style,
    source: 'ai_generated' as const,
    isPremium: false
  }));

  // Filter by minimum score
  const filteredRecs = recommendations.filter(r => r.score >= config.minScoreThreshold);

  return {
    recommendations: filteredRecs,
    generatedAt: new Date().toISOString(),
    contextSummary: result.contextSummary,
    totalMatches: filteredRecs.length,
    appliedFilters: request.categories || []
  };
}

/**
 * Get placeholder image URL based on category
 */
function getPlaceholderImage(category: string, tags: string[], highRes = false): string {
  const size = highRes ? '800x600' : '400x300';
  const query = encodeURIComponent(tags.slice(0, 3).join(' ') || category);

  // Use Unsplash for realistic placeholders
  const sources: Record<string, string> = {
    image: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=${highRes ? 800 : 400}&q=80`,
    photo: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${highRes ? 800 : 400}&q=80`,
    illustration: `https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=${highRes ? 800 : 400}&q=80`,
    icon: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=${highRes ? 800 : 400}&q=80`,
    video: `https://images.unsplash.com/photo-1536240478700-b869070f9279?w=${highRes ? 800 : 400}&q=80`,
    template: `https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=${highRes ? 800 : 400}&q=80`,
    font: `https://images.unsplash.com/photo-1455390582262-044cdead277a?w=${highRes ? 800 : 400}&q=80`,
    color_palette: `https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=${highRes ? 800 : 400}&q=80`,
    '3d_model': `https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=${highRes ? 800 : 400}&q=80`
  };

  return sources[category] || `https://source.unsplash.com/${size}/?${query}`;
}

/**
 * Get similar assets based on a source asset
 */
export async function getSimilarAssets(
  sourceAsset: {
    name: string;
    type: string;
    tags: string[];
    colors?: string[];
    style?: string;
  },
  library: any[],
  limit = 5
): Promise<RecommendedAsset[]> {
  const ai = getAIClient();

  const prompt = `Find the ${limit} most similar assets to this source:
Source: ${JSON.stringify(sourceAsset)}

Library:
${JSON.stringify(library.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    tags: a.tags,
    dominantColors: a.dominantColors
  })))}

For each match, explain why it's similar and give a similarity score (0-100).
Return as JSON array with: id, score, reasonText`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasonText: { type: Type.STRING }
          },
          required: ['id', 'score', 'reasonText']
        }
      }
    }
  });

  const matches = JSON.parse(response.text || '[]');

  // Map back to full asset info
  return matches.map((match: any) => {
    const asset = library.find(a => a.id === match.id);
    if (!asset) return null;

    return {
      id: asset.id,
      name: asset.name,
      category: asset.type as AssetCategory,
      thumbnailUrl: asset.thumbnail || asset.versions?.[0]?.url || '',
      score: match.score,
      confidence: match.score > 80 ? 'high' : match.score > 50 ? 'medium' : 'low',
      reasons: ['style_match', 'similar_usage'] as RecommendationReason[],
      reasonText: match.reasonText,
      tags: asset.tags || [],
      colors: asset.dominantColors,
      source: 'library' as const
    };
  }).filter(Boolean) as RecommendedAsset[];
}

// ============================================================================
// COLOR RECOMMENDATIONS
// ============================================================================

/**
 * Generate color harmony suggestions
 */
export async function generateColorHarmonies(baseColor: string): Promise<ColorHarmony[]> {
  const ai = getAIClient();

  const prompt = `Generate color harmonies for the base color ${baseColor}.
Create 5 different harmony types: complementary, analogous, triadic, split_complementary, and monochromatic.
For each, provide:
- harmonyType
- colors (array of 4-5 hex colors including the base)
- name (creative palette name)
- mood (emotional tone)
- useCases (where this palette works best)`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            harmonyType: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            name: { type: Type.STRING },
            mood: { type: Type.STRING },
            useCases: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['harmonyType', 'colors', 'name', 'mood', 'useCases']
        }
      }
    }
  });

  const harmonies = JSON.parse(response.text || '[]');

  return harmonies.map((h: any) => ({
    baseColor,
    harmonyType: h.harmonyType,
    colors: h.colors,
    name: h.name,
    mood: h.mood,
    useCases: h.useCases
  }));
}

/**
 * Generate palette recommendations for a design context
 */
export async function generatePaletteRecommendations(
  context: DesignAnalysis,
  count = 5
): Promise<PaletteRecommendation[]> {
  const ai = getAIClient();

  const prompt = `Generate ${count} color palette recommendations for this design:
- Style: ${context.style}
- Mood: ${context.mood}
- Industry: ${context.industry || 'general'}
- Target audience: ${context.targetAudience || 'general'}
- Existing colors: ${context.dominantColors.join(', ')}

For each palette provide:
- name (creative name)
- colors (5-6 hex colors)
- harmonyType
- mood
- industry relevance
- score (0-100 relevance)
- reasons (why this works)`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            harmonyType: { type: Type.STRING },
            mood: { type: Type.STRING },
            industry: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['name', 'colors', 'harmonyType', 'mood', 'score', 'reasons']
        }
      }
    }
  });

  const palettes = JSON.parse(response.text || '[]');

  return palettes.map((p: any, i: number) => ({
    id: `palette_${Date.now()}_${i}`,
    name: p.name,
    colors: p.colors,
    harmony: {
      baseColor: p.colors[0],
      harmonyType: p.harmonyType,
      colors: p.colors,
      name: p.name,
      mood: p.mood,
      useCases: []
    },
    industry: p.industry,
    mood: p.mood,
    accessibility: {
      contrastRatio: 4.5,
      wcagLevel: 'AA' as const
    },
    score: p.score,
    reasons: p.reasons
  }));
}

// ============================================================================
// FONT RECOMMENDATIONS
// ============================================================================

/**
 * Generate font pairing suggestions
 */
export async function generateFontPairings(
  context: DesignAnalysis,
  count = 5
): Promise<FontPairing[]> {
  const ai = getAIClient();

  const prompt = `Suggest ${count} font pairings for this design:
- Style: ${context.style}
- Mood: ${context.mood}
- Project type: ${context.projectType}

For each pairing provide:
- primary font (name, category, recommended weights)
- secondary font (name, category, recommended weights)
- harmonyScore (0-100)
- useCases (what this pairing is good for)
- mood
- readabilityScore (0-100)

Use real Google Fonts that pair well together.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            primary: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                weights: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ['name', 'category', 'weights']
            },
            secondary: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                weights: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ['name', 'category', 'weights']
            },
            harmonyScore: { type: Type.NUMBER },
            useCases: { type: Type.ARRAY, items: { type: Type.STRING } },
            mood: { type: Type.STRING },
            readabilityScore: { type: Type.NUMBER }
          },
          required: ['primary', 'secondary', 'harmonyScore', 'useCases', 'mood', 'readabilityScore']
        }
      }
    }
  });

  const pairings = JSON.parse(response.text || '[]');

  return pairings.map((p: any, i: number) => ({
    id: `font_${Date.now()}_${i}`,
    primary: {
      name: p.primary.name,
      category: p.primary.category,
      weights: p.primary.weights,
      url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(p.primary.name)}`
    },
    secondary: {
      name: p.secondary.name,
      category: p.secondary.category,
      weights: p.secondary.weights,
      url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(p.secondary.name)}`
    },
    harmonyScore: p.harmonyScore,
    useCases: p.useCases,
    mood: p.mood,
    readabilityScore: p.readabilityScore
  }));
}

// ============================================================================
// LAYOUT SUGGESTIONS
// ============================================================================

/**
 * Generate layout suggestions
 */
export async function generateLayoutSuggestions(
  context: DesignAnalysis,
  aspectRatio = '16:9',
  count = 4
): Promise<LayoutSuggestion[]> {
  const ai = getAIClient();

  const prompt = `Suggest ${count} layout compositions for:
- Project type: ${context.projectType}
- Style: ${context.style}
- Aspect ratio: ${aspectRatio}

For each layout provide:
- name
- description
- gridColumns
- gridRows
- spacing (in pixels)
- alignment
- slots (array of content areas with id, type, x, y, width, height as percentages)
- score (0-100)
- reasons

Slot types: image, text, heading, cta, logo, spacer`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            gridColumns: { type: Type.NUMBER },
            gridRows: { type: Type.NUMBER },
            spacing: { type: Type.NUMBER },
            alignment: { type: Type.STRING },
            slots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER }
                },
                required: ['id', 'type', 'x', 'y', 'width', 'height']
              }
            },
            score: { type: Type.NUMBER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['name', 'gridColumns', 'gridRows', 'slots', 'score', 'reasons']
        }
      }
    }
  });

  const layouts = JSON.parse(response.text || '[]');

  return layouts.map((l: any, i: number) => ({
    id: `layout_${Date.now()}_${i}`,
    name: l.name,
    thumbnailUrl: `https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=400&q=80`,
    gridColumns: l.gridColumns,
    gridRows: l.gridRows,
    spacing: l.spacing || 16,
    alignment: l.alignment || 'left',
    slots: l.slots,
    context: context.projectType,
    aspectRatio,
    score: l.score,
    reasons: l.reasons
  }));
}

// ============================================================================
// USER PREFERENCE LEARNING
// ============================================================================

/**
 * Get user preferences from local storage
 */
export function getUserPreferences(): UserPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save user preferences
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

/**
 * Record user interaction for learning
 */
export function recordInteraction(interaction: UserInteraction): void {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.INTERACTION_HISTORY);
    const history: UserInteraction[] = historyStr ? JSON.parse(historyStr) : [];

    // Keep last 1000 interactions
    history.push(interaction);
    if (history.length > 1000) {
      history.shift();
    }

    localStorage.setItem(STORAGE_KEYS.INTERACTION_HISTORY, JSON.stringify(history));

    // Update preferences based on interaction
    updatePreferencesFromInteraction(interaction);
  } catch (e) {
    console.error('Failed to record interaction:', e);
  }
}

/**
 * Update preferences based on a new interaction
 */
function updatePreferencesFromInteraction(interaction: UserInteraction): void {
  const config = DEFAULT_RECOMMENDATION_CONFIG;
  let prefs = getUserPreferences();

  if (!prefs) {
    prefs = {
      userId: interaction.userId,
      preferredStyles: [],
      preferredColors: [],
      preferredCategories: [],
      frequentContexts: [],
      averageSessionLength: 0,
      peakUsageHours: [],
      favoriteAssets: [],
      dismissedAssets: [],
      recentlyUsed: [],
      totalInteractions: 0,
      lastUpdated: new Date().toISOString(),
      confidenceScore: 0
    };
  }

  // Update based on interaction type
  const weight = getInteractionWeight(interaction.interactionType);

  // Update recently used
  if (['use_in_design', 'download', 'edit'].includes(interaction.interactionType)) {
    prefs.recentlyUsed = [interaction.assetId, ...prefs.recentlyUsed.filter(id => id !== interaction.assetId)].slice(0, 50);
  }

  // Update favorites
  if (interaction.interactionType === 'favorite') {
    if (!prefs.favoriteAssets.includes(interaction.assetId)) {
      prefs.favoriteAssets.push(interaction.assetId);
    }
  }

  // Update dismissed
  if (interaction.interactionType === 'dismiss') {
    if (!prefs.dismissedAssets.includes(interaction.assetId)) {
      prefs.dismissedAssets.push(interaction.assetId);
    }
  }

  // Update context frequency
  if (interaction.context) {
    const contextIndex = prefs.frequentContexts.indexOf(interaction.context);
    if (contextIndex === -1) {
      prefs.frequentContexts.push(interaction.context);
    } else {
      // Move to front
      prefs.frequentContexts.splice(contextIndex, 1);
      prefs.frequentContexts.unshift(interaction.context);
    }
    prefs.frequentContexts = prefs.frequentContexts.slice(0, 5);
  }

  // Increment total and update timestamp
  prefs.totalInteractions++;
  prefs.lastUpdated = new Date().toISOString();

  // Update confidence score (caps at 100)
  prefs.confidenceScore = Math.min(100, prefs.totalInteractions * 0.5 + prefs.favoriteAssets.length * 2);

  saveUserPreferences(prefs);
}

/**
 * Get weight for interaction type
 */
function getInteractionWeight(type: UserInteraction['interactionType']): number {
  const weights: Record<string, number> = {
    view: 0.1,
    download: 0.5,
    use_in_design: 0.8,
    favorite: 0.7,
    dismiss: -0.5,
    share: 0.4,
    edit: 0.6,
    purchase: 1.0
  };
  return weights[type] || 0.1;
}

/**
 * Get interaction history
 */
export function getInteractionHistory(): UserInteraction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INTERACTION_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear user data
 */
export function clearUserData(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  localStorage.removeItem(STORAGE_KEYS.INTERACTION_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.RECOMMENDATION_CACHE);
}

// ============================================================================
// SMART COLLECTIONS
// ============================================================================

/**
 * Generate smart collection based on criteria
 */
export async function generateSmartCollection(
  name: string,
  criteria: SmartCollection['criteria'],
  assets: any[]
): Promise<SmartCollection> {
  const ai = getAIClient();

  const prompt = `From this asset library, select the best matches for a collection called "${name}":
Criteria:
${criteria.styles ? `- Styles: ${criteria.styles.join(', ')}` : ''}
${criteria.colors ? `- Colors: ${criteria.colors.join(', ')}` : ''}
${criteria.categories ? `- Categories: ${criteria.categories.join(', ')}` : ''}
${criteria.tags ? `- Tags: ${criteria.tags.join(', ')}` : ''}

Assets:
${JSON.stringify(assets.map(a => ({ id: a.id, name: a.name, type: a.type, tags: a.tags })))}

Return array of asset IDs that best match, up to 20 items.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const assetIds = JSON.parse(response.text || '[]');

  return {
    id: `collection_${Date.now()}`,
    name,
    description: `Auto-curated collection matching ${Object.keys(criteria).join(', ')}`,
    coverImage: assets.find(a => assetIds.includes(a.id))?.thumbnail || '',
    criteria,
    assetIds,
    assetCount: assetIds.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAutoGenerated: true,
    curationType: 'style_based'
  };
}

// ============================================================================
// TRENDING & ANALYTICS
// ============================================================================

/**
 * Get trending styles (mock data - would connect to analytics in production)
 */
export function getTrendingStyles(): TrendData[] {
  return [
    {
      id: 'trend_1',
      type: 'style',
      value: 'Minimalist',
      usageCount: 15420,
      growthRate: 23.5,
      industries: ['tech', 'fashion', 'finance'],
      period: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    {
      id: 'trend_2',
      type: 'color',
      value: '#6366f1',
      usageCount: 8940,
      growthRate: 45.2,
      industries: ['tech', 'saas'],
      period: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    {
      id: 'trend_3',
      type: 'style',
      value: 'Glassmorphism',
      usageCount: 6230,
      growthRate: 67.8,
      industries: ['tech', 'finance'],
      period: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    {
      id: 'trend_4',
      type: 'category',
      value: 'illustration',
      usageCount: 12850,
      growthRate: 18.3,
      industries: ['marketing', 'education'],
      period: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }
  ];
}

/**
 * Get recommended categories based on user history
 */
export function getRecommendedCategories(): typeof RECOMMENDATION_CATEGORIES {
  const prefs = getUserPreferences();

  if (!prefs || prefs.preferredCategories.length === 0) {
    return RECOMMENDATION_CATEGORIES;
  }

  // Sort by user preference
  return [...RECOMMENDATION_CATEGORIES].sort((a, b) => {
    const aWeight = prefs.preferredCategories.find(c => a.assetCategories.includes(c.category))?.weight || 0;
    const bWeight = prefs.preferredCategories.find(c => b.assetCategories.includes(c.category))?.weight || 0;
    return bWeight - aWeight;
  });
}

// ============================================================================
// QUICK RECOMMENDATIONS
// ============================================================================

/**
 * Get quick recommendations without full context analysis
 */
export function getQuickRecommendations(
  keywords: string[],
  category?: AssetCategory
): Promise<RecommendedAsset[]> {
  return generateRecommendations({
    context: {
      projectType: 'general',
      dominantColors: [],
      style: 'modern',
      mood: 'professional',
      keywords,
      existingAssets: []
    },
    categories: category ? [category] : undefined,
    limit: 6
  }).then(r => r.recommendations);
}

/**
 * Get personalized homepage recommendations
 */
export async function getHomepageRecommendations(): Promise<{
  forYou: RecommendedAsset[];
  trending: RecommendedAsset[];
  recentlyUsed: RecommendedAsset[];
}> {
  const prefs = getUserPreferences();
  const trends = getTrendingStyles();

  // For You - based on preferences
  const forYouKeywords = prefs?.preferredStyles.map(s => s.style) || ['modern', 'professional'];
  const forYou = await getQuickRecommendations(forYouKeywords);

  // Trending - based on trend data
  const trendingKeywords = trends.filter(t => t.type === 'style').map(t => t.value);
  const trending = await getQuickRecommendations(trendingKeywords);

  // Recently used - mock for now
  const recentlyUsed: RecommendedAsset[] = [];

  return { forYou, trending, recentlyUsed };
}
