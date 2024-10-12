import React, { useEffect, useRef } from 'react';

const vertexShaderCode = `
    struct Uniforms {
        translation: vec2<f32>,
    };
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let translatedPosition = position + uniforms.translation;
        return vec4<f32>(translatedPosition, 0.0, 1.0);
    }
`;

const fragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(0.8, 0.8, 0.8, 1.0); // Light gray color
    }
`;

const gridSize = 10;
const gridSpacing = 0.1;

// Precompute the number of vertices: each grid line has 2 vertices, and there are 2 * gridSize + 1 lines horizontally and vertically
const numLines = 2 * gridSize + 1;
const vertices = new Float32Array(numLines * 4 * 2); // 4 vertices per line (start and end for both horizontal and vertical), 2 coordinates each
let vertexIndex = 0;

for (let i = -gridSize; i <= gridSize; i++) {
    // Vertical lines
    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = -gridSize * gridSpacing;

    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = gridSize * gridSpacing;

    // Horizontal lines
    vertices[vertexIndex++] = -gridSize * gridSpacing;
    vertices[vertexIndex++] = i * gridSpacing;

    vertices[vertexIndex++] = gridSize * gridSpacing;
    vertices[vertexIndex++] = i * gridSpacing;
}

const WebGPUCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const deviceRef = useRef<GPUDevice>();
    const pipelineRef = useRef<GPURenderPipeline>();
    const vertexBufferRef = useRef<GPUBuffer>();
    const contextRef = useRef<GPUCanvasContext>();
    const formatRef = useRef<GPUTextureFormat>();
    const translationBufferRef = useRef<GPUBuffer>();
    const bindGroupRef = useRef<GPUBindGroup>();
    const isDraggingRef = useRef<boolean>(false);
    const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
    const translationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Function to update translation
    const updateTranslation = (x: number, y: number) => {
        if (!deviceRef.current || !translationBufferRef.current) return;

        const translationArray = new Float32Array([x, y]);
        deviceRef.current.queue.writeBuffer(translationBufferRef.current, 0, translationArray);
    };

    // Mouse event handlers
    const handleMouseDown = (event: MouseEvent) => {
        isDraggingRef.current = true;
        lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!isDraggingRef.current || !lastMousePositionRef.current) return;

        const deltaX = event.clientX - lastMousePositionRef.current.x;
        const deltaY = event.clientY - lastMousePositionRef.current.y;

        // Update the translation based on the mouse movement
        translationRef.current.x += deltaX / window.innerWidth * 2;
        translationRef.current.y -= deltaY / window.innerHeight * 2; // Invert Y axis

        updateTranslation(translationRef.current.x, translationRef.current.y);

        // Update last mouse position
        lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        lastMousePositionRef.current = null;
    };

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        const device = deviceRef.current;
        const format = formatRef.current;

        if (canvas && context && device && format) {
            const gridDimension = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;

            canvas.width = gridDimension;
            canvas.height = gridDimension;

            context.configure({
                device,
                format,
                alphaMode: 'opaque',
            });
        }
    };

    useEffect(() => {
        if (!canvasRef.current) {
            console.error('Canvas element is not available.');
            return;
        }

        if (!navigator.gpu) {
            console.error('WebGPU is not supported in this browser.');
            return;
        }

        let animationFrameId: number;

        const initializeWebGPU = async () => {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (!adapter) throw new Error('Failed to get GPU adapter.');

                const device = await adapter.requestDevice();
                deviceRef.current = device;

                const context = canvasRef.current!.getContext('webgpu') as GPUCanvasContext;
                contextRef.current = context;

                const format = navigator.gpu.getPreferredCanvasFormat();
                formatRef.current = format;

                // Initial canvas sizing
                resizeCanvas();

                // Create vertex buffer
                const vertexBuffer = device.createBuffer({
                    size: vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true,
                });
                
                new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
                vertexBuffer.unmap();
                vertexBufferRef.current = vertexBuffer;

                // Create the translation uniform buffer
                const translationArray = new Float32Array([0.0, 0.0]); // Initial translation values
                const translationBuffer = device.createBuffer({
                    size: translationArray.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(translationBuffer, 0, translationArray);
                translationBufferRef.current = translationBuffer;

                // Create shader modules and check for errors
                const vertexModule = device.createShaderModule({ code: vertexShaderCode });
                const fragmentModule = device.createShaderModule({ code: fragmentShaderCode });

                const vertexCompilationInfo = await vertexModule.getCompilationInfo();
                const fragmentCompilationInfo = await fragmentModule.getCompilationInfo();

                if (vertexCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Vertex shader compilation failed:', vertexCompilationInfo);
                    return;
                }

                if (fragmentCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Fragment shader compilation failed:', fragmentCompilationInfo);
                    return;
                }

                // Create bind group layout
                const bindGroupLayout = device.createBindGroupLayout({
                    entries: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            buffer: {
                                type: 'uniform',
                            },
                        },
                    ],
                });

                // Create the bind group
                const bindGroup = device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: translationBuffer,
                            },
                        },
                    ],
                });
                bindGroupRef.current = bindGroup;

                // Create a pipeline layout
                const pipelineLayout = device.createPipelineLayout({
                    bindGroupLayouts: [bindGroupLayout],
                });

                // Create the render pipeline
                const pipeline = device.createRenderPipeline({
                    layout: pipelineLayout,
                    vertex: {
                        module: vertexModule,
                        entryPoint: 'main',
                        buffers: [
                            {
                                arrayStride: 8, // 2 * 4 bytes for vec2<f32>
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
                        module: fragmentModule,
                        entryPoint: 'main',
                        targets: [{ format }],
                    },
                    primitive: {
                        topology: 'line-list',
                    },
                });
                pipelineRef.current = pipeline;

                // Add mouse event listeners
                window.addEventListener('mousedown', handleMouseDown);
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);

                // Start render loop
                const render = () => {
                    if (!deviceRef.current || !pipelineRef.current || !contextRef.current) {
                        return;
                    }

                    const commandEncoder = deviceRef.current.createCommandEncoder();
                    const textureView = contextRef.current.getCurrentTexture().createView();

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

                    renderPass.setPipeline(pipelineRef.current);
                    renderPass.setBindGroup(0, bindGroupRef.current!);
                    renderPass.setVertexBuffer(0, vertexBufferRef.current!);
                    renderPass.draw(vertices.length / 2);
                    renderPass.end();

                    deviceRef.current.queue.submit([commandEncoder.finish()]);

                    animationFrameId = requestAnimationFrame(render);
                };

                render();
            } catch (err) {
                console.error('Error initializing WebGPU:', err);
            }
        };

        initializeWebGPU();

        // Handle window resize
        const handleResize = () => {
            resizeCanvas();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            // Cleanup function
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (animationFrameId !== undefined) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
            }}
        />
    );
};

export default WebGPUCanvas;
