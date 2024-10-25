// src/domain/entities/Rectangle.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { RectangleShader } from '../../shaders/RectangleShader';
import { Point } from './Point';

export class Rectangle extends RenderableEntity {
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private vertexBuffer: GPUBuffer | null = null;
  private vertices: Float32Array = new Float32Array(0);
  private cornerPoints: Point[] = [];

  constructor(renderer: Renderer, startX: number, startY: number) {
    super(renderer);
    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;

    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();

    const startPoint = new Point(this.startX, this.startY, this.renderer);
    this.cornerPoints.push(startPoint);
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: RectangleShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: RectangleShader.FRAGMENT,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
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

  private createBuffers(): void {
    this.updateVertices();
  }

  public updateEndPoint(endX: number, endY: number): void {
    this.endX = endX;
    this.endY = endY;
    this.updateVertices();
  }

  private updateVertices(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    this.vertices = new Float32Array([
      // Edge from top-left to top-right
      this.startX, this.startY,
      this.endX, this.startY,

      // Edge from top-right to bottom-right
      this.endX, this.startY,
      this.endX, this.endY,

      // Edge from bottom-right to bottom-left
      this.endX, this.endY,
      this.startX, this.endY,

      // Edge from bottom-left to top-left
      this.startX, this.endY,
      this.startX, this.startY,
    ]);

    // Update corner points
    if (this.cornerPoints.length < 2) {
      const endPoint = new Point(this.endX, this.endY, this.renderer);
      this.cornerPoints.push(endPoint);
    } else {
      this.cornerPoints[1].setX(this.endX);
      this.cornerPoints[1].setY(this.endY);
    }

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
  }

  public getCornerPoints(): Point[] {
    return this.cornerPoints;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertices.length / 2);
    }

    for (const point of this.cornerPoints) {
      point.draw(renderPass);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }

    for (const point of this.cornerPoints) {
      point.dispose();
    }
    this.cornerPoints = [];

    super.dispose();
  }
}