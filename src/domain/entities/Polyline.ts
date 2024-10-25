// src/domain/entities/Polyline.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { PolylineShader } from '../../shaders/PolylineShader'; // Ensure you have PolylineShader implemented
import { Point } from './Point';

export class Polyline extends RenderableEntity {
  private points: Point[] = [];
  private vertexBuffer: GPUBuffer | null = null;
  private vertexCount: number = 0;

  constructor(renderer: Renderer) {
    super(renderer);
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

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.vertexCount > 1) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertexCount);
    }

    // Optionally, draw the control points
    // for (const point of this.points) {
    //   point.draw(renderPass);
    // }
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
}
