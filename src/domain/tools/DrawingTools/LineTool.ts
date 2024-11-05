// src/domain/tools/LineTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Line } from '../../entities/Line';
import { Point } from '../../entities/Point';

export class LineTool extends AbstractDrawingTool {
  private startPoint: Point | null = null;
  private currentLine: Line | null = null;
  private temporaryEndPoint: Point | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const worldPosition = this.getWorldPosition(event);

    if (!this.isDrawing) {
      // Start drawing
      this.isDrawing = true;
      this.startPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);

      const endPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
      this.temporaryEndPoint = endPoint;

      this.currentLine = new Line(this.startPoint, endPoint, this.renderer);
      this.currentLine.setColor(color)
      this.entityManager.addEntity(this.currentLine);
    } else {
      // Finish drawing
      if (this.currentLine && this.startPoint) {
        const endPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
        this.currentLine.setEndPoint(endPoint);

        if (this.temporaryEndPoint) {
          this.entityManager.removeEntity(this.temporaryEndPoint);
          this.temporaryEndPoint = null;
        }

        this.currentLine = null;
      }
      this.isDrawing = false;
      this.startPoint = null;
      this.points = [];
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.currentLine || !this.startPoint) return;

    const worldPosition = this.getWorldPosition(event);

    if (this.temporaryEndPoint) {
      this.entityManager.removeEntity(this.temporaryEndPoint);
    }

    const endPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
    this.temporaryEndPoint = endPoint;
    this.currentLine.setEndPoint(endPoint);
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (event.key === 'Escape' && this.isDrawing) {

      this.cancelDrawing();
    }
  }

  public cancelDrawing(): void {
    super.cancelDrawing();

     // Cancel line drawing
     if (this.currentLine) {
      this.entityManager.removeEntity(this.currentLine);
      this.currentLine = null;
    }
    if (this.startPoint) {
      this.entityManager.removeEntity(this.startPoint);
      this.startPoint = null;
    }
    if (this.temporaryEndPoint) {
      this.entityManager.removeEntity(this.temporaryEndPoint);
      this.temporaryEndPoint = null;
    }
    
  }
}
