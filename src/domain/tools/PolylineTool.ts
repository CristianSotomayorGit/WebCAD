import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Polyline } from '../entities/Polyline';
import { Point } from '../entities/Point';

export class PolylineTool implements Tool {
    private isDrawing = false;
    private currentPolyline: Polyline | null = null;

    constructor(
        private entityManager: EntityManager,
        private renderer: Renderer
    ) { }

    public onMouseDown(event: MouseEvent): void {
        if (event.button === 0) { 
            const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
            const x = event.clientX - canvasRect.left;
            const y = event.clientY - canvasRect.top;

            const worldPosition = this.renderer.screenToWorld(x, y);

            const newPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
            this.entityManager.addEntity(newPoint);

            if (!this.isDrawing) {
                this.isDrawing = true;

                const polyline = new Polyline(this.renderer);
                polyline.addPoint(newPoint);

                this.entityManager.addEntity(polyline);

                this.currentPolyline = polyline;
            } else {
                if (this.currentPolyline) {
                    this.currentPolyline.addPoint(newPoint);

                }
            }
        }
    }

    public onMouseMove(event: MouseEvent): void {
        if (this.isDrawing && this.currentPolyline) {
            const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
            const x = event.clientX - canvasRect.left;
            const y = event.clientY - canvasRect.top;

            const worldPosition = this.renderer.screenToWorld(x, y);

            this.currentPolyline.updateLastPoint(worldPosition.x, worldPosition.y);
        }
    }

    public onMouseUp(event: MouseEvent): void {
        // No action needed on mouse up for this tool
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.isDrawing) {
            if (event.key === 'Escape') {
                if (this.currentPolyline) {
                    this.entityManager.removeEntity(this.currentPolyline);
                    for (const point of this.currentPolyline.getPoints()) {
                        this.entityManager.removeEntity(point);
                    }
                    this.currentPolyline = null;
                }
                this.isDrawing = false;
            } else if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
                this.currentPolyline?.removeLastLine();
                this.isDrawing = false;
                this.currentPolyline = null;
            }
        }
    }
}
