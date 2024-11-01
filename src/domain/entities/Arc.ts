// src/domain/entities/Arc.ts

import { RenderableEntity } from './RenderableEntity';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { ArcShader } from '../../shaders/ArcShader';

interface PointType {
  x: number;
  y: number;
}

export class Arc extends RenderableEntity {
  private startPoint: PointType | null = null;
  private midPoint: PointType | null = null;
  private endPoint: PointType | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer) {
    super(renderer, new Float32Array([0.0, 1.0, 0.0, 1.0])); // Green color
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: ArcShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: ArcShader.FRAGMENT,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [{ format: this.renderer.getFormat() }],
      },
      primitive: { topology: 'line-strip' },
    });
  }

  public setStartPoint(point: PointType): void {
    this.startPoint = point;
    this.updateVertexBuffer();
  }

  public setMidPoint(point: PointType): void {
    this.midPoint = point;
    this.updateVertexBuffer();
  }

  public setEndPoint(point: PointType): void {
    this.endPoint = point;
    this.updateVertexBuffer();
  }

  private updateVertexBuffer(): void {
    if (this.startPoint && this.midPoint && this.endPoint) {
      const vertices = this.calculateArcVertices();
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
  }

  private calculateArcVertices(): number[] {
    const circle = this.calculateCircleFromPoints(
      this.startPoint!,
      this.midPoint!,
      this.endPoint!
    );

    if (!circle) {
      // Points are colinear; return a straight line
      return [
        this.startPoint!.x,
        this.startPoint!.y,
        this.endPoint!.x,
        this.endPoint!.y,
      ];
    }

    const { centerX, centerY, radius } = circle;

    const startAngle = Math.atan2(
      this.startPoint!.y - centerY,
      this.startPoint!.x - centerX
    );
    const midAngle = Math.atan2(
      this.midPoint!.y - centerY,
      this.midPoint!.x - centerX
    );
    const endAngle = Math.atan2(
      this.endPoint!.y - centerY,
      this.endPoint!.x - centerX
    );

    // Determine the arc direction (clockwise or counter-clockwise)
    const angles = [startAngle, midAngle, endAngle].map((angle) =>
      angle < 0 ? angle + 2 * Math.PI : angle
    );

    let angleStart = angles[0];
    let angleMid = angles[1];
    let angleEnd = angles[2];

    let angleDeltaStartMid = this.normalizeAngle(angleMid - angleStart);
    let angleDeltaMidEnd = this.normalizeAngle(angleEnd - angleMid);
    let totalAngle = this.normalizeAngle(angleEnd - angleStart);

    let isClockwise = false;

    if (angleDeltaStartMid + angleDeltaMidEnd > totalAngle) {
      // The arc goes the other way around the circle
      isClockwise = true;
    }

    const vertices = this.generateArcVertices(
      centerX,
      centerY,
      radius,
      angleStart,
      angleEnd,
      isClockwise
    );

    return vertices;
  }

  private normalizeAngle(angle: number): number {
    angle = angle % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  }

  private generateArcVertices(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    isClockwise: boolean
  ): number[] {
    const numSegments = 50; // Adjust for smoothness
    const vertices: number[] = [];

    let angleDiff = endAngle - startAngle;
    if (isClockwise) {
      if (angleDiff > 0) {
        angleDiff -= 2 * Math.PI;
      }
    } else {
      if (angleDiff < 0) {
        angleDiff += 2 * Math.PI;
      }
    }

    const angleStep = angleDiff / numSegments;

    for (let i = 0; i <= numSegments; i++) {
      const angle = startAngle + angleStep * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      vertices.push(x, y);
    }

    return vertices;
  }

  private calculateCircleFromPoints(
    p1: PointType,
    p2: PointType,
    p3: PointType
  ): { centerX: number; centerY: number; radius: number } | null {
    const x1 = p1.x,
      y1 = p1.y;
    const x2 = p2.x,
      y2 = p2.y;
    const x3 = p3.x,
      y3 = p3.y;

    const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    if (Math.abs(a) < 1e-10) {
      // Points are colinear
      return null;
    }

    const b =
      ((x1 * x1 + y1 * y1) * (y3 - y2) +
        (x2 * x2 + y2 * y2) * (y1 - y3) +
        (x3 * x3 + y3 * y3) * (y2 - y1)) /
      (2 * a);
    const c =
      ((x1 * x1 + y1 * y1) * (x2 - x3) +
        (x2 * x2 + y2 * y2) * (x3 - x1) +
        (x3 * x3 + y3 * y3) * (x1 - x2)) /
      (2 * a);

    const centerX = b;
    const centerY = c;
    const radius = Math.sqrt((x1 - centerX) ** 2 + (y1 - centerY) ** 2);

    return { centerX, centerY, radius };
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    super.dispose();
  }
}