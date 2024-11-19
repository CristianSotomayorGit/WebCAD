// src/domain/entities/Circle.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { CircleShader } from '../../shaders/CircleShader';
import { Point } from './Point';

export class Circle extends RenderableEntity {
  private points: Point[] = [];
  private centerX: number;
  private centerY: number;
  private radius: number;
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer, centerX: number, centerY: number, radius: number) {
    super(renderer);
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;

    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: CircleShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: CircleShader.FRAGMENT,
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
      primitive: { topology: 'line-strip' },
    });
  }

  private createBuffers(): void {
    const numSegments = 128; // Increased for smoother rendering
    const angleIncrement = (2 * Math.PI) / numSegments;
    const vertices: number[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const angle = i * angleIncrement;
      const x = this.centerX + this.radius * Math.cos(angle);
      const y = this.centerY + this.radius * Math.sin(angle);
      vertices.push(x, y);
    }

    this.numVertices = vertices.length / 2;

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    const vertexData = new Float32Array(vertices);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  public setRadius(radius: number): void {
    this.radius = radius;
    this.createBuffers();
  }

  public override draw(renderPass: GPURenderPassEncoder, drawVertices:boolean): void {
    if (this.vertexBuffer && this.numVertices > 0) {

      if (drawVertices) {
        for (let point of this.points) point.draw(renderPass);
      }

      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    super.dispose();
  }

  public addPoint(point: Point): void {
    this.points.push(point);
  }
}
