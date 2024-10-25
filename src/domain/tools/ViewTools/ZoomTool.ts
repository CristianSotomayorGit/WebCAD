// src/domain/tools/ZoomTool.ts

import { Tool } from '../DrawingTools/DrawingTool';
import { Camera } from '../../Camera';

export class ZoomTool implements Tool {
  private camera: Camera;
  private ZOOM_FACTOR = 1.1;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  public onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 1 / this.ZOOM_FACTOR : this.ZOOM_FACTOR;
    const newZoom = this.camera.getZoom() * delta;
    this.camera.setZoom(newZoom);
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Handle key events if necessary
  }

}
