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
    resolutionScale: number = 2,
    color: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0]) // Default color is white
  ) {
    super(renderer, text, x, y, fontSize, resolutionScale, color);
  }
}
