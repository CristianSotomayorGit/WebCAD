import React, { useEffect, useRef, useState } from 'react';

const vertexShaderCode = `
    struct Uniforms {
        cameraOffset: vec2<f32>,  // Camera offset
        zoomFactor: f32,          // Zoom factor
        padding: f32,             // Padding for alignment
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let cameraPosition = (position - uniforms.cameraOffset) * uniforms.zoomFactor;  // Apply camera offset and zoom
        return vec4<f32>(cameraPosition, 0.0, 1.0);            // Output final position
    }
`;

const gridFragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(59.0 / 255.0, 65.0 / 255.0, 72.0 / 255.0, 1.0); // Grid color
    }
`;

const lineFragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        // Cyan color for the lines being drawn
        return vec4<f32>(0.0, 1.0, 1.0, 1.0);
    }
`;

const circleVertexShaderCode = `
    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let scale = 0.03;  // Increase the size of the vertex dots for lines
        let scaledPosition = position * scale;  // Scale to make larger dots
        return vec4<f32>(scaledPosition, 0.0, 1.0);
    }
`;

const circleFragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        // Gray color for the vertices of the lines
        return vec4<f32>(0.5, 0.5, 0.5, 1.0);
    }
`;

const gridSize = 10;
const gridSpacing = 0.1;

const numLines = 2 * gridSize + 1;
const vertices = new Float32Array(numLines * 4 * 2); 
let vertexIndex = 0;

for (let i = -gridSize; i <= gridSize; i++) {
    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = -gridSize * gridSpacing;

    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = gridSize * gridSpacing;

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
    const cameraBufferRef = useRef<GPUBuffer>();
    const bindGroupRef = useRef<GPUBindGroup>();
    const circlePipelineRef = useRef<GPURenderPipeline>();
    const linePipelineRef = useRef<GPURenderPipeline>();
    const gridPipelineRef = useRef<GPURenderPipeline>(); // For rendering the grid
    const isDraggingRef = useRef<boolean>(false);
    const isPDownRef = useRef<boolean>(false);
    const isLDownRef = useRef<boolean>(false); // New state to track 'L' command
    const firstClickDetected = useRef<boolean>(false); // Track first click state
    const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
    const cameraOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const zoomFactorRef = useRef<number>(1.0); // Initial zoom factor is 1 (no zoom)
    const commandRef = useRef<string>('Current Command: None');
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

    const [command, setCommand] = useState(commandRef.current);

    const lastVertexRef = useRef<{ x: number, y: number } | null>(null); // Track the last vertex
    const linesRef = useRef<Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>>([]); // Store permanent lines

    // Function to update camera offset and zoom factor
    const updateCameraData = (x: number, y: number, zoom: number) => {
        if (!deviceRef.current || !cameraBufferRef.current) return;

        const cameraData = new Float32Array([x, y, zoom, 0.0]);  // Include padding
        deviceRef.current.queue.writeBuffer(cameraBufferRef.current, 0, cameraData);
    };

    // Function to transform mouse click to grid coordinates
    const getMousePositionOnGrid = (event: MouseEvent): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        // Get normalized coordinates relative to the canvas (-1 to 1 range)
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const mouseY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

        // Apply camera offset and zoom to get the correct position on the grid
        const x = (mouseX / zoomFactorRef.current) + cameraOffsetRef.current.x;
        const y = (mouseY / zoomFactorRef.current) + cameraOffsetRef.current.y;

        return { x, y };
    };

    const handleMouseDown = (event: MouseEvent) => {
        if (isLDownRef.current) {
            const { x, y } = getMousePositionOnGrid(event);

            if (!firstClickDetected.current) {
                // The first click determines the starting vertex
                lastVertexRef.current = { x, y };
                firstClickDetected.current = true; // Mark the first click as detected
            } else {
                // If a line is already started, finalize the line and make the second point the new starting point
                linesRef.current.push({
                    start: lastVertexRef.current!,
                    end: { x, y }
                });
                lastVertexRef.current = { x, y }; // Set the last point as the new starting point
                setMousePosition(null); // Clear the dynamic line after the second click
            }
        } else {
            // Regular pan mode
            isDraggingRef.current = true;
            lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        const { x, y } = getMousePositionOnGrid(event);
        setMousePosition({ x, y }); // Update the mouse position continuously

        if (!isPDownRef.current || !isDraggingRef.current || !lastMousePositionRef.current) return;

        const deltaX = event.clientX - lastMousePositionRef.current.x;
        const deltaY = event.clientY - lastMousePositionRef.current.y;

        cameraOffsetRef.current.x -= deltaX / window.innerWidth * 2;  
        cameraOffsetRef.current.y += deltaY / window.innerHeight * 2;  

        updateCameraData(cameraOffsetRef.current.x, cameraOffsetRef.current.y, zoomFactorRef.current);
        lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        lastMousePositionRef.current = null;
    };

    const handlePDown = (event: KeyboardEvent) => {
        if (event.key === 'p' || event.key === 'P') {
            if (isPDownRef.current === false) {
                isPDownRef.current = true;
                commandRef.current = 'Current Command Pan';
                setCommand(commandRef.current);
            } else {
                isPDownRef.current = false;
                commandRef.current = 'Current Command: None';
                setCommand(commandRef.current);
            }
        }
    };

    const handleLDown = (event: KeyboardEvent) => {
        if (event.key === 'l' || event.key === 'L') {
            if (isLDownRef.current === false) {
                isLDownRef.current = true;
                firstClickDetected.current = false; // Reset for new line drawing session
                commandRef.current = 'Current Command: Line Drawing';
                setCommand(commandRef.current);
            } else {
                isLDownRef.current = false;
                commandRef.current = 'Current Command: None';
                setCommand(commandRef.current);
            }
        }
    };

    const handleScroll = (event: WheelEvent) => {
        const zoomSpeed = 0.1;
        if (event.deltaY < 0) {
            zoomFactorRef.current = Math.min(zoomFactorRef.current + zoomSpeed, 5);
        } else {
            zoomFactorRef.current = Math.max(zoomFactorRef.current - zoomSpeed, 0.1);
        }

        updateCameraData(cameraOffsetRef.current.x, cameraOffsetRef.current.y, zoomFactorRef.current);
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

                resizeCanvas();

                const vertexBuffer = device.createBuffer({
                    size: vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true,
                });

                new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
                vertexBuffer.unmap();
                vertexBufferRef.current = vertexBuffer;

                const cameraDataArray = new Float32Array([0.0, 0.0, 1.0, 0.0]); // Initial camera data with padding
                const cameraBuffer = device.createBuffer({
                    size: cameraDataArray.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(cameraBuffer, 0, cameraDataArray);
                cameraBufferRef.current = cameraBuffer;

                const vertexModule = device.createShaderModule({ code: vertexShaderCode });
                const lineFragmentModule = device.createShaderModule({ code: lineFragmentShaderCode });
                const circleFragmentModule = device.createShaderModule({ code: circleFragmentShaderCode });
                const circleVertexModule = device.createShaderModule({ code: circleVertexShaderCode });
                const gridFragmentModule = device.createShaderModule({ code: gridFragmentShaderCode });

                const vertexCompilationInfo = await vertexModule.getCompilationInfo();
                const lineCompilationInfo = await lineFragmentModule.getCompilationInfo();
                const circleVertexCompilationInfo = await circleVertexModule.getCompilationInfo();
                const circleFragmentCompilationInfo = await circleFragmentModule.getCompilationInfo();
                const gridFragmentCompilationInfo = await gridFragmentModule.getCompilationInfo();

                if (vertexCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Vertex shader compilation failed:', vertexCompilationInfo);
                    return;
                }

                if (lineCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Line fragment shader compilation failed:', lineCompilationInfo);
                    return;
                }

                if (circleVertexCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Circle vertex shader compilation failed:', circleVertexCompilationInfo);
                    return;
                }

                if (circleFragmentCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Circle fragment shader compilation failed:', circleFragmentCompilationInfo);
                    return;
                }

                if (gridFragmentCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Grid fragment shader compilation failed:', gridFragmentCompilationInfo);
                    return;
                }

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

                const bindGroup = device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: cameraBuffer,  
                            },
                        },
                    ],
                });
                bindGroupRef.current = bindGroup;

                const pipelineLayout = device.createPipelineLayout({
                    bindGroupLayouts: [bindGroupLayout],
                });

                const pipeline = device.createRenderPipeline({
                    layout: pipelineLayout,
                    vertex: {
                        module: vertexModule,
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
                        module: lineFragmentModule,
                        entryPoint: 'main',
                        targets: [{ format }],
                    },
                    primitive: {
                        topology: 'line-list',
                    },
                });
                pipelineRef.current = pipeline;

                // Circle pipeline for vertices (gray)
                const circlePipeline = device.createRenderPipeline({
                    layout: pipelineLayout,
                    vertex: {
                        module: circleVertexModule,
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
                        module: circleFragmentModule,
                        entryPoint: 'main',
                        targets: [{ format }],
                    },
                    primitive: {
                        topology: 'point-list',
                    },
                });
                circlePipelineRef.current = circlePipeline;

                // Pipeline for grid rendering
                const gridPipeline = device.createRenderPipeline({
                    layout: pipelineLayout,
                    vertex: {
                        module: vertexModule,
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
                        module: gridFragmentModule,
                        entryPoint: 'main',
                        targets: [{ format }],
                    },
                    primitive: {
                        topology: 'line-list',
                    },
                });
                gridPipelineRef.current = gridPipeline;

                window.addEventListener('mousedown', handleMouseDown);
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
                window.addEventListener('keydown', handlePDown);
                window.addEventListener('keydown', handleLDown);
                window.addEventListener('wheel', handleScroll);

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

                    // Draw the grid
                    renderPass.setPipeline(gridPipelineRef.current);
                    renderPass.setBindGroup(0, bindGroupRef.current!);
                    renderPass.setVertexBuffer(0, vertexBufferRef.current!);
                    renderPass.draw(vertices.length / 2);

                    // Draw gray circles for each clicked vertex
                    if (lastVertexRef.current) {
                        renderPass.setPipeline(circlePipelineRef.current!);

                        const clickedVertices = new Float32Array([lastVertexRef.current.x, lastVertexRef.current.y]);
                        const clickedVertexBuffer = deviceRef.current!.createBuffer({
                            size: clickedVertices.byteLength,
                            usage: GPUBufferUsage.VERTEX,
                            mappedAtCreation: true,
                        });
                        new Float32Array(clickedVertexBuffer.getMappedRange()).set(clickedVertices);
                        clickedVertexBuffer.unmap();

                        renderPass.setVertexBuffer(0, clickedVertexBuffer);
                        renderPass.draw(1);
                    }

                    // Draw all permanent lines
                    if (linesRef.current.length > 0) {
                        renderPass.setPipeline(pipelineRef.current!);

                        linesRef.current.forEach(line => {
                            const lineVertices = new Float32Array([
                                line.start.x, line.start.y, 
                                line.end.x, line.end.y
                            ]);
                            const lineVertexBuffer = device.createBuffer({
                                size: lineVertices.byteLength,
                                usage: GPUBufferUsage.VERTEX,
                                mappedAtCreation: true,
                            });
                            new Float32Array(lineVertexBuffer.getMappedRange()).set(lineVertices);
                            lineVertexBuffer.unmap();

                            renderPass.setVertexBuffer(0, lineVertexBuffer);
                            renderPass.draw(2);
                        });
                    }

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

        const handleResize = () => {
            resizeCanvas();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handlePDown);
            window.removeEventListener('keydown', handleLDown);
            window.removeEventListener('wheel', handleScroll);

            if (animationFrameId !== undefined) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                }}
            />
            <div style={{
                width: '100%',
                position: 'absolute',
                top: '0px',
                left: '0px',
                color: 'white',
                fontSize: '12px',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '2px',
            }}>
                <a style={{
                    display: 'block',
                    textAlign: 'left',
                }}>{command}</a>
            </div>
        </div>
    );
};

export default WebGPUCanvas;
