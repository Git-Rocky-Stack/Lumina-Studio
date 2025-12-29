// ============================================================================
// AI TEMPLATE ENGINE - SERVICE
// ============================================================================

import { getAIClient } from './geminiService';
import { Type } from '@google/genai';
import {
  TemplateCategory,
  OutputFormat,
  IndustryPreset
} from '../types/template';
import type {
  AITemplate,
  TemplatePrompt,
  GeneratedTemplate,
  TemplateElement,
  TextElementProps,
  ImageElementProps,
  ShapeElementProps
} from '../types/template';
import { BrandKit } from '../types';

// Model constants
const TEXT_PRO = 'gemini-3-pro-preview';
const TEXT_FLASH = 'gemini-3-flash-preview';
const IMAGE_PRO = 'gemini-3-pro-image-preview';

/**
 * Generate unique ID
 */
const generateId = () => `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Get dimensions for a format
 */
export const getFormatDimensions = (format: OutputFormat): { width: number; height: number; aspectRatio: string } => {
  const dimensions: Record<OutputFormat, { width: number; height: number; aspectRatio: string }> = {
    [OutputFormat.INSTAGRAM_POST]: { width: 1080, height: 1080, aspectRatio: '1:1' },
    [OutputFormat.INSTAGRAM_STORY]: { width: 1080, height: 1920, aspectRatio: '9:16' },
    [OutputFormat.INSTAGRAM_REEL]: { width: 1080, height: 1920, aspectRatio: '9:16' },
    [OutputFormat.FACEBOOK_POST]: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    [OutputFormat.FACEBOOK_COVER]: { width: 820, height: 312, aspectRatio: '2.63:1' },
    [OutputFormat.TWITTER_POST]: { width: 1200, height: 675, aspectRatio: '16:9' },
    [OutputFormat.LINKEDIN_POST]: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    [OutputFormat.YOUTUBE_THUMBNAIL]: { width: 1280, height: 720, aspectRatio: '16:9' },
    [OutputFormat.TIKTOK]: { width: 1080, height: 1920, aspectRatio: '9:16' },
    [OutputFormat.EMAIL_HEADER]: { width: 600, height: 200, aspectRatio: '3:1' },
    [OutputFormat.BANNER_AD]: { width: 728, height: 90, aspectRatio: '8:1' },
    [OutputFormat.HERO_IMAGE]: { width: 1920, height: 1080, aspectRatio: '16:9' },
    [OutputFormat.SLIDE_16_9]: { width: 1920, height: 1080, aspectRatio: '16:9' },
    [OutputFormat.SLIDE_4_3]: { width: 1024, height: 768, aspectRatio: '4:3' },
    [OutputFormat.FLYER_LETTER]: { width: 2550, height: 3300, aspectRatio: '8.5:11' },
    [OutputFormat.BUSINESS_CARD]: { width: 1050, height: 600, aspectRatio: '3.5:2' },
    [OutputFormat.POSTER_A4]: { width: 2480, height: 3508, aspectRatio: '1:1.41' },
    [OutputFormat.CUSTOM]: { width: 1080, height: 1080, aspectRatio: '1:1' }
  };
  return dimensions[format] || dimensions[OutputFormat.INSTAGRAM_POST];
};

/**
 * Build comprehensive AI prompt for template generation
 */
const buildTemplatePrompt = (
  prompt: TemplatePrompt,
  brandKit?: BrandKit | null
): string => {
  const dims = getFormatDimensions(prompt.format);

  const parts: string[] = [
    'You are an expert graphic designer specializing in creating professional marketing templates.',
    'Generate a complete design template structure as JSON.',
    '',
    `USER REQUEST: "${prompt.prompt}"`,
    '',
    `CANVAS DIMENSIONS:`,
    `- Width: ${dims.width}px`,
    `- Height: ${dims.height}px`,
    `- Aspect Ratio: ${dims.aspectRatio}`,
    `- Format: ${prompt.format.replace(/_/g, ' ')}`,
    ''
  ];

  if (prompt.industry) {
    parts.push(`INDUSTRY: ${prompt.industry.replace(/_/g, ' ')}`);
    parts.push('');
  }

  if (brandKit && prompt.applyBrandKit) {
    parts.push(
      'BRAND KIT TO APPLY:',
      `- Brand Personality: ${brandKit.personality}`,
      `- Colors: ${brandKit.colors.join(', ')}`,
      `- Fonts: ${brandKit.fonts.join(', ')}`,
      ''
    );
  }

  if (prompt.preferences) {
    parts.push(
      'STYLE PREFERENCES:',
      `- Color Scheme: ${prompt.preferences.colorScheme}`,
      `- Layout Complexity: ${prompt.preferences.layoutComplexity}`,
      `- Text Density: ${prompt.preferences.textDensity}`,
      `- Image Style: ${prompt.preferences.imageStyle}`,
      `- Tone: ${prompt.preferences.tone}`,
      ''
    );
  }

  parts.push(
    'REQUIREMENTS:',
    '1. Create a visually balanced composition',
    '2. Include placeholder text that fits the context',
    '3. Use appropriate font sizes for readability',
    '4. Position elements with proper margins and spacing',
    '5. Ensure visual hierarchy (heading > subheading > body)',
    '',
    'RETURN STRUCTURE:',
    '- name: Template name',
    '- description: Brief description',
    '- backgroundColor: Hex color for background',
    '- elements: Array of design elements',
    '',
    'Each element should have:',
    '- id: unique identifier',
    '- type: "text", "shape", or "image"',
    '- name: descriptive name',
    '- x, y: position in pixels from top-left',
    '- width, height: dimensions in pixels',
    '- rotation: degrees (usually 0)',
    '- zIndex: layer order (higher = front)',
    '- props: element-specific properties',
    '',
    'For TEXT elements, props should include:',
    '- content: the text content',
    '- fontFamily: font name (use Inter, Poppins, Playfair Display, or Montserrat)',
    '- fontSize: size in pixels',
    '- fontWeight: 400, 500, 600, 700, or 800',
    '- color: hex color',
    '- alignment: "left", "center", or "right"',
    '- lineHeight: multiplier (e.g., 1.2)',
    '- letterSpacing: pixels',
    '',
    'For SHAPE elements, props should include:',
    '- shapeType: "rectangle", "circle", or "line"',
    '- fill: hex color',
    '- opacity: 0 to 1',
    '- borderRadius: pixels (for rectangles)',
    '',
    'Return ONLY valid JSON, no markdown or explanation.'
  );

  return parts.join('\n');
};

/**
 * Generate a template using AI
 */
export async function generateTemplate(
  prompt: TemplatePrompt,
  brandKit?: BrandKit | null
): Promise<GeneratedTemplate> {
  const startTime = Date.now();
  const ai = getAIClient();

  try {
    const aiPrompt = buildTemplatePrompt(prompt, brandKit);
    const dims = getFormatDimensions(prompt.format);

    const response = await ai.models.generateContent({
      model: TEXT_PRO,
      contents: aiPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            backgroundColor: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            colorRationale: { type: Type.STRING },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                  zIndex: { type: Type.NUMBER },
                  props: { type: Type.OBJECT }
                }
              }
            }
          },
          required: ['name', 'elements', 'backgroundColor']
        },
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });

    const parsed = JSON.parse(response.text || '{}');

    // Build complete template
    const template: AITemplate = {
      id: generateId(),
      name: parsed.name || 'Untitled Template',
      description: parsed.description || prompt.prompt,
      category: prompt.category || TemplateCategory.SOCIAL_MEDIA,
      industry: prompt.industry ? [prompt.industry] : [IndustryPreset.GENERAL],
      tags: extractTags(prompt.prompt),
      format: prompt.format,
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.aspectRatio,
      elements: processElements(parsed.elements || [], dims, brandKit),
      layout: {
        type: 'freeform',
        padding: { top: 40, right: 40, bottom: 40, left: 40 }
      },
      backgroundColor: parsed.backgroundColor || '#FFFFFF',
      customizable: {
        text: true,
        images: true,
        colors: true,
        fonts: true
      },
      brandKitCompatible: true,
      popularity: 0,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedWith: {
        model: TEXT_PRO,
        prompt: prompt.prompt,
        confidence: 0.85
      }
    };

    const generatedTemplate: GeneratedTemplate = {
      id: generateId(),
      promptId: prompt.id,
      template,
      metadata: {
        model: TEXT_PRO,
        generationTime: Date.now() - startTime,
        confidence: 0.85
      },
      insights: {
        reasoning: parsed.reasoning || 'AI-generated design based on your prompt',
        colorRationale: parsed.colorRationale,
        suggestions: [
          'Try adjusting the headline for more impact',
          'Consider adding your brand logo',
          'Experiment with different color variations'
        ]
      },
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    return generatedTemplate;

  } catch (error) {
    console.error('Template generation failed:', error);
    throw new Error(`Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process and validate elements from AI response
 */
function processElements(
  rawElements: any[],
  dims: { width: number; height: number },
  brandKit?: BrandKit | null
): TemplateElement[] {
  return rawElements.map((el, index) => {
    const element: TemplateElement = {
      id: el.id || `el_${index}_${Date.now()}`,
      type: el.type || 'text',
      name: el.name || `Element ${index + 1}`,
      x: Math.max(0, Math.min(el.x || 0, dims.width)),
      y: Math.max(0, Math.min(el.y || 0, dims.height)),
      width: Math.max(10, Math.min(el.width || 100, dims.width)),
      height: Math.max(10, Math.min(el.height || 50, dims.height)),
      rotation: el.rotation || 0,
      zIndex: el.zIndex ?? index,
      props: processElementProps(el.type, el.props, brandKit),
      locked: false,
      visible: true,
      aiGenerated: true
    };

    return element;
  });
}

/**
 * Process element properties with brand kit application
 */
function processElementProps(
  type: string,
  props: any,
  brandKit?: BrandKit | null
): TextElementProps | ImageElementProps | ShapeElementProps {
  if (!props) props = {};

  switch (type) {
    case 'text':
      return {
        content: props.content || 'Sample Text',
        fontFamily: props.fontFamily || (brandKit?.fonts?.[0] || 'Inter'),
        fontSize: props.fontSize || 24,
        fontWeight: props.fontWeight || 600,
        color: props.color || (brandKit?.colors?.[0] || '#0F172A'),
        alignment: props.alignment || 'left',
        lineHeight: props.lineHeight || 1.3,
        letterSpacing: props.letterSpacing || 0,
        textTransform: props.textTransform || 'none'
      } as TextElementProps;

    case 'shape':
      return {
        shapeType: props.shapeType || 'rectangle',
        fill: props.fill || (brandKit?.colors?.[1] || '#6366F1'),
        stroke: props.stroke,
        strokeWidth: props.strokeWidth,
        opacity: props.opacity ?? 1,
        borderRadius: props.borderRadius || 0
      } as ShapeElementProps;

    case 'image':
      return {
        src: props.src || '',
        alt: props.alt || 'Template image',
        opacity: props.opacity ?? 1,
        fit: props.fit || 'cover',
        borderRadius: props.borderRadius || 0,
        aiPrompt: props.aiPrompt
      } as ImageElementProps;

    default:
      return {
        content: 'Element',
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: 400,
        color: '#0F172A',
        alignment: 'left',
        lineHeight: 1.4,
        letterSpacing: 0
      } as TextElementProps;
  }
}

/**
 * Extract tags from prompt
 */
function extractTags(prompt: string): string[] {
  const words = prompt.toLowerCase().split(/\s+/);
  const stopWords = new Set(['a', 'an', 'the', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'is', 'it', 'with', 'create', 'make', 'design']);
  return words
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
}

/**
 * Generate template variations
 */
export async function generateVariations(
  template: AITemplate,
  count: number = 3
): Promise<AITemplate[]> {
  const ai = getAIClient();
  const variations: AITemplate[] = [];

  const variationPrompts = [
    'Create a bolder version with stronger contrast',
    'Create a minimal version with more whitespace',
    'Create a version with different color palette'
  ];

  for (let i = 0; i < Math.min(count, variationPrompts.length); i++) {
    try {
      const response = await ai.models.generateContent({
        model: TEXT_FLASH,
        contents: `Given this template: ${JSON.stringify(template)}

        ${variationPrompts[i]}

        Return a modified version as JSON with the same structure.`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      variations.push({
        ...template,
        ...parsed,
        id: generateId(),
        name: `${template.name} - Variation ${i + 1}`
      });
    } catch (e) {
      console.error('Failed to generate variation', e);
    }
  }

  return variations;
}

/**
 * Get style suggestions based on prompt
 */
export async function getStyleSuggestions(prompt: string): Promise<string[]> {
  const ai = getAIClient();

  try {
    const response = await ai.models.generateContent({
      model: TEXT_FLASH,
      contents: `Suggest 6 visual styles for a design template with this description: "${prompt}".
      Return as JSON array of short style descriptions (e.g., "Minimalist with bold typography").`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch {
    return [
      'Clean and minimal',
      'Bold and colorful',
      'Professional corporate',
      'Modern gradient',
      'Vintage inspired',
      'Geometric patterns'
    ];
  }
}

/**
 * Apply brand kit to existing template
 */
export function applyBrandKitToTemplate(
  template: AITemplate,
  brandKit: BrandKit
): AITemplate {
  const updatedElements = template.elements.map(element => {
    const updatedProps = { ...element.props };

    if (element.type === 'text') {
      const textProps = updatedProps as TextElementProps;
      if (element.brandMapping?.color === 'primary' || element.zIndex > 5) {
        textProps.color = brandKit.colors[0] || textProps.color;
      }
      if (element.brandMapping?.font === 'heading' || textProps.fontSize > 30) {
        textProps.fontFamily = brandKit.fonts[0] || textProps.fontFamily;
      } else {
        textProps.fontFamily = brandKit.fonts[1] || brandKit.fonts[0] || textProps.fontFamily;
      }
    }

    if (element.type === 'shape') {
      const shapeProps = updatedProps as ShapeElementProps;
      if (element.brandMapping?.color === 'primary') {
        shapeProps.fill = brandKit.colors[0] || shapeProps.fill;
      } else if (element.brandMapping?.color === 'secondary') {
        shapeProps.fill = brandKit.colors[1] || shapeProps.fill;
      }
    }

    return { ...element, props: updatedProps };
  });

  return {
    ...template,
    elements: updatedElements,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Generate background image for template
 */
export async function generateTemplateBackground(
  template: AITemplate,
  style: string
): Promise<string> {
  const ai = getAIClient();

  const prompt = `Professional ${style} background for ${template.format.replace(/_/g, ' ')} design. ${template.description}. Abstract, no text, suitable for overlaying design elements.`;

  const response = await ai.models.generateContent({
    model: IMAGE_PRO,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: template.aspectRatio.includes('16:9') ? '16:9' :
                     template.aspectRatio.includes('9:16') ? '9:16' : '1:1',
        imageSize: '2K'
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Failed to generate background image');
}

/**
 * Convert template to Canvas-compatible elements
 */
export function templateToCanvasElements(template: AITemplate) {
  return template.elements.map(el => ({
    id: el.id,
    type: el.type === 'shape' ? 'shape' : el.type === 'image' ? 'image' : 'text',
    content: el.type === 'text' ? (el.props as TextElementProps).content : '',
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    zIndex: el.zIndex,
    fontSize: el.type === 'text' ? (el.props as TextElementProps).fontSize : undefined,
    color: el.type === 'text' ? (el.props as TextElementProps).color :
           el.type === 'shape' ? (el.props as ShapeElementProps).fill : undefined,
    style: el.props,
    isVisible: el.visible,
    isLocked: el.locked
  }));
}

/**
 * Quick template suggestions based on category
 */
export async function getQuickTemplateSuggestions(
  category: TemplateCategory,
  industry?: IndustryPreset
): Promise<string[]> {
  const ai = getAIClient();

  try {
    const response = await ai.models.generateContent({
      model: TEXT_FLASH,
      contents: `Suggest 8 specific template ideas for ${category.replace(/_/g, ' ')}
      ${industry ? `in the ${industry.replace(/_/g, ' ')} industry` : ''}.
      Return as JSON array of short descriptions.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch {
    return [
      'Product launch announcement',
      'Sale promotion banner',
      'Event invitation',
      'Brand awareness post',
      'Customer testimonial',
      'Behind the scenes',
      'Tips and tricks',
      'Quote of the day'
    ];
  }
}

export default {
  generateTemplate,
  generateVariations,
  getStyleSuggestions,
  applyBrandKitToTemplate,
  generateTemplateBackground,
  templateToCanvasElements,
  getQuickTemplateSuggestions,
  getFormatDimensions
};
