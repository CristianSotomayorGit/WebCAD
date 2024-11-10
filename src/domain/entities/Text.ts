// src/domain/entities/Text.ts

import { RenderableText } from './RenderableText';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Text extends RenderableText {
  public cursorIndex: number = 0;

  constructor(
    renderer: Renderer,
    text: string,
    x: number,
    y: number,
    fontFamily: string,
    fontSize: number = 12,
    resolutionScale: number = 2,
    color: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0]) // Default white color
  ) {
    super(renderer, text, x, y, fontFamily, fontSize, resolutionScale, color);
  }

  /**
   * Dynamically updates the text content.
   * This method overrides the base setText for additional functionality if needed.
   */
  public updateText(newText: string): void {
    this.text = newText;
    // Do not modify cursorIndex here
    this.createTextTexture();
    this.createBuffers();
  }

  /**
   * Updates the text color dynamically.
   */
  public updateColor(newColor: Float32Array): void {
    this.setColor(newColor); // Call the base method to update the color
  }
}
