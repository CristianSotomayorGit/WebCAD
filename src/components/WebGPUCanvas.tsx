import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { EntityManager } from '../domain/managers/EntityManager';
import { ToolManager } from '../domain/managers/ToolManager';
import CommandToolbar from './CommandToolbar';

const WebGPUCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>();
  const entityManagerRef = useRef(new EntityManager());
  const toolManagerRef = useRef<ToolManager>();

  const [activeToolName, setActiveToolName] = useState('Select');

  useEffect(() => {
    const initRenderer = async () => {

      console.log('hello')
      if (canvasRef.current) {
        rendererRef.current = new Renderer(
          canvasRef.current,
          entityManagerRef.current
        );

        await rendererRef.current.initialize();

        toolManagerRef.current = new ToolManager(
          entityManagerRef.current,
          rendererRef.current
        );

        canvasRef.current.addEventListener('mousedown', handleMouseDown);
        canvasRef.current.addEventListener('mousemove', handleMouseMove);
        canvasRef.current.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel);
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose(); 
      }
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 1) toolManagerRef.current?.getPanTool().onMouseDown(event);
    toolManagerRef.current?.getActiveTool().onMouseDown(event);
  };

  const handleMouseMove = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseMove(event);
    toolManagerRef.current?.getActiveTool().onMouseMove(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseUp(event);
    // toolManagerRef.current?.getActiveTool().onMouseUp(event);
  };

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'l' || event.key === 'L') {
    setActiveToolName('Line');
    toolManagerRef.current?.setActiveTool('Line');
  } else if (event.key === 's' || event.key === 'S') {
    setActiveToolName('Select');
    toolManagerRef.current?.setActiveTool('Select');
  } else if (event.key === 'p' || event.key === 'P') {
    setActiveToolName('Point');
    toolManagerRef.current?.setActiveTool('Point');
  }
};

  const handleWheel = (event: WheelEvent) => {
    toolManagerRef.current?.getZoomTool().onWheelScroll(event);
  };

  return (
    <>
      <CommandToolbar activeTool={activeToolName} />
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </>
  );
};

export default WebGPUCanvas;
