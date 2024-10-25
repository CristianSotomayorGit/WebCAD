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
  // private nearest: Point | null = null;


  constructor(
    target: ConstraintTarget = 'both',
    entityManager: EntityManager,
    renderer: Renderer,
    threshold: number = 0.02
  ) {
    this.target = target;
    this.entityManager = entityManager;
    this.renderer = renderer;
    this.threshold = threshold;
  }

  apply(point: Point, referencePoint?: Point): Point | null {
    const mouse = { x: point.getX(), y: point.getY() };
    let minDist = Infinity;
    // let nearest: Point | null = null;
    // this.nearest = null;

    for (const entity of this.entityManager.getEntities()) {
      if (entity instanceof Point) {
        const dx = entity.getX() - mouse.x;
        const dy = entity.getY() - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist && dist <= this.threshold) {
          minDist = dist;
          entity.setColor(new Float32Array([1.0, 1.0, 0.0, 1.0])); // Highlighted color

          return new Point(entity.getX(), entity.getY(), this.renderer);
        }

        else entity.resetColor();
      }
    }

    // if (this.nearest) {
    //   // Optional: Provide visual feedback by changing colors
    //   this.nearest.setColor(new Float32Array([1.0, 1.0, 0.0, 1.0])); // Highlighted color
    //   // nearest.setColor(new Float32Array([0.5, 0.5, 0.5, 1.0])); // Dimmed color      
    //   return this.nearest;
    // }
    return null;
  }
}
