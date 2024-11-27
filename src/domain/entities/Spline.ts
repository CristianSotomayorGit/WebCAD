// src/domain/entities/Spline.ts

import { RenderableEntity } from "./RenderableEntity";
import { Renderer } from "../../infrastructure/rendering/Renderer";
import { Point } from "./Point";

export class Spline extends RenderableEntity {
  private controlPoints: Point[];
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;
  public cameraBuffer!: GPUBuffer;
  public colorBuffer!: GPUBuffer;
  public bindGroup!: GPUBindGroup;

  constructor(renderer: Renderer, controlPoints: Point[]) {
    super(renderer);
    this.controlPoints = controlPoints;

    this.setupPipeline();
    this.createUniformBuffers();
    this.updateVertexBuffer();
  }

  private updateVertexBuffer(): void {
    const vertices: number[] = [];

    // Generate points along the spline curve
    const sampledPoints = this.sampleSpline();
    for (const point of sampledPoints) {
      vertices.push(point.x, point.y);
    }

    this.numVertices = vertices.length / 2;

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    const vertexData = new Float32Array(vertices);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  private sampleSpline(): { x: number; y: number }[] {
    const sampledPoints: { x: number; y: number }[] = [];
    const numSamples = 100; // Adjust for desired smoothness

    // Use a simple Catmull-Rom spline interpolation
    for (let i = 0; i < this.controlPoints.length - 1; i++) {
      const p0 = this.controlPoints[Math.max(i - 1, 0)];
      const p1 = this.controlPoints[i];
      const p2 = this.controlPoints[i + 1];
      const p3 = this.controlPoints[Math.min(i + 2, this.controlPoints.length - 1)];

      for (let j = 0; j < numSamples; j++) {
        const t = j / numSamples;
        const point = this.catmullRomSpline(p0, p1, p2, p3, t);
        sampledPoints.push(point);
      }
    }

    // Add the last control point
    const lastPoint = this.controlPoints[this.controlPoints.length - 1];
    sampledPoints.push({ x: lastPoint.x, y: lastPoint.y });

    return sampledPoints;
  }

  private catmullRomSpline(p0: Point, p1: Point, p2: Point, p3: Point, t: number): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;

    const x =
    0.5 *
    ((2 * p1.getX()) +
      (-p0.getX() + p2.getX()) * t +
      (2 * p0.getX() - 5 * p1.getX() + 4 * p2.getX() - p3.getX()) * t2 +
      (-p0.getX() + 3 * p1.getX() - 3 * p2.getX() + p3.getX()) * t3);
  
  const y =
    0.5 *
    ((2 * p1.getY()) +
      (-p0.getY() + p2.getY()) * t +
      (2 * p0.getY() - 5 * p1.getY() + 4 * p2.getY() - p3.getY()) * t2 +
      (-p0.getY() + 3 * p1.getY() - 3 * p2.getY() + p3.getY()) * t3);
  

    return { x, y };
  }

  protected setupPipeline(): void {
    const vertexShaderCode = `
      struct Uniforms {
        cameraOffset: vec2<f32>,
        zoomFactor: f32,
        padding: f32,
      }

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      @vertex
      fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let pos = (position - uniforms.cameraOffset) * uniforms.zoomFactor;
        return vec4<f32>(pos, 0.0, 1.0);
      }
    `;

    const fragmentShaderCode = `
      @group(0) @binding(1) var<uniform> color: vec4<f32>;

      @fragment
      fn main() -> @location(0) vec4<f32> {
        return color;
      }
    `;

    const vertexShaderModule = this.device.createShaderModule({
      code: vertexShaderCode,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: fragmentShaderCode,
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
      primitive: { topology: 'line-strip' },
    });

    // Create the bind group after setting up the pipeline
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
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

  private createUniformBuffers(): void {
    // Camera buffer
    this.cameraBuffer = this.device.createBuffer({
      size: 4 * 4, // 4 floats
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Color buffer
    this.colorBuffer = this.device.createBuffer({
      size: 4 * 4, // vec4<f32>
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Set default color to green
    const defaultColor = new Float32Array([0.0, 1.0, 0.0, 1.0]);
    this.device.queue.writeBuffer(this.colorBuffer, 0, defaultColor);
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      // Update camera buffer
      const cameraOffset = this.renderer.getCamera().getOffset(); // { x, y }
      const zoomFactor = this.renderer.getCamera().getZoom();

      const cameraData = new Float32Array([
        cameraOffset.x,
        cameraOffset.y,
        zoomFactor,
        0.0, // Padding
      ]);

      this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);

      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public setColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error('Color must be a Float32Array with 4 components (RGBA).');
    }
    this.device.queue.writeBuffer(this.colorBuffer, 0, color);
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    if (this.cameraBuffer) {
      this.cameraBuffer.destroy();
    }
    if (this.colorBuffer) {
      this.colorBuffer.destroy();
    }
    super.dispose();
  }
}
