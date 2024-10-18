// LineTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
import { Point } from '../entities/Point';
import { ConstraintManager } from '../managers/ConstraintManager';
import { OrthogonalConstraint } from '../constraints/OrthogonalConstraint';

export class LineTool implements Tool {
  private isDrawing = false;
  private startVertex: { x: number; y: number } | null = null;
  private currentLine: Line | null = null;
  private temporaryEndPoint: Point | null = null;
  private constraintManager: ConstraintManager;
  private isOrthoConstraintActive = false;

  constructor(
    private entityManager: EntityManager,
    private renderer: Renderer
  ) {
    this.constraintManager = new ConstraintManager();
  }

  public onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;

      const worldPosition = this.renderer.screenToWorld(x, y);

      if (!this.isDrawing) {
        // Start drawing
        this.startVertex = worldPosition;
        this.isDrawing = true;

        const startPoint = new Point(
          this.startVertex.x,
          this.startVertex.y,
          this.renderer
        );

        const endPoint = new Point(
          worldPosition.x,
          worldPosition.y,
          this.renderer
        );

        const line = new Line(startPoint, endPoint, this.renderer);

        this.entityManager.addEntity(line);
        this.entityManager.addEntity(startPoint);

        this.currentLine = line;
      } else {
        // Finish drawing
        if (this.currentLine) {
          let endPointPosition = { x: worldPosition.x, y: worldPosition.y };

          // Apply constraints if any
          if (this.constraintManager.hasConstraints() && this.startVertex) {
            endPointPosition = this.constraintManager.applyConstraints(
              endPointPosition,
              this.startVertex
            );
          }

          const endpoint = new Point(
            endPointPosition.x,
            endPointPosition.y,
            this.renderer
          );

          this.currentLine.setEndPoint(endpoint);

          // Remove temporary endpoint
          if (this.temporaryEndPoint) {
            this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
            this.temporaryEndPoint = null;
          }

          // Add finalized endpoint as a permanent entity
          this.entityManager.addEntity(endpoint);

          this.currentLine = null;
        }
        this.isDrawing = false;
        this.startVertex = null;
      }
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentLine) {
      const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;
      const worldPosition = this.renderer.screenToWorld(x, y);

      let endPointPosition = { x: worldPosition.x, y: worldPosition.y };

      // Apply constraints if any
      if (this.constraintManager.hasConstraints() && this.startVertex) {
        endPointPosition = this.constraintManager.applyConstraints(
          endPointPosition,
          this.startVertex
        );
      }

      const endPoint = new Point(
        endPointPosition.x,
        endPointPosition.y,
        this.renderer
      );

      this.currentLine.setEndPoint(endPoint);

      // Update temporary endpoint entity
      if (this.temporaryEndPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
      }
      this.temporaryEndPoint = endPoint;
      this.entityManager.addTemporaryEntity(this.temporaryEndPoint);

      // Update temporary line entity
      this.entityManager.addTemporaryEntity(this.currentLine);
      this.entityManager.removeTemporaryEntity(this.currentLine);
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up for this tool
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isDrawing) {
      if (this.currentLine) {
        this.entityManager.removeEntity(this.currentLine);
        this.entityManager.removeEntity(this.currentLine.getStartpoint());
        this.currentLine = null;
      }
      if (this.temporaryEndPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
        this.temporaryEndPoint = null;
      }
      this.isDrawing = false;
      this.startVertex = null;
    } else if (event.key === 'Shift') {
      // Toggle orthogonal constraint
      this.toggleOrthoConstraint();
    }
  }

  private toggleOrthoConstraint(): void {
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
