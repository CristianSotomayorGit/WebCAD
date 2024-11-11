// src/domain/tools/AbstractDrawingTool.ts

import { Tool } from './DrawingTool';
import { Renderer } from '../../../infrastructure/rendering/Renderer';
import { EntityManager } from '../../managers/EntityManager';
import { Point } from '../../entities/Point';

export abstract class AbstractDrawingTool implements Tool {
    protected renderer: Renderer;
    protected entityManager: EntityManager;
    protected isDrawing: boolean = false;
    protected clickCount: number = 0;
    protected points: Point[] = [];

    constructor(entityManager: EntityManager, renderer: Renderer) {
        this.entityManager = entityManager;
        this.renderer = renderer;
    }

    public abstract onLeftClick(event: MouseEvent, color: Float32Array, font?: string, fontSize?: number): void;

    public onMouseMove(event: MouseEvent): void {
        event
    }

    public onMouseUp(event: MouseEvent): void {
        event
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.cancel();
        }
    }

    protected getWorldPosition(event: MouseEvent): { x: number; y: number } {
        const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
        const screenX = event.clientX - canvasRect.left;
        const screenY = event.clientY - canvasRect.top;
        return this.renderer.screenToWorld(screenX, screenY);
    }

    protected createAndAddPoint(x: number, y: number): Point {
        const point = new Point(x, y, this.renderer);
        this.entityManager.addEntity(point);
        this.points.push(point);
        return point;
    }

    protected removePoints(): void {
        for (const point of this.points) {
            this.entityManager.removeEntity(point);
        }
        this.points = [];
    }

    public cancel(): void {
        this.isDrawing = false;
        this.clickCount = 0;
        // this.removePoints();
        // Additional cleanup in subclasses if needed
    }
}