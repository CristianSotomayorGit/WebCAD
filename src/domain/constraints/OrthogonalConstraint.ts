// src/domain/constraints/OrthogonalConstraint.ts

import { Constraint } from './Constraint';

export class OrthogonalConstraint implements Constraint {
  public apply(
    currentPoint: { x: number; y: number },
    referencePoint: { x: number; y: number }
  ): { x: number; y: number } {
    const deltaX = Math.abs(currentPoint.x - referencePoint.x);
    const deltaY = Math.abs(currentPoint.y - referencePoint.y);

    if (deltaX > deltaY) {
      // Constrain to horizontal line
      return { x: currentPoint.x, y: referencePoint.y };
    } else {
      // Constrain to vertical line
      return { x: referencePoint.x, y: currentPoint.y };
    }
  }
}
