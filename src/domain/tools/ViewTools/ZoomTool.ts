// src/domain/tools/ZoomTool.ts

import { Camera } from '../../Camera';

const ZoomSettings = {
  ZOOM_FACTOR: 1.1,
  ZOOM_SPEED: 0.00025
}

export class ZoomTool {
  private camera: Camera;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  public onWheel(event: WheelEvent): void {
    event.preventDefault();

    let lastMousePosition = { x: event.clientX, y: event.clientY };
    let centerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const deltaX = centerPosition.x - lastMousePosition.x;
    const deltaY = centerPosition.y - lastMousePosition.y;
    const zoom = this.camera.getZoom();
    const panSpeed = ZoomSettings.ZOOM_SPEED;
    const offset = this.camera.getOffset();

    this.camera.setOffset(
      offset.x - (deltaX / zoom) * panSpeed,
      offset.y - (deltaY / zoom) * -panSpeed
    );

    const delta = event.deltaY > 0 ? 1 / ZoomSettings.ZOOM_FACTOR : ZoomSettings.ZOOM_FACTOR;
    const newZoom = this.camera.getZoom() * delta;
    this.camera.setZoom(newZoom);
  }
}
