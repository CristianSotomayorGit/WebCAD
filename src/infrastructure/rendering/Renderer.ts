import { EntityManager } from '../../domain/managers/EntityManager';
import { Camera } from '../../domain/Camera';
import { Grid } from '../../domain/entities/Grid';

export class Renderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private grid!: Grid;
  private gridPipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private cameraBuffer!: GPUBuffer;
  private colorBuffer!: GPUBuffer;
  private camera: Camera;

  constructor(public canvas: HTMLCanvasElement,private entityManager: EntityManager) {
    this.camera = new Camera();
  }

  public async initialize() {
    await this.initializeWebGPU();
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.startRendering();
  }

  private async initializeWebGPU() {
    if (!navigator.gpu) throw new Error('WebGPU is not supported in this browser.');

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('Failed to get GPU adapter.');

    this.device = await adapter.requestDevice();
    if (!this.device) throw new Error('Failed to get GPU device.');

    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
    if (!this.context) throw new Error('Failed to get WebGPU context.');

    this.format = navigator.gpu.getPreferredCanvasFormat();
    if (!this.format) throw new Error('Failed to get preferred canvas format.');

    this.grid = new Grid(this, this.entityManager);
  }

  public resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxDimension = Math.max(width, height);
    const presentationSize = maxDimension * devicePixelRatio;

    if (this.canvas.width !== presentationSize || this.canvas.height !== presentationSize) {
      this.canvas.width = presentationSize;
      this.canvas.height = presentationSize;
      this.canvas.style.width = `${maxDimension}px`;
      this.canvas.style.height = `${maxDimension}px`;
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = `${(width - maxDimension) / 2}px`;
      this.canvas.style.top = `${(height - maxDimension) / 2}px`;
      this.configureContext();
    }
  }

  private configureContext() {
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });
  }

  public updateCameraBuffer() {
    const { x, y } = this.camera.getOffset();
    const zoom = this.camera.getZoom();
    const cameraData = new Float32Array([x, y, zoom, 0]);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public getDevice(): GPUDevice {
    return this.device;
  }

  public updateColorBuffer(newColor: Float32Array) {
    if (newColor.length !== 4) throw new Error("Color must be a Float32Array with 4 components (RGBA).");
    this.device.queue.writeBuffer(this.colorBuffer, 0, newColor);
  }

  private startRendering() {
    const renderLoop = () => {
      this.render();
      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  public dispose() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getBindGroup(): GPUBindGroup {
    return this.bindGroup;
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const canvasRect = this.canvas.getBoundingClientRect();
    const ndcX = (screenX / canvasRect.width) * 2 - 1;
    const ndcY = -((screenY / canvasRect.height) * 2 - 1);

    const zoom = this.camera.getZoom();
    const offset = this.camera.getOffset();

    const worldX = ndcX / zoom + offset.x;
    const worldY = ndcY / zoom + offset.y;

    return { x: worldX, y: worldY };
  }

  public getGridPipeline(): GPURenderPipeline {
    return this.gridPipeline;
  }

  public render() {
    if (!this.device) throw new Error('Device not yet initialized')

    const commandEncoder = this.device.createCommandEncoder();
    if (!commandEncoder) throw new Error('Failed to create command encoder')

    const textureView = this.context.getCurrentTexture().createView();
    if (!textureView) throw new Error('Failed to get current texture')

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1294, g: 0.1569, b: 0.1882, a: 1 },
          loadOp: 'clear',
          storeOp: 'store'
        },
      ],
    });

    if (!textureView) throw new Error('Failed to begin render pass')

    const entities = this.entityManager.getEntities();
    const tempEntities = this.entityManager.getTemporaryEntities();

    this.grid.draw(renderPass);

    tempEntities.forEach((entity) => {
      entity.draw(renderPass);
    });

    entities.forEach((entity) => {
      entity.draw(renderPass);
    });

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  public getFormat(): GPUTextureFormat {
    return this.format;
  }
}