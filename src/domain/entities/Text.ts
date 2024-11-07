// src/domain/entities/Text.ts

import { RenderableText } from './RenderableText';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Text extends RenderableText {
  constructor(
    renderer: Renderer,
    text: string,
    x: number,
    y: number,
    fontSize: number = 32,
    resolutionScale: number = 2 // Default resolution scale
  ) {
    super(renderer, text, x, y, fontSize, resolutionScale);
    // Additional initialization or overrides if needed
  }

  // Implement or override methods if necessary
}
