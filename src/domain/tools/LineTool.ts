// tools/LineTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
import { Point } from '../entities/Point';
import { ConstraintManager } from '../managers/ConstraintManager';
import { ConstraintType } from '../constraints/ConstraintTypes';
import { OrthogonalConstraint } from '../constraints/OrthogonalConstraint';
import { PointSnapConstraint } from '../constraints/PointSnapConstraint';

export class LineTool implements Tool {
  private isDrawing = false;
  private startVertex: Point | null = null;
  private currentLine: Line | null = null;
  private temporaryEndPoint: Point | null = null;
  private constraintManager: ConstraintManager;
  private renderer: Renderer;

  constructor(
    private entityManager: EntityManager,
    constraintManager: ConstraintManager,
    renderer: Renderer
  ) {
    this.renderer = renderer;
    this.constraintManager = constraintManager;
  }

  public onLeftclick(event: MouseEvent): void {
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    const mouseWorldPosition = this.renderer.screenToWorld(x, y);

    if (!mouseWorldPosition) {
      throw new Error('Mouse world position error');
    }

    if (this.constraintManager.hasActiveConstraints()) {
      this.createConstrainedLine(mouseWorldPosition);
    } else {
      this.createLine(mouseWorldPosition);
    }
  }

  private createConstrainedLine(mouseWorldPosition: { x: number; y: number }) {
    const worldPosition = mouseWorldPosition;

    if (!this.isDrawing) {
      // Start drawing
      this.startVertex = this.findNearestPoint(worldPosition) || new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.isDrawing = true;

      // Apply constraints to the start vertex if applicable
      if (this.constraintManager.hasActiveConstraints()) {
        this.startVertex = this.constraintManager.applyConstraints(
          this.startVertex,
          this.startVertex, // Reference point can be itself or another logic
          'start'
        );
      }

      const endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

      // Apply constraints to the end point if applicable
      const constrainedEndPoint = this.constraintManager.applyConstraints(
        endPoint,
        this.startVertex,
        'end'
      );

      const line = new Line(this.startVertex, constrainedEndPoint, this.renderer);

      this.entityManager.addEntity(line);
      this.entityManager.addEntity(this.startVertex);
      this.entityManager.addEntity(constrainedEndPoint);

      this.currentLine = line;
      this.temporaryEndPoint = constrainedEndPoint;
    } else {
      // Finish drawing
      if (this.currentLine && this.startVertex) {
        let endPointPosition = { x: worldPosition.x, y: worldPosition.y };

        // Apply constraints to the end point
        const tempPoint = new Point(endPointPosition.x, endPointPosition.y, this.renderer);
        let endPointConstrainedPosition = this.constraintManager.applyConstraints(
          tempPoint,
          this.startVertex,
          'end'
        );

        endPointPosition = { x: endPointConstrainedPosition.getX(), y: endPointConstrainedPosition.getY() }

        const endpoint = this.findNearestPoint(endPointPosition) || new Point(endPointPosition.x, endPointPosition.y, this.renderer);

        this.currentLine.setEndPoint(endpoint);

        // Clean up temporary endpoint
        if (this.temporaryEndPoint) {
          this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
          this.temporaryEndPoint = null;
        }

        this.entityManager.addEntity(endpoint);
        this.currentLine = null;
      }

      this.isDrawing = false;
      this.startVertex = null;
    }
  }

  private createLine(mouseWorldPosition: { x: number; y: number }) {
    const worldPosition = mouseWorldPosition;

    if (!this.isDrawing) {
      // Start drawing
      this.startVertex = new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.isDrawing = true;

      const endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      const line = new Line(this.startVertex, endPoint, this.renderer);

      this.entityManager.addEntity(line);
      this.entityManager.addEntity(this.startVertex);

      this.currentLine = line;
      this.temporaryEndPoint = endPoint;
    } else {
      // Finish drawing
      if (this.currentLine) {
        const endpoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
        this.currentLine.setEndPoint(endpoint);

        if (this.temporaryEndPoint) {
          this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
          this.temporaryEndPoint = null;
        }

        this.entityManager.addEntity(endpoint);
        this.currentLine = null;
      }

      this.isDrawing = false;
      this.startVertex = null;
    }
  }

  private findNearestPoint(mouseWorldPosition: { x: number; y: number }): Point | null {
    let nearest: Point | null = null;
    let minDist = Infinity;
    const threshold = 0.02; // Adjust as needed

    for (const entity of this.entityManager.getEntities()) {
      if (entity instanceof Point) {
        const dx = entity.getX() - mouseWorldPosition.x;
        const dy = entity.getY() - mouseWorldPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist && dist <= threshold) {
          minDist = dist;
          nearest = entity;

          entity.setColor(new Float32Array([1.0, 1.0, 0.0, 1.0])); // Highlight nearest point
          console.log('NEAR');
        } else {
          entity.setColor(new Float32Array([0.5, 0.5, 0.5, 1.0])); // Reset color
        }
      }
    }

    return nearest;
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentLine) {
      const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;
      const worldPosition = this.renderer.screenToWorld(x, y);

      if (!worldPosition || !this.startVertex) return;

      let endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

      // Apply constraints to the end point
      endPoint = this.constraintManager.applyConstraints(endPoint, this.startVertex, 'end');

      this.currentLine.setEndPoint(endPoint);

      // Manage temporary endpoint
      if (this.temporaryEndPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
      }

      this.temporaryEndPoint = endPoint;
      this.entityManager.addTemporaryEntity(this.temporaryEndPoint);
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
    }
    // Additional key handling can be done via the React component
  }
}
