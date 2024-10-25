// src/domain/entities/Entity.ts

export interface Entity {
  draw(renderPass: GPURenderPassEncoder): void;
  dispose(): void;
}
