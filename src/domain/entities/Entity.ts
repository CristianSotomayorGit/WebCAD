// src/domain/entities/Entity.ts

export interface Entity {
  draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void;
  dispose(): void;

}
