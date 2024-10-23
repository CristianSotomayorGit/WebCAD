import { Renderer } from '../../infrastructure/rendering/Renderer';
import { LineShader } from '../../shaders/LineShader';
import { Point } from './Point';

export class Line {
  private vertexBuffer!: GPUBuffer;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private pipeline!: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private device: GPUDevice;
  private renderer: Renderer;
  private vertices: Float32Array;
  private startPoint: Point;
  private endPoint: Point;
  private color: Float32Array;

  constructor(
    startPoint: Point,
    endPoint: Point,
    renderer: Renderer
  ) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0])
    this.device = renderer.getDevice();
    this.renderer = renderer;
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.vertices = new Float32Array([
      this.startPoint.getX(), this.startPoint.getY(),
      this.endPoint.getX(), this.endPoint.getY(),
    ]);

    this.createBuffers();
  }

  private setupPipeline(): GPURenderPipeline {

    const lineVertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const lineFragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
    });

    const linePipelineLayout = this.device.createPipelineLayout({
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
      layout: linePipelineLayout,
      vertex: {
        module: lineVertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4,
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
        module: lineFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'line-list',
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
    this.updateCameraBuffer();
    this.updateColorBuffer(this.color)
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

  public getLength(): number {
    const dx = this.endPoint.getX() - this.startPoint.getX();
    const dy = this.endPoint.getY() - this.startPoint.getY();
    return Math.sqrt(dx * dx + dy * dy);
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
