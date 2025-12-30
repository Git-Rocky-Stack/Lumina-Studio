// ============================================================================
// DESIGN HANDOFF SYSTEM - SERVICE
// ============================================================================

import type { DesignElement } from '../types';
import {
  generateHandoffId,
  hexToRgb,
  rgbToHsl,
  formatCssValue,
  pxToRem,
  toCssVariable,
  toCamelCase,
  toPascalCase
} from '../types/handoff';
import type {
  ElementSpec,
  DesignToken,
  ColorEntry,
  TypographyStyle,
  SpacingValue,
  GeneratedCode,
  HandoffPackage,
  CodeTarget,
  StyleFormat,
  MeasurementOverlay,
  CodeSnippet
} from '../types/handoff';

// ============================================================================
// HANDOFF MANAGER
// ============================================================================

class HandoffManager {
  // ============================================================================
  // SPEC EXTRACTION
  // ============================================================================

  /**
   * Extract full spec from an element
   */
  extractElementSpec(element: DesignElement): ElementSpec {
    const spec: ElementSpec = {
      elementId: element.id,
      name: this.generateElementName(element),
      type: element.type,
      position: {
        x: element.x,
        y: element.y,
        unit: 'px'
      },
      size: {
        width: element.width,
        height: element.height,
        unit: 'px'
      },
      spacing: {}
    };

    // Typography for text elements
    if (element.type === 'text') {
      spec.typography = {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: element.fontSize || 16,
        fontWeight: 700,
        lineHeight: 1.5,
        letterSpacing: 0,
        textAlign: 'left',
        color: element.color || '#1e293b'
      };
    }

    // Transform
    if (element.rotation || element.skewX || element.skewY) {
      spec.transform = {
        rotation: element.rotation || 0,
        scaleX: 1,
        scaleY: 1,
        skewX: element.skewX || 0,
        skewY: element.skewY || 0
      };
    }

    // Border radius for masks
    if (element.mask === 'circle') {
      spec.border = {
        width: 0,
        style: 'none',
        color: 'transparent',
        radius: 9999
      };
    } else if (element.mask === 'rounded') {
      spec.border = {
        width: 0,
        style: 'none',
        color: 'transparent',
        radius: 24
      };
    }

    return spec;
  }

  /**
   * Generate a readable name for an element
   */
  private generateElementName(element: DesignElement): string {
    if (element.type === 'text') {
      const content = element.content?.substring(0, 20) || 'Text';
      return content.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Text';
    }
    return `${element.type.charAt(0).toUpperCase()}${element.type.slice(1)} ${element.id.substring(0, 4)}`;
  }

  // ============================================================================
  // TOKEN EXTRACTION
  // ============================================================================

  /**
   * Extract all design tokens from elements
   */
  extractTokens(elements: DesignElement[]): DesignToken[] {
    const tokens: DesignToken[] = [];
    const colorSet = new Set<string>();
    const fontSizeSet = new Set<number>();
    const spacingSet = new Set<number>();

    elements.forEach(el => {
      // Colors
      if (el.color) colorSet.add(el.color);

      // Font sizes
      if (el.fontSize) fontSizeSet.add(el.fontSize);

      // Spacing (from positions/sizes)
      spacingSet.add(el.x);
      spacingSet.add(el.y);
      spacingSet.add(el.width);
      spacingSet.add(el.height);
    });

    // Create color tokens
    Array.from(colorSet).forEach((color, i) => {
      tokens.push({
        id: `color-${i}`,
        name: `color-${i + 1}`,
        type: 'color',
        value: color,
        rawValue: color
      });
    });

    // Create typography tokens
    Array.from(fontSizeSet).sort((a, b) => a - b).forEach((size, i) => {
      tokens.push({
        id: `font-size-${i}`,
        name: this.getFontSizeName(size),
        type: 'typography',
        value: `${size}px`,
        rawValue: size
      });
    });

    return tokens;
  }

  /**
   * Get semantic font size name
   */
  private getFontSizeName(size: number): string {
    if (size <= 12) return 'text-xs';
    if (size <= 14) return 'text-sm';
    if (size <= 16) return 'text-base';
    if (size <= 20) return 'text-lg';
    if (size <= 24) return 'text-xl';
    if (size <= 30) return 'text-2xl';
    if (size <= 36) return 'text-3xl';
    if (size <= 48) return 'text-4xl';
    return 'text-5xl';
  }

  /**
   * Extract color palette
   */
  extractColors(elements: DesignElement[]): ColorEntry[] {
    const colorMap = new Map<string, ColorEntry>();

    elements.forEach(el => {
      const color = el.color || (el.type === 'text' ? '#1e293b' : null);
      if (!color) return;

      const hex = color.toLowerCase();
      const existing = colorMap.get(hex);

      if (existing) {
        existing.usage.push(el.id);
        existing.count++;
      } else {
        const rgb = hexToRgb(hex);
        if (rgb) {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          colorMap.set(hex, {
            name: this.getColorName(hsl),
            hex,
            rgb,
            hsl,
            usage: [el.id],
            count: 1
          });
        }
      }
    });

    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Get semantic color name based on HSL
   */
  private getColorName(hsl: { h: number; s: number; l: number }): string {
    if (hsl.s < 10) {
      if (hsl.l < 20) return 'gray-900';
      if (hsl.l < 40) return 'gray-700';
      if (hsl.l < 60) return 'gray-500';
      if (hsl.l < 80) return 'gray-300';
      return 'gray-100';
    }

    let hueName: string;
    if (hsl.h < 15) hueName = 'red';
    else if (hsl.h < 45) hueName = 'orange';
    else if (hsl.h < 75) hueName = 'yellow';
    else if (hsl.h < 165) hueName = 'green';
    else if (hsl.h < 195) hueName = 'teal';
    else if (hsl.h < 255) hueName = 'blue';
    else if (hsl.h < 285) hueName = 'indigo';
    else if (hsl.h < 315) hueName = 'purple';
    else if (hsl.h < 345) hueName = 'pink';
    else hueName = 'red';

    const shade = hsl.l < 30 ? '900' : hsl.l < 50 ? '600' : hsl.l < 70 ? '400' : '200';
    return `${hueName}-${shade}`;
  }

  /**
   * Extract typography styles
   */
  extractTypography(elements: DesignElement[]): TypographyStyle[] {
    const styleMap = new Map<string, TypographyStyle>();

    elements
      .filter(el => el.type === 'text')
      .forEach(el => {
        const key = `${el.fontSize || 16}-${el.color || '#1e293b'}`;

        const existing = styleMap.get(key);
        if (existing) {
          existing.usage.push(el.id);
        } else {
          styleMap.set(key, {
            name: this.getFontSizeName(el.fontSize || 16),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: el.fontSize || 16,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: 0,
            usage: [el.id]
          });
        }
      });

    return Array.from(styleMap.values()).sort((a, b) => b.fontSize - a.fontSize);
  }

  // ============================================================================
  // CODE GENERATION
  // ============================================================================

  /**
   * Generate code for elements
   */
  generateCode(
    elements: DesignElement[],
    target: CodeTarget,
    styleFormat: StyleFormat
  ): GeneratedCode {
    const specs = elements.map(el => this.extractElementSpec(el));

    let component: string;
    let styles: string;
    let imports: string = '';

    switch (target) {
      case 'react':
        component = this.generateReactComponent(specs, styleFormat);
        styles = this.generateStyles(specs, styleFormat);
        imports = this.generateReactImports(styleFormat);
        break;
      case 'vue':
        component = this.generateVueComponent(specs, styleFormat);
        styles = this.generateStyles(specs, styleFormat);
        break;
      case 'html':
        component = this.generateHtmlComponent(specs);
        styles = this.generateStyles(specs, 'css');
        break;
      case 'swift':
        component = this.generateSwiftUIComponent(specs);
        styles = '';
        break;
      case 'flutter':
        component = this.generateFlutterComponent(specs);
        styles = '';
        break;
      default:
        component = '';
        styles = '';
    }

    return { target, styleFormat, component, styles, imports };
  }

  /**
   * Generate React component
   */
  private generateReactComponent(specs: ElementSpec[], styleFormat: StyleFormat): string {
    const componentName = 'DesignComponent';
    const useModule = styleFormat === 'css-modules';
    const useTailwind = styleFormat === 'tailwind';
    const useStyled = styleFormat === 'styled-components';

    let jsx = specs.map(spec => {
      const className = useTailwind
        ? this.getTailwindClasses(spec)
        : useModule
        ? `{styles.${toCamelCase(spec.name)}}`
        : `"${toCamelCase(spec.name)}"`;

      if (spec.type === 'text') {
        return `      <p className=${className}>{/* ${spec.name} */}</p>`;
      }
      return `      <div className=${className} />`;
    }).join('\n');

    if (useStyled) {
      return `import styled from 'styled-components';

${specs.map(spec => {
  const styledName = toPascalCase(spec.name);
  return `const ${styledName} = styled.${spec.type === 'text' ? 'p' : 'div'}\`
${this.getStyleProperties(spec).map(p => `  ${p}`).join('\n')}
\`;`;
}).join('\n\n')}

const ${componentName} = () => {
  return (
    <div>
${specs.map(spec => `      <${toPascalCase(spec.name)} />`).join('\n')}
    </div>
  );
};

export default ${componentName};`;
    }

    return `const ${componentName} = () => {
  return (
    <div className="design-container">
${jsx}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Generate Vue component
   */
  private generateVueComponent(specs: ElementSpec[], styleFormat: StyleFormat): string {
    const useTailwind = styleFormat === 'tailwind';

    const template = specs.map(spec => {
      const className = useTailwind
        ? this.getTailwindClasses(spec)
        : toCamelCase(spec.name);

      if (spec.type === 'text') {
        return `    <p class="${className}"><!-- ${spec.name} --></p>`;
      }
      return `    <div class="${className}" />`;
    }).join('\n');

    return `<template>
  <div class="design-container">
${template}
  </div>
</template>

<script setup>
// Component logic here
</script>

<style scoped>
${this.generateStyles(specs, styleFormat === 'tailwind' ? 'css' : styleFormat)}
</style>`;
  }

  /**
   * Generate HTML component
   */
  private generateHtmlComponent(specs: ElementSpec[]): string {
    const elements = specs.map(spec => {
      const className = toCamelCase(spec.name);
      if (spec.type === 'text') {
        return `  <p class="${className}"><!-- ${spec.name} --></p>`;
      }
      return `  <div class="${className}"></div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <title>Design Component</title>
</head>
<body>
  <div class="design-container">
${elements}
  </div>
</body>
</html>`;
  }

  /**
   * Generate SwiftUI component
   */
  private generateSwiftUIComponent(specs: ElementSpec[]): string {
    const views = specs.map(spec => {
      if (spec.type === 'text') {
        return `            Text("${spec.name}")
                .font(.system(size: ${spec.typography?.fontSize || 16}))
                .foregroundColor(Color(hex: "${spec.typography?.color || '#000000'}"))
                .frame(width: ${spec.size.width}, height: ${spec.size.height})
                .position(x: ${spec.position.x + spec.size.width / 2}, y: ${spec.position.y + spec.size.height / 2})`;
      }
      return `            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: ${spec.size.width}, height: ${spec.size.height})
                .position(x: ${spec.position.x + spec.size.width / 2}, y: ${spec.position.y + spec.size.height / 2})`;
    }).join('\n');

    return `import SwiftUI

struct DesignView: View {
    var body: some View {
        ZStack {
${views}
        }
    }
}

struct DesignView_Previews: PreviewProvider {
    static var previews: some View {
        DesignView()
    }
}`;
  }

  /**
   * Generate Flutter component
   */
  private generateFlutterComponent(specs: ElementSpec[]): string {
    const widgets = specs.map(spec => {
      if (spec.type === 'text') {
        return `          Positioned(
            left: ${spec.position.x},
            top: ${spec.position.y},
            child: Text(
              '${spec.name}',
              style: TextStyle(
                fontSize: ${spec.typography?.fontSize || 16},
                color: Color(0xFF${(spec.typography?.color || '#000000').slice(1)}),
              ),
            ),
          ),`;
      }
      return `          Positioned(
            left: ${spec.position.x},
            top: ${spec.position.y},
            child: Container(
              width: ${spec.size.width},
              height: ${spec.size.height},
              color: Colors.grey.withOpacity(0.2),
            ),
          ),`;
    }).join('\n');

    return `import 'package:flutter/material.dart';

class DesignWidget extends StatelessWidget {
  const DesignWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
${widgets}
      ],
    );
  }
}`;
  }

  /**
   * Generate styles
   */
  private generateStyles(specs: ElementSpec[], format: StyleFormat): string {
    if (format === 'tailwind') {
      return '/* Tailwind classes are applied inline */';
    }

    const isScss = format === 'scss';
    const isModule = format === 'css-modules';

    const styles = specs.map(spec => {
      const className = isModule
        ? `.${toCamelCase(spec.name)}`
        : `.${toCamelCase(spec.name)}`;

      const properties = this.getStyleProperties(spec);

      return `${className} {
${properties.map(p => `  ${p}`).join('\n')}
}`;
    }).join('\n\n');

    return `.design-container {
  position: relative;
  width: 100%;
}

${styles}`;
  }

  /**
   * Get CSS properties for a spec
   */
  private getStyleProperties(spec: ElementSpec): string[] {
    const props: string[] = [];

    props.push('position: absolute;');
    props.push(`left: ${spec.position.x}px;`);
    props.push(`top: ${spec.position.y}px;`);
    props.push(`width: ${spec.size.width}px;`);
    props.push(`height: ${spec.size.height}px;`);

    if (spec.typography) {
      props.push(`font-family: ${spec.typography.fontFamily};`);
      props.push(`font-size: ${spec.typography.fontSize}px;`);
      props.push(`font-weight: ${spec.typography.fontWeight};`);
      props.push(`line-height: ${spec.typography.lineHeight};`);
      props.push(`color: ${spec.typography.color};`);
    }

    if (spec.border?.radius) {
      const radius = typeof spec.border.radius === 'number'
        ? `${spec.border.radius}px`
        : `${spec.border.radius.tl}px ${spec.border.radius.tr}px ${spec.border.radius.br}px ${spec.border.radius.bl}px`;
      props.push(`border-radius: ${radius};`);
    }

    if (spec.transform) {
      const transforms: string[] = [];
      if (spec.transform.rotation) transforms.push(`rotate(${spec.transform.rotation}deg)`);
      if (spec.transform.skewX) transforms.push(`skewX(${spec.transform.skewX}deg)`);
      if (spec.transform.skewY) transforms.push(`skewY(${spec.transform.skewY}deg)`);
      if (transforms.length) props.push(`transform: ${transforms.join(' ')};`);
    }

    return props;
  }

  /**
   * Get Tailwind classes for a spec
   */
  private getTailwindClasses(spec: ElementSpec): string {
    const classes: string[] = ['absolute'];

    // Position (would need custom values in real usage)
    classes.push(`left-[${spec.position.x}px]`);
    classes.push(`top-[${spec.position.y}px]`);

    // Size
    classes.push(`w-[${spec.size.width}px]`);
    classes.push(`h-[${spec.size.height}px]`);

    // Typography
    if (spec.typography) {
      const fontSize = this.getFontSizeName(spec.typography.fontSize);
      classes.push(fontSize);
      classes.push('font-bold');
    }

    // Border radius
    if (spec.border?.radius) {
      if (spec.border.radius >= 9999) {
        classes.push('rounded-full');
      } else if (spec.border.radius >= 24) {
        classes.push('rounded-3xl');
      } else {
        classes.push('rounded-lg');
      }
    }

    return classes.join(' ');
  }

  /**
   * Generate React imports
   */
  private generateReactImports(styleFormat: StyleFormat): string {
    switch (styleFormat) {
      case 'css-modules':
        return "import styles from './DesignComponent.module.css';";
      case 'styled-components':
        return "import styled from 'styled-components';";
      default:
        return "import './DesignComponent.css';";
    }
  }

  // ============================================================================
  // MEASUREMENTS
  // ============================================================================

  /**
   * Calculate distance between two elements
   */
  calculateDistance(
    elementA: DesignElement,
    elementB: DesignElement
  ): MeasurementOverlay[] {
    const measurements: MeasurementOverlay[] = [];

    // Horizontal distance
    const hDistance = elementB.x - (elementA.x + elementA.width);
    if (hDistance >= 0) {
      measurements.push({
        sourceId: elementA.id,
        targetId: elementB.id,
        type: 'horizontal',
        value: hDistance,
        unit: 'px',
        startPoint: { x: elementA.x + elementA.width, y: elementA.y + elementA.height / 2 },
        endPoint: { x: elementB.x, y: elementB.y + elementB.height / 2 }
      });
    }

    // Vertical distance
    const vDistance = elementB.y - (elementA.y + elementA.height);
    if (vDistance >= 0) {
      measurements.push({
        sourceId: elementA.id,
        targetId: elementB.id,
        type: 'vertical',
        value: vDistance,
        unit: 'px',
        startPoint: { x: elementA.x + elementA.width / 2, y: elementA.y + elementA.height },
        endPoint: { x: elementB.x + elementB.width / 2, y: elementB.y }
      });
    }

    return measurements;
  }

  /**
   * Generate distance to canvas edges
   */
  getEdgeDistances(
    element: DesignElement,
    canvasSize: { width: number; height: number }
  ): MeasurementOverlay[] {
    return [
      {
        sourceId: element.id,
        type: 'horizontal',
        value: element.x,
        unit: 'px',
        startPoint: { x: 0, y: element.y + element.height / 2 },
        endPoint: { x: element.x, y: element.y + element.height / 2 }
      },
      {
        sourceId: element.id,
        type: 'horizontal',
        value: canvasSize.width - (element.x + element.width),
        unit: 'px',
        startPoint: { x: element.x + element.width, y: element.y + element.height / 2 },
        endPoint: { x: canvasSize.width, y: element.y + element.height / 2 }
      },
      {
        sourceId: element.id,
        type: 'vertical',
        value: element.y,
        unit: 'px',
        startPoint: { x: element.x + element.width / 2, y: 0 },
        endPoint: { x: element.x + element.width / 2, y: element.y }
      },
      {
        sourceId: element.id,
        type: 'vertical',
        value: canvasSize.height - (element.y + element.height),
        unit: 'px',
        startPoint: { x: element.x + element.width / 2, y: element.y + element.height },
        endPoint: { x: element.x + element.width / 2, y: canvasSize.height }
      }
    ];
  }

  // ============================================================================
  // CODE SNIPPETS
  // ============================================================================

  /**
   * Get all code snippets for an element
   */
  getCodeSnippets(element: DesignElement): CodeSnippet[] {
    const spec = this.extractElementSpec(element);

    return [
      {
        language: 'css',
        label: 'CSS',
        icon: 'fab fa-css3-alt',
        code: this.getStyleProperties(spec).join('\n')
      },
      {
        language: 'tailwind',
        label: 'Tailwind',
        icon: 'fab fa-css3',
        code: this.getTailwindClasses(spec)
      },
      {
        language: 'react',
        label: 'React',
        icon: 'fab fa-react',
        code: this.generateSingleReactElement(spec)
      },
      {
        language: 'swift',
        label: 'SwiftUI',
        icon: 'fab fa-swift',
        code: this.generateSingleSwiftElement(spec)
      }
    ];
  }

  private generateSingleReactElement(spec: ElementSpec): string {
    if (spec.type === 'text') {
      return `<p style={{
  position: 'absolute',
  left: ${spec.position.x},
  top: ${spec.position.y},
  fontSize: ${spec.typography?.fontSize || 16},
  fontWeight: ${spec.typography?.fontWeight || 400},
  color: '${spec.typography?.color || '#000'}',
}}>
  {/* ${spec.name} */}
</p>`;
    }
    return `<div style={{
  position: 'absolute',
  left: ${spec.position.x},
  top: ${spec.position.y},
  width: ${spec.size.width},
  height: ${spec.size.height},
}} />`;
  }

  private generateSingleSwiftElement(spec: ElementSpec): string {
    if (spec.type === 'text') {
      return `Text("${spec.name}")
  .font(.system(size: ${spec.typography?.fontSize || 16}))
  .position(x: ${spec.position.x}, y: ${spec.position.y})`;
    }
    return `Rectangle()
  .frame(width: ${spec.size.width}, height: ${spec.size.height})
  .position(x: ${spec.position.x}, y: ${spec.position.y})`;
  }

  // ============================================================================
  // HANDOFF PACKAGE
  // ============================================================================

  /**
   * Create complete handoff package
   */
  createHandoffPackage(
    elements: DesignElement[],
    canvasSize: { width: number; height: number },
    name: string = 'Design Handoff'
  ): HandoffPackage {
    return {
      id: generateHandoffId(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: elements.map(el => this.extractElementSpec(el)),
      tokens: this.extractTokens(elements),
      colors: this.extractColors(elements),
      typography: this.extractTypography(elements),
      spacing: [],
      canvasSize,
      totalElements: elements.length
    };
  }

  /**
   * Export handoff package as JSON
   */
  exportPackage(pkg: HandoffPackage): string {
    return JSON.stringify(pkg, null, 2);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const handoffManager = new HandoffManager();
