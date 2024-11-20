// src/domain/tools/PointTool.ts

import { Arc } from "../../entities/Arc";
import { Circle } from "../../entities/Circle";
import { Ellipse } from "../../entities/Ellipse";
import { Entity } from "../../entities/Entity";
import { Line } from "../../entities/Line";
import { Point } from "../../entities/Point";
import { Polygon } from "../../entities/Polygon";
import { Polyline } from "../../entities/Polyline";
import { Rectangle } from "../../entities/Rectangle";
import { Spline } from "../../entities/Spline";
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
            let onEdge = false;
            let points = entity.getPoints()
            for (let i = 0, j = 1; i < points.length; i++, j++) {
                if (j === points.length) j = 0;
                let startPoint = { x: points[i].getX(), y: points[i].getY() };
                let endPoint = { x: points[j].getX(), y: points[j].getY() };
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const len = Math.hypot(dx, dy);
                const distance = Math.abs(dy * mouseX - dx * mouseY + endPoint.x * startPoint.y - endPoint.y * startPoint.x) / len;
                if (distance <= SelectToolSettings.INITIAL_TOLERANCE) onEdge = true;
            }

            return onEdge
        }

        if (entity instanceof Circle) {
            let center = entity.getCenter();
            let distance = Math.sqrt(((mouseX - center.x) ** 2) + ((mouseY - center.y) ** 2));
            if (Math.abs(distance - entity.getRadius()) <= SelectToolSettings.INITIAL_TOLERANCE) return true;
        }

        if (entity instanceof Ellipse) {
            let center = entity.getCenter();
            let radiusX = entity.getRadiusX();
            let radiusY = entity.getRadiusY();
            let aspectRatio = Math.max(radiusX, radiusY) / Math.min(radiusX, radiusY);
            let adjustedTolerance = SelectToolSettings.INITIAL_TOLERANCE * aspectRatio;
            let distanceEllipse = ((mouseX - center.x) ** 2) / (radiusX ** 2) + ((mouseY - center.y) ** 2) / (radiusY ** 2);
            if (Math.abs(distanceEllipse - 1) <= adjustedTolerance) return true;
        }


        if (entity instanceof Spline) {
            let controlPoints = entity.getControlPoints();
            let samples = 100; // Number of samples along the spline for accuracy
            let closestDistance = Infinity;
        
            // Iterate through each segment of the spline
            for (let i = 0; i < controlPoints.length - 1; i++) {
                for (let j = 0; j <= samples; j++) {
                    let t = j / samples;
                    let splinePoint = entity['calculateSplinePoint'](i, t);
                    let distanceToSpline = ((mouseX - splinePoint.x) ** 2) + ((mouseY - splinePoint.y) ** 2);
                    closestDistance = Math.min(closestDistance, distanceToSpline);
                }
            }
        
            // Adjust tolerance based on the spline's characteristics
            let adjustedTolerance = SelectToolSettings.INITIAL_TOLERANCE;
        
            // Optionally, modify tolerance based on the spline's control point distance or scale
            let splineLength = 0;
            for (let i = 0; i < controlPoints.length - 1; i++) {
                let dx = controlPoints[i+1].getX() - controlPoints[i].getX();
                let dy = controlPoints[i+1].getY() - controlPoints[i].getY();
                splineLength += Math.sqrt(dx * dx + dy * dy);
            }
            
            // Adjust tolerance based on the length of the spline (scale it accordingly)
            let lengthFactor = splineLength / 1000; // Normalize based on spline length
            adjustedTolerance *= lengthFactor; // Increase or decrease tolerance based on spline length
        
            // If the closest distance is within the tolerance, return true
            if (closestDistance <= adjustedTolerance) return true;
        }
        

        return false;
    }
}
