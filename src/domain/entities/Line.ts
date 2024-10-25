// src/domain/entities/Line.ts

import { RenderableEntity } from './RenderableEntity';
import { LineShader } from '../../shaders/LineShader';
import { Point } from './Point';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Line extends RenderableEntity {
  private startPoint: Point;
  private endPoint: Point;
  private vertexBuffer: GPUBuffer;

  constructor(startPoint: Point, endPoint: Point, renderer: Renderer) {
    super(renderer);
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.vertexBuffer = this.createVertexBuffer();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [{ format: this.renderer.getFormat() }],
      },
      primitive: { topology: 'line-list' },
    });
  }

  private createVertexBuffer(): GPUBuffer {
    const vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);
    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, vertices);
    return buffer;
  }

  public updateVertexBuffer(): void {
    const vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  public setStartPoint(startPoint: Point): void {
    this.startPoint = startPoint;
    this.updateVertexBuffer();
  }

  public setEndPoint(endPoint: Point): void {
    this.endPoint = endPoint;
    this.updateVertexBuffer();
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    this.updateCameraBuffer();
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(2);
  }
}
