// src/domain/entities/Polyline.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from './Line';
import { Point } from './Point';

export class Polyline {
  private lines: Line[] = [];
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  public addPoint(point: Point): void {
    if (this.lines.length === 0) {
      const line = new Line(point, point, this.renderer);
      this.lines.push(line);
    } else {
      const lastLine = this.lines[this.lines.length - 1];
      const newLine = new Line(lastLine.getEndpoint(), point, this.renderer);
      this.lines.push(newLine);
    }
  }

  public updateLastPoint(x: number, y: number): void {
    if (this.lines.length > 0) {
      const lastLine = this.lines[this.lines.length - 1];
      const endPoint = lastLine.getEndpoint();
      endPoint.setX(x);
      endPoint.setY(y);
      lastLine.setEndPoint(endPoint);
    }
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    for (const line of this.lines) {
      line.draw(renderPass);
    }
  }

  public getLines(): Line[] {
    return this.lines;
  }

  public getPoints(): Point[] {
    const points: Point[] = [];
    if (this.lines.length > 0) {
      points.push(this.lines[0].getStartpoint());
      for (const line of this.lines) {
        points.push(line.getEndpoint());
      }
    }
    return points;
  }
}
