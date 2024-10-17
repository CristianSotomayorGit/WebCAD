import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
import { Point } from '../entities/Point';

export class LineTool implements Tool {
  private isDrawing = false;
  private startVertex: { x: number; y: number } | null = null;
  private currentLine: Line | null = null;

  constructor(
    private entityManager: EntityManager,
    private renderer: Renderer
  ) { }

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
          const endpoint = new Point(worldPosition.x, worldPosition.y, this.renderer)
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
      const endPoint = new Point(worldPosition.x, worldPosition.y, this.renderer)
      this.currentLine.setEndPoint(endPoint);
      this.entityManager.addTemporaryEntity(this.currentLine)
      this.entityManager.removeTemporaryEntity(this.currentLine)
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up for this tool
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isDrawing) {
      if (this.currentLine) {
        this.entityManager.removeEntity(this.currentLine);
        this.currentLine = null;
      }
      this.isDrawing = false;
      this.startVertex = null;
    }
  }
}
