// src/domain/entities/Polygon.ts

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
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0]);
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.centerX = centerX;
    this.centerY = centerY;
    this.numSides = numSides;

    this.pipeline = this.setupPipeline();
    this.cameraBuffer = this.createCameraBuffer();
    this.colorBuffer = this.createColorBuffer();
    this.bindGroup = this.setupBindGroup();

    // Initialize radius to a default value
    this.radius = 1; // Or any default value
    this.updateVertices();
  }

  // Method to set the number of sides and update the polygon
  public setNumSides(numSides: number): void {
    this.numSides = numSides;
    this.updateVertices();
  }

  // Method to update the radius based on a point (e.g., mouse position)
  public updateRadiusFromPoint(x: number, y: number): void {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    this.radius = Math.sqrt(dx * dx + dy * dy);
    this.updateVertices();
  }

  private updateVertices(): void {
    // Destroy previous vertex buffer if it exists
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

    // Create new vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
  }

  private setupPipeline(): GPURenderPipeline {
    const vertexShaderModule = this.device.createShaderModule({
      code: PolygonShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: PolygonShader.FRAGMENT,
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
        module: vertexShaderModule,
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
        frontFace: 'ccw',
        cullMode: 'none',
      },
    });
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

  private updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.vertices.length >= 4) {
      this.updateCameraBuffer();
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
      this.vertexBuffer = null;
    }

    // Dispose of point representations
    for (const point of this.points) {
      point.dispose();
    }
    this.points = [];
  }

  public updateColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error("Color must be a Float32Array with 4 components (RGBA).");
    }
    this.color = color;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }
}
