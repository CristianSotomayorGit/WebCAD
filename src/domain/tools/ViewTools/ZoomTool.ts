// src/domain/tools/ZoomTool.ts

import { PAN_SPEED, ZOOM_FACTOR } from '../../../constants/ToolConstants';
import { Camera } from '../../Camera';

export class ZoomTool {
  private camera: Camera;
  private ZOOM_FACTOR = ZOOM_FACTOR;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  // public onWheel(event: WheelEvent): void {
  //   event.preventDefault();
  //   const delta = event.deltaY > 0 ? 1 / this.ZOOM_FACTOR : this.ZOOM_FACTOR;
  //   const newZoom = this.camera.getZoom() * delta;
  //   console.log(newZoom)
  //   this.camera.setZoom(newZoom);
  // }

  public onWheel(event: WheelEvent): void {
    event.preventDefault();

    let lastMousePosition = { x: event.clientX, y: event.clientY };
    let centerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2}
    const deltaX = centerPosition.x - lastMousePosition.x;
    const deltaY = centerPosition.y - lastMousePosition.y;
    const zoom = this.camera.getZoom();
    const panSpeed = 0.00025; 
    const offset = this.camera.getOffset();

    this.camera.setOffset(
      offset.x - (deltaX / zoom) * panSpeed,
      offset.y - (deltaY / zoom) * -panSpeed
    );

    const delta = event.deltaY > 0 ? 1 / this.ZOOM_FACTOR : this.ZOOM_FACTOR;
    const newZoom = this.camera.getZoom() * delta;
    console.log(newZoom)
    this.camera.setZoom(newZoom);

  }

}
