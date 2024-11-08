// src/domain/tools/AbstractWritingTool.ts

import { Renderer } from '../../../infrastructure/rendering/Renderer';
import { EntityManager } from '../../managers/EntityManager';
import { Tool } from '../DrawingTools/DrawingTool';

export abstract class AbstractWritingTool implements Tool {
    protected renderer: Renderer;
    protected entityManager: EntityManager;

    constructor(entityManager: EntityManager, renderer: Renderer) {
        this.entityManager = entityManager;
        this.renderer = renderer;
    }

    public abstract onLeftClick(event: MouseEvent, color: Float32Array, font: string, fontSize: number): void;

    protected getWorldPosition(event: MouseEvent): { x: number; y: number } {
        const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
        const screenX = event.clientX - canvasRect.left;
        const screenY = event.clientY - canvasRect.top;
        return this.renderer.screenToWorld(screenX, screenY);
    }

    public cancel(): void {
        // Implement cancel functionality if needed
    }
}