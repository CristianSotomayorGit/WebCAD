// src/domain/entities/Rectangle.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from './Point';

export class Rectangle {
  private device: GPUDevice;
  private renderer: Renderer;
  private vertexBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup;
  private pipeline: GPURenderPipeline;
  private vertices: Float32Array = new Float32Array(0);
  private cornerPoints: Point[] = [];

  constructor(renderer: Renderer, private startX: number, private startY: number) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.bindGroup = renderer.getBindGroup();
    this.pipeline = renderer.getRectanglePipeline();

    // Initialize the rectangle with start point as both corners
    this.updateEndPoint(this.startX, this.startY);

    // Create corner points
    const startPoint = new Point(this.startX, this.startY, this.renderer);
    this.cornerPoints.push(startPoint);
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
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.vertices.length / 2);
    }

    // Draw corner points
    for (const point of this.cornerPoints) {
      point.draw(renderPass);
    }
  }

  public getCornerPoints(): Point[] {
    return this.cornerPoints;
  }

  public dispose(): void {
    // Clean up resources
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }
    // Dispose corner points
    for (const point of this.cornerPoints) {
      point.dispose();
    }
  }
}
