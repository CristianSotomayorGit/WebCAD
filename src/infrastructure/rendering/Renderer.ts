// // src/infrastructure/rendering/Renderer.ts

// import { EntityManager } from '../../domain/managers/EntityManager';
// import { Camera } from '../../domain/Camera';
// import { Grid } from '../../domain/entities/Grid';
// import { GridShader } from '../../shaders/GridShader';
// import { LineShader } from '../../shaders/LineShader';
// import { PointShader } from '../../shaders/PointShader';
// import { Point } from '../../domain/entities/Point';
// import { Line } from '../../domain/entities/Line';

// export class Renderer {
//   private device!: GPUDevice;
//   private context!: GPUCanvasContext;
//   private format!: GPUTextureFormat;
//   private gridPipeline!: GPURenderPipeline;
//   private pointPipeline!: GPURenderPipeline;
//   private linePipeline!: GPURenderPipeline;
//   private tempLinePipeline!: GPURenderPipeline;
//   private bindGroup!: GPUBindGroup;
//   private cameraBuffer!: GPUBuffer;
//   private camera: Camera;
//   private grid!: Grid;

//   constructor(
//     private canvas: HTMLCanvasElement,
//     private entityManager: EntityManager
//   ) {
//     this.camera = new Camera();
//   }

//   public async initialize() {
//     await this.initializeWebGPU();
//     this.resizeCanvas(); // Initial canvas resize
//     window.addEventListener('resize', this.resizeCanvas.bind(this));
//     this.startRendering();
//   }

//   private async initializeWebGPU() {
//     if (!navigator.gpu) {
//       throw new Error('WebGPU is not supported in this browser.');
//     }

//     const adapter = await navigator.gpu.requestAdapter();
//     if (!adapter) {
//       throw new Error('Failed to get GPU adapter.');
//     }

//     this.device = await adapter.requestDevice();
//     if (!this.device) {
//       throw new Error('Failed to get GPU device.');
//     }

//     this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
//     if (!this.context) {
//       throw new Error('Failed to get WebGPU context.');
//     }

//     this.format = navigator.gpu.getPreferredCanvasFormat();
//     if (!this.format) {
//       throw new Error('Failed to get preferred canvas format.');
//     }

//     // The context will be configured in resizeCanvas()
//     this.setupPipelines();
//     this.setupCameraBuffer();

//     this.grid = new Grid(this.device); // Initialize grid after device is ready
//   }

//   public resizeCanvas() {
//     const devicePixelRatio = window.devicePixelRatio || 1;
//     const width = window.innerWidth;
//     const height = window.innerHeight;
//     const maxDimension = Math.max(width, height);
//     const presentationSize = maxDimension * devicePixelRatio;

//     if (
//       this.canvas.width !== presentationSize ||
//       this.canvas.height !== presentationSize
//     ) {
//       // Set the canvas width and height to the maximum dimension
//       this.canvas.width = presentationSize;
//       this.canvas.height = presentationSize;

//       // Adjust the canvas style to ensure it appears square on the screen
//       this.canvas.style.width = `${maxDimension}px`;
//       this.canvas.style.height = `${maxDimension}px`;

//       // Center the canvas within the window
//       this.canvas.style.position = 'absolute';
//       this.canvas.style.left = `${(width - maxDimension) / 2}px`;
//       this.canvas.style.top = `${(height - maxDimension) / 2}px`;

//       // Reconfigure the context with the new size
//       this.configureContext();
//     }
//   }

//   private configureContext() {
//     this.context.configure({
//       device: this.device,
//       format: this.format,
//       alphaMode: 'opaque',
//     });
//   }

//   private setupPipelines() {
//     // Grid Pipeline
//     const gridVertexShaderModule = this.device.createShaderModule({
//       code: GridShader.VERTEX,
//     });

//     const gridFragmentShaderModule = this.device.createShaderModule({
//       code: GridShader.FRAGMENT,
//     });

//     const bindGroupLayout = this.createBindGroupLayout();

//     const gridPipelineLayout = this.device.createPipelineLayout({
//       bindGroupLayouts: [bindGroupLayout],
//     });

//     this.gridPipeline = this.device.createRenderPipeline({
//       layout: gridPipelineLayout,
//       vertex: {
//         module: gridVertexShaderModule,
//         entryPoint: 'main',
//         buffers: [
//           {
//             arrayStride: 8,
//             attributes: [
//               {
//                 shaderLocation: 0,
//                 offset: 0,
//                 format: 'float32x2',
//               },
//             ],
//           },
//         ],
//       },
//       fragment: {
//         module: gridFragmentShaderModule,
//         entryPoint: 'main',
//         targets: [{ format: this.format }],
//       },
//       primitive: {
//         topology: 'line-list',
//       },
//     });

//     // Setup point pipeline
//     const pointVertexShaderModule = this.device.createShaderModule({
//       code: PointShader.VERTEX,
//     });

//     const pointFragmentShaderModule = this.device.createShaderModule({
//       code: PointShader.FRAGMENT,
//     });

//     const pointPipelineLayout = this.device.createPipelineLayout({
//       bindGroupLayouts: [bindGroupLayout],
//     });

//     this.pointPipeline = this.device.createRenderPipeline({
//       layout: pointPipelineLayout,
//       vertex: {
//         module: pointVertexShaderModule,
//         entryPoint: 'main',
//         buffers: [
//           {
//             arrayStride: 2 * 4, // 2 floats (x, y)
//             attributes: [
//               {
//                 shaderLocation: 0,
//                 offset: 0,
//                 format: 'float32x2',
//               },
//             ],
//           },
//         ],
//       },
//       fragment: {
//         module: pointFragmentShaderModule,
//         entryPoint: 'main',
//         targets: [
//           {
//             format: this.format,
//           },
//         ],
//       },
//       primitive: {
//         topology: 'triangle-list',
//       },
//     });

//     const lineVertexShaderModule = this.device.createShaderModule({
//       code: LineShader.VERTEX,
//     });

//     const lineFragmentShaderModule = this.device.createShaderModule({
//       code: LineShader.FRAGMENT,
//     });

//     const linePipelineLayout = this.device.createPipelineLayout({
//       bindGroupLayouts: [bindGroupLayout],
//     });

//     this.linePipeline = this.device.createRenderPipeline({
//       layout: linePipelineLayout,
//       vertex: {
//         module: lineVertexShaderModule,
//         entryPoint: 'main',
//         buffers: [
//           {
//             arrayStride: 2 * 4, // Each vertex is 2 floats (x, y)
//             attributes: [
//               {
//                 shaderLocation: 0,
//                 offset: 0,
//                 format: 'float32x2',
//               },
//             ],
//           },
//         ],
//       },
//       fragment: {
//         module: lineFragmentShaderModule,
//         entryPoint: 'main',
//         targets: [
//           {
//             format: this.format,
//           },
//         ],
//       },
//       primitive: {
//         topology: 'line-list',
//       },
//     });

//     // Setup temporary line pipeline
//     const tempLineVertexShaderModule = this.device.createShaderModule({
//       code: LineShader.VERTEX,
//     });

//     const tempLineFragmentShaderModule = this.device.createShaderModule({
//       code: LineShader.FRAGMENT,
//     });

//     const tempLinePipelineLayout = this.device.createPipelineLayout({
//       bindGroupLayouts: [bindGroupLayout],
//     });
//     this.tempLinePipeline = this.device.createRenderPipeline({
//       layout: tempLinePipelineLayout,
//       vertex: {
//         module: tempLineVertexShaderModule,
//         entryPoint: 'main',
//         buffers: [
//           {
//             arrayStride: 2 * 4,
//             attributes: [
//               {
//                 shaderLocation: 0,
//                 offset: 0,
//                 format: 'float32x2',
//               },
//             ],
//           },
//         ],
//       },
//       fragment: {
//         module: tempLineFragmentShaderModule,
//         entryPoint: 'main',
//         targets: [
//           {
//             format: this.format,
//           },
//         ],
//       },
//       primitive: {
//         topology: 'line-list',
//       },
//     });
//   }

//   private createBindGroupLayout(): GPUBindGroupLayout {
//     return this.device.createBindGroupLayout({
//       entries: [
//         {
//           binding: 0,
//           visibility: GPUShaderStage.VERTEX,
//           buffer: { type: 'uniform' },
//         },
//       ],
//     });
//   }

//   private setupCameraBuffer() {
//     const cameraData = new Float32Array([0, 0, 1, 0]);//-4 1 1 
//     // const cameraData = new Float32Array([-1,1, 1, 0]);//-4 1 1 

//     this.cameraBuffer = this.device.createBuffer({
//       size: cameraData.byteLength,
//       usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
//     });
//     this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);

//     this.bindGroup = this.device.createBindGroup({
//       layout: this.gridPipeline.getBindGroupLayout(0),
//       entries: [
//         {
//           binding: 0,
//           resource: {
//             buffer: this.cameraBuffer,
//           },
//         },
//       ],
//     });
//   }

//   public updateCameraBuffer() {
//     const { x, y } = this.camera.getOffset();
//     const zoom = this.camera.getZoom();
//     const cameraData = new Float32Array([x, y, zoom, 0]);


//     this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);
//   }

//   public getCamera(): Camera {
//     return this.camera;
//   }

//   public getDevice(): GPUDevice {
//     return this.device;
//   }

//   public render() {
//     if (!this.device) throw new Error('Device not yet initialized')

//     this.updateCameraBuffer();

//     const commandEncoder = this.device.createCommandEncoder();
//     if (!commandEncoder) throw new Error('Failed to create command encoder')

//     const textureView = this.context.getCurrentTexture().createView();
//     if (!textureView) throw new Error('Failed to get current texture')

//     const renderPass = commandEncoder.beginRenderPass({
//       colorAttachments: [
//         {
//           view: textureView,
//           clearValue: { r: 0.1294, g: 0.1569, b: 0.1882, a: 1 },
//           loadOp: 'clear',
//           storeOp: 'store',
//         },
//       ],
//     });

//     if (!textureView) throw new Error('Failed to begin render pass')


//     // Draw Grid
//     // renderPass.setPipeline(this.gridPipeline);
//     // renderPass.setBindGroup(0, this.bindGroup);
//     this.grid.draw(renderPass);


//     const entities = this.entityManager.getEntities();
//     const tempEntities = this.entityManager.getTemporaryEntities();

//     // Draw perm lines
//     let count2 = 2;
//     entities.forEach((entity) => {
//       if (entity instanceof Line) {
//         entity.draw(renderPass);
//         count2++
//       }
//     });

//     let count = 0
//     // Draw temp entities
//     tempEntities.forEach((entity) => {
//       if (entity instanceof Line) {
//         console.log(count)
//         entity.draw(renderPass);
//         count++
//       }
//     });

//     // Draw Points
//     entities.forEach((entity) => {
//       if (entity instanceof Point) {
//         entity.draw(renderPass);
//       }
//     });

//     renderPass.end();
//     this.device.queue.submit([commandEncoder.finish()]);
//   }

//   private startRendering() {
//     const renderLoop = () => {
//       this.render();
//       requestAnimationFrame(renderLoop);
//     };
//     requestAnimationFrame(renderLoop);
//   }

//   public dispose() {
//     window.removeEventListener('resize', this.resizeCanvas.bind(this));
//   }

//   public getCanvas(): HTMLCanvasElement {
//     return this.canvas;
//   }

//   public getBindGroup(): GPUBindGroup {
//     return this.bindGroup;
//   }

//   public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
//     const canvasRect = this.canvas.getBoundingClientRect();
//     const ndcX = (screenX / canvasRect.width) * 2 - 1;
//     const ndcY = -((screenY / canvasRect.height) * 2 - 1);

//     const zoom = this.camera.getZoom();
//     const offset = this.camera.getOffset();

//     const worldX = ndcX / zoom + offset.x;
//     const worldY = ndcY / zoom + offset.y;

//     return { x: worldX, y: worldY };
//   }

//   public getPointPipeline(): GPURenderPipeline {
//     return this.pointPipeline;
//   }

//   public getLinePipeline(): GPURenderPipeline {
//     return this.linePipeline;
//   }

//   public getTempLinePipeline(): GPURenderPipeline {
//     return this.tempLinePipeline;
//   }

// }

// src/infrastructure/rendering/Renderer.ts

import { EntityManager } from '../../domain/managers/EntityManager';
import { Camera } from '../../domain/Camera';
import { Grid } from '../../domain/entities/Grid';
import { GridShader } from '../../shaders/GridShader';
import { LineShader } from '../../shaders/LineShader';
import { PointShader } from '../../shaders/PointShader';
import { Point } from '../../domain/entities/Point';
import { Line } from '../../domain/entities/Line';

export class Renderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private gridPipeline!: GPURenderPipeline;
  private pointPipeline!: GPURenderPipeline;
  private linePipeline!: GPURenderPipeline;
  private tempLinePipeline!: GPURenderPipeline;
  private bindGroup!: GPUBindGroup;
  private cameraBuffer!: GPUBuffer;
  private camera: Camera;
  private grid!: Grid;

  constructor(
    private canvas: HTMLCanvasElement,
    private entityManager: EntityManager
  ) {
    this.camera = new Camera();
  }

  public async initialize() {
    await this.initializeWebGPU();
    this.resizeCanvas(); // Initial canvas resize
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.startRendering();
  }

  private async initializeWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Failed to get GPU adapter.');
    }

    this.device = await adapter.requestDevice();
    if (!this.device) {
      throw new Error('Failed to get GPU device.');
    }

    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
    if (!this.context) {
      throw new Error('Failed to get WebGPU context.');
    }

    this.format = navigator.gpu.getPreferredCanvasFormat();
    if (!this.format) {
      throw new Error('Failed to get preferred canvas format.');
    }

    // The context will be configured in resizeCanvas()
    this.setupPipelines();
    this.setupCameraBuffer();

    this.grid = new Grid(this); // Initialize grid after device is ready
  }

  public resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxDimension = Math.max(width, height);
    const presentationSize = maxDimension * devicePixelRatio;

    if (
      this.canvas.width !== presentationSize ||
      this.canvas.height !== presentationSize
    ) {
      // Set the canvas width and height to the maximum dimension
      this.canvas.width = presentationSize;
      this.canvas.height = presentationSize;

      // Adjust the canvas style to ensure it appears square on the screen
      this.canvas.style.width = `${maxDimension}px`;
      this.canvas.style.height = `${maxDimension}px`;

      // Center the canvas within the window
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = `${(width - maxDimension) / 2}px`;
      this.canvas.style.top = `${(height - maxDimension) / 2}px`;

      // Reconfigure the context with the new size
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

  private setupPipelines() {
    // Grid Pipeline
    const gridVertexShaderModule = this.device.createShaderModule({
      code: GridShader.VERTEX,
    });

    const gridFragmentShaderModule = this.device.createShaderModule({
      code: GridShader.FRAGMENT,
    });

    const bindGroupLayout = this.createBindGroupLayout();

    const gridPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.gridPipeline = this.device.createRenderPipeline({
      layout: gridPipelineLayout,
      vertex: {
        module: gridVertexShaderModule,
        entryPoint: 'vs_main',
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
        module: gridFragmentShaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });


    // Grid Pipeline
    // const gridVertexShaderModule = this.device.createShaderModule({
    //   code: GridShader.VERTEX,
    // });

    // const gridFragmentShaderModule = this.device.createShaderModule({
    //   code: GridShader.FRAGMENT,
    // });

    // const bindGroupLayout = this.createBindGroupLayout();

    // const gridPipelineLayout = this.device.createPipelineLayout({
    //   bindGroupLayouts: [bindGroupLayout],
    // });

    // this.gridPipeline = this.device.createRenderPipeline({
    //   layout: gridPipelineLayout,
    //   vertex: {
    //     module: gridVertexShaderModule,
    //     entryPoint: 'main',
    //     buffers: [
    //       {
    //         arrayStride: 8,
    //         attributes: [
    //           {
    //             shaderLocation: 0,
    //             offset: 0,
    //             format: 'float32x2',
    //           },
    //         ],
    //       },
    //     ],
    //   },
    //   fragment: {
    //     module: gridFragmentShaderModule,
    //     entryPoint: 'main',
    //     targets: [{ format: this.format }],
    //   },
    //   primitive: {
    //     topology: 'line-list',
    //   },
    // });



    // Setup point pipeline
    const pointVertexShaderModule = this.device.createShaderModule({
      code: PointShader.VERTEX,
    });

    const pointFragmentShaderModule = this.device.createShaderModule({
      code: PointShader.FRAGMENT,
    });

    const pointPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pointPipeline = this.device.createRenderPipeline({
      layout: pointPipelineLayout,
      vertex: {
        module: pointVertexShaderModule,
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
        module: pointFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    const lineVertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const lineFragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
    });

    const linePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.linePipeline = this.device.createRenderPipeline({
      layout: linePipelineLayout,
      vertex: {
        module: lineVertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4, // Each vertex is 2 floats (x, y)
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
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'line-list',
      },
    });

    // Setup temporary line pipeline
    const tempLineVertexShaderModule = this.device.createShaderModule({
      code: LineShader.VERTEX,
    });

    const tempLineFragmentShaderModule = this.device.createShaderModule({
      code: LineShader.FRAGMENT,
    });

    const tempLinePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });
    this.tempLinePipeline = this.device.createRenderPipeline({
      layout: tempLinePipelineLayout,
      vertex: {
        module: tempLineVertexShaderModule,
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
        module: tempLineFragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'line-list',
      },
    });
  }

  private createBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    });
  }

  private setupCameraBuffer() {
    const cameraData = new Float32Array([0, 0, 1, 0]);//-4 1 1 
    // const cameraData = new Float32Array([-1,1, 1, 0]);//-4 1 1 

    this.cameraBuffer = this.device.createBuffer({
      size: cameraData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);

    this.bindGroup = this.device.createBindGroup({
      layout: this.gridPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.cameraBuffer,
          },
        },
      ],
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

  public render() {
    if (!this.device) throw new Error('Device not yet initialized')

    this.updateCameraBuffer();

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
          storeOp: 'store',
        },
      ],
    });

    if (!textureView) throw new Error('Failed to begin render pass')


    // Draw Grid
    // renderPass.setPipeline(this.gridPipeline);
    // renderPass.setBindGroup(0, this.bindGroup);
    this.grid.draw(renderPass);


    const entities = this.entityManager.getEntities();
    const tempEntities = this.entityManager.getTemporaryEntities();

    // Draw perm lines
    let count2 = 2;
    entities.forEach((entity) => {
      if (entity instanceof Line) {
        entity.draw(renderPass);
        count2++
      }
    });

    let count = 0
    // Draw temp entities
    tempEntities.forEach((entity) => {
      if (entity instanceof Line) {
        console.log(count)
        entity.draw(renderPass);
        count++
      }
    });

    // Draw Points
    entities.forEach((entity) => {
      if (entity instanceof Point) {
        entity.draw(renderPass);
      }
    });

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
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

  public getPointPipeline(): GPURenderPipeline {
    return this.pointPipeline;
  }

  public getGridPipeline(): GPURenderPipeline {
    return this.gridPipeline;
  }

  public getLinePipeline(): GPURenderPipeline {
    return this.linePipeline;
  }

  public getTempLinePipeline(): GPURenderPipeline {
    return this.tempLinePipeline;
  }

}

