// src/domain/entities/Point.ts
import { Renderer } from '../../infrastructure/rendering/Renderer';

export class Point {
  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private pipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private device!: GPUDevice;
  private vertexCount!: number;

  constructor(
    private x: number,
    private y: number,
    renderer: Renderer
  ) {
    this.device = renderer.getDevice();
    this.pipeline = renderer.getPointPipeline();
    this.bindGroup = renderer.getBindGroup();

    this.createBuffers();
  }

  private createBuffers() {
    // Create a square centered at (x, y)
    const size = 0.015; // Adjust size as needed

    const halfSize = size / 2;
    const vertices = new Float32Array([
      this.x - halfSize, this.y - halfSize, // Bottom-left
      this.x + halfSize, this.y - halfSize, // Bottom-right
      this.x + halfSize, this.y + halfSize, // Top-right
      this.x - halfSize, this.y + halfSize, // Top-left
    ]);

    const indices = new Uint16Array([
      0, 1, 2, // First triangle
      0, 2, 3, // Second triangle
    ]);

    // Create vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    // Create index buffer
    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();

    this.vertexCount = indices.length;
  }

  public draw(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
    renderPass.drawIndexed(this.vertexCount);
  }

  public getX(): number {
    return this.x;
  }

  public setX(x: number) {
    this.x = x;
    this.updateBuffers();
  }

  public getY(): number {
    return this.y;
  }

  public setY(y: number) {
    this.y = y;
    this.updateBuffers();
  }

  private updateBuffers() {
    // Recreate the vertex buffer with the new position
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }
    // Recreate buffers
    this.createBuffers();
  }

  public dispose() {
    // Destroy GPU resources
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null as any;
    }
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
      this.indexBuffer = null as any;
    }
  }
}
