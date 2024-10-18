// src/domain/tools/RectangleTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Rectangle } from '../entities/Rectangle';
import { Point } from '../entities/Point';

export class RectangleTool implements Tool {
  private isDrawing = false;
  private currentRectangle: Rectangle | null = null;
  private renderer: Renderer;
  private entityManager: EntityManager;
  private startPoint: Point | null = null;
  private tempEndPoint: Point | null = null;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  public onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      const { x, y } = this.getWorldPosition(event);

      if (!this.isDrawing) {
        // First click: set the starting point
        this.isDrawing = true;
        this.startPoint = new Point(x, y, this.renderer);
        this.entityManager.addEntity(this.startPoint);

        this.currentRectangle = new Rectangle(this.renderer, x, y);
        this.entityManager.addEntity(this.currentRectangle);
      } else {
        // Second click: finalize the rectangle
        this.finishDrawing(x, y);
      }
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
        this.tempEndPoint = new Point(x, y, this.renderer);
        this.entityManager.addEntity(this.tempEndPoint);
      }
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDrawing) {
      if (event.key === 'Escape') {
        this.cancelDrawing();
      } else if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
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
    if (this.currentRectangle) {
      this.entityManager.removeEntity(this.currentRectangle);
      this.currentRectangle.dispose();
      this.currentRectangle = null;
    }
    if (this.startPoint) {
      this.entityManager.removeEntity(this.startPoint);
      this.startPoint.dispose();
      this.startPoint = null;
    }
    if (this.tempEndPoint) {
      this.entityManager.removeEntity(this.tempEndPoint);
      this.tempEndPoint.dispose();
      this.tempEndPoint = null;
    }
    this.isDrawing = false;
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
        this.tempEndPoint.dispose();
        this.tempEndPoint = null;
      }
    }
    this.isDrawing = false;
  }
}
