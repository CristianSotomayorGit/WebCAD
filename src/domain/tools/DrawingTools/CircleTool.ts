// src/domain/tools/ArcTool.ts

import { Tool } from './DrawingTool';
import { EntityManager } from '../../managers/EntityManager';
import { Renderer } from '../../../infrastructure/rendering/Renderer';
import { Arc } from '../../entities/Arc';
import { Point } from '../../entities/Point';

interface PointType {
    x: number;
    y: number;
}

export class ArcTool implements Tool {
    private renderer: Renderer;
    private entityManager: EntityManager;

    private clickCount: number = 0;
    private startPoint: PointType | null = null;
    private midPoint: PointType | null = null;
    private endPoint: PointType | null = null;
    private temporaryArc: Arc | null = null;

    // Point entities for rendering
    private startPointEntity: Point | null = null;
    private midPointEntity: Point | null = null;
    private endPointEntity: Point | null = null;

    constructor(entityManager: EntityManager, renderer: Renderer) {
        this.renderer = renderer;
        this.entityManager = entityManager;
    }

    public onLeftclick(event: MouseEvent): void {
        const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;
        const worldPosition = this.renderer.screenToWorld(x, y);

        if (!worldPosition) return;

        const point: PointType = { x: worldPosition.x, y: worldPosition.y };

        if (this.clickCount === 0) {
            // First click: set start point
            this.startPoint = point;
            this.clickCount = 1;

            // Create and add the start point entity
            this.startPointEntity = new Point(point.x, point.y, this.renderer);
            this.entityManager.addEntity(this.startPointEntity);

            // Initialize temporary arc
            this.temporaryArc = new Arc(this.renderer);
            this.temporaryArc.setStartPoint(this.startPoint);
            this.entityManager.addTemporaryEntity(this.temporaryArc);
        } else if (this.clickCount === 1) {
            // Second click: set mid point
            this.midPoint = point;
            this.clickCount = 2;

            // Create and add the mid point entity
            this.midPointEntity = new Point(point.x, point.y, this.renderer);
            this.entityManager.addEntity(this.midPointEntity);

            // Update temporary arc with mid point
            if (this.temporaryArc) {
                this.temporaryArc.setMidPoint(this.midPoint);
            }
        } else if (this.clickCount === 2) {
            // Third click: set end point
            this.endPoint = point;
            this.clickCount = 0;

            // Create and add the end point entity
            this.endPointEntity = new Point(point.x, point.y, this.renderer);
            this.entityManager.addEntity(this.endPointEntity);

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

            // Reset point entities
            this.startPointEntity = null;
            this.midPointEntity = null;
            this.endPointEntity = null;
        }
    }

    public onMouseMove(event: MouseEvent): void {
        if (this.clickCount === 0) return;

        const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;
        const worldPosition = this.renderer.screenToWorld(x, y);

        if (!worldPosition) return;

        const point: PointType = { x: worldPosition.x, y: worldPosition.y };

        if (this.clickCount === 1 && this.temporaryArc) {
            // Update mid point of temporary arc
            this.temporaryArc.setMidPoint(point);
        } else if (this.clickCount === 2 && this.temporaryArc) {
            // Update end point of temporary arc
            this.temporaryArc.setEndPoint(point);
        }
    }

    public onMouseUp(event: MouseEvent): void {
        // No action needed on mouse up
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            // Cancel arc drawing
            if (this.temporaryArc) {
                this.entityManager.removeTemporaryEntity(this.temporaryArc);
                this.temporaryArc = null;
            }
            if (this.startPointEntity) {
                this.entityManager.removeEntity(this.startPointEntity);
                this.startPointEntity = null;
            }
            if (this.midPointEntity) {
                this.entityManager.removeEntity(this.midPointEntity);
                this.midPointEntity = null;
            }
            if (this.endPointEntity) {
                this.entityManager.removeEntity(this.endPointEntity);
                this.endPointEntity = null;
            }

            this.clickCount = 0;
            this.startPoint = null;
            this.midPoint = null;
            this.endPoint = null;
        }
    }
}
