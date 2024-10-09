import React, { useEffect, useRef } from 'react';

const vertexShaderCode = `
    @vertex
    fn main(@location(0) position : vec3<f32>) -> @builtin(position) vec4<f32> {
        return vec4<f32>(position, 1.0);
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
const vertices = new Float32Array(numLines * 4 * 3); // 4 vertices per line (start and end for both horizontal and vertical)
let vertexIndex = 0;

for (let i = -gridSize; i <= gridSize; i++) {
    // Vertical lines
    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = -gridSize * gridSpacing;
    vertices[vertexIndex++] = 0;

    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = gridSize * gridSpacing;
    vertices[vertexIndex++] = 0;

    // Horizontal lines
    vertices[vertexIndex++] = -gridSize * gridSpacing;
    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = 0;

    vertices[vertexIndex++] = gridSize * gridSpacing;
    vertices[vertexIndex++] = i * gridSpacing;
    vertices[vertexIndex++] = 0;
}

const WebGPUCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const deviceRef = useRef<GPUDevice>();
    const pipelineRef = useRef<GPURenderPipeline>();
    const vertexBufferRef = useRef<GPUBuffer>();
    const contextRef = useRef<GPUCanvasContext>();
    const formatRef = useRef<GPUTextureFormat>();

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        const device = deviceRef.current;
        const format = formatRef.current;

        if (canvas && context && device && format) {
            const gridDimension = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight

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

                // Create shader modules
                const vertexModule = device.createShaderModule({ code: vertexShaderCode });
                const fragmentModule = device.createShaderModule({ code: fragmentShaderCode });

                // Create pipeline
                const pipeline = device.createRenderPipeline({
                    layout: 'auto',
                    vertex: {
                        module: vertexModule,
                        entryPoint: 'main',
                        buffers: [
                            {
                                arrayStride: 12, // 3 * 4 bytes for vec3<f32>
                                attributes: [
                                    {
                                        shaderLocation: 0,
                                        offset: 0,
                                        format: 'float32x3',
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
                                clearValue: { r: 0, g: 0, b: 0, a: 1 }, // Clear to black
                                loadOp: 'clear',
                                storeOp: 'store',
                            },
                        ],
                    });

                    renderPass.setPipeline(pipelineRef.current);
                    renderPass.setVertexBuffer(0, vertexBufferRef.current!);
                    renderPass.draw(vertices.length / 3);
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
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            // Optionally, destroy WebGPU resources here if needed
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
