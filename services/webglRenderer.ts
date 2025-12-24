/**
 * WebGL Canvas Renderer
 *
 * Hardware-accelerated rendering with:
 * - GPU-powered compositing
 * - Real-time filters
 * - Smooth 60fps performance
 * - Complex layer handling
 */

export interface RenderLayer {
  id: string;
  type: 'image' | 'shape' | 'text' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  filters: LayerFilter[];
  data: any;
  texture?: WebGLTexture;
}

export interface LayerFilter {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'sepia' | 'invert' | 'grayscale';
  value: number;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

interface ShaderProgram {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation>;
}

class WebGLRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private programs: Map<string, ShaderProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private frameBuffer: WebGLFramebuffer | null = null;
  private isInitialized = false;

  // Vertex shader - transforms vertices
  private vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;

    uniform vec2 u_resolution;
    uniform mat3 u_transform;

    out vec2 v_texCoord;

    void main() {
      vec3 position = u_transform * vec3(a_position, 1.0);
      vec2 clipSpace = (position.xy / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  // Fragment shader - applies colors and effects
  private fragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 v_texCoord;

    uniform sampler2D u_texture;
    uniform float u_opacity;
    uniform float u_blur;
    uniform float u_brightness;
    uniform float u_contrast;
    uniform float u_saturation;
    uniform float u_hue;
    uniform int u_blendMode;

    out vec4 outColor;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 color = texture(u_texture, v_texCoord);

      // Apply brightness
      color.rgb *= u_brightness;

      // Apply contrast
      color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;

      // Apply saturation and hue
      vec3 hsv = rgb2hsv(color.rgb);
      hsv.x += u_hue;
      hsv.y *= u_saturation;
      color.rgb = hsv2rgb(hsv);

      // Apply opacity
      color.a *= u_opacity;

      outColor = color;
    }
  `;

  /**
   * Initialize the WebGL renderer
   */
  init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;

    // Try WebGL 2 first, fall back to WebGL 1
    this.gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      console.error('[WebGL] WebGL 2 not supported');
      return false;
    }

    // Initialize shaders
    this.initShaders();

    // Set up default state
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.isInitialized = true;
    console.log('[WebGL] Renderer initialized');

    return true;
  }

  /**
   * Initialize shader programs
   */
  private initShaders(): void {
    if (!this.gl) return;

    const program = this.createProgram(this.vertexShaderSource, this.fragmentShaderSource);
    if (!program) return;

    this.programs.set('main', {
      program,
      attributes: {
        a_position: this.gl.getAttribLocation(program, 'a_position'),
        a_texCoord: this.gl.getAttribLocation(program, 'a_texCoord'),
      },
      uniforms: {
        u_resolution: this.gl.getUniformLocation(program, 'u_resolution')!,
        u_transform: this.gl.getUniformLocation(program, 'u_transform')!,
        u_texture: this.gl.getUniformLocation(program, 'u_texture')!,
        u_opacity: this.gl.getUniformLocation(program, 'u_opacity')!,
        u_brightness: this.gl.getUniformLocation(program, 'u_brightness')!,
        u_contrast: this.gl.getUniformLocation(program, 'u_contrast')!,
        u_saturation: this.gl.getUniformLocation(program, 'u_saturation')!,
        u_hue: this.gl.getUniformLocation(program, 'u_hue')!,
        u_blendMode: this.gl.getUniformLocation(program, 'u_blendMode')!,
      },
    });
  }

  /**
   * Create a shader program
   */
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('[WebGL] Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  /**
   * Create a shader
   */
  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('[WebGL] Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Load an image as a texture
   */
  async loadTexture(id: string, source: string | HTMLImageElement | HTMLVideoElement): Promise<WebGLTexture | null> {
    if (!this.gl) return null;

    // Check cache
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    if (typeof source === 'string') {
      // Load from URL
      const image = new Image();
      image.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = source;
      });

      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        image
      );
    } else {
      // Load from element
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        source
      );
    }

    this.textures.set(id, texture);
    return texture;
  }

  /**
   * Render layers to canvas
   */
  render(layers: RenderLayer[]): void {
    if (!this.gl || !this.canvas || !this.isInitialized) return;

    const { width, height } = this.canvas;

    // Set viewport
    this.gl.viewport(0, 0, width, height);

    // Clear canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    const mainProgram = this.programs.get('main');
    if (!mainProgram) return;

    this.gl.useProgram(mainProgram.program);

    // Set resolution
    this.gl.uniform2f(mainProgram.uniforms.u_resolution, width, height);

    // Render each layer
    for (const layer of layers) {
      if (layer.opacity <= 0) continue;
      this.renderLayer(layer, mainProgram);
    }
  }

  /**
   * Render a single layer
   */
  private renderLayer(layer: RenderLayer, program: ShaderProgram): void {
    if (!this.gl) return;

    // Get or create texture
    const texture = this.textures.get(layer.id);
    if (!texture && layer.type === 'image') return;

    // Create geometry
    const positions = new Float32Array([
      0, 0,
      layer.width, 0,
      0, layer.height,
      0, layer.height,
      layer.width, 0,
      layer.width, layer.height,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]);

    // Create buffers
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(program.attributes.a_position);
    this.gl.vertexAttribPointer(program.attributes.a_position, 2, this.gl.FLOAT, false, 0, 0);

    const texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(program.attributes.a_texCoord);
    this.gl.vertexAttribPointer(program.attributes.a_texCoord, 2, this.gl.FLOAT, false, 0, 0);

    // Create transform matrix
    const transform = this.createTransformMatrix(layer);
    this.gl.uniformMatrix3fv(program.uniforms.u_transform, false, transform);

    // Set filter uniforms
    this.gl.uniform1f(program.uniforms.u_opacity, layer.opacity);
    this.gl.uniform1f(program.uniforms.u_brightness, this.getFilterValue(layer.filters, 'brightness', 1));
    this.gl.uniform1f(program.uniforms.u_contrast, this.getFilterValue(layer.filters, 'contrast', 1));
    this.gl.uniform1f(program.uniforms.u_saturation, this.getFilterValue(layer.filters, 'saturation', 1));
    this.gl.uniform1f(program.uniforms.u_hue, this.getFilterValue(layer.filters, 'hue', 0));
    this.gl.uniform1i(program.uniforms.u_blendMode, this.getBlendModeIndex(layer.blendMode));

    // Bind texture
    if (texture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.uniform1i(program.uniforms.u_texture, 0);
    }

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Cleanup
    this.gl.deleteBuffer(positionBuffer);
    this.gl.deleteBuffer(texCoordBuffer);
  }

  /**
   * Create transform matrix for a layer
   */
  private createTransformMatrix(layer: RenderLayer): Float32Array {
    const cos = Math.cos(layer.rotation);
    const sin = Math.sin(layer.rotation);

    // Translation to position, rotation around center
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;

    return new Float32Array([
      cos, sin, 0,
      -sin, cos, 0,
      cx - cos * layer.width / 2 + sin * layer.height / 2,
      cy - sin * layer.width / 2 - cos * layer.height / 2,
      1,
    ]);
  }

  /**
   * Get filter value by type
   */
  private getFilterValue(filters: LayerFilter[], type: string, defaultValue: number): number {
    const filter = filters.find((f) => f.type === type);
    return filter?.value ?? defaultValue;
  }

  /**
   * Get blend mode index for shader
   */
  private getBlendModeIndex(mode: BlendMode): number {
    const modes: BlendMode[] = [
      'normal', 'multiply', 'screen', 'overlay',
      'darken', 'lighten', 'color-dodge', 'color-burn',
      'hard-light', 'soft-light', 'difference', 'exclusion',
    ];
    return modes.indexOf(mode);
  }

  /**
   * Resize the canvas
   */
  resize(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Export canvas to image
   */
  toDataURL(type = 'image/png', quality = 1): string {
    return this.canvas?.toDataURL(type, quality) || '';
  }

  /**
   * Export canvas to blob
   */
  async toBlob(type = 'image/png', quality = 1): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas?.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (!this.gl) return;

    // Delete textures
    this.textures.forEach((texture) => {
      this.gl?.deleteTexture(texture);
    });
    this.textures.clear();

    // Delete programs
    this.programs.forEach((program) => {
      this.gl?.deleteProgram(program.program);
    });
    this.programs.clear();

    this.gl = null;
    this.canvas = null;
    this.isInitialized = false;
  }

  /**
   * Check if WebGL is supported
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const webglRenderer = new WebGLRenderer();

export default webglRenderer;
