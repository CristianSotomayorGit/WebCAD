// src/domain/tools/PolylineTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Polyline } from '../entities/Polyline';
import { Point } from '../entities/Point';

export class PolylineTool extends AbstractDrawingTool {
  private currentPolyline: Polyline | null = null;
  private tempPoint: Point | null = null; // Temporary point for dynamic feedback
  private isOrthoConstraintActive = false;

  public onLeftClick(event: MouseEvent): void {
    const worldPosition = this.getWorldPosition(event);

    let adjustedPosition = worldPosition;
    if (this.isOrthoConstraintActive && this.isDrawing && this.tempPoint) {
      const referencePoint = this.tempPoint;
      adjustedPosition = this.applyOrthogonalConstraint(worldPosition, {
        x: referencePoint.getX(),
        y: referencePoint.getY(),
      });
    }

    const newPoint = this.createAndAddPoint(adjustedPosition.x, adjustedPosition.y);

    if (!this.isDrawing) {
      this.isDrawing = true;

      this.currentPolyline = new Polyline(this.renderer);
      this.currentPolyline.addPoint(newPoint);
      this.entityManager.addEntity(this.currentPolyline);

      // Create a temporary point for dynamic feedback
      this.tempPoint = this.createAndAddPoint(adjustedPosition.x, adjustedPosition.y);
      this.currentPolyline.addPoint(this.tempPoint);
    } else {
      if (this.currentPolyline && this.tempPoint) {
        // Replace the temporary point with the new fixed point
        this.currentPolyline.removePoint(this.tempPoint);
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint = null;

        this.currentPolyline.addPoint(newPoint);

        // Create a new temporary point for the next segment
        this.tempPoint = this.createAndAddPoint(adjustedPosition.x, adjustedPosition.y);
        this.currentPolyline.addPoint(this.tempPoint);
      }
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentPolyline && this.tempPoint) {
      const worldPosition = this.getWorldPosition(event);

      let adjustedPosition = worldPosition;
      if (this.isOrthoConstraintActive && this.currentPolyline.getPoints().length > 1) {
        const lastFixedPoint = this.currentPolyline.getPoints()[this.currentPolyline.getPoints().length - 2];
        adjustedPosition = this.applyOrthogonalConstraint(worldPosition, {
          x: lastFixedPoint.getX(),
          y: lastFixedPoint.getY(),
        });
      }

      // Update the position of the temporary point
      this.tempPoint.setX(adjustedPosition.x);
      this.tempPoint.setY(adjustedPosition.y);

      // Update the last line's vertex buffer
      const lastLine = this.currentPolyline['lines'][this.currentPolyline['lines'].length - 1];
      lastLine.updateVertexBuffer();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (this.isDrawing) {
      if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
        this.finishDrawing();
      } else if (event.key === 'Shift') {
        // Toggle orthogonal constraint
        this.isOrthoConstraintActive = !this.isOrthoConstraintActive;
      }
    }
  }

  protected cancelDrawing(): void {
    super.cancelDrawing();

    if (this.currentPolyline) {
      this.entityManager.removeEntity(this.currentPolyline);
      // Remove associated points
      for (const point of this.currentPolyline.getPoints()) {
        this.entityManager.removeEntity(point);
      }
      this.currentPolyline = null;
    }

    if (this.tempPoint) {
      this.entityManager.removeEntity(this.tempPoint);
      this.tempPoint = null;
    }

    this.isOrthoConstraintActive = false;
  }

  private finishDrawing(): void {
    if (this.currentPolyline) {
      if (this.tempPoint) {
        // Remove the temporary point from the polyline
        this.currentPolyline.removePoint(this.tempPoint);
        this.entityManager.removeEntity(this.tempPoint);
        this.tempPoint = null;
      }
      this.currentPolyline = null;
    }
    this.isDrawing = false;
    this.isOrthoConstraintActive = false;
    this.points = [];
  }

  private applyOrthogonalConstraint(
    currentPoint: { x: number; y: number },
    referencePoint: { x: number; y: number }
  ): { x: number; y: number } {
    const deltaX = Math.abs(currentPoint.x - referencePoint.x);
    const deltaY = Math.abs(currentPoint.y - referencePoint.y);

    if (deltaX > deltaY) {
      // Constrain to horizontal line
      return { x: currentPoint.x, y: referencePoint.y };
    } else {
      // Constrain to vertical line
      return { x: referencePoint.x, y: currentPoint.y };
    }
  }
}
