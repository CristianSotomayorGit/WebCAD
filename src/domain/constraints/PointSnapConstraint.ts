// constraints/PointSnapConstraint.ts

import { Constraint, ConstraintTarget } from './Constraint';
import { ConstraintType } from './ConstraintTypes';
import { Point } from '../entities/Point';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class PointSnapConstraint implements Constraint {
  type: ConstraintType = ConstraintType.Snap;
  target: ConstraintTarget;
  private entityManager: EntityManager;
  private renderer: Renderer;
  private threshold: number;

  constructor(
    target: ConstraintTarget = 'end',
    entityManager: EntityManager,
    renderer: Renderer,
    threshold: number = 0.02
  ) {
    this.target = target;
    this.entityManager = entityManager;
    this.renderer = renderer;
    this.threshold = threshold;
  }

  apply(point: Point, referencePoint?: Point): Point {
    const mouse = { x: point.getX(), y: point.getY() };
    let nearest: Point | null = null;
    let minDist = Infinity;

    for (const entity of this.entityManager.getEntities()) {
      if (entity instanceof Point) {
        const dx = entity.getX() - mouse.x;
        const dy = entity.getY() - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist && dist <= this.threshold) {
          minDist = dist;
          nearest = entity;
        }
      }
    }

    if (nearest) {
      // Optional: Provide visual feedback by changing colors
      nearest.setColor(new Float32Array([1.0, 1.0, 0.0, 1.0])); // Highlighted color
      point.setColor(new Float32Array([0.5, 0.5, 0.5, 1.0])); // Dimmed color

      return new Point(nearest.getX(), nearest.getY(), this.renderer);
    }

    return point;
  }
}
