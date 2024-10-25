// constraints/Constraint.ts

import { ConstraintType } from './ConstraintTypes';
import { Point } from '../entities/Point';

export type ConstraintTarget = 'start' | 'end' | 'both';

export interface Constraint {
  type: ConstraintType;
  target: ConstraintTarget;
  apply(point: Point, referencePoint?: Point): Point| null;
}
