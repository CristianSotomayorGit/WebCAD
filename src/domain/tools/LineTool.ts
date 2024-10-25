// LineTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
import { Point } from '../entities/Point';
import { ConstraintManager } from '../managers/ConstraintManager';

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
      // Create a new point for the start vertex
      const startPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

      // Apply constraints to the start vertex if applicable
      const constrainedStartPoint = this.constraintManager.applyConstraints(
        startPoint,
        startPoint, // Reference point can be itself or another logic
        'start'
      );

      this.startVertex = constrainedStartPoint ? constrainedStartPoint : startPoint;
      this.isDrawing = true;

      // Create endPoint and apply constraints
      const endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      const constrainedEndPoint = this.constraintManager.applyConstraints(
        endPoint,
        this.startVertex,
        'end'
      ) ;

      // Create the line with constrained points
      const line = new Line(this.startVertex, constrainedEndPoint ? constrainedEndPoint : endPoint, this.renderer);

      // Add entities to the manager
      this.entityManager.addEntity(line);
      if (!constrainedStartPoint) this.entityManager.addEntity(this.startVertex);
      else this.entityManager.addEntity(constrainedStartPoint);

      if (!constrainedEndPoint) this.entityManager.addEntity(endPoint);
      else this.entityManager.addEntity(constrainedEndPoint);

      this.currentLine = line;
      this.temporaryEndPoint = constrainedEndPoint ? constrainedEndPoint: endPoint;
    } else {
      // Finish drawing
      if (this.currentLine && this.startVertex) {
        // Create a new end point based on mouse position
        const endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

        // Apply constraints to the end point
        const constrainedEndPoint = this.constraintManager.applyConstraints(
          endPoint,
          this.startVertex,
          'end'
        );

        // Set the constrained end point to the current line
        this.currentLine.setEndPoint(constrainedEndPoint ? constrainedEndPoint : endPoint);

        // Add the constrained end point as a permanent entity
        if (!constrainedEndPoint) this.entityManager.addEntity(endPoint);

        // Clean up temporary endpoint
        if (this.temporaryEndPoint) {
          this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
          this.temporaryEndPoint = null;
        }

        this.currentLine = null;
      }

      // Reset drawing state
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

  public onMouseMove(event: MouseEvent): void {

    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    const worldPosition = this.renderer.screenToWorld(x, y);


    if (this.isDrawing && this.currentLine) {


      if (!worldPosition || !this.startVertex) return;

      // Create a new end point based on mouse position
      let endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);

      // Apply constraints to the end point
      let constrainedEndPoint = this.constraintManager.applyConstraints(endPoint, this.startVertex, 'both');

      // Update the current line with the constrained end point
      this.currentLine.setEndPoint(constrainedEndPoint ? constrainedEndPoint : endPoint);

      // Manage temporary endpoint
      if (this.temporaryEndPoint) {
        this.entityManager.removeTemporaryEntity(this.temporaryEndPoint);
      }

      this.temporaryEndPoint = endPoint;
      this.entityManager.addTemporaryEntity(this.temporaryEndPoint);
    }

    if (!this.isDrawing) {
      let mouseLocationPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.constraintManager.applyConstraints(mouseLocationPoint,mouseLocationPoint,'start')
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
