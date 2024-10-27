// src/domain/entities/Point.ts

import { RenderableEntity } from './RenderableEntity';
import { PointShader } from '../../shaders/PointShader';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Point extends RenderableEntity {
  private x: number;
  private y: number;
  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private vertexCount!: number;

  constructor(x: number, y: number, renderer: Renderer) {
    // Initialize with default color (gray)
    super(renderer, new Float32Array([0.5, 0.5, 0.5, 1.0]));
    this.x = x;
    this.y = y;

    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: PointShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: PointShader.FRAGMENT,
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
            arrayStride: 2 * 4, // 2 floats (x, y)
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
        topology: 'line-list',
      },
    });
  }

  private createBuffers(): void {
    const size = 0.015; // Adjust as needed
    const halfSize = size / 2;

    const vertices = new Float32Array([
      this.x - halfSize, this.y - halfSize, // Bottom-left (0)
      this.x + halfSize, this.y - halfSize, // Bottom-right (1)
      this.x + halfSize, this.y + halfSize, // Top-right (2)
      this.x - halfSize, this.y + halfSize, // Top-left (3)
    ]);

    const indices = new Uint16Array([
      0, 1, // Bottom edge
      1, 2, // Right edge
      2, 3, // Top edge
      3, 0, // Left edge
    ]);

    this.vertexCount = indices.length;

    // Create vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    // Create index buffer
    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();
  }

  private updateBuffers(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }
    this.createBuffers();
  }

  public setX(x: number): void {
    this.x = x;
    this.updateBuffers();
  }

  public setY(y: number): void {
    this.y = y;
    this.updateBuffers();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.indexBuffer && this.vertexCount > 0) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
      renderPass.drawIndexed(this.vertexCount);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null as any;
    }
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
      this.indexBuffer = null as any;
    }
    super.dispose();
  }

  protected updateTransform(): void {
    this.x = this.position.x;
    this.y = this.position.y;
    this.createBuffers(); // Recreate buffers with new position
  }

  public isPointInside(x: number, y: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    const distanceSquared = dx * dx + dy * dy;
    const radius = 0.02; // Adjust as needed
    return distanceSquared <= radius * radius;
  }
}
