// src/domain/tools/PointTool.ts

import { Entity } from "../../entities/Entity";
import { Line } from "../../entities/Line";
import { Point } from "../../entities/Point";
import { AbstractDrawingTool } from "../DrawingTools/AbstractDrawingTool";

export class SelectTool extends AbstractDrawingTool {
    public onLeftClick(event: MouseEvent): void {
        const { x, y } = this.getWorldPosition(event);
        console.log(x, y);
        for (let entity of this.entityManager.getEntities()) {
            if (this.isMouseNearShape(entity, x, y)) {
                entity.setColor(new Float32Array([1.0, 1.0, 1.0, 1.0])
                )
            }

        }
    }


    public isMouseNearShape(entity: Entity, mouseX: number, mouseY: number) {
        if (entity instanceof Point) {
            return Math.hypot(mouseX - entity.getX(), mouseY - entity.getY()) <= 0.05;
        }
        // if (entity instanceof Line) {
        //     const dx = shape.x2 - shape.x1;
        //     const dy = shape.y2 - shape.y1;
        //     const len = Math.hypot(dx, dy);
        //     const distance = Math.abs(dy * mouseX - dx * mouseY + shape.x2 * shape.y1 - shape.y2 * shape.x1) / len;
        //     return distance < 5; // Threshold for hover area
        // }

        // if (shape.type === 'polygon') {
        //     let inside = false;
        //     for (let i = 0, j = shape.vertices.length - 1; i < shape.vertices.length; j = i++) {
        //         const xi = shape.vertices[i].x, yi = shape.vertices[i].y;
        //         const xj = shape.vertices[j].x, yj = shape.vertices[j].y;
        //         const intersect = ((yi > mouseY) !== (yj > mouseY)) &&
        //                           (mouseX < (xj - xi) * (mouseY - yi) / (yj - yi) + xi);
        //         if (intersect) inside = !inside;
        //     }
        //     return inside;
        // }
        return false;
    }
}
