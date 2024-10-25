// src/domain/entities/Circle.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { CircleShader } from '../../shaders/CircleShader';

export class Circle {
  private device: GPUDevice;
  private renderer: Renderer;
  private centerX: number;
  private centerY: number;
  private radius: number;
  private vertexBuffer: GPUBuffer | null = null;
  private cameraBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private numVertices: number = 0;
  private color: Float32Array;

  constructor(renderer: Renderer, centerX: number, centerY: number, radius: number) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0]); // Default color: Red

    this.pipeline = this.setupPipeline();
    this.cameraBuffer = this.createCameraBuffer();
    this.colorBuffer = this.createColorBuffer();
    this.bindGroup = this.setupBindGroup();

    this.createBuffers();
  }

  private setupPipeline(): GPURenderPipeline {
    const circleVertexShaderModule = this.device.createShaderModule({
      code: CircleShader.VERTEX,
    });

    const circleFragmentShaderModule = this.device.createShaderModule({
      code: CircleShader.FRAGMENT,
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

    return this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: circleVertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4,
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
        module: circleFragmentShaderModule,
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

  private createCameraBuffer(): GPUBuffer {
    const cameraData = new Float32Array([0, 0, 1, 0]);
    const buffer = this.device.createBuffer({
      size: cameraData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, cameraData);
    return buffer;
  }

  private createColorBuffer(): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: this.color.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, this.color);
    return buffer;
  }

  private setupBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.colorBuffer },
        },
      ],
    });
  }

  private createBuffers() {
    const numSegments = 64;
    const angleIncrement = (2 * Math.PI) / numSegments;
    const vertices: number[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const angle = i * angleIncrement;
      const x = this.centerX + this.radius * Math.cos(angle);
      const y = this.centerY + this.radius * Math.sin(angle);
      vertices.push(x, y);
    }

    this.numVertices = vertices.length / 2;

    const vertexData = new Float32Array(vertices);

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  public setRadius(radius: number): void {
    this.radius = radius;
    this.createBuffers();
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.numVertices > 0) {
      this.updateCameraBuffer();
      this.updateColorBuffer(this.color);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  private updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public updateColorBuffer(newColor: Float32Array): void {
    if (newColor.length !== 4) {
      throw new Error("Color must be a Float32Array with 4 components (RGBA).");
    }
    this.color = newColor;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }

  public dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
  }
}
