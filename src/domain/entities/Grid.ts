// src/domain/entities/Grid.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { GridShader } from '../../shaders/GridShader'; // Ensure you have GridShader implemented

export class Grid extends RenderableEntity {
  private vertexBuffer!: GPUBuffer;
  private vertexCount!: number;

  constructor(renderer: Renderer) {
    super(renderer);
    this.createFullscreenQuad();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: GridShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: GridShader.FRAGMENT,
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
      primitive: { topology: 'triangle-list' },
    });
  }

  private createFullscreenQuad(): void {
    const vertices = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0,
    ]);
    this.vertexCount = vertices.length / 2;

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    this.updateCameraBuffer();
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(this.vertexCount);
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null as any;
    }
    super.dispose();
  }
}