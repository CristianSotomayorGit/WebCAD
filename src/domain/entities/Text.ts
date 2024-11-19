// src/domain/entities/Text.ts

import { RenderableText } from './RenderableText';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from './Point';

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

  public updateText(newText: string): void {
    this.text = newText;
    // Do not modify cursorIndex here
    this.createTextTexture();
    this.createBuffers();
  }

  public updateColor(newColor: Float32Array): void {
    this.setColor(newColor); 
  }

  public addPoint(point: Point): void {
    this.points.push(point);
  }
}
