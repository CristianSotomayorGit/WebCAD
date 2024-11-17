import { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { ToolManager } from '../domain/managers/ToolManager';
import { EntityManager } from '../domain/managers/EntityManager';

export const useWebGPU = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const rendererRef = useRef<Renderer | null>(null);
    const toolManagerRef = useRef<ToolManager | null>(null);
    const entityManagerRef = useRef(new EntityManager());
    const [initializationError, setInitializationError] = useState<string | null>(null);
    const [didLoad, setLoad] = useState<boolean>(false);


    useEffect(() => {
        const initRenderer = async () => {
            if (canvasRef.current) {
                rendererRef.current = new Renderer(canvasRef.current, entityManagerRef.current);

                try {
                    await rendererRef.current.initialize();
                    toolManagerRef.current = new ToolManager(entityManagerRef.current, rendererRef.current);
                    setLoad(!didLoad)

                } catch (error) {
                    console.error('Error during WebGPU initialization', error);
                    setInitializationError(error instanceof Error ? error.message : String(error));
                }
            }
        };

        initRenderer();

        return () => {
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [canvasRef]);

    return { rendererRef, didLoad, toolManagerRef, initializationError };
};
