// src/domain/entities/RenderableEntity.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Entity } from './Entity';

export abstract class RenderableEntity implements Entity {
  protected renderer: Renderer;
  protected device: GPUDevice;
  protected pipeline!: GPURenderPipeline;
  protected bindGroup!: GPUBindGroup;
  protected cameraBuffer!: GPUBuffer;
  protected colorBuffer!: GPUBuffer;
  protected color: Float32Array;

  constructor(renderer: Renderer, color?: Float32Array) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.color = color || new Float32Array([1.0, 0.0, 0.0, 1.0]); // Default color: Red

    this.setupPipeline();
    this.createCameraBuffer();
    this.createColorBuffer();
    this.setupBindGroup();
  }

  protected abstract setupPipeline(): void;

  protected createCameraBuffer(): void {
    const cameraData = new Float32Array([0, 0, 1, 0]);
    this.cameraBuffer = this.device.createBuffer({
      size: cameraData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  protected createColorBuffer(): void {
    this.colorBuffer = this.device.createBuffer({
      size: this.color.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }

  protected setupBindGroup(): void {
    const bindGroupLayout = this.pipeline.getBindGroupLayout(0);
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.colorBuffer },
        },
      ],
    });
  }

  protected updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public setColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error('Color must be a Float32Array with 4 components (RGBA).');
    }
    this.color = color;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }

  public abstract draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void;
  public dispose(): void {
    if (this.cameraBuffer) {
      this.cameraBuffer.destroy();
    }
    if (this.colorBuffer) {
      this.colorBuffer.destroy();
    }
  }
}
