// src/domain/tools/PointTool.ts

import { Circle } from "../../entities/Circle";
import { Entity } from "../../entities/Entity";
import { Line } from "../../entities/Line";
import { Point } from "../../entities/Point";
import { Polygon } from "../../entities/Polygon";
import { Polyline } from "../../entities/Polyline";
import { Rectangle } from "../../entities/Rectangle";
import { AbstractDrawingTool } from "../DrawingTools/AbstractDrawingTool";

const SelectToolSettings = {
    INITIAL_TOLERANCE: 0.0125
}

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
            return Math.hypot(mouseX - entity.getX(), mouseY - entity.getY()) <= 0.0;
        }

        if (entity instanceof Line) {
            let startPoint = { x: entity.getStartPoint().getX(), y: entity.getStartPoint().getY() };
            let endPoint = { x: entity.getEndPoint().getX(), y: entity.getEndPoint().getY() };
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const len = Math.hypot(dx, dy);
            const distance = Math.abs(dy * mouseX - dx * mouseY + endPoint.x * startPoint.y - endPoint.y * startPoint.x) / len;
            return distance < SelectToolSettings.INITIAL_TOLERANCE;
        }

        if (entity instanceof Polyline) {
            let nearEdge = false;
            let points = entity.getPoints()
            for (let i = 0, j = 1; i < points.length - 1; i++, j++) {
                let startPoint = { x: points[i].getX(), y: points[i].getY() };
                let endPoint = { x: points[j].getX(), y: points[j].getY() };
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const len = Math.hypot(dx, dy);
                const distance = Math.abs(dy * mouseX - dx * mouseY + endPoint.x * startPoint.y - endPoint.y * startPoint.x) / len;
                if (distance <= SelectToolSettings.INITIAL_TOLERANCE) nearEdge = true;
            }

            return nearEdge
        }

        if (entity instanceof Polygon || entity instanceof Rectangle) {
            let nearEdge = false;
            let points = entity.getPoints()
            for (let i = 0, j = 1; i < points.length; i++, j++) {
                if (j === points.length) j = 0;
                let startPoint = { x: points[i].getX(), y: points[i].getY() };
                let endPoint = { x: points[j].getX(), y: points[j].getY() };
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const len = Math.hypot(dx, dy);
                const distance = Math.abs(dy * mouseX - dx * mouseY + endPoint.x * startPoint.y - endPoint.y * startPoint.x) / len;
                if (distance <= SelectToolSettings.INITIAL_TOLERANCE) nearEdge = true;
            }

            return nearEdge
        }

        if (entity instanceof Circle) {
            let center = entity.getCenter();
            let distance = Math.sqrt(((mouseX - center.x) ** 2) + ((mouseY - center.y) ** 2));
            if (Math.abs(distance - entity.getRadius()) <= SelectToolSettings.INITIAL_TOLERANCE) return true;
        }

        return false;
    }
}
