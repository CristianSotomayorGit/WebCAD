import { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { ToolManager } from '../domain/managers/ToolManager';
import { EntityManager } from '../domain/managers/EntityManager';
import { FileManager } from '../domain/managers/FileManager';

export const useWebGPU = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const rendererRef = useRef<Renderer | null>(null);
    const fileManagerRef =useRef<FileManager | null>(null);
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
                    fileManagerRef.current = new FileManager(entityManagerRef.current,rendererRef.current)
                    toolManagerRef.current = new ToolManager(entityManagerRef.current, rendererRef.current);
                    setLoad(!didLoad)

                } catch (error) {
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

    return { rendererRef, didLoad, fileManagerRef, toolManagerRef, initializationError };
};
