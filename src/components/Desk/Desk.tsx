import React, { useState, useRef, useEffect } from 'react';
import { useWebGPU } from '../../hooks/useWebGPU';
import CommandToolbar from '../CommandToolbar/CommandToolbar';
import ButtonToolbar from '../ButtonToolbar/ButtonToolbar';
import PopUp from '../PopUp/PopUp';
import WebGPUCanvas from '../WebGPUCanvas/WebGPUCanvas';
import { AbstractDrawingTool } from '../../domain/tools/DrawingTools/AbstractDrawingTool';
import { AbstractWritingTool } from '../../domain/tools/WritingTools/AbstractWritingTool';
import { PanTool } from '../../domain/tools/ViewTools/PanTool';

const Desk: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeToolName, setActiveToolName] = useState('Select');
    const [activeColor, setActiveColor] = useState(new Float32Array([0.0, 1.0, 1.0, 1.0]));
    const [activeFont, setActiveFont] = useState('Times New Roman');
    const [activeFontSize, setActiveFontSize] = useState(12);
    const [showPopup, setShowPopup] = useState(true);
    const { didLoad, toolManagerRef, initializationError } = useWebGPU(canvasRef);

    useEffect(() => {
        if (toolManagerRef.current) {
            const toolManager = toolManagerRef.current;

            const handleMouseDown = (event: MouseEvent) => {

                console.log('nigger!!!')
                if (event.button === 0) {
                    const activeTool = toolManager.getActiveTool();
                    if (activeTool instanceof AbstractDrawingTool) {
                        activeTool.onLeftClick(event, activeColor);
                    }
                    if (activeTool instanceof AbstractWritingTool) {
                        activeTool.onLeftClick(event, activeColor, activeFont, activeFontSize);
                    }
                    if (activeTool instanceof PanTool) {
                        activeTool.onLeftClick(event);
                    }
                }
                if (event.button === 1) {
                    toolManager.getPanTool()?.onWheelClick(event);
                }
            };

            const handleMouseMove = (event: MouseEvent) => {
                toolManager.getPanTool()?.onMouseMove(event);
                toolManager.getActiveTool()?.onMouseMove?.(event);
            };

            const handleMouseUp = (event: MouseEvent) => {
                toolManager.getPanTool()?.onMouseUp(event);
            };

            const handleWheel = (event: WheelEvent) => {
                event.preventDefault();
                toolManager.getZoomTool()?.onWheel(event);
            };

            const handleKeyDown = (event: KeyboardEvent) => {
                toolManager.getActiveTool()?.onKeyDown?.(event);
            };

            canvasRef.current?.addEventListener('mousedown', handleMouseDown);
            canvasRef.current?.addEventListener('mousemove', handleMouseMove);
            canvasRef.current?.addEventListener('mouseup', handleMouseUp);
            canvasRef.current?.addEventListener('wheel', handleWheel);
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
                canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
                canvasRef.current?.removeEventListener('mouseup', handleMouseUp);
                canvasRef.current?.removeEventListener('wheel', handleWheel);
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [toolManagerRef, activeColor, activeFont, activeFontSize]);

    return (
        <>
            {showPopup && <PopUp didLoad={didLoad} initializationError={initializationError!} setShowPopup={setShowPopup} />}
            <CommandToolbar activeTool={activeToolName} />
            <ButtonToolbar
                toolManagerRef={toolManagerRef}
                setActiveToolName={setActiveToolName}
                setActiveColor={setActiveColor}
                setActiveFont={setActiveFont}
                setActiveFontSize={setActiveFontSize}
                activeToolName={activeToolName}
                activeColor={activeColor}
                activeFont={activeFont}
                activeFontSize={activeFontSize}
            />
            <WebGPUCanvas canvasRef={canvasRef} />
        </>
    );
};

export default Desk;
