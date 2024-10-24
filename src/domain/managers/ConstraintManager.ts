// managers/ConstraintManager.ts

import { Constraint, ConstraintTarget } from '../constraints/Constraint';
import { ConstraintType } from '../constraints/ConstraintTypes';
import { Point } from '../entities/Point';
import { OrthogonalConstraint } from '../constraints/OrthogonalConstraint';
import { PointSnapConstraint } from '../constraints/PointSnapConstraint';
import { EntityManager } from './EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class ConstraintManager {
  private constraints: Constraint[] = [];
  private entityManager: EntityManager;
  private renderer: Renderer;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  addActiveConstraint(type: ConstraintType, target: ConstraintTarget = 'end') {
    // Prevent adding duplicate constraints of the same type and target
    if (this.constraints.some(c => c.type === type && c.target === target)) {
      return;
    }

    let constraint: Constraint;

    switch (type) {
      case ConstraintType.Snap:
        constraint = new PointSnapConstraint(target, this.entityManager, this.renderer);
        break;
      case ConstraintType.Orthogonal:
        constraint = new OrthogonalConstraint(target, this.renderer);
        break;
      // Add more cases for additional constraint types
      default:
        throw new Error(`Unsupported constraint type: ${type}`);
    }

    this.constraints.push(constraint);
    console.log(`Constraint added: ${type} targeting ${target}`);
  }

  removeActiveConstraint(type: ConstraintType, target: ConstraintTarget = 'end') {
    const index = this.constraints.findIndex(
      c => c.type === type && c.target === target
    );
    if (index !== -1) {
      this.constraints.splice(index, 1);
      console.log(`Constraint removed: ${type} targeting ${target}`);
    }
  }

  toggleConstraint(type: ConstraintType, target: ConstraintTarget = 'end') {
    const exists = this.constraints.some(
      c => c.type === type && c.target === target
    );
    if (exists) {
      this.removeActiveConstraint(type, target);
    } else {
      this.addActiveConstraint(type, target);
    }
  }

  hasActiveConstraints(): boolean {
    return this.constraints.length > 0;
  }

  getActiveConstraints(): Constraint[] {
    return this.constraints;
  }

  applyConstraints(
    point: Point,
    referencePoint: Point,
    target: ConstraintTarget
  ): Point {
    let constrainedPoint = point;
    // Apply constraints in the order they were added
    for (const constraint of this.constraints) {
      if (constraint.target === target || constraint.target === 'both') {
        constrainedPoint = constraint.apply(constrainedPoint, referencePoint);
      }
    }
    return constrainedPoint;
  }

  clearConstraints() {
    this.constraints = [];
    console.log('All constraints cleared.');
  }
}
