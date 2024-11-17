// src/components/WebGPUCanvas.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { EntityManager } from '../../domain/managers/EntityManager';
import { ToolManager } from '../../domain/managers/ToolManager';
import CommandToolbar from '../CommandToolbar/CommandToolbar';
import ButtonToolbar from '../ButtonToolbar/ButtonToolbar';
import { AbstractWritingTool } from '../../domain/tools/WritingTools/AbstractWritingTool';
import { AbstractDrawingTool } from '../../domain/tools/DrawingTools/AbstractDrawingTool';
import { PanTool } from '../../domain/tools/ViewTools/PanTool';
import WebGPUCanvas from '../WebGPUCanvas/WebGPUCanvas';
import PopUp from '../PopUp/PopUp';

export type Font = {
    size: string;
    name: string;
}


const Desk: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<Renderer>();
    const entityManagerRef = useRef(new EntityManager());
    const toolManagerRef = useRef<ToolManager>();
    const activeColorRef = useRef<Float32Array>(new Float32Array([0.0, 1.0, 1.0, 1.0])); // Default cyan color
    const [activeToolName, setActiveToolName] = useState('Select'); // Keep default tool as 'Select'
    const [activeColor, setActiveColor] = useState(new Float32Array([0.0, 1.0, 1.0, 1.0]));
    undefined
    const [activeFontSize, setActiveFontSize] = useState<number>(12);
    const activeFontSizeRef = useRef<number>(12);

    const [activeFont, setActiveFont] = useState<string>("Times New Roman");
    const activeFontRef = useRef<string>("Times New Roman");

    const [showPopup, setShowPopup] = useState(true);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        activeColorRef.current = activeColor;
    }, [activeColor]);

    useEffect(() => {
        activeFontRef.current = activeFont;
        activeFontSizeRef.current = activeFontSize;
    }, [activeFont, activeFontSize]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const initRenderer = async () => {
            if (canvasRef.current) {
                rendererRef.current = new Renderer(canvasRef.current, entityManagerRef.current);

                try {
                    await rendererRef.current.initialize();
                } catch (error) {
                    console.error('Error during WebGPU initialization', error);
                    setInitializationError(error instanceof Error ? error.message : String(error));
                }

                toolManagerRef.current = new ToolManager(entityManagerRef.current, rendererRef.current);

                canvasRef.current.addEventListener('mousedown', handleMouseDown);
                canvasRef.current.addEventListener('mousemove', handleMouseMove);
                canvasRef.current.addEventListener('mouseup', handleMouseUp);
                canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });
                window.addEventListener('keydown', handleKeyDown);
            }
        };

        initRenderer();

        return () => {
            document.body.style.overflow = 'auto';

            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('mousedown', handleMouseDown);
                canvasRef.current.removeEventListener('mousemove', handleMouseMove);
                canvasRef.current.removeEventListener('mouseup', handleMouseUp);
                canvasRef.current.removeEventListener('wheel', handleWheel);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
            const activeTool = toolManagerRef.current?.getActiveTool();

            if (activeTool instanceof AbstractDrawingTool)
                activeTool?.onLeftClick(event, activeColorRef.current);

            if (activeTool instanceof AbstractWritingTool)
                activeTool?.onLeftClick(event, activeColorRef.current, activeFontRef.current, activeFontSizeRef.current);

            if (activeTool instanceof PanTool)
                activeTool.onLeftClick(event);
        }

        if (event.button === 1) {
            toolManagerRef.current?.getPanTool()?.onWheelClick(event);
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        toolManagerRef.current?.getPanTool()?.onMouseMove(event);
        toolManagerRef.current?.getActiveTool()?.onMouseMove?.(event);
    };

    const handleMouseUp = (event: MouseEvent) => {
        toolManagerRef.current?.getPanTool()?.onMouseUp(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!toolManagerRef.current) return;
        toolManagerRef.current.getActiveTool()?.onKeyDown?.(event);
    };

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        toolManagerRef.current?.getZoomTool()?.onWheel(event);
    };

    return (
        <>
            {showPopup && <PopUp initializationError={initializationError!} setShowPopup={setShowPopup} />}
            <CommandToolbar activeTool={activeToolName} />
            <ButtonToolbar
                toolManagerRef={toolManagerRef}

                setActiveToolName={setActiveToolName}

                setActiveColor={(color: Float32Array) => {
                    setActiveColor(color);
                    activeColorRef.current = color;
                }}

                setActiveFont={(fontName: string) => {
                    setActiveFont(fontName);
                    activeFontRef.current = fontName;
                }}

                setActiveFontSize={(fontSize: number) => {
                    setActiveFontSize(fontSize);
                    activeFontSizeRef.current = fontSize;
                }}
            />
            <WebGPUCanvas canvasRef={canvasRef} renderer={rendererRef.current!} />
        </>
    );
};



export default Desk;
