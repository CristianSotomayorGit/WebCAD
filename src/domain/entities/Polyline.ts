import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from './Line';
import { Point } from './Point';

export class Polyline {
  private lines: Line[] = [];
  private renderer: Renderer;
  private firstPoint: Point | null = null;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  public addPoint(point: Point): void {
    if (!this.firstPoint) {
      this.firstPoint = point;
    } else {
      const lastPoint = this.lines.length === 0 ? this.firstPoint : this.lines[this.lines.length - 1].getEndpoint();
      const newLine = new Line(lastPoint, point, this.renderer);
      this.lines.push(newLine);
    }
  }

  public updateLastPoint(x: number, y: number): void {
    if (this.lines.length === 0 && this.firstPoint) {
      // Create the first line when moving the mouse to get the second point
      const endPoint = new Point(x, y, this.renderer);
      const newLine = new Line(this.firstPoint, endPoint, this.renderer);
      this.lines.push(newLine);
    } else if (this.lines.length > 0) {
      const lastLine = this.lines[this.lines.length - 1];
      const endPoint = lastLine.getEndpoint();
      endPoint.setX(x);
      endPoint.setY(y);
      lastLine.setEndPoint(endPoint);
    }
  }

  public getLastPointPosition(): { x: number; y: number } {
    if (this.lines.length === 0 && this.firstPoint) {
      return { x: this.firstPoint.getX(), y: this.firstPoint.getY() };
    } else if (this.lines.length > 0) {
      const lastLine = this.lines[this.lines.length - 1];
      const endPoint = lastLine.getEndpoint();
      return { x: endPoint.getX(), y: endPoint.getY() };
    } else {
      throw new Error('No points in polyline');
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
    if (this.firstPoint) {
      points.push(this.firstPoint);
    }
    for (const line of this.lines) {
      points.push(line.getEndpoint());
    }
    return points;
  }

  public removeLastLine() {
    this.lines.pop();
  }
}
