// src/utils/Transformations.ts

export function translate2D(
    position: { x: number; y: number },
    deltaX: number,
    deltaY: number
  ): { x: number; y: number } {
    return {
      x: position.x + deltaX,
      y: position.y + deltaY,
    };
  }
  