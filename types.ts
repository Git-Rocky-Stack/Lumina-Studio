
export enum StudioMode {
  WORKSPACE = 'workspace',
  ASSETS = 'assets',
  CANVAS = 'canvas',
  VIDEO = 'video',
  STOCK = 'stock',
  TEMPLATES = 'templates',
  PDF = 'pdf',
  PRO_PHOTO = 'pro_photo',
  ASSISTANT = 'assistant',
  BRANDING = 'branding',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  FEATURES = 'features'
}

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate';

export interface WorkspaceWidget {
  id: string;
  title: string;
  enabled: boolean;
  type: 'stat' | 'ai_quick' | 'activity';
}

export type TransitionType = 'cut' | 'crossfade' | 'glitch' | 'dissolve' | 'zoom' | 'slide';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:2';

export interface Shot {
  id: string;
  prompt: string;
  camera: string;
  lighting: string;
  lensType?: string;
  motionDescription?: string;
  motionScore?: number;
  cinematicDetail?: string;
  duration: number;
  status: 'pending' | 'generating' | 'ready' | 'extending' | 'error';
  videoUrl?: string;
  thumbnailUrl?: string;
  rawVideoData?: any;
  transition: TransitionType;
  transitionIntensity?: number;
  transitionDuration?: number;
}

export interface Storyboard {
  id: string;
  title: string;
  masterConcept: string;
  shots: Shot[];
  aspectRatio: VideoAspectRatio;
  audioTrackId?: string;
  audioPrompt?: string;
}

export type AnimationType = 'none' | 'fade' | 'fade-out' | 'slide' | 'bounce' | 'zoom';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
export type AnimationEasing = 'linear' | 'ease-out' | 'elastic' | 'bounce-phys';
export type MaskType = 'none' | 'circle' | 'rounded' | 'star' | 'diamond';

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  fontSize?: number;
  color?: string;
  groupId?: string;
  zIndex: number;
  style?: any;
  isVisible?: boolean;
  isLocked?: boolean;
  mask?: MaskType;
  animation?: AnimationType;
  animationDirection?: AnimationDirection;
  animationEasing?: AnimationEasing;
  animationDuration?: number;
  animationDelay?: number;
  animationIterationCount?: string;
}

export interface PhotoLayer {
  id: string;
  name: string;
  type: 'raster' | 'adjustment' | 'smart_object';
  content: string; // base64 or URL
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  visible: boolean;
  locked: boolean;
  filters: PhotoFilter[];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

export interface PhotoFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'blur' | 'ai_enhance';
  value: number;
}

export interface BrandKit {
  name: string;
  personality: string;
  colors: string[];
  fonts: string[];
  logoUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
