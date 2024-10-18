// src/domain/entities/Line.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Point } from './Point';

export class Line {
  private vertexBuffer!: GPUBuffer;
  private pipeline!: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private device: GPUDevice;
  private renderer: Renderer;
  private vertices: Float32Array;
  private startPoint: Point;
  private endPoint: Point;

  constructor(
    startPoint: Point,
    endPoint: Point,
    renderer: Renderer
  ) {
    this.device = renderer.getDevice();
    this.renderer = renderer;
    this.pipeline = this.renderer.getLinePipeline();
    this.bindGroup = renderer.getBindGroup();
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);

    this.createBuffers();
  }

  private createBuffers() {
    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.updateVertexBuffer();
  }

  private updateVertexBuffer() {
    this.vertices[0] = this.startPoint.getX();
    this.vertices[1] = this.startPoint.getY();
    this.vertices[2] = this.endPoint.getX();
    this.vertices[3] = this.endPoint.getY();

    this.device.queue.writeBuffer(
      this.vertexBuffer,
      0,
      this.vertices.buffer,
      this.vertices.byteOffset,
      this.vertices.byteLength
    );
  }

  public setEndPoint(endpoint: Point) {
    this.endPoint.setX(endpoint.getX());
    this.endPoint.setY(endpoint.getY());

    this.updateVertexBuffer();
  }

  public draw(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(2);
  }

  public getStartpoint(): Point {
    return this.startPoint;
  }

  public getEndpoint(): Point {
    return this.endPoint;
  }
}
