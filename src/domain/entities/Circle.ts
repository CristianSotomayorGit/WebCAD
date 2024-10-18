// src/domain/entities/Circle.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Circle {
  private device: GPUDevice;
  private renderer: Renderer;
  private center: { x: number; y: number };
  private radius: number;
  private vertexBuffer!: GPUBuffer;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private numVertices!: number;

  constructor(
    center: { x: number; y: number },
    radius: number,
    renderer: Renderer
  ) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.center = center;
    this.radius = radius;
    this.pipeline = this.renderer.getCirclePipeline();
    this.bindGroup = renderer.getBindGroup();

    this.createBuffers();
  }

  private createBuffers() {
    const numSegments = 64; // Adjust for smoothness
    const angleIncrement = (2 * Math.PI) / numSegments;
    const vertices: number[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const angle = i * angleIncrement;
      const x = this.center.x + this.radius * Math.cos(angle);
      const y = this.center.y + this.radius * Math.sin(angle);
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

  public updateRadius(radius: number) {
    this.radius = radius;
    this.createBuffers();
  }

  public draw(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(this.numVertices);
  }

  public getCenter(): { x: number; y: number } {
    return this.center;
  }

  public getRadius(): number {
    return this.radius;
  }
}
