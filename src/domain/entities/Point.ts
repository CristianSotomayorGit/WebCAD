// src/domain/entities/Point.ts
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { PointShader } from '../../shaders/PointShader';

export class Point {
  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private pipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private device!: GPUDevice;
  private vertexCount!: number;
  private color: Float32Array;

  constructor(
    private x: number,
    private y: number,
    private renderer: Renderer
  ) {
    this.color = new Float32Array([0.5, 0.5, 0.5, 1.0]);
    this.device = renderer.getDevice();
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();
    this.createBuffers();
  }

  // const pointVertexShaderModule = this.device.createShaderModule({
  //   code: PointShader.VERTEX,
  // });

  // const pointFragmentShaderModule = this.device.createShaderModule({
  //   code: PointShader.FRAGMENT,
  // });

  private setupPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.VERTEX, // Visibility for camera buffer
              buffer: {
                type: 'uniform',
              },
            },
            {
              binding: 1,
              visibility: GPUShaderStage.FRAGMENT, // Visibility for color buffer
              buffer: {
                type: 'uniform',
              },
            },
          ],
        })],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: PointShader.VERTEX
        }),
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4, // 2 floats (x, y)
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
        module: this.device.createShaderModule({
          code: PointShader.FRAGMENT
        }),
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    })
  }

  private setupBindGroup(): GPUBindGroup {
    const cameraData = new Float32Array([0, 0, 1, 0]);//-4 1 1 
    const initialColor = this.color;
    // const cameraData = new Float32Array([-1,1, 1, 0]);//-4 1 1 

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
          binding: 1, // Assuming colorBuffer is the second binding
          resource: {
            buffer: this.colorBuffer, // Add the color buffer
          },
        },
      ],
    });

    return bindGroup;
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
    this.updateCameraBuffer();
    this.updateColorBuffer(this.color)
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

  public getColor() {
    return this.color;
  }
  public setColor(newColor: Float32Array) {
    this.color = newColor;
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

  public getRenderer() {
    return this.renderer;
  }
}
