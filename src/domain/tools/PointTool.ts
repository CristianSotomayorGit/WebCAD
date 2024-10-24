// src/domain/tools/PointTool.ts
import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from '../entities/Point';

export class PointTool implements Tool {
  constructor(
    private entityManager: EntityManager,
    private renderer: Renderer
  ) { }

  public onLeftclick(event: MouseEvent): void {
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    // Convert screen coordinates to world coordinates
    const worldPosition = this.renderer.screenToWorld(x, y);

    // Create a new point at the world position
    const point = new Point(worldPosition.x, worldPosition.y, this.renderer);
    this.entityManager.addEntity(point);
  }

  public onMouseMove(event: MouseEvent): void {
    // No action needed for mouse move in this tool
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed for mouse up in this tool
  }

  public onKeyDown(event: KeyboardEvent): void {

  }
}
