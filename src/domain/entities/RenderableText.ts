// src/domain/entities/RenderableText.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { TextShader } from '../../shaders/TextShader';

export abstract class RenderableText {
  protected renderer: Renderer;
  protected device: GPUDevice;
  protected pipeline!: GPURenderPipeline;
  protected bindGroup!: GPUBindGroup;
  protected cameraBuffer!: GPUBuffer;
  protected vertexBuffer: GPUBuffer | null = null;
  protected numVertices: number = 0;
  protected textTexture!: GPUTexture;
  protected textSampler!: GPUSampler;
  protected textureWidth!: number;
  protected textureHeight!: number;
  protected position: { x: number; y: number };
  protected text: string;
  protected fontSize: number;
  protected resolutionScale: number; // New property

  constructor(
    renderer: Renderer,
    text: string,
    x: number,
    y: number,
    fontSize: number = 32,
    resolutionScale: number = 2 // Default resolution scale
  ) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.position = { x, y };
    this.text = text;
    this.fontSize = fontSize;
    this.resolutionScale = resolutionScale; // Initialize resolution scale

    this.createCameraBuffer();
    this.createTextTexture();
    this.setupPipeline();
    this.createBuffers();
    this.setupBindGroup();
  }

  protected createCameraBuffer(): void {
    const cameraData = new Float32Array([0, 0, 1, 0]);
    this.cameraBuffer = this.device.createBuffer({
      size: cameraData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  protected createTextTexture(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to get 2D context');
    }

    // Increase the font size for higher resolution
    const scaledFontSize = this.fontSize * this.resolutionScale;
    context.font = `${scaledFontSize}px sans-serif`;
    const textMetrics = context.measureText(this.text);
    canvas.width = Math.ceil(textMetrics.width);
    canvas.height = scaledFontSize;

    // Draw the text at the higher resolution
    context.font = `${scaledFontSize}px sans-serif`;
    context.fillStyle = 'white'; // Text color
    context.textBaseline = 'top';
    context.fillText(this.text, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    this.textTexture = this.device.createTexture({
      size: [canvas.width, canvas.height, 1],
      format: 'rgba8unorm', // Supports alpha channel
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.device.queue.writeTexture(
      { texture: this.textTexture },
      pixels,
      {
        bytesPerRow: canvas.width * 4,
        rowsPerImage: canvas.height,
      },
      {
        width: canvas.width,
        height: canvas.height,
      }
    );

    this.textSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this.textureWidth = canvas.width;
    this.textureHeight = canvas.height;
  }

  protected setupPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: TextShader.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: TextShader.FRAGMENT,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
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
            arrayStride: 4 * 4, // 2 floats for position, 2 floats for texCoord
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' }, // position
              { shaderLocation: 1, offset: 2 * 4, format: 'float32x2' }, // texCoord
            ],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.getFormat(),
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
            writeMask: GPUColorWrite.ALL,
          },
        ],
      },
      primitive: { topology: 'triangle-strip' },
    });
  }

  protected createBuffers(): void {
    const x = this.position.x;
    const y = this.position.y;

    // Calculate the width and height based on the original font size
    const width = (this.textureWidth / this.resolutionScale) * 0.01; // Adjust scale as needed
    const height = (this.textureHeight / this.resolutionScale) * 0.01; // Adjust scale as needed

    // Vertex positions and texture coordinates
    const vertices = new Float32Array([
      // x, y, u, v
      x, y, 0, 1,
      x + width, y, 1, 1,
      x, y + height, 0, 0,
      x + width, y + height, 1, 0,
    ]);

    this.numVertices = 4;

    if (this.vertexBuffer) this.vertexBuffer.destroy();

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  protected setupBindGroup(): void {
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraBuffer },
        },
        {
          binding: 1,
          resource: this.textTexture.createView(),
        },
        {
          binding: 2,
          resource: this.textSampler,
        },
      ],
    });
  }

  protected updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public draw(renderPass: GPURenderPassEncoder): void {
    if (this.vertexBuffer && this.numVertices > 0) {
      this.updateCameraBuffer();
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.draw(this.numVertices);
    }
  }

  public dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    if (this.textTexture) {
      this.textTexture.destroy();
    }
    if (this.cameraBuffer) {
      this.cameraBuffer.destroy();
    }
  }
}
