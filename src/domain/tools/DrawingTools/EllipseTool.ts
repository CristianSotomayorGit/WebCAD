// src/domain/tools/EllipseTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Ellipse } from '../../entities/Ellipse';
import { Point } from '../../entities/Point';

export class EllipseTool extends AbstractDrawingTool {
  private currentEllipse: Ellipse | null = null;
  private centerPoint: Point | null = null;
  private edgePoint: Point | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const worldPosition = this.getWorldPosition(event);

    if (!this.isDrawing) {
      this.isDrawing = true;

      // Set the center point of the ellipse
      this.centerPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.entityManager.addEntity(this.centerPoint);

      // Create an initial ellipse with zero radii
      this.currentEllipse = new Ellipse(this.renderer, worldPosition.x, worldPosition.y, 0, 0);
      this.currentEllipse.setColor(color);
      this.entityManager.addEntity(this.currentEllipse);
    } else if (this.isDrawing && this.centerPoint) {
      // Finalize the ellipse
      this.isDrawing = false;

      if (this.edgePoint) {
        this.entityManager.removeEntity(this.edgePoint);
        this.edgePoint.dispose();
        this.edgePoint = null;
      }

      this.centerPoint = null;
      this.currentEllipse = null;
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.centerPoint && this.currentEllipse) {
      const worldPosition = this.getWorldPosition(event);

      const radiusX = Math.abs(worldPosition.x - this.centerPoint.getX());
      const radiusY = Math.abs(worldPosition.y - this.centerPoint.getY());

      this.currentEllipse.updateRadii(radiusX, radiusY);

      if (!this.edgePoint) {
        this.edgePoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
        this.entityManager.addEntity(this.edgePoint);
      } else {
        this.edgePoint.setX(worldPosition.x);
        this.edgePoint.setY(worldPosition.y);
      }
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (this.isDrawing && (event.key === 'Escape' || event.key === 'Esc')) {
      this.cancelDrawing();
    }
  }

  protected cancelDrawing(): void {
    super.cancelDrawing();

    if (this.currentEllipse) {
      this.entityManager.removeEntity(this.currentEllipse);
      this.currentEllipse.dispose();
      this.currentEllipse = null;
    }

    if (this.centerPoint) {
      this.entityManager.removeEntity(this.centerPoint);
      this.centerPoint.dispose();
      this.centerPoint = null;
    }

    if (this.edgePoint) {
      this.entityManager.removeEntity(this.edgePoint);
      this.edgePoint.dispose();
      this.edgePoint = null;
    }

    this.isDrawing = false;
  }
}
