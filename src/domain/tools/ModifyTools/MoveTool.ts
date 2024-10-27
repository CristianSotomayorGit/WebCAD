// src/domain/tools/ModifyTools/MoveTool.ts

import { AbstractModifyTool } from './AbstractModifyTool';
import { RenderableEntity } from '../../entities/RenderableEntity';

export class MoveTool extends AbstractModifyTool {
  private selectedEntity: RenderableEntity | null = null;
  private isDragging: boolean = false;
  private lastMousePosition: { x: number; y: number } | null = null;

  public onLeftClick(event: MouseEvent): void {
    const worldPosition = this.renderer.screenToWorld(
      event.clientX,
      event.clientY
    );

    // Hit test to find the entity under the cursor
    this.selectedEntity = this.entityManager.hitTest(
      worldPosition.x,
      worldPosition.y
    );

    if (this.selectedEntity) {
      this.isDragging = true;
      this.lastMousePosition = worldPosition;
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.selectedEntity && this.lastMousePosition) {
      const worldPosition = this.renderer.screenToWorld(
        event.clientX,
        event.clientY
      );

      const deltaX = worldPosition.x - this.lastMousePosition.x;
      const deltaY = worldPosition.y - this.lastMousePosition.y;

      this.selectedEntity.translate(deltaX, deltaY);

      this.lastMousePosition = worldPosition;
    }
  }

  public onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.selectedEntity = null;
      this.lastMousePosition = null;
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Handle key events if needed
  }
}
