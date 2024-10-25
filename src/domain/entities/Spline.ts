// src/domain/entities/Spline.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { SplineShader } from '../../shaders/SplineShader'; // Ensure you have SplineShader implemented
import { Point } from './Point';

export class Spline extends RenderableEntity {
  private controlPoints: Point[] = [];
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer) {
    super(renderer);
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
      },
    });
  }

  public addControlPoint(point: Point): void {
    this.controlPoints.push(point);
    this.updateVertexBuffer();
  }

  public updateControlPoint(index: number, x: number, y: number): void {
    if (index >= 0 && index < this.controlPoints.length) {
      this.controlPoints[index].setX(x);
      this.controlPoints[index].setY(y);
      this.updateVertexBuffer();
    }
  }

  public updateVertexBuffer(): void {
    const vertices: number[] = [];
    const numSegments = 20; // Adjust for curve smoothness per segment

    if (this.controlPoints.length >= 2) {
      for (let i = 0; i < this.controlPoints.length - 1; i++) {
        // For each segment between control points
        for (let j = 0; j <= numSegments; j++) {
          const t = j / numSegments;
          const point = this.calculateSplinePoint(i, t);
          vertices.push(point.x, point.y);
        }
      }
    }

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

  private calculateSplinePoint(segmentIndex: number, t: number): { x: number; y: number } {
    // Use Catmull-Rom spline interpolation
    const p0 = this.getControlPoint(segmentIndex - 1);
    const p1 = this.getControlPoint(segmentIndex);
    const p2 = this.getControlPoint(segmentIndex + 1);
    const p3 = this.getControlPoint(segmentIndex + 2);

    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      0.5 *
      ((2 * p1.getX()) +
        (-p0.getX() + p2.getX()) * t +
        (2 * p0.getX() - 5 * p1.getX() + 4 * p2.getX() - p3.getX()) * t2 +
        (-p0.getX() + 3 * p1.getX() - 3 * p2.getX() + p3.getX()) * t3);

    const y =
      0.5 *
      ((2 * p1.getY()) +
        (-p0.getY() + p2.getY()) * t +
        (2 * p0.getY() - 5 * p1.getY() + 4 * p2.getY() - p3.getY()) * t2 +
        (-p0.getY() + 3 * p1.getY() - 3 * p2.getY() + p3.getY()) * t3);

    return { x, y };
  }

  private getControlPoint(index: number): Point {
    const total = this.controlPoints.length;
    if (index < 0) {
      return this.controlPoints[0];
    } else if (index >= total) {
      return this.controlPoints[total - 1];
    } else {
      return this.controlPoints[index];
    }
  }

  public getControlPoints(): Point[] {
    return this.controlPoints;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }

    // Optionally, draw control points
    // for (const point of this.controlPoints) {
    //   point.draw(renderPass);
    // }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }

    for (const point of this.controlPoints) {
      point.dispose();
    }
    this.controlPoints = [];

    super.dispose();
  }
}
