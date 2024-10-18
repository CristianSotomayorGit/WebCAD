// src/domain/constraints/Constraint.ts

export interface Constraint {
    /**
     * Applies the constraint to a given point, possibly modifying it.
     * @param currentPoint The current point being adjusted.
     * @param referencePoint A reference point (e.g., the starting point of a line).
     * @returns The adjusted point after applying the constraint.
     */
    apply(
      currentPoint: { x: number; y: number },
      referencePoint: { x: number; y: number }
    ): { x: number; y: number };
  }
  