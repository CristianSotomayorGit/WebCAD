//TODO:
// 1. fix issues with side input
// 2. fix issue with vertex highlighting

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { PolygonShader } from '../../shaders/PolygonShader';
import { Point } from './Point';

export class Polygon {
  private centerX: number;
  private centerY: number;
  private numSides: number;
  private radius: number = 0;
  private vertices: Float32Array = new Float32Array(0);
  private vertexBuffer: GPUBuffer | null = null;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private device: GPUDevice;
  private renderer: Renderer;
  private points: Point[] = [];
  private color: Float32Array;

  constructor(renderer: Renderer, centerX: number, centerY: number, numSides: number) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0])
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();
    this.centerX = centerX;
    this.centerY = centerY;
    this.numSides = numSides;
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
    const polygonVertexShaderModule = this.device.createShaderModule({
      code: PolygonShader.VERTEX,
    });

    const polygonFragmentShaderModule = this.device.createShaderModule({
      code: PolygonShader.FRAGMENT,
    });

    const polygonPipelineLayout = this.device.createPipelineLayout({
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
      layout: polygonPipelineLayout,
      vertex: {
        module: polygonVertexShaderModule,
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
        module: polygonFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'line-strip',
        stripIndexFormat: undefined,
        frontFace: 'ccw',
        cullMode: 'none',
      },
    });
  }

  public updateRadiusFromPoint(x: number, y: number): void {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    this.radius = Math.sqrt(dx * dx + dy * dy);
    this.updateVertices();
  }

  private updateVertices(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    const angleIncrement = (2 * Math.PI) / this.numSides;
    const verticesArray: number[] = [];
    this.points = []; // Reset points

    for (let i = 0; i <= this.numSides; i++) {
      const angle = i * angleIncrement;
      const x = this.centerX + this.radius * Math.cos(angle);
      const y = this.centerY + this.radius * Math.sin(angle);
      verticesArray.push(x, y);

      if (i < this.numSides) {
        // Create point representations for each vertex
        const point = new Point(x, y, this.renderer);
        this.points.push(point);
      }
    }

    this.vertices = new Float32Array(verticesArray);

    if (this.vertices.length > 0) {
      this.vertexBuffer = this.device.createBuffer({
        size: this.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    }
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.vertices.length >= 4) {
      this.updateCameraBuffer();
      this.updateColorBuffer(this.color);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertices.length / 2);
    }

    // Draw point representations
    for (const point of this.points) {
      point.draw(renderPass);
    }
  }

  public dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null as any;
    }

    // Dispose of point representations
    for (const point of this.points) {
      point.dispose();
    }
    this.points = [];
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
