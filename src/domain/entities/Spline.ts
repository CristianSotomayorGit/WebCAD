// src/domain/entities/Spline.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { SplineShader } from '../../shaders/SplineShader';
import { Point } from './Point';

export class Spline extends RenderableEntity {
  private controlPoints: Point[] = [];
  private knotVector: number[] = [];
  private weights: number[] = [];
  private degree: number = 3; // Default degree for cubic splines
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer, degree: number = 3) {
    super(renderer);
    this.degree = degree;
    this.setupPipeline();
    this.setupBindGroup();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: SplineShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: SplineShader.FRAGMENT,
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
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' }, // controlPosition
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
      },
    });
  }

  public setControlPoints(points: Point[]): void {
    this.controlPoints = points;
    this.updateVertexBuffer();
  }

  public setKnotVector(knotVector: number[]): void {
    this.knotVector = knotVector;
  }

  public setWeights(weights: number[]): void {
    this.weights = weights;
  }

  private updateVertexBuffer(): void {
    const vertices = this.calculateSplineVertices();
    this.numVertices = vertices.length / 2;

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    if (vertices.length > 0) {
      const vertexData = new Float32Array(vertices);
      this.vertexBuffer = this.device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    }
  }

  private calculateSplineVertices(): number[] {
    const vertices: number[] = [];
    const numSegments = 100; // Adjust for spline smoothness

    if (this.controlPoints.length < this.degree + 1 || this.knotVector.length < this.controlPoints.length + this.degree + 1) {
      return vertices; // Insufficient data for spline calculation
    }

    // Evaluate spline points using De Boor's algorithm or similar for B-spline interpolation
    for (let i = 0; i <= numSegments; i++) {
      const t = (this.knotVector[this.knotVector.length - 1] - this.knotVector[0]) * (i / numSegments) + this.knotVector[0];
      const point = this.evaluateBSpline(t);
      vertices.push(point.x, point.y);
    }

    return vertices;
  }

  private evaluateBSpline(t: number): { x: number; y: number } {
    const k = this.findKnotIndex(t);
    const d = this.degree;
    const points = this.controlPoints;
    const knots = this.knotVector;
    const weights = this.weights.length > 0 ? this.weights : new Array(points.length).fill(1);

    const deBoorPoints = points.map((p, i) => ({
      x: p.getX() * weights[i],
      y: p.getY() * weights[i],
      weight: weights[i],
    }));

    for (let r = 1; r <= d; r++) {
      for (let j = k; j > k - d + r - 1; j--) {
        const alpha = (t - knots[j]) / (knots[j + d - r + 1] - knots[j]);
        deBoorPoints[j].x = alpha * deBoorPoints[j].x + (1 - alpha) * deBoorPoints[j - 1].x;
        deBoorPoints[j].y = alpha * deBoorPoints[j].y + (1 - alpha) * deBoorPoints[j - 1].y;
        deBoorPoints[j].weight = alpha * deBoorPoints[j].weight + (1 - alpha) * deBoorPoints[j - 1].weight;
      }
    }

    return {
      x: deBoorPoints[k].x / deBoorPoints[k].weight,
      y: deBoorPoints[k].y / deBoorPoints[k].weight,
    };
  }

  private findKnotIndex(t: number): number {
    const knots = this.knotVector;
    for (let i = this.degree; i < knots.length - this.degree - 1; i++) {
      if (t >= knots[i] && t < knots[i + 1]) {
        return i;
      }
    }
    return knots.length - this.degree - 2;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
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
