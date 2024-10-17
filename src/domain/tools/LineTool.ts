// src/domain/tools/LineTool.ts

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

        const line = new Line(
          startPoint,
          endPoint,
          this.renderer
        );

        this.entityManager.addEntity(line);
        this.entityManager.addEntity(line.getStartpoint());

        this.currentLine = line;
      } else {
        if (this.currentLine) {
          const endpoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

          // Apply constraints if any
          if (this.constraintManager.hasConstraints() && this.startVertex) {
            const constrainedPoint = this.constraintManager.applyConstraints(
              { x: endpoint.getX(), y: endpoint.getY() },
              this.startVertex
            );
            endpoint.setX(constrainedPoint.x);
            endpoint.setY(constrainedPoint.y);
          }

          this.currentLine.setEndPoint(endpoint);
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

      let endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

      // Apply constraints if any
      if (this.constraintManager.hasConstraints() && this.startVertex) {
        const constrainedPoint = this.constraintManager.applyConstraints(
          { x: endPoint.getX(), y: endPoint.getY() },
          this.startVertex
        );
        endPoint.setX(constrainedPoint.x);
        endPoint.setY(constrainedPoint.y);
      }

      this.currentLine.setEndPoint(endPoint);

      // Update temporary entities
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
        this.entityManager.removeEntity(this.currentLine.getEndpoint());
        this.entityManager.removeEntity(this.currentLine.getStartpoint());
        this.currentLine = null;
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
