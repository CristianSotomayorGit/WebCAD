// src/domain/managers/ConstraintManager.ts

import { Constraint } from '../constraints/Constraint';

export class ConstraintManager {
  private constraints: Constraint[] = [];

  public addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  public removeConstraint(constraint: Constraint): void {
    this.constraints = this.constraints.filter((c) => c !== constraint);
  }

  public clearConstraints(): void {
    this.constraints = [];
  }

  /**
   * Applies all active constraints to the current point.
   * @param currentPoint The point to apply constraints to.
   * @param referencePoint A reference point for constraints that require it.
   * @returns The adjusted point after applying all constraints.
   */
  public applyConstraints(
    currentPoint: { x: number; y: number },
    referencePoint: { x: number; y: number }
  ): { x: number; y: number } {
    let adjustedPoint = { ...currentPoint };
    for (const constraint of this.constraints) {
      adjustedPoint = constraint.apply(adjustedPoint, referencePoint);
    }
    return adjustedPoint;
  }

  public hasConstraints(): boolean {
    return this.constraints.length > 0;
  }
}
