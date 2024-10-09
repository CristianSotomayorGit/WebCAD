import React, { useEffect, useRef } from 'react';

const WebGPUCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const initializeWebGPU = async () => {
            if (!canvasRef.current) {
                console.error('Canvas element is not available.');
                return;
            }

            if (!navigator.gpu) {
                console.error('WebGPU is not supported in this browser.');
                return;
            }

            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                console.error('Failed to get GPU adapter.');
                return;
            }

            const device = await adapter.requestDevice();

            const context = canvasRef.current.getContext('webgpu');
            if (!context) {
                console.error('Failed to get WebGPU context.');
                return;
            }

            const format = navigator.gpu.getPreferredCanvasFormat();

            context.configure({
                device,
                format,
                alphaMode: 'opaque',
            });

            console.log('WebGPU initialized successfully.');
        };

        initializeWebGPU().catch((err) => {
            console.error('Error initializing WebGPU:', err);
        });

    }, []);

    return <canvas ref={canvasRef} width={512} height={512}/>
};

export default WebGPUCanvas;
