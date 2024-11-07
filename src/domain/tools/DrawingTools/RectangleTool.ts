// src/domain/tools/RectangleTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Rectangle } from '../../entities/Rectangle';
import { Point } from '../../entities/Point';

export class RectangleTool extends AbstractDrawingTool {
  private currentRectangle: Rectangle | null = null;
  private startPoint: Point | null = null;
  private tempEndPoint: Point | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const { x, y } = this.getWorldPosition(event);

    if (!this.isDrawing) {
      // First click: set the starting point
      this.isDrawing = true;
      this.startPoint = this.createAndAddPoint(x, y);

      this.currentRectangle = new Rectangle(this.renderer, x, y);
      this.currentRectangle.setColor(color);
      this.entityManager.addEntity(this.currentRectangle);
    } else {
      // Second click: finalize the rectangle
      this.finishDrawing(x, y);
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentRectangle) {
      const { x, y } = this.getWorldPosition(event);

      // Update the rectangle's end point
      this.currentRectangle.updateEndPoint(x, y);

      // Update the temporary end point
      if (this.tempEndPoint) {
        this.tempEndPoint.setX(x);
        this.tempEndPoint.setY(y);
      } else {
        this.tempEndPoint = this.createAndAddPoint(x, y);
      }
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (this.isDrawing) {
      if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
        this.finishDrawing();
      }
    }
  }

  private finishDrawing(x?: number, y?: number): void {
    if (this.currentRectangle) {
      if (x !== undefined && y !== undefined) {
        // Finalize the rectangle's end point with provided coordinates
        this.currentRectangle.updateEndPoint(x, y);
      } else if (this.tempEndPoint) {
        // Finalize using tempEndPoint's coordinates
        x = this.tempEndPoint.getX();
        y = this.tempEndPoint.getY();
        this.currentRectangle.updateEndPoint(x, y);
      }

      // Remove the temporary end point
      if (this.tempEndPoint) {
        this.entityManager.removeEntity(this.tempEndPoint);
        this.tempEndPoint = null;
      }
    }
    this.isDrawing = false;
    this.startPoint = null;
    this.currentRectangle = null;
    this.points = [];
  }

  public cancel(): void {
    super.cancel();

    if (this.currentRectangle) {
      this.entityManager.removeEntity(this.currentRectangle);
      this.currentRectangle = null;
    }
    if (this.tempEndPoint) {
      this.entityManager.removeEntity(this.tempEndPoint);
      this.tempEndPoint = null;
    }
    if (this.startPoint) this.entityManager.removeEntity(this.startPoint);
    this.startPoint = null;
  }

  getStartPoint() {
    return this.startPoint;
  }
}
