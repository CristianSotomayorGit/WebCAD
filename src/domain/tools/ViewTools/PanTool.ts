// src/domain/tools/PanTool.ts
import { PAN_SPEED } from "../../../constants/ToolConstants";
import { Camera } from "../../Camera";

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

      const panSpeed = PAN_SPEED; // Adjust this value between 0 and 1 for desired panning speed

      // Adjust camera offset accordingly
      const offset = this.camera.getOffset();
      this.camera.setOffset(
        offset.x - (deltaX / zoom) * panSpeed,
        offset.y - (deltaY / zoom) * -panSpeed
      );

      // Update camera buffer
      // this.renderer.updateCameraBuffer();

      // Update last mouse position
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

  public cancelDrawing() {
  //
  }
}
