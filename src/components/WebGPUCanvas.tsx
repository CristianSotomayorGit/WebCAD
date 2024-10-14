import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import { Command } from '../command/command';

const vertexShaderCode =
    `    struct Uniforms {
        cameraOffset: vec2<f32>,  
        zoomFactor: f32,      
        padding: f32,      
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let cameraPosition = (position - uniforms.cameraOffset) * uniforms.zoomFactor;  
        return vec4<f32>(cameraPosition, 0.0, 1.0);            
    }; `

const gridFragmentShaderCode =
    `@fragment
    fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(59.0 / 255.0, 65.0 / 255.0, 72.0 / 255.0, 1.0); 
    }
;`

const lineFragmentShaderCode =
    `@fragment
    fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(0.0, 1.0, 1.0, 1.0);
    }
;`

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
    const linePipelineRef = useRef<GPURenderPipeline>();
    const gridPipelineRef = useRef<GPURenderPipeline>();
    const isDraggingRef = useRef<boolean>(false);
    const firstClickDetected = useRef<boolean>(false);
    const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
    const cameraOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const zoomFactorRef = useRef<number>(1.0);
    const commandRef = useRef<string>(Command.NONE);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

    const [command, setCommand] = useState(commandRef.current);

    const lastVertexRef = useRef<{ x: number, y: number } | null>(null);
    const linesRef = useRef<Array<{ start: { x: number; y: number }, end: { x: number; y: number } }>>([]);
    const tempLineRef = useRef<{ start: { x: number; y: number }, end: { x: number; y: number } }>();
    const updateCameraData = (x: number, y: number, zoom: number) => {
        if (!deviceRef.current || !cameraBufferRef.current) return;

        const cameraData = new Float32Array([x, y, zoom, 0.0]);
        deviceRef.current.queue.writeBuffer(cameraBufferRef.current, 0, cameraData);
    };

    const getMousePositionOnGrid = (event: MouseEvent): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const mouseY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

        const x = (mouseX / zoomFactorRef.current) + cameraOffsetRef.current.x;
        const y = (mouseY / zoomFactorRef.current) + cameraOffsetRef.current.y;

        return { x, y };
    };

    const handleMouseDown = (event: MouseEvent) => {
        switch (event.button) {
            case 0:
                if (commandRef.current === Command.LINE) {
                    const { x, y } = getMousePositionOnGrid(event);

                    if (!firstClickDetected.current) {
                        lastVertexRef.current = { x, y };
                        firstClickDetected.current = true;
                    }

                    else {
                        linesRef.current.push({
                            start: lastVertexRef.current!,
                            end: { x, y }
                        });
                        lastVertexRef.current = { x, y };
                        setMousePosition(null);
                    }
                }

                break;

            case 1:
                commandRef.current = Command.PAN;
                setCommand(commandRef.current);

                isDraggingRef.current = true;
                lastMousePositionRef.current = { x: event.clientX, y: event.clientY };

                break;

            case 2:
            //implement some right click
        }
    };

    const handleMouseUp = (event: MouseEvent) => {
        switch (event.button) {
            case 1:
                commandRef.current = Command.NONE;
                setCommand(commandRef.current);
        }

        isDraggingRef.current = false;
        lastMousePositionRef.current = null;
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (commandRef.current === Command.PAN) {
            const { x, y } = getMousePositionOnGrid(event);
            setMousePosition({ x, y });

            if (commandRef.current !== Command.PAN || !isDraggingRef.current || !lastMousePositionRef.current) return;

            const deltaX = event.clientX - lastMousePositionRef.current.x;
            const deltaY = event.clientY - lastMousePositionRef.current.y;

            cameraOffsetRef.current.x -= deltaX / window.innerWidth * 2;
            cameraOffsetRef.current.y += deltaY / window.innerHeight * 2;

            updateCameraData(cameraOffsetRef.current.x, cameraOffsetRef.current.y, zoomFactorRef.current);
            lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
        }

        if (commandRef.current === Command.LINE) {
            const { x, y } = getMousePositionOnGrid(event);

            if (firstClickDetected.current) {
                tempLineRef.current = {
                    start: lastVertexRef.current!,
                    end: { x, y }
                }
            }
        }
    };

    const handleCommandKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            commandRef.current = Command.NONE
            tempLineRef.current = undefined;
        
        }
        if (event.key === 'p' || event.key === 'P') commandRef.current = Command.POINT;
        if (event.key === 'l' || event.key === 'L') {
            commandRef.current = Command.LINE;
            firstClickDetected.current = false;
        }
        setCommand(commandRef.current);
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

                const cameraDataArray = new Float32Array([0.0, 0.0, 1.0, 0.0]);
                const cameraBuffer = device.createBuffer({
                    size: cameraDataArray.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(cameraBuffer, 0, cameraDataArray);
                cameraBufferRef.current = cameraBuffer;

                const vertexModule = device.createShaderModule({ code: vertexShaderCode });
                const lineFragmentModule = device.createShaderModule({ code: lineFragmentShaderCode });
                const gridFragmentModule = device.createShaderModule({ code: gridFragmentShaderCode });

                const vertexCompilationInfo = await vertexModule.getCompilationInfo();
                const lineCompilationInfo = await lineFragmentModule.getCompilationInfo();
                const gridFragmentCompilationInfo = await gridFragmentModule.getCompilationInfo();

                if (vertexCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Vertex shader compilation failed:', vertexCompilationInfo);
                    return;
                }

                if (lineCompilationInfo.messages.some(msg => msg.type === 'error')) {
                    console.error('Line fragment shader compilation failed:', lineCompilationInfo);
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
                window.addEventListener('wheel', handleScroll);
                window.addEventListener('keydown', handleCommandKeyDown);


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

                    renderPass.setPipeline(gridPipelineRef.current);
                    renderPass.setBindGroup(0, bindGroupRef.current!);
                    renderPass.setVertexBuffer(0, vertexBufferRef.current!);
                    renderPass.draw(vertices.length / 2);

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

                    if (tempLineRef.current) {
                        renderPass.setPipeline(pipelineRef.current!);
                        const tempLine = tempLineRef.current

                        const lineVertices = new Float32Array([
                            tempLine.start.x, tempLine.start.y,
                            tempLine.end.x, tempLine.end.y
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
            window.removeEventListener('keydown', handleCommandKeyDown);
            window.removeEventListener('wheel', handleScroll);
            // window.removeEventListener('mousedown', handleScrollWheelDown);

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
                }}>Command: {command}</a>
            </div>
        </div>
    );
};

export default WebGPUCanvas;