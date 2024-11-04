// src/domain/tools/ArcTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Arc } from '../../entities/Arc';

interface PointType {
    x: number;
    y: number;
}

export class ArcTool extends AbstractDrawingTool {
    private startPoint: PointType | null = null;
    private midPoint: PointType | null = null;
    private endPoint: PointType | null = null;
    private temporaryArc: Arc | null = null;

    public onLeftClick(event: MouseEvent, color: Float32Array): void {
        const worldPosition = this.getWorldPosition(event);

        if (this.clickCount === 0) {
            // First click: set start point
            this.startPoint = worldPosition;
            this.clickCount = 1;
            this.isDrawing = true;

            // Create and add the start point entity
            this.createAndAddPoint(worldPosition.x, worldPosition.y);

            // Initialize temporary arc
            this.temporaryArc = new Arc(this.renderer);
            this.temporaryArc.setColor(color);
            this.temporaryArc.setStartPoint(this.startPoint);
            this.entityManager.addTemporaryEntity(this.temporaryArc);
        } else if (this.clickCount === 1) {
            // Second click: set mid point
            this.midPoint = worldPosition;
            this.clickCount = 2;

            // Create and add the mid point entity
            this.createAndAddPoint(worldPosition.x, worldPosition.y);

            // Update temporary arc with mid point
            if (this.temporaryArc) {
                this.temporaryArc.setMidPoint(this.midPoint);
            }
        } else if (this.clickCount === 2) {
            // Third click: set end point
            this.endPoint = worldPosition;
            this.clickCount = 0;
            this.isDrawing = false;

            // Create and add the end point entity
            this.createAndAddPoint(worldPosition.x, worldPosition.y);

            // Finalize the arc
            if (this.temporaryArc) {
                this.temporaryArc.setEndPoint(this.endPoint);
                // Remove temporary arc and add it as a permanent entity
                this.entityManager.removeTemporaryEntity(this.temporaryArc);
                this.entityManager.addEntity(this.temporaryArc);
                this.temporaryArc = null;
            }

            // Reset points
            this.startPoint = null;
            this.midPoint = null;
            this.endPoint = null;
            this.points = [];
        }
    }

    public onMouseMove(event: MouseEvent): void {
        if (!this.isDrawing || !this.temporaryArc) return;

        const worldPosition = this.getWorldPosition(event);

        if (this.clickCount === 1) {
            // Update mid point of temporary arc
            this.temporaryArc.setMidPoint(worldPosition);
        } else if (this.clickCount === 2) {
            // Update end point of temporary arc
            this.temporaryArc.setEndPoint(worldPosition);
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        super.onKeyDown(event); // Handle common key events like 'Escape'

        if (event.key === 'Escape' && this.isDrawing) {
            // Cancel arc drawing
            if (this.temporaryArc) {
                this.entityManager.removeTemporaryEntity(this.temporaryArc);
                this.temporaryArc = null;
            }
            this.cancelDrawing();
            this.startPoint = null;
            this.midPoint = null;
            this.endPoint = null;
        }
    }
}
