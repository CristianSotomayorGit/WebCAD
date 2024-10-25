// src/domain/tools/ZoomTool.ts

import { ZOOM_FACTOR } from '../../../constants/ToolConstants';
import { Camera } from '../../Camera';

export class ZoomTool  {
  private camera: Camera;
  private ZOOM_FACTOR = ZOOM_FACTOR;

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
