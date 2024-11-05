// src/domain/tools/CircleTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Circle } from '../../entities/Circle';
import { Point } from '../../entities/Point';

export class CircleTool extends AbstractDrawingTool {
    private currentCircle: Circle | null = null;
    private centerPoint: Point | null = null;
    private tempPoint: Point | null = null;

    public onLeftClick(event: MouseEvent, color: Float32Array): void {
        const { x, y } = this.getWorldPosition(event);

        if (!this.isDrawing) {
            // First click: set the center of the circle
            this.centerPoint = this.createAndAddPoint(x, y);
            this.isDrawing = true;

            // Create the circle with zero radius
            this.currentCircle = new Circle(this.renderer, x, y, 0);
            this.currentCircle.setColor(color);
            this.entityManager.addEntity(this.currentCircle);
        } else if (this.isDrawing) {
            // Second click: finalize the circle
            this.finishDrawing();
        }
    }

    public onMouseMove(event: MouseEvent): void {
        if (this.isDrawing && this.currentCircle) {
            const { x, y } = this.getWorldPosition(event);

            // Update the radius of the circle based on the distance from the center
            const dx = x - this.centerPoint!.getX();
            const dy = y - this.centerPoint!.getY();
            const radius = Math.sqrt(dx * dx + dy * dy);

            this.currentCircle.setRadius(radius);

            // Update the temporary point position
            if (this.tempPoint) {
                this.tempPoint.setX(x);
                this.tempPoint.setY(y);
            } else {
                // Create a temporary point at the current mouse position
                this.tempPoint = this.createAndAddPoint(x, y);
            }
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        super.onKeyDown(event);

        if (this.isDrawing) {
            if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
                // Finish drawing the circle
                this.finishDrawing();
            }
        }
    }

    public cancelDrawing(): void {
        super.cancelDrawing();

        if (this.currentCircle) {
            this.entityManager.removeEntity(this.currentCircle);
            this.currentCircle = null;
        }
        if (this.tempPoint) {
            this.entityManager.removeEntity(this.tempPoint);
            this.tempPoint = null;
        }
        if (this.centerPoint) {
            this.entityManager.removeEntity(this.centerPoint);
            this.centerPoint = null;
        }
    }

    private finishDrawing(): void {
        if (this.currentCircle && this.tempPoint) {
            // Remove the temporary point
            this.entityManager.removeEntity(this.tempPoint);
            this.tempPoint = null;
        }
        this.isDrawing = false;
        this.currentCircle = null;
        this.centerPoint = null;
        this.points = [];
    }
}
