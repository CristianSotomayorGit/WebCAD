// src/domain/entities/Polyline.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { PolylineShader } from '../../shaders/PolylineShader'; // Ensure you have PolylineShader implemented
import { Point } from './Point';

interface Vertex {
  x: number;
  y: number;
  bulge?: number;
}

export class Polyline extends RenderableEntity {
  private vertices: Vertex[] = [];
  private numVertices: number = 0;
  private elevation: number = 0;
  private closed: boolean = false;

  private points: Point[] = [];
  private vertexBuffer: GPUBuffer | null = null;
  private vertexCount: number = 0;

  constructor(
    renderer: Renderer, 
    vertices: Vertex[] = [], 
    elevation: number = 0, 
    closed: boolean = false
  ) {
    super(renderer);

    if (vertices.length > 0) {
      this.vertices = vertices;
      this.points = this.vertices.map(vertex => new Point(vertex.x, vertex.y, renderer))
      this.elevation = elevation;
      this.closed = closed;
      this.createBuffers();
      this.setColor(new Float32Array([1.0, 0.0, 0.5, 1.0]));
    }

    this.setupPipeline();
    this.setupBindGroup();
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
            arrayStride: 2 * 4, // 2 floats per vertex
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'line-strip',
      },
    });
  }

  public addPoint(point: Point): void {
    this.points.push(point);
    this.updateVertexBuffer();
  }

  public removePoint(point: Point): void {
    const index = this.points.indexOf(point);
    if (index !== -1) {
      this.points.splice(index, 1);
      point.dispose();
      this.updateVertexBuffer();
    }
  }

  public updatePoint(index: number, x: number, y: number): void {
    if (index >= 0 && index < this.points.length) {
      const point = this.points[index];
      point.setX(x);
      point.setY(y);
      this.updateVertexBuffer();
    }
  }

  public updateVertexBuffer(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    if (this.points.length > 0) {
      const vertices = new Float32Array(this.points.length * 2);
      for (let i = 0; i < this.points.length; i++) {
        vertices[i * 2] = this.points[i].getX();
        vertices[i * 2 + 1] = this.points[i].getY();
      }

      this.vertexCount = this.points.length;

      this.vertexBuffer = this.device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    } else {
      this.vertexBuffer = null;
      this.vertexCount = 0;
    }
  }

  public getPoints(): Point[] {
    return this.points;
  }

  public override draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void {
    if (this.vertexBuffer && this.vertexCount > 1) {

      if (drawVertices) {
        for (let point of this.points) point.draw(renderPass);
      }
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertexCount);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }

    for (const point of this.points) {
      point.dispose();
    }
    this.points = [];

    super.dispose();
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
}
