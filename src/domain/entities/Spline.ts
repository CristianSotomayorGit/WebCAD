import { RenderableEntity } from "./RenderableEntity";
import { Renderer } from "../../infrastructure/rendering/Renderer";

export class Spline extends RenderableEntity {
  private points: { x: number; y: number }[];
  private vertexBuffer: GPUBuffer | null = null;
  private numVertices: number = 0;

  constructor(renderer: Renderer, points: { x: number; y: number }[]) {
    super(renderer);
    this.points = points;
    this.updateVertexBuffer();
    this.setupPipeline();
  }

  private updateVertexBuffer(): void {
    const vertices: number[] = [];
    for (const point of this.points) {
      vertices.push(point.x, point.y);
    }

    this.numVertices = vertices.length / 2;

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    const vertexData = new Float32Array(vertices);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  protected setupPipeline(): void {
    const vertexShaderCode = `
      [[stage(vertex)]]
      fn main([[location(0)]] position: vec2<f32>) -> [[builtin(position)]] vec4<f32> {
        return vec4<f32>(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderCode = `
      [[stage(fragment)]]
      fn main() -> [[location(0)]] vec4<f32> {
        return vec4<f32>(0.0, 1.0, 0.0, 1.0); // Green color
      }
    `;

    const vertexShaderModule = this.device.createShaderModule({
      code: vertexShaderCode,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: fragmentShaderCode,
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
      vertex: {
        module: vertexShaderModule,
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: "main",
        targets: [{ format: this.renderer.getFormat() }],
      },
      primitive: { topology: "line-strip" },
    });
  }

  public override draw(renderPass: GPURenderPassEncoder): void {
    if (this.numVertices > 0 && this.vertexBuffer) {
      renderPass.setPipeline(this.pipeline);
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
