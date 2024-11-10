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
  public fontFamily: string;
  public fontSize: number;
  public resolutionScale: number;
  public color: Float32Array;
  public position: { x: number; y: number };
  public cursorIndex: number = 0; // Position of the cursor in the text

  constructor(
    renderer: Renderer,
    text: string,
    x: number,
    y: number,
    fontFamily: string,
    fontSize: number = 32,
    resolutionScale: number = 2,
    color: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0])
  ) {
    this.renderer = renderer;
    this.device = renderer.getDevice();
    this.text = text;
    this.fontFamily = fontFamily;
    this.position = { x, y };
    this.fontSize = fontSize;
    this.resolutionScale = resolutionScale;
    this.color = color;

    this.createCameraBuffer();
    this.createColorBuffer();
    this.setupPipeline();
    this.createTextTexture();
    this.createBuffers();
    // No need to call setupBindGroup here; it's called within createTextTexture()
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

  protected createTextTexture(): void {
    // Create new texture and sampler without destroying the old ones
    const newCanvas = document.createElement('canvas');
    const newContext = newCanvas.getContext('2d');

    if (!newContext) {
      throw new Error('Unable to get 2D context');
    }

    // Ensure font size and resolution scale are valid
    const scaledFontSize = Math.max(1, this.fontSize * this.resolutionScale);
    newContext.font = `${scaledFontSize}px ${this.fontFamily}`;

    // Measure text width
    const textMetrics = newContext.measureText(this.text);
    const textWidth = Math.max(1, Math.ceil(textMetrics.width));

    // Set canvas dimensions
    newCanvas.width = textWidth;
    newCanvas.height = scaledFontSize;

    // Clear the canvas before rendering
    newContext.clearRect(0, 0, newCanvas.width, newCanvas.height);

    // Render the text on the canvas
    newContext.font = `${scaledFontSize}px ${this.fontFamily}`;
    newContext.fillStyle = 'white';
    newContext.textBaseline = 'top';
    newContext.fillText(this.text, 0, 0);

    const imageData = newContext.getImageData(0, 0, newCanvas.width, newCanvas.height);
    const pixels = imageData.data;

    // Create new texture and sampler
    const newTexture = this.device.createTexture({
      size: [newCanvas.width, newCanvas.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.device.queue.writeTexture(
      { texture: newTexture },
      pixels,
      {
        bytesPerRow: newCanvas.width * 4,
        rowsPerImage: newCanvas.height,
      },
      {
        width: newCanvas.width,
        height: newCanvas.height,
      }
    );

    const newSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Update bind group with new texture and sampler before destroying old texture
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: newTexture.createView() },
        { binding: 2, resource: newSampler },
        { binding: 3, resource: { buffer: this.colorBuffer } },
      ],
    });

    // Now it's safe to destroy the old texture
    if (this.textTexture) {
      this.textTexture.destroy();
    }

    // Replace old texture and sampler references
    this.textTexture = newTexture;
    this.textSampler = newSampler;

    this.textureWidth = newCanvas.width;
    this.textureHeight = newCanvas.height;
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

  protected updateCameraBuffer(): void {
    const { x, y } = this.renderer.getCamera().getOffset();
    const zoom = this.renderer.getCamera().getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public setText(newText: string): void {
    this.text = newText;
    // Do not modify cursorIndex here
    this.createTextTexture();
    this.createBuffers();
  }

  public moveCursor(offset: number): void {
    this.cursorIndex = Math.max(0, Math.min(this.cursorIndex + offset, this.text.length));
    // No need to recreate the texture here
  }

  public setColor(color: Float32Array): void {
    if (color.length !== 4) {
      throw new Error('Color must be a Float32Array with 4 components (RGBA).');
    }
    this.color = color;
    this.device.queue.writeBuffer(this.colorBuffer, 0, this.color);
  }

  public getCursorWorldPosition(): { x: number; y: number } {
    const textBeforeCursor = this.text.substring(0, this.cursorIndex);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    // Use the same scaled font size as in createTextTexture
    const scaledFontSize = Math.max(1, this.fontSize * this.resolutionScale);
    context.font = `${scaledFontSize}px ${this.fontFamily}`;

    // Measure the width of the text before the cursor
    const textWidth = context.measureText(textBeforeCursor).width;

    // Convert text width to world units (match createBuffers calculation)
    const widthInWorldUnits = (textWidth / this.resolutionScale) * 0.01;
    const x = this.position.x + widthInWorldUnits;
    const y = this.position.y;
    return { x, y };
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
