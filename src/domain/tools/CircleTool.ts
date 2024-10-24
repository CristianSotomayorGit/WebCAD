// src/domain/tools/CircleTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Circle } from '../entities/Circle';
import { Point } from '../entities/Point';

export class CircleTool implements Tool {
  private isDrawing = false;
  private centerPoint: { x: number; y: number } | null = null;
  private currentCircle: Circle | null = null;
  private temporaryPoint: Point | null = null;

  constructor(
    private entityManager: EntityManager,
    private renderer: Renderer
  ) { }

  public onLeftclick(event: MouseEvent): void {

    console.log('niggaszzzzzzzzz')
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    const worldPosition = this.renderer.screenToWorld(x, y);

    if (!this.isDrawing) {
      // Start drawing
      this.centerPoint = worldPosition;
      this.isDrawing = true;

      // Create a circle with zero radius
      this.currentCircle = new Circle(this.centerPoint, 0, this.renderer);
      this.entityManager.addEntity(this.currentCircle);

      // Create and add the center point
      const center = new Point(this.centerPoint.x, this.centerPoint.y, this.renderer);
      this.entityManager.addEntity(center);
    } else {
      // Finish drawing
      this.isDrawing = false;
      this.centerPoint = null;
      this.currentCircle = null;

      // Remove the temporary point
      if (this.temporaryPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryPoint);
        this.temporaryPoint = null;
      }
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentCircle && this.centerPoint) {
      const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;
      const worldPosition = this.renderer.screenToWorld(x, y);

      // Calculate radius
      const dx = worldPosition.x - this.centerPoint.x;
      const dy = worldPosition.y - this.centerPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      // Update circle radius
      this.currentCircle.updateRadius(radius);

      // Update temporary point (edge of the circle)
      if (this.temporaryPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryPoint);
      }
      this.temporaryPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.entityManager.addTemporaryEntity(this.temporaryPoint);
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isDrawing) {
      // Cancel drawing
      if (this.currentCircle) {
        this.entityManager.removeEntity(this.currentCircle);
        this.currentCircle = null;
      }
      if (this.temporaryPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryPoint);
        this.temporaryPoint = null;
      }
      this.isDrawing = false;
      this.centerPoint = null;
    }
  }
}
