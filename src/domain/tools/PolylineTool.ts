import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Polyline } from '../entities/Polyline';
import { Point } from '../entities/Point';
import { ConstraintManager } from '../managers/ConstraintManager';
import { OrthogonalConstraint } from '../constraints/OrthogonalConstraint';

export class PolylineTool implements Tool {
  private isDrawing = false;
  private currentPolyline: Polyline | null = null;
  private constraintManager: ConstraintManager;
  private isOrthoConstraintActive = false;
  private tempLastPointPosition!: { x: number, y: number };

  constructor(
    private entityManager: EntityManager,
    private renderer: Renderer

  ) {
    this.constraintManager = new ConstraintManager();
  }

  public onLeftclick(event: MouseEvent): void {
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    let worldPosition = this.renderer.screenToWorld(x, y);

    if (this.constraintManager.hasConstraints() && this.isDrawing && this.currentPolyline) {
      worldPosition = this.applyOrthogonalConstraint(worldPosition, this.tempLastPointPosition);
    }


    const newPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
    this.entityManager.addEntity(newPoint);

    if (!this.isDrawing) {
      this.isDrawing = true;

      const polyline = new Polyline(this.renderer);
      polyline.addPoint(newPoint);

      this.entityManager.addEntity(polyline);

      this.currentPolyline = polyline;
    } else {
      if (!this.currentPolyline) throw new Error('Current Polyline is null')
      this.currentPolyline.addPoint(newPoint);
    }

    this.tempLastPointPosition = worldPosition;
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentPolyline) {
      const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;

      let worldPosition = this.renderer.screenToWorld(x, y);

      if (this.isOrthoConstraintActive) {
        // const lastPointPosition = this.getLastPointPosition();
        worldPosition = this.applyOrthogonalConstraint(worldPosition, this.tempLastPointPosition);
      }

      this.currentPolyline.updateLastPoint(worldPosition.x, worldPosition.y);
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up for this tool
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDrawing) {
      if (event.key === 'Escape') {
        if (this.currentPolyline) {
          this.entityManager.removeEntity(this.currentPolyline);
          for (const point of this.currentPolyline.getPoints()) {
            this.entityManager.removeEntity(point);
          }
          this.currentPolyline = null;
        }
        this.isDrawing = false;
      } else if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
        this.currentPolyline?.removeLastLine();
        this.isDrawing = false;
        this.currentPolyline = null;
      }
      else if (event.key === 'Shift') {
        // Toggle orthogonal constraint
        this.isOrthoConstraintActive = !this.isOrthoConstraintActive;

        if (this.isOrthoConstraintActive) {
          // Activate orthogonal constraint
          this.constraintManager.addConstraint(new OrthogonalConstraint());
        } else {
          // Deactivate orthogonal constraint
          this.constraintManager.clearConstraints();
        }
      }
    }
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

  private getLastPointPosition(): { x: number; y: number } {
    const points = this.currentPolyline!.getPoints();
    const lastPoint = points[points.length - 1];
    return { x: lastPoint.getX(), y: lastPoint.getY() };
  }
}
