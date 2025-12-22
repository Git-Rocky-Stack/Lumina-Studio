
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { VideoAspectRatio } from "../types";

// Model constants - Free tier compatible
const TEXT_FLASH = 'gemini-2.0-flash';
const TEXT_PRO = 'gemini-1.5-pro';
const IMAGE_PRO = 'imagen-3.0-generate-002';
const IMAGE_FLASH = 'imagen-3.0-fast-generate-001';
const VIDEO_MODEL = 'veo-2.0-generate-001';
const VIDEO_HIGH_MODEL = 'veo-2.0-generate-001';
const TTS_MODEL = 'gemini-2.0-flash';
const LIVE_MODEL = 'gemini-2.0-flash';

// Get API key from aistudio storage or environment
const getApiKey = (): string => {
  // First check window.__GEMINI_API_KEY__ (set by aistudio)
  if ((window as any).__GEMINI_API_KEY__) {
    return (window as any).__GEMINI_API_KEY__;
  }
  // Fallback to localStorage
  const storedKey = localStorage.getItem('lumina_gemini_api_key');
  if (storedKey) {
    return storedKey;
  }
  // Fallback to env variable
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

// Get AI client with current API key
export const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please add your Google AI API key.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * AI Image Editing using Gemini 2.0 Flash.
 * Analyzes image and provides suggestions or generates new version.
 */
export async function editImage(base64Data: string, prompt: string, mimeType: string = 'image/png') {
  const ai = getAIClient();

  // Use Gemini for analysis, then Imagen for regeneration
  const analysisResponse = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: `Analyze this image and create a detailed prompt to recreate it with these changes: ${prompt}. Return only the image generation prompt.` }
      ]
    }
  });

  const enhancedPrompt = analysisResponse.text || prompt;

  // Generate new image with Imagen
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_FLASH,
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
      }
    });

    const image = response.generatedImages?.[0];
    if (image?.image?.imageBytes) {
      return `data:image/png;base64,${image.image.imageBytes}`;
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    console.error("Image edit error:", error);
    throw new Error(error.message || "Image editing failed");
  }
}

/**
 * Fast text generation using Gemini 3 Flash by default.
 */
export async function generateText(prompt: string, options: { 
  systemInstruction?: string, 
  useSearch?: boolean, 
  think?: boolean,
  fast?: boolean
} = { fast: true }) {
  const ai = getAIClient();
  const model = options.think ? TEXT_PRO : TEXT_FLASH;
  const config: any = { 
    systemInstruction: options.systemInstruction,
    thinkingConfig: options.think ? { thinkingBudget: 16000 } : undefined
  };
  
  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

/**
 * Smart Asset Recommendations: Analyzes a source asset and a library to suggest matches.
 */
export async function suggestRelatedAssets(sourceAsset: any, library: any[]) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `Analyze this asset: ${JSON.stringify(sourceAsset)}. 
    From this library: ${JSON.stringify(library.map(a => ({id: a.id, name: a.name, type: a.type, tags: a.tags})))}.
    Suggest the top 3 assets that would complement this one (e.g. same style, useful for the same project, or visually similar).
    Return ONLY a JSON array of asset IDs.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

/**
 * Semantic Audio Search: Uses Gemini to rank tracks based on intent.
 */
export async function semanticAudioSearch(query: string, tracks: any[]) {
  const ai = getAIClient();
  const trackContext = tracks.map(t => ({ id: t.id, name: t.name, genre: t.genre, tags: t.tags, bpm: t.bpm }));
  
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `User is looking for music with this prompt: "${query}". 
    Rank these tracks from most to least relevant. Return ONLY a JSON array of track IDs.
    Tracks: ${JSON.stringify(trackContext)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    console.error("Failed to parse semantic search results", e);
    return [];
  }
}

/**
 * Intelligent Redaction: Scans text for PII.
 */
export async function scanForSensitiveData(text: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `Identify all sensitive data (names, emails, phones, dates, locations) in this text: "${text}". Return as a JSON array of unique strings found.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

/**
 * Document Reflow: Converts raw text into structured hierarchy.
 */
export async function reflowDocumentText(text: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_PRO,
    contents: `Reflow this text into a professional document structure with headings and body content. Keep the meaning identical but improve hierarchy: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "heading or body" },
            content: { type: Type.STRING }
          },
          required: ["type", "content"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

/**
 * Text-to-Speech generation via Gemini TTS.
 */
export async function generateSpeech(text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Zephyr' | 'Fenrir' = 'Kore') {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

/**
 * Audio Transcription using Gemini 3 Flash.
 */
export async function transcribeAudio(base64Audio: string, mimeType: string = 'audio/wav') {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Transcribe this audio exactly. Provide timing if possible. No commentary." }
      ]
    }
  });
  return response.text;
}

/**
 * High-speed image and video analysis.
 */
export async function analyzeMedia(prompt: string, mediaData: { data: string, mimeType: string }) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: {
      parts: [
        { inlineData: mediaData },
        { text: prompt }
      ]
    }
  });
  return response.text;
}

/**
 * Deep Video Understanding.
 */
export async function analyzeVideoContent(base64Video: string, prompt: string, mimeType: string = 'video/mp4') {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: {
      parts: [
        { inlineData: { data: base64Video, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text;
}

/**
 * High-quality image generation with Imagen 3.
 * Supports: "1:1", "3:4", "4:3", "9:16", "16:9"
 */
export async function generateHighQualityImage(prompt: string, aspectRatio: "1:1" | "4:3" | "16:9" | "9:16" = "1:1", size: "1K" | "2K" | "4K" = "2K") {
  const ai = getAIClient();

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_PRO,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
      }
    });

    const image = response.generatedImages?.[0];
    if (image?.image?.imageBytes) {
      return `data:image/png;base64,${image.image.imageBytes}`;
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(error.message || "Image generation failed");
  }
}

/**
 * Storyboard synthesis from script.
 */
export async function generateStoryboardFromScript(script: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_PRO,
    contents: `Analyze script and generate 4 cinematic shots. Script: ${script}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            camera: { type: Type.STRING },
            lighting: { type: Type.STRING },
            lensType: { type: Type.STRING },
            motionDescription: { type: Type.STRING },
            cinematicDetail: { type: Type.STRING },
            motionScore: { type: Type.INTEGER }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function generateStyleSuggestions(prompt: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `Suggest 6 distinct artistic styles for: "${prompt}". Return as JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function generateBatchImages(prompt: string, count: number, aspectRatio: any) {
  const promises = Array.from({ length: count }).map(() => generateHighQualityImage(prompt, aspectRatio, "1K"));
  return Promise.all(promises);
}

// Fix for Canvas.tsx: Add generateBackground
export async function generateBackground(subject: string, prompt: string) {
  const ai = getAIClient();
  const fullPrompt = `Generate a cinematic high-quality background for: ${subject}. Artistic style: ${prompt}`;

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_PRO,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      }
    });

    const image = response.generatedImages?.[0];
    if (image?.image?.imageBytes) {
      return `data:image/png;base64,${image.image.imageBytes}`;
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    console.error("Background generation error:", error);
    throw new Error(error.message || "Background generation failed");
  }
}

// Fix for AssetHub.tsx: Add suggestAssetMetadata
export async function suggestAssetMetadata(name: string, type: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `Suggest professional tags and a description for an asset named "${name}" of type "${type}". Return JSON with "tags" (string array) and "description" (string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING }
        },
        required: ["tags", "description"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

// Fix for AssetHub.tsx: Add analyzeAssetDeep
export async function analyzeAssetDeep(name: string, description: string, tags: string[]) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_PRO,
    contents: `Deeply analyze this asset context for production readiness: Name: ${name}, Description: ${description}, Tags: ${tags.join(', ')}. Return JSON with "composition", "alignment", and "quality" insights.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          composition: { type: Type.STRING },
          alignment: { type: Type.STRING },
          quality: { type: Type.STRING }
        },
        required: ["composition", "alignment", "quality"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

// Fix for AssetHub.tsx: Add bulkSuggestTags
export async function bulkSuggestTags(assets: {name: string, type: string}[]) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: TEXT_FLASH,
    contents: `Suggest professional metadata tags for these assets: ${JSON.stringify(assets)}. Return a JSON array of objects with "name" and "tags" (string array).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "tags"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

// Helper to map UI ratios to supported native Veo ratios (16:9 or 9:16)
const mapAspectRatio = (ratio: VideoAspectRatio): "16:9" | "9:16" => {
  if (ratio === '9:16') return '9:16';
  return '16:9'; // Default for landscape or square-like ratios in Veo
};

export async function generateAnimatedLoop(prompt: string, aspectRatio: VideoAspectRatio = "16:9") {
  const ai = getAIClient();
  const loopPrompt = `A seamless 3-second animated loop: ${prompt}. Cinematic.`;
  return await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt: loopPrompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: mapAspectRatio(aspectRatio) }
  });
}

export async function startVideoGeneration(prompt: string, aspectRatio: VideoAspectRatio = "16:9") {
  const ai = getAIClient();
  return await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: mapAspectRatio(aspectRatio) }
  });
}

export async function pollVideoOperation(operationId: any) {
  const ai = getAIClient();
  return await ai.operations.getVideosOperation({ operation: operationId });
}

export async function fetchVideoData(uri: string) {
  const apiKey = getApiKey();
  const response = await fetch(`${uri}&key=${apiKey}`);
  return await response.blob();
}

export async function extendVideo(previousVideo: any, prompt: string, aspectRatio: VideoAspectRatio) {
  const ai = getAIClient();
  return await ai.models.generateVideos({
    model: VIDEO_HIGH_MODEL,
    prompt,
    video: previousVideo,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: mapAspectRatio(aspectRatio) }
  });
}

// Helpers
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
