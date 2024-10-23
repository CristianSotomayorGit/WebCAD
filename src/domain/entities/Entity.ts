// src/domain/entities/Entity.ts
// import { GPUDevice, GPURenderPassEncoder } from 'gpu-web';

export interface Entity {
  draw(renderPass: GPURenderPassEncoder, device: GPUDevice): void;
  select(): void;
}
