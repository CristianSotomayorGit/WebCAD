import { Renderer } from '../../infrastructure/rendering/Renderer';
import { CircleShader } from '../../shaders/CircleShader';
import { Point } from './Point';

export class Spline {
  private controlPoints: Point[] = [];
  private device: GPUDevice;
  private renderer: Renderer;
  private vertexBuffer: GPUBuffer | null = null;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private bindGroup: GPUBindGroup;
  private pipeline: GPURenderPipeline;
  private numVertices: number = 0;
  private color: Float32Array

  constructor(renderer: Renderer) {
    this.color = new Float32Array([1.0, 0.0, 0.0, 1.0])
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.pipeline = this.setupPipeline();
    this.bindGroup = this.setupBindGroup();
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

  private setupPipeline() {
    const splineVertexShaderModule = this.device.createShaderModule({
      code: CircleShader.VERTEX,
    });

    const splineFragmentShaderModule = this.device.createShaderModule({
      code: CircleShader.FRAGMENT,
    });

    const splinePipelineLayout = this.device.createPipelineLayout({
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
      layout: splinePipelineLayout,
      vertex: {
        module: splineVertexShaderModule,
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
        module: splineFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
          },
        ],
      },
      primitive: {
        topology: 'line-strip',
      }
    });
  }

  public addControlPoint(point: Point): void {
    this.controlPoints.push(point);
    this.updateVertexBuffer();
  }

  public updateControlPoint(index: number, x: number, y: number): void {
    if (index >= 0 && index < this.controlPoints.length) {
      this.controlPoints[index].setX(x);
      this.controlPoints[index].setY(y);
      this.updateVertexBuffer();
    }
  }

  public updateVertexBuffer(): void {
    const vertices: number[] = [];
    const numSegments = 20; // Adjust for curve smoothness per segment

    if (this.controlPoints.length >= 2) {
      for (let i = 0; i < this.controlPoints.length - 1; i++) {
        // For each segment between control points
        for (let j = 0; j <= numSegments; j++) {
          const t = j / numSegments;
          const point = this.calculateSplinePoint(i, t);
          vertices.push(point.x, point.y);
        }
      }
    }

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

  private calculateSplinePoint(segmentIndex: number, t: number): { x: number; y: number } {
    // Use Catmull-Rom spline for interpolation between controlPoint[segmentIndex] and controlPoint[segmentIndex + 1]
    const p0 = this.getControlPoint(segmentIndex - 1);
    const p1 = this.getControlPoint(segmentIndex);
    const p2 = this.getControlPoint(segmentIndex + 1);
    const p3 = this.getControlPoint(segmentIndex + 2);

    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      0.5 *
      ((2 * p1.getX()) +
        (-p0.getX() + p2.getX()) * t +
        (2 * p0.getX() - 5 * p1.getX() + 4 * p2.getX() - p3.getX()) * t2 +
        (-p0.getX() + 3 * p1.getX() - 3 * p2.getX() + p3.getX()) * t3);

    const y =
      0.5 *
      ((2 * p1.getY()) +
        (-p0.getY() + p2.getY()) * t +
        (2 * p0.getY() - 5 * p1.getY() + 4 * p2.getY() - p3.getY()) * t2 +
        (-p0.getY() + 3 * p1.getY() - 3 * p2.getY() + p3.getY()) * t3);

    return { x, y };
  }

  private getControlPoint(index: number): Point {
    const total = this.controlPoints.length;
    if (index < 0) {
      return this.controlPoints[0];
    } else if (index >= total) {
      return this.controlPoints[total - 1];
    } else {
      return this.controlPoints[index];
    }
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      this.updateCameraBuffer();
      this.updateColorBuffer(this.color)
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public getControlPoints(): Point[] {
    return this.controlPoints;
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
