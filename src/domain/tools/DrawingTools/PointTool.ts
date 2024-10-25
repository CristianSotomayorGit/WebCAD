// src/domain/tools/PointTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';

export class PointTool extends AbstractDrawingTool {
  public onLeftClick(event: MouseEvent): void {
    const { x, y } = this.getWorldPosition(event);
    this.createAndAddPoint(x, y);
  }
}
