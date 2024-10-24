// constraints/OrthogonalConstraint.ts

import { Constraint, ConstraintTarget } from './Constraint';
import { ConstraintType } from './ConstraintTypes';
import { Point } from '../entities/Point';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class OrthogonalConstraint implements Constraint {
  type: ConstraintType = ConstraintType.Orthogonal;
  target: ConstraintTarget;
  private renderer: Renderer;


  constructor(target: ConstraintTarget = 'end', renderer: Renderer) {
    this.target = target;
    this.renderer = renderer;
  }

  apply(point: Point, referencePoint?: Point): Point {
    if (!referencePoint) return point;

    const dx = point.getX() - referencePoint.getX();
    const dy = point.getY() - referencePoint.getY();

    // Align horizontally or vertically based on the dominant direction
    if (Math.abs(dx) > Math.abs(dy)) {
      return new Point(point.getX(), referencePoint.getY(), this.renderer);
    } else {
      return new Point(referencePoint.getX(), point.getY(), this.renderer);
    }
  }
}
