// src/domain/entities/Polygon.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { PolygonShader } from '../../shaders/PolygonShader';
import { Point } from './Point';

export class Polygon extends RenderableEntity {
  private centerX: number;
  private centerY: number;
  private numSides: number;
  private radius: number;
  private vertexBuffer: GPUBuffer | null = null;
  private vertices: Float32Array = new Float32Array(0);
  private points: Point[] = [];

  constructor(renderer: Renderer, centerX: number, centerY: number, numSides: number) {
    super(renderer);
    this.centerX = centerX;
    this.centerY = centerY;
    this.numSides = numSides;
    this.radius = 0; // Default radius

    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: PolygonShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: PolygonShader.FRAGMENT,
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
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
            ],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [{ format: this.renderer.getFormat() }],
      },
      primitive: {
        topology: 'line-strip',
        frontFace: 'ccw',
        cullMode: 'none',
      },
    });
  }

  private createBuffers(): void {
    this.updateVertices();
  }

  private updateVertices(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    const angleIncrement = (2 * Math.PI) / this.numSides;
    const verticesArray: number[] = [];
    this.points = []; // Reset points

    for (let i = 0; i <= this.numSides; i++) {
      const angle = i * angleIncrement;
      const x = this.centerX + this.radius * Math.cos(angle);
      const y = this.centerY + this.radius * Math.sin(angle);
      verticesArray.push(x, y);

      this.points.push(new Point(this.centerX, this.centerY, this.renderer))

      if (i < this.numSides) {
        // Create point representations for each vertex
        const point = new Point(x, y, this.renderer);
        this.points.push(point);
      }
    }

    this.vertices = new Float32Array(verticesArray);

    // Create new vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
  }

  public setNumSides(numSides: number): void {
    this.numSides = numSides;
    this.updateVertices();
  }

  public updateRadiusFromPoint(x: number, y: number): void {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    this.radius = Math.sqrt(dx * dx + dy * dy);
    this.updateVertices();
  }

  public override draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void {
    if (this.vertexBuffer && this.vertices.length >= 4) {
      this.updateCameraBuffer();

      if (drawVertices) {
        for (let point of this.points) {
          point.draw(renderPass)
        }
      }

      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertices.length / 2);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }

    // Dispose of point representations
    for (const point of this.points) {
      point.dispose();
    }

    this.points = [];

    super.dispose();
  }

  public addPoint(point: Point): void {
    this.points.push(point);
  }
}
