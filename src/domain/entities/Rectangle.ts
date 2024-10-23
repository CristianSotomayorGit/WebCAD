//TODO:
// 1. Add point to every coner and fix why point highlighting is not working

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { RectangleShader } from '../../shaders/RectangleShader';
import { Point } from './Point';

export class Rectangle {
  private device: GPUDevice;
  private renderer: Renderer;
  private vertexBuffer: GPUBuffer | null = null;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private bindGroup: GPUBindGroup;
  private pipeline: GPURenderPipeline;
  private vertices: Float32Array = new Float32Array(0);
  private cornerPoints: Point[] = [];
  private color: Float32Array;

  constructor(renderer: Renderer, private startX: number, private startY: number) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0])
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();

    this.updateEndPoint(this.startX, this.startY);

    const startPoint = new Point(this.startX, this.startY, this.renderer);
    this.cornerPoints.push(startPoint);
  }

  private setupBindGroup(): GPUBindGroup {
    const cameraData = new Float32Array([0, 0, 1, 0]);
    const initialColor = this.color;

    this.cameraBuffer = this.device.createBuffer({
      size: cameraData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.colorBuffer = this.device.createBuffer({
      size: initialColor.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
    this.device.queue.writeBuffer(this.colorBuffer, 0, initialColor);

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.cameraBuffer,
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

    return bindGroup;
  }
  private setupPipeline() {
    const rectangleVertexShaderModule = this.device.createShaderModule({
      code: RectangleShader.VERTEX,
    });

    const rectangleFragmentShaderModule = this.device.createShaderModule({
      code: RectangleShader.FRAGMENT,
    });

    const rectanglePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'uniform',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform',
            },
          },
        ],
      })],
    });

    return this.device.createRenderPipeline({
      layout: rectanglePipelineLayout,
      vertex: {
        module: rectangleVertexShaderModule,
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
        module: rectangleFragmentShaderModule,
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

  public updateEndPoint(endX: number, endY: number): void {
    // Update the vertices for an outline rectangle using line-list topology
    this.vertices = new Float32Array([
      // Edge from top-left to top-right
      this.startX, this.startY,
      endX, this.startY,

      // Edge from top-right to bottom-right
      endX, this.startY,
      endX, endY,

      // Edge from bottom-right to bottom-left
      endX, endY,
      this.startX, endY,

      // Edge from bottom-left to top-left
      this.startX, endY,
      this.startX, this.startY,
    ]);

    // Update corner points
    if (this.cornerPoints.length < 2) {
      const endPoint = new Point(endX, endY, this.renderer);
      this.cornerPoints.push(endPoint);
    } else {
      this.cornerPoints[1].setX(endX);
      this.cornerPoints[1].setY(endY);
    }

    this.updateVertexBuffer();
  }

  private updateVertexBuffer(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer) {
      this.updateCameraBuffer();
      this.updateColorBuffer(this.color);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertices.length / 2);
    }

    for (const point of this.cornerPoints) {
      point.draw(renderPass);
    }
  }

  public getCornerPoints(): Point[] {
    return this.cornerPoints;
  }

  public dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    for (const point of this.cornerPoints) {
      point.dispose();
    }
  }

  public updateCameraBuffer() {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);


    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public updateColorBuffer(newColor: Float32Array) {
    if (newColor.length !== 4) {
      throw new Error("Color must be a Float32Array with 4 components (RGBA).");
    }

    this.device.queue.writeBuffer(this.colorBuffer, 0, newColor);
  }
}
