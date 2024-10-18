// src/domain/tools/SplineTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Spline } from '../entities/Spline';
import { Point } from '../entities/Point';

export class SplineTool implements Tool {
  private isDrawing = false;
  private currentSpline: Spline | null = null;
  private renderer: Renderer;
  private entityManager: EntityManager;
  private tempPoint: Point | null = null;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  public onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      const { x, y } = this.getWorldPosition(event);

      // Remove the temporary point if it exists
      if (this.tempPoint) {
        this.currentSpline!.getControlPoints().pop();
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint = null;
      }

      const newPoint = new Point(x, y, this.renderer);
      this.entityManager.addEntity(newPoint);

      if (!this.isDrawing) {
        this.isDrawing = true;
        this.currentSpline = new Spline(this.renderer);
        this.currentSpline.addControlPoint(newPoint);
        this.entityManager.addEntity(this.currentSpline);
      } else {
        this.currentSpline!.addControlPoint(newPoint);
      }

      // Add a new temporary point for dynamic feedback
      this.tempPoint = new Point(x, y, this.renderer);
      this.currentSpline!.addControlPoint(this.tempPoint);
    }
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

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDrawing) {
      if (event.key === 'Escape') {
        // Cancel drawing
        this.cancelDrawing();
      } else if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
        // Finish drawing
        this.finishDrawing();
      }
    }
  }

  private getWorldPosition(event: MouseEvent): { x: number; y: number } {
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const screenX = event.clientX - canvasRect.left;
    const screenY = event.clientY - canvasRect.top;
    return this.renderer.screenToWorld(screenX, screenY);
  }

  private cancelDrawing(): void {
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
    this.isDrawing = false;
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
  }
}
