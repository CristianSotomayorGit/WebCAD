// src/domain/entities/RenderableText.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { TextShader } from '../../shaders/TextShader';

export abstract class RenderableText {
  protected renderer: Renderer;
  protected device: GPUDevice;
  protected pipeline!: GPURenderPipeline;
  protected bindGroup!: GPUBindGroup;
  protected cameraBuffer!: GPUBuffer;
  protected colorBuffer!: GPUBuffer;
  protected vertexBuffer: GPUBuffer | null = null;
  protected numVertices: number = 0;
  protected textTexture!: GPUTexture;
  protected textSampler!: GPUSampler;
  protected textureWidth!: number;
  protected textureHeight!: number;
  public text: string;
  protected font: string;
  protected fontSize: number;
  protected resolutionScale: number;
  protected color: Float32Array;
  protected position: { x: number; y: number };

  constructor(
    renderer: Renderer,
    text: string,
    x: number,
    y: number,
    font: string,
    fontSize: number = 32,
    resolutionScale: number = 2,
    color: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0])
  ) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.text = text;
    this.position = { x, y };
    this.font = font;
    this.fontSize = fontSize;
    this.resolutionScale = resolutionScale;
    this.color = color;

    this.createCameraBuffer();
    this.createColorBuffer();
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

  protected createColorBuffer(): void {
    this.colorBuffer = this.device.createBuffer({
      size: this.color.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }

  protected createTextTexture(): void {
    // Dispose of old texture and sampler
    if (this.textTexture) {
      this.textTexture.destroy();
    }
    // if (this.textSampler) {
    //   // No destroy method for sampler, set to null for safety
    //   this.textSampler = null;
    // }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to get 2D context');
    }

    // Ensure font size and resolution scale are valid
    const scaledFontSize = Math.max(1, this.fontSize * this.resolutionScale); // Minimum font size of 1
    context.font = `${scaledFontSize}px ${this.font}`;

    // Measure text width
    const textMetrics = context.measureText(this.text);
    const textWidth = Math.max(1, Math.ceil(textMetrics.width)); // Minimum width of 1

    // Set canvas dimensions (fallback to 1 if invalid)
    canvas.width = textWidth;
    canvas.height = scaledFontSize;

    // Debug log for invalid values
    if (isNaN(textWidth) || isNaN(scaledFontSize)) {
      console.error('Invalid canvas dimensions:', { textWidth, scaledFontSize });
    }

    // Render the text on the canvas
    context.font = `${scaledFontSize}px ${this.font}`;
    context.fillStyle = 'white';
    context.textBaseline = 'top';
    context.fillText(this.text, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    this.textTexture = this.device.createTexture({
      size: [canvas.width, canvas.height, 1],
      format: 'rgba8unorm',
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
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
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
            arrayStride: 4 * 4,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 2 * 4, format: 'float32x2' },
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

    const width = (this.textureWidth / this.resolutionScale) * 0.01;
    const height = (this.textureHeight / this.resolutionScale) * 0.01;

    const vertices = new Float32Array([
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
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: this.textTexture.createView() },
        { binding: 2, resource: this.textSampler },
        { binding: 3, resource: { buffer: this.colorBuffer } },
      ],
    });
  }

  protected updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public setText(newText: string): void {
    this.text = newText;
    this.createTextTexture();
    this.createBuffers();
    this.setupBindGroup(); // Update the bind group with the new texture and sampler
  }

  public setColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error('Color must be a Float32Array with 4 components (RGBA).');
    }
    this.color = color;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
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
    if (this.vertexBuffer) this.vertexBuffer.destroy();
    if (this.textTexture) this.textTexture.destroy();
    if (this.cameraBuffer) this.cameraBuffer.destroy();
    if (this.colorBuffer) this.colorBuffer.destroy();
  }
}
