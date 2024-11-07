// src/domain/entities/Text.ts

import { RenderableText } from './RenderableText';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Text extends RenderableText {
  constructor(renderer: Renderer, text: string, x: number, y: number, fontSize: number = 32) {
    super(renderer, text, x, y, fontSize);
    // Additional initialization or overrides if needed
  }

  // Implement or override methods if necessary
}
