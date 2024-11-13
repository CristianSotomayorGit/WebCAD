// src/domain/tools/PanTool.ts

import { Camera } from "../../Camera";

const PanSettings = {
  PAN_SPEED: 0.00125,
}

export class PanTool {
  private isPanning = false;
  private lastMousePosition: { x: number; y: number } | null = null;
  private camera: Camera;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  public isActive(): boolean {
    return this.isPanning;
  }

  public onWheelClick(event: MouseEvent): void {
    this.isPanning = true;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isPanning && this.lastMousePosition) {
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;
      const zoom = this.camera.getZoom();
      const panSpeed = PanSettings.PAN_SPEED; 

      const offset = this.camera.getOffset();
      this.camera.setOffset(
        offset.x - (deltaX / zoom) * panSpeed,
        offset.y - (deltaY / zoom) * -panSpeed
      );

      this.lastMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  public onMouseUp(event: MouseEvent): void {
    if (event.button === 0 || event.button === 1  && this.isPanning) {
      this.isPanning = false;
      this.lastMousePosition = null;
    }
  }

  public onLeftClick(event: MouseEvent): void {
    this.isPanning = true;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  public cancel() {
  //
  }
}
