// src/domain/entities/Arc.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { ArcShader } from '../../shaders/ArcShader';
import { Point } from './Point';

export class Arc extends RenderableEntity {
  private centerX: number;
  private centerY: number;
  private radius: number;
  private startAngle: number;
  private endAngle: number;
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;
  private isClockwise: boolean;

  // Add properties for points
  private startPoint: Point | null = null;
  private midPoint: Point | null = null;
  private endPoint: Point | null = null;

  constructor(
    renderer: Renderer,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    isClockwise: boolean = false,
    startPoint?: Point,
    midPoint?: Point,
    endPoint?: Point
  ) {
    super(renderer, new Float32Array([0.0, 1.0, 0.0, 1.0])); // Green color
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.isClockwise = isClockwise;

    // Store the points if provided
    this.startPoint = startPoint || null;
    this.midPoint = midPoint || null;
    this.endPoint = endPoint || null;

    this.setupPipeline();
    this.updateVertexBuffer();
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: ArcShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: ArcShader.FRAGMENT,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
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
  }

  private updateVertexBuffer(): void {
    const vertices = this.calculateArcVertices();
    this.numVertices = vertices.length / 2;

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    if (vertices.length > 0) {
      const vertexData = new Float32Array(vertices);
      this.vertexBuffer = this.device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    }
  }

  private calculateArcVertices(): number[] {
    const vertices: number[] = [];
    const numSegments = 50; // Adjust for smoothness

    let angleDiff = this.endAngle - this.startAngle;
    if (this.isClockwise) {
      if (angleDiff > 0) angleDiff -= 2 * Math.PI;
    } else {
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
    }

    const angleStep = angleDiff / numSegments;

    for (let i = 0; i <= numSegments; i++) {
      const angle = this.startAngle + angleStep * i;
      const x = this.centerX + this.radius * Math.cos(angle);
      const y = this.centerY + this.radius * Math.sin(angle);
      vertices.push(x, y);
    }

    return vertices;
  }

  public updateArcParameters(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    isClockwise: boolean,
    startPoint?: Point,
    midPoint?: Point,
    endPoint?: Point
  ): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.isClockwise = isClockwise;

    // Update points if provided
    if (startPoint) this.startPoint = startPoint;
    if (midPoint) this.midPoint = midPoint;
    if (endPoint) this.endPoint = endPoint;

    this.updateVertexBuffer();
  }

  // Modify the draw method
  public override draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      if (drawVertices) {
        // Draw the points
        if (this.startPoint) this.startPoint.draw(renderPass);
        if (this.midPoint) this.midPoint.draw(renderPass);
        if (this.endPoint) this.endPoint.draw(renderPass);
      }
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    super.dispose();
  }
}
