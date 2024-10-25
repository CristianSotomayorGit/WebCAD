// src/domain/entities/Polyline.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from './Line';
import { Point } from './Point';

export class Polyline {
  private lines: Line[] = [];
  private renderer: Renderer;
  private points: Point[] = [];

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  public addPoint(point: Point): void {
    this.points.push(point);
    if (this.points.length > 1) {
      const startPoint = this.points[this.points.length - 2];
      const endPoint = point;
      const newLine = new Line(startPoint, endPoint, this.renderer);
      this.lines.push(newLine);
    }
  }

  public removePoint(point: Point): void {
    const index = this.points.indexOf(point);
    if (index !== -1) {
      this.points.splice(index, 1);
      // Remove associated lines
      if (index > 0) {
        // Remove line connecting to this point
        this.lines.splice(index - 1, 1);
      }
      if (index < this.lines.length) {
        // Update the start point of the next line
        if (index === 0 && this.points.length > 0) {
          this.lines[0].setStartPoint(this.points[0]);
        } else if (index > 0 && index < this.points.length) {
          this.lines[index - 1].setEndPoint(this.points[index]);
        }
      }
    }
  }

  public updateLastPoint(x: number, y: number): void {
    if (this.points.length > 0) {
      const lastPoint = this.points[this.points.length - 1];
      lastPoint.setX(x);
      lastPoint.setY(y);
      if (this.lines.length > 0) {
        const lastLine = this.lines[this.lines.length - 1];
        lastLine.updateVertexBuffer();
      }
    }
  }

  public getPoints(): Point[] {
    return this.points;
  }

  public removeLastLine(): void {
    if (this.lines.length > 0) {
      this.lines.pop();
    }
    if (this.points.length > 0) {
      this.points.pop();
    }
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    for (const line of this.lines) {
      line.draw(renderPass);
    }
  }
}
