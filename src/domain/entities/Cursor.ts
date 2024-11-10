// src/domain/entities/Cursor.ts

import { RenderableEntity } from './RenderableEntity';
import { LineShader } from '../../shaders/LineShader';
import { Renderer } from '../../infrastructure/rendering/Renderer';

interface Vertex {
  x: number;
  y: number;
}

export class Cursor extends RenderableEntity {
  private startPoint: Vertex;
  private endPoint: Vertex;
  private vertexBuffer: GPUBuffer;
  private isVisible: boolean = true;
  private flashInterval: number | null = null;

  constructor(startPoint: Vertex, endPoint: Vertex, renderer: Renderer) {
    super(renderer, new Float32Array([1.0, 1.0, 1.0, 1.0])); // Pass white color to super

    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.vertexBuffer = this.createVertexBuffer();
    this.setupFlash();

    // Now that cameraBuffer and colorBuffer are initialized, set up the bind group
    this.setupBindGroup();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
    });

    // Set up the pipeline with auto layout
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
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

    // Do not call setupBindGroup() here; it will be called in the constructor after buffers are initialized
  }

  // No need to declare setupBindGroup() here; it uses the one from RenderableEntity

  private createVertexBuffer(): GPUBuffer {
    const vertices = new Float32Array([
      this.startPoint.x, this.startPoint.y,
      this.endPoint.x, this.endPoint.y,
    ]);
    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, vertices);
    return buffer;
  }

  public updatePosition(startPoint: Vertex, endPoint: Vertex): void {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.updateVertexBuffer();
  }

  private updateVertexBuffer(): void {
    const vertices = new Float32Array([
      this.startPoint.x, this.startPoint.y,
      this.endPoint.x, this.endPoint.y,
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  private setupFlash(): void {
    this.flashInterval = window.setInterval(() => {
      this.isVisible = !this.isVisible;
    }, 500); // Toggle visibility every 500 ms
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (!this.isVisible) return; // Skip drawing if not visible (for blinking effect)

    this.updateCameraBuffer();
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(2);
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      // @ts-ignore
      this.vertexBuffer = null;
    }
    if (this.flashInterval !== null) {
      window.clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    super.dispose();
  }
}
