// // src/domain/entities/Grid.ts
// // import { GPURenderPassEncoder, GPUDevice, GPUBufferUsage } from 'gpu-web';

// export class Grid {
//   private vertexBuffer!: GPUBuffer;
//   private vertexCount!: number;

//   constructor(private device: GPUDevice) {
//     this.createVertexBuffer();
//   }

//   private createVertexBuffer() {
//     const gridSize = 10;
//     const gridSpacing = 0.1;
//     const numLines = 2 * gridSize + 1;
//     const vertices = new Float32Array(numLines * 4 * 2);
//     let vertexIndex = 0;

//     for (let i = -gridSize; i <= gridSize; i++) {
//       // Vertical lines
//       vertices[vertexIndex++] = i * gridSpacing;
//       vertices[vertexIndex++] = -gridSize * gridSpacing;
//       vertices[vertexIndex++] = i * gridSpacing;
//       vertices[vertexIndex++] = gridSize * gridSpacing;

//       // Horizontal lines
//       vertices[vertexIndex++] = -gridSize * gridSpacing;
//       vertices[vertexIndex++] = i * gridSpacing;
//       vertices[vertexIndex++] = gridSize * gridSpacing;
//       vertices[vertexIndex++] = i * gridSpacing;
//     }

//     this.vertexCount = vertices.length / 2;

//     this.vertexBuffer = this.device.createBuffer({
//       size: vertices.byteLength,
//       usage: GPUBufferUsage.VERTEX,
//       mappedAtCreation: true,
//     });

//     new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
//     this.vertexBuffer.unmap();
//   }

//   public draw(renderPass: GPURenderPassEncoder) {
//     renderPass.setVertexBuffer(0, this.vertexBuffer);
//     renderPass.draw(this.vertexCount);
//   }
// }


// src/domain/entities/Grid.ts
// import { GPURenderPassEncoder, GPUDevice, GPUBufferUsage } from 'gpu-web';
import { Renderer } from "../../infrastructure/rendering/Renderer";

export class Grid {
  private vertexBuffer!: GPUBuffer;
  private pipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private device!: GPUDevice;
  private vertexCount!: number;

  constructor(renderer: Renderer) {
    this.device = renderer.getDevice();
    this.pipeline = renderer.getGridPipeline();
    this.bindGroup = renderer.getBindGroup();

    this.createFullscreenQuad();
    // this.createVertexBuffer();
  }

  private createFullscreenQuad() {
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    this.vertexCount = vertices.length / 2;

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();
  }

  // private createVertexBuffer() {
  //   const gridSize = 10;
  //   const gridSpacing = 0.1;
  //   const numLines = 2 * gridSize + 1;
  //   const vertices = new Float32Array(numLines * 4 * 2);
  //   let vertexIndex = 0;

  //   for (let i = -gridSize; i <= gridSize; i++) {
  //     // Vertical lines
  //     vertices[vertexIndex++] = i * gridSpacing;
  //     vertices[vertexIndex++] = -gridSize * gridSpacing;
  //     vertices[vertexIndex++] = i * gridSpacing;
  //     vertices[vertexIndex++] = gridSize * gridSpacing;

  //     // Horizontal lines
  //     vertices[vertexIndex++] = -gridSize * gridSpacing;
  //     vertices[vertexIndex++] = i * gridSpacing;
  //     vertices[vertexIndex++] = gridSize * gridSpacing;
  //     vertices[vertexIndex++] = i * gridSpacing;
  //   }

  //   this.vertexCount = vertices.length / 2;

  //   this.vertexBuffer = this.device.createBuffer({
  //     size: vertices.byteLength,
  //     usage: GPUBufferUsage.VERTEX,
  //     mappedAtCreation: true,
  //   });

  //   new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
  //   this.vertexBuffer.unmap();
  // }

  public draw(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(this.vertexCount);
  }
}
