// src/domain/entities/Line.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { LineShader } from '../../shaders/LineShader';
import { Point } from './Point';

export class Line {
  private vertexBuffer: GPUBuffer;
  private cameraBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private device: GPUDevice;
  private renderer: Renderer;
  private startPoint: Point;
  private endPoint: Point;
  private color: Float32Array;

  constructor(
    startPoint: Point,
    endPoint: Point,
    renderer: Renderer
  ) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0]); // Default color: Red
    this.device = renderer.getDevice();
    this.renderer = renderer;
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.pipeline = this.setupPipeline();
    this.cameraBuffer = this.createCameraBuffer();
    this.colorBuffer = this.createColorBuffer();
    this.vertexBuffer = this.createVertexBuffer();

    this.bindGroup = this.setupBindGroup();
  }

  private setupPipeline(): GPURenderPipeline {
    const lineVertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const lineFragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
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
        module: lineVertexShaderModule,
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
        module: lineFragmentShaderModule,
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

  private createVertexBuffer(): GPUBuffer {
    const vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);
    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, vertices);
    return buffer;
  }

  public updateVertexBuffer(): void {
    const vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
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

  public setStartPoint(startPoint: Point): void {
    this.startPoint = startPoint;
    this.updateVertexBuffer();
  }

  public setEndPoint(endPoint: Point): void {
    this.endPoint = endPoint;
    this.updateVertexBuffer();
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    this.updateCameraBuffer();
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(2);
  }

  private updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public getStartpoint(): Point {
    return this.startPoint;
  }

  public getEndpoint(): Point {
    return this.endPoint;
  }

  public setColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error('Color must be a Float32Array with 4 components (RGBA).');
    }
    this.color = color;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }
}
