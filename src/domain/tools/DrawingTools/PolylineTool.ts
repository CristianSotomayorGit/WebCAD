// src/domain/tools/PolylineTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Polyline } from '../../entities/Polyline';
import { Point } from '../../entities/Point';

export class PolylineTool extends AbstractDrawingTool {
  private currentPolyline: Polyline | null = null;
  private tempPoints: Point[] = [];
  private tempPoint: Point | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const worldPosition = this.getWorldPosition(event);

    const newPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
    this.tempPoints.push(newPoint);

    if (!this.isDrawing) {
      this.isDrawing = true;

      this.currentPolyline = new Polyline(this.renderer);
      this.currentPolyline.setColor(color)
      this.entityManager.addEntity(this.currentPolyline);

      this.currentPolyline.addPoint(newPoint);

      this.tempPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
      this.currentPolyline.addPoint(this.tempPoint);
    } else {
      if (this.currentPolyline && this.tempPoint) {
        this.currentPolyline.removePoint(this.tempPoint);
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint.dispose();
        this.tempPoint = null;

        this.currentPolyline.addPoint(newPoint);

        this.tempPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
        this.currentPolyline.addPoint(this.tempPoint);
      }
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentPolyline && this.tempPoint) {
      const worldPosition = this.getWorldPosition(event);

      this.tempPoint.setX(worldPosition.x);
      this.tempPoint.setY(worldPosition.y);

      this.currentPolyline.updateVertexBuffer();
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

  public cancel(): void {
    super.cancel();

    if (this.currentPolyline) {
      this.entityManager.removeEntity(this.currentPolyline);
      this.currentPolyline.dispose();
      this.currentPolyline = null;
    }

    if (this.tempPoint) {
      this.entityManager.removeEntity(this.tempPoint);
      this.tempPoint.dispose();
      this.tempPoint = null;
    }

    if (this.tempPoints.length < 0) {
      this.entityManager.removeEntity(this.tempPoints)
    }
  }

  private finishDrawing(): void {
    if (this.currentPolyline) {
      if (this.tempPoint) {
        this.currentPolyline.removePoint(this.tempPoint);
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint.dispose();
        this.tempPoint = null;
      }
      this.currentPolyline = null;
    }
    this.isDrawing = false;
  }
}
