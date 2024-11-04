// src/domain/entities/LWPolyline.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from './Point';
import { PolylineShader } from '../../shaders/PolylineShader';

interface Vertex {
  x: number;
  y: number;
  bulge?: number;
}

export class Polyline extends RenderableEntity {
  private vertices: Vertex[] = [];
  private elevation: number = 0;
  private closed: boolean = false;
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer, vertices: Vertex[], elevation: number = 0, closed: boolean = false) {
    super(renderer);
    this.vertices = vertices;
    this.elevation = elevation;
    this.closed = closed;

    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();
    this.setColor(new Float32Array([1.0, 0.0, 0.5, 1.0]));
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: PolylineShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: PolylineShader.FRAGMENT,
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
            arrayStride: 3 * 4, // x, y, elevation
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
            ],
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
    const vertices: number[] = [];
    for (let i = 0; i < this.vertices.length; i++) {
      const { x, y, bulge } = this.vertices[i];
      vertices.push(x, y, this.elevation);

      // If the vertex has a bulge, add interpolated points to form an arc segment
      if (bulge && i < this.vertices.length - 1) {
        const nextVertex = this.vertices[i + 1];
        const interpolatedPoints = this.interpolateArcPoints({ x, y }, nextVertex, bulge);
        interpolatedPoints.forEach((point) => vertices.push(point.x, point.y, this.elevation));
      }
    }

    if (this.closed && this.vertices.length > 1) {
      const firstVertex = this.vertices[0];
      vertices.push(firstVertex.x, firstVertex.y, this.elevation);
    }

    this.numVertices = vertices.length / 3;

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

  private interpolateArcPoints(start: Vertex, end: Vertex, bulge: number): { x: number; y: number }[] {
    const interpolatedPoints: { x: number; y: number }[] = [];
    const angle = 4 * Math.atan(bulge);
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const radius = distance / (2 * Math.sin(angle / 2));
    const angleStep = angle / 10; // Adjust for smoothness
    const startAngle = Math.atan2(start.y - end.y, start.x - end.x);

    for (let i = 0; i <= 10; i++) {
      const theta = startAngle + i * angleStep;
      const x = start.x + radius * Math.cos(theta);
      const y = start.y + radius * Math.sin(theta);
      interpolatedPoints.push({ x, y });
    }

    return interpolatedPoints;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.numVertices > 0) {
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
}
