import { Renderer } from '../../infrastructure/rendering/Renderer';
import { CircleShader } from '../../shaders/CircleShader';

export class Circle {
  private device: GPUDevice;
  private renderer: Renderer;
  private center: { x: number; y: number };
  private radius: number;
  private vertexBuffer!: GPUBuffer;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private numVertices!: number;
  private color!: Float32Array;

  constructor(
    center: { x: number; y: number },
    radius: number,
    renderer: Renderer
  ) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0])
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.center = center;
    this.radius = radius;
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();

    this.createBuffers();
  }

  private setupPipeline() {
    const circleVertexShaderModule = this.device.createShaderModule({
      code: CircleShader.VERTEX,
    });

    const circleFragmentShaderModule = this.device.createShaderModule({
      code: CircleShader.FRAGMENT,
    });

    const circlePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'uniform',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform',
            },
          },
        ],
      })],
    });

    return this.device.createRenderPipeline({
      layout: circlePipelineLayout,
      vertex: {
        module: circleVertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 8,
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
        module: circleFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'triangle-strip',
      },
    });
  }


  private setupBindGroup(): GPUBindGroup {
    const cameraData = new Float32Array([0, 0, 1, 0]);
    const initialColor = this.color;

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
          binding: 1,
          resource: {
            buffer: this.colorBuffer,
          },
        },
      ],
    });

    return bindGroup;
  }

  //TODO: Update to generate like spline
  private createBuffers() {
    const numSegments = 64;
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
    this.updateCameraBuffer();
    this.updateColorBuffer(this.color);
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
}