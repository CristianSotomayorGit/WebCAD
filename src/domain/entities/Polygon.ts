// src/domain/entities/RegularPolygon.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from './Point';

export class Polygon {
  private centerX: number;
  private centerY: number;
  private numSides: number;
  private radius: number = 0;
  private vertices: Float32Array = new Float32Array(0);
  private vertexBuffer: GPUBuffer | null = null;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private device: GPUDevice;
  private renderer: Renderer;
  private points: Point[] = [];

  constructor(renderer: Renderer, centerX: number, centerY: number, numSides: number) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.pipeline = renderer.getPolygonPipeline();
    this.bindGroup = renderer.getBindGroup();
    this.centerX = centerX;
    this.centerY = centerY;
    this.numSides = numSides;
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
}
