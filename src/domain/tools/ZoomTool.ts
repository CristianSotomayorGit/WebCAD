// src/domain/tools/PanTool.ts
import { Tool } from './Tool';
import { Camera } from '../Camera';

export class ZoomTool implements Tool {
    private isPanning = false;
    private camera: Camera;

    constructor(camera: Camera) {
        this.camera = camera;
    }

    public isActive(): boolean {
        return this.isPanning;
    }

    public onWheelScroll(event: WheelEvent) {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        if (this.camera) {
            const newZoom = this.camera.getZoom() * (1 + delta);
            this.camera.setZoom(newZoom);
            console.log(newZoom)
        }
    }

    public onMouseDown(event: MouseEvent): void {

    }

    public onMouseMove(event: MouseEvent): void {
    }

    public onMouseUp(event: MouseEvent): void {

    }
}
