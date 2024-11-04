// src/domain/tools/SplineTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Spline } from '../../entities/Spline';
import { Point } from '../../entities/Point';

export class SplineTool extends AbstractDrawingTool {
  private currentSpline: Spline | null = null;
  private tempPoint: Point | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const { x, y } = this.getWorldPosition(event);

    // Remove the temporary point if it exists
    if (this.tempPoint) {
      this.currentSpline!.getControlPoints().pop();
      this.entityManager.removeEntity(this.tempPoint);
      this.tempPoint = null;
    }

    const newPoint = this.createAndAddPoint(x, y);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.currentSpline = new Spline(this.renderer);
      this.currentSpline.setColor(color);
      this.currentSpline.addControlPoint(newPoint);
      this.entityManager.addEntity(this.currentSpline);
    } else {
      this.currentSpline!.addControlPoint(newPoint);
    }

    // Add a new temporary point for dynamic feedback
    this.tempPoint = this.createAndAddPoint(x, y);
    this.currentSpline!.addControlPoint(this.tempPoint);
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentSpline && this.tempPoint) {
      const { x, y } = this.getWorldPosition(event);

      // Update the position of the temporary control point
      this.tempPoint.setX(x);
      this.tempPoint.setY(y);

      this.currentSpline.updateVertexBuffer();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (this.isDrawing) {
      if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
        // Finish drawing
        this.finishDrawing();
      }
    }
  }

  protected cancelDrawing(): void {
    super.cancelDrawing();

    if (this.currentSpline) {
      // Remove the temporary point if it exists
      if (this.tempPoint) {
        this.currentSpline.getControlPoints().pop();
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint = null;
      }

      // Remove the spline and its control points
      for (const point of this.currentSpline.getControlPoints()) {
        this.entityManager.removeEntity(point);
      }
      this.entityManager.removeEntity(this.currentSpline);

      this.currentSpline = null;
    }
  }

  private finishDrawing(): void {
    if (this.currentSpline) {
      // Remove the temporary point if it exists
      if (this.tempPoint) {
        this.currentSpline.getControlPoints().pop();
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint = null;
      }

      this.currentSpline.updateVertexBuffer();
      this.currentSpline = null;
    }
    this.isDrawing = false;
    this.points = [];
  }
}
