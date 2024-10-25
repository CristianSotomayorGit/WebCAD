// src/domain/tools/PanTool.ts
import { Tool } from './Tool';
import { Camera } from '../Camera';

export class ZoomTool implements Tool {
    private isPanning = false;
    private camera: Camera;

    constructor(camera: Camera) {
        this.camera = camera;
        this.setZoom(1);
    }

    public isActive(): boolean {
        return this.isPanning;
    }

    public onWheelScroll(event: WheelEvent) {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        if (this.camera) {
            const newZoom = this.camera.getZoom() * (1 + delta);
            this.camera.setZoom(newZoom);
        }
    }

    public setZoom(zoom: number) {
        this.camera.setZoom(zoom);
    }

    public onLeftclick(event: MouseEvent): void {

    }

    public onMouseMove(event: MouseEvent): void {
    }

    public onMouseUp(event: MouseEvent): void {

    }

    public onKeyDown(event: KeyboardEvent): void {

    }
}
