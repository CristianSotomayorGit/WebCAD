// src/domain/tools/ArcTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Arc } from '../../entities/Arc';
import { Point } from '../../entities/Point';

export class ArcTool extends AbstractDrawingTool {
  private startPoint: Point | null = null;
  private midPoint: Point | null = null;
  private endPoint: Point | null = null;
  private temporaryArc: Arc | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const worldPosition = this.getWorldPosition(event);

    if (this.clickCount === 0) {
      // First click: set start point
      this.clickCount = 1;
      this.isDrawing = true;

      // Create and add the start point entity
      this.startPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);
    } else if (this.clickCount === 1) {
      // Second click: set mid point
      this.clickCount = 2;

      // Create and add the mid point entity
      this.midPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);

      // Initialize temporary arc with dummy parameters
      this.temporaryArc = new Arc(
        this.renderer,
        0,
        0,
        0,
        0,
        0,
        false,
        this.startPoint!,
        this.midPoint,
        null!
      );
      this.temporaryArc.setColor(color);
      this.entityManager.addTemporaryEntity(this.temporaryArc);
    } else if (this.clickCount === 2) {
      // Third click: set end point
      this.clickCount = 0;
      this.isDrawing = false;

      // Create and add the end point entity
      this.endPoint = this.createAndAddPoint(worldPosition.x, worldPosition.y);

      // Finalize the arc
      this.finalizeArc(color);

      // Reset points
      this.startPoint = null;
      this.midPoint = null;
      this.endPoint = null;
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.temporaryArc) return;

    const worldPosition = this.getWorldPosition(event);

    if (this.clickCount === 2) {
      // Update temporary arc with current mouse position as end point
      const tempEndPoint = new Point(worldPosition.x, worldPosition.y, this.renderer);
      this.updateTemporaryArc(tempEndPoint);
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isDrawing) {
      // Cancel arc drawing
      this.cancel();
      this.startPoint = null;
      this.midPoint = null;
      this.endPoint = null;
    }
  }

  public cancel(): void {
    super.cancel();

    if (this.temporaryArc) {
      this.entityManager.removeTemporaryEntity(this.temporaryArc);
      this.temporaryArc = null;
    }
    if (this.startPoint) {
      this.entityManager.removeTemporaryEntity(this.startPoint);
      this.entityManager.removeEntity(this.startPoint);
      this.startPoint = null;
    }
    if (this.midPoint) {
      this.entityManager.removeTemporaryEntity(this.midPoint);
      this.entityManager.removeEntity(this.midPoint);
      this.midPoint = null;
    }
  }

  private updateTemporaryArc(tempEndPoint: Point): void {
    const circle = this.calculateCircleFromPoints(
      this.startPoint!,
      this.midPoint!,
      tempEndPoint
    );

    if (circle) {
      const { centerX, centerY, radius } = circle;

      // Compute angles
      const startAngle = Math.atan2(
        this.startPoint!.getY() - centerY,
        this.startPoint!.getX() - centerX
      );
      const midAngle = Math.atan2(
        this.midPoint!.getY() - centerY,
        this.midPoint!.getX() - centerX
      );
      const endAngle = Math.atan2(
        tempEndPoint.getY() - centerY,
        tempEndPoint.getX() - centerX
      );

      // Determine arc direction
      const isClockwise = this.isArcClockwise(startAngle, midAngle, endAngle);

      // Update temporary arc
      this.temporaryArc!.updateArcParameters(
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
        isClockwise,
        this.startPoint!,
        this.midPoint!,
        tempEndPoint
      );
    }
  }

  private finalizeArc(color: Float32Array): void {
    const circle = this.calculateCircleFromPoints(
      this.startPoint!,
      this.midPoint!,
      this.endPoint!
    );

    if (circle) {
      const { centerX, centerY, radius } = circle;

      // Compute angles
      const startAngle = Math.atan2(
        this.startPoint!.getY() - centerY,
        this.startPoint!.getX() - centerX
      );
      const midAngle = Math.atan2(
        this.midPoint!.getY() - centerY,
        this.midPoint!.getX() - centerX
      );
      const endAngle = Math.atan2(
        this.endPoint!.getY() - centerY,
        this.endPoint!.getX() - centerX
      );

      // Determine arc direction
      const isClockwise = this.isArcClockwise(startAngle, midAngle, endAngle);

      // Remove temporary arc
      if (this.temporaryArc) {
        this.entityManager.removeTemporaryEntity(this.temporaryArc);
        this.temporaryArc = null;
      }

      // Create final arc
      const finalArc = new Arc(
        this.renderer,
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
        isClockwise,
        this.startPoint!,
        this.midPoint!,
        this.endPoint!
      );
      finalArc.setColor(color);
      this.entityManager.addEntity(finalArc);
    }
  }

  private calculateCircleFromPoints(
    p1: Point,
    p2: Point,
    p3: Point
  ): { centerX: number; centerY: number; radius: number } | null {
    const x1 = p1.getX(),
      y1 = p1.getY();
    const x2 = p2.getX(),
      y2 = p2.getY();
    const x3 = p3.getX(),
      y3 = p3.getY();

    const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    if (Math.abs(a) < 1e-10) {
      // Points are colinear
      return null;
    }

    const b =
      ((x1 * x1 + y1 * y1) * (y3 - y2) +
        (x2 * x2 + y2 * y2) * (y1 - y3) +
        (x3 * x3 + y3 * y3) * (y2 - y1)) /
      (2 * a);
    const c =
      ((x1 * x1 + y1 * y1) * (x2 - x3) +
        (x2 * x2 + y2 * y2) * (x3 - x1) +
        (x3 * x3 + y3 * y3) * (x1 - x2)) /
      (2 * a);

    const centerX = b;
    const centerY = c;
    const radius = Math.sqrt((x1 - centerX) ** 2 + (y1 - centerY) ** 2);

    return { centerX, centerY, radius };
  }

  private isArcClockwise(startAngle: number, midAngle: number, endAngle: number): boolean {
    const angles = [startAngle, midAngle, endAngle].map((angle) =>
      angle < 0 ? angle + 2 * Math.PI : angle
    );

    const angleStart = angles[0];
    const angleMid = angles[1];
    const angleEnd = angles[2];

    const angleDeltaStartMid = this.normalizeAngle(angleMid - angleStart);
    const angleDeltaMidEnd = this.normalizeAngle(angleEnd - angleMid);
    const totalAngle = this.normalizeAngle(angleEnd - angleStart);

    // If the sum of deltas is greater than the total angle, arc is clockwise
    return angleDeltaStartMid + angleDeltaMidEnd > totalAngle;
  }

  private normalizeAngle(angle: number): number {
    angle = angle % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  }
}
