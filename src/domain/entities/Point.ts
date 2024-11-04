// src/domain/entities/Point.ts

import { RenderableEntity } from './RenderableEntity';
import { PointShader } from '../../shaders/PointShader';
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Point extends RenderableEntity {
  private x: number;
  private y: number;
  private vertexBuffer!: GPUBuffer;
  private vertexCount!: number;
  private uniformBuffer!: GPUBuffer;

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
            arrayStride: 2 * 4, // 2 floats (vertexPosition)
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
        topology: 'triangle-strip',
      },
    });
  }

  private createBuffers(): void {
    const vertices = new Float32Array([
      -0.5, -0.5, // Bottom-left
      0.5, -0.5,  // Bottom-right
      -0.5, 0.5,  // Top-left
      0.5, 0.5,   // Top-right
    ]);

    this.vertexCount = 4;

    // Create vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();
  }

  public setupBindGroup(): void {
    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 32, // 8 floats * 4 bytes per float
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create color buffer
    this.colorBuffer = this.device.createBuffer({
      size: 16, // 4 floats * 4 bytes per float
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.colorBuffer.getMappedRange()).set(this.color);
    this.colorBuffer.unmap();

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.colorBuffer,
          },
        },
      ],
    });
  }

  public setX(x: number): void {
    this.x = x;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.vertexCount > 0) {
      this.updateUniformBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertexCount, 1, 0, 0);
    }
  }

  private updateUniformBuffer(): void {
    const cameraOffset = this.renderer.getCamera().getOffset();
    const zoomFactor = this.renderer.getCamera().getZoom();

    const pointSize = 0.015; // Adjust as needed

    const uniformData = new Float32Array([
      cameraOffset.x, // cameraOffset.x
      cameraOffset.y, // cameraOffset.y
      zoomFactor,     // zoomFactor
      pointSize,      // pointSize
      this.x,         // pointPosition.x
      this.y,         // pointPosition.y
      0.0,            // Padding (optional, to align to 32 bytes)
      0.0,            // Padding (optional)
    ]);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      uniformData.buffer,
      uniformData.byteOffset,
      uniformData.byteLength
    );
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null as any;
    }
    if (this.uniformBuffer) {
      this.uniformBuffer.destroy();
      this.uniformBuffer = null as any;
    }
    super.dispose();
  }
}
