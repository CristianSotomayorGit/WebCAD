import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { EntityManager } from '../domain/managers/EntityManager';
import { ToolManager } from '../domain/managers/ToolManager';
import CommandToolbar from './CommandToolbar';
import ButtonToolbar from './ButtonToolbar';
import { ConstraintType } from '../domain/constraints/ConstraintTypes';
import { ConstraintManager } from '../domain/managers/ConstraintManager';
import ConstraintToolbar from './ConstraintToolbar';

const WebGPUCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>();
  const entityManagerRef = useRef(new EntityManager());
  const toolManagerRef = useRef<ToolManager>();
  const constraintManagerRef = useRef<ConstraintManager>();

  const [activeToolName, setActiveToolName] = useState('Select');
  const [isSnapChecked, setIsSnapChecked] = useState(false);
  const [isOrthoChecked, setIsOrthoChecked] = useState(false);

  useEffect(() => {
    const initRenderer = async () => {
      if (canvasRef.current) {
        rendererRef.current = new Renderer(
          canvasRef.current,
          entityManagerRef.current
        );

        await rendererRef.current.initialize();

        constraintManagerRef.current = new ConstraintManager(entityManagerRef.current, rendererRef.current);

        toolManagerRef.current = new ToolManager(
          entityManagerRef.current,
          constraintManagerRef.current,
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
    if (event.button === 0) toolManagerRef.current?.getActiveTool().onLeftclick(event);
    if (event.button === 1) toolManagerRef.current?.getPanTool().onWheelClick(event);
  };

  const handleMouseMove = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseMove(event);
    toolManagerRef.current?.getActiveTool().onMouseMove(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseUp(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!constraintManagerRef.current || !toolManagerRef.current) return;

    switch (event.key.toLowerCase()) {
      case 'l':
        setActiveToolName('Line'); // Update UI state
        toolManagerRef.current.setActiveTool('Line'); // Update tool manager
        break;

      case 's':
        setActiveToolName('Select'); // Update UI state
        toolManagerRef.current.setActiveTool('Select'); // Update tool manager
        break;

      case 'p':
        setActiveToolName('Polygon'); // Update UI state
        toolManagerRef.current.setActiveTool('Polygon'); // Update tool manager
        break;

      case 'c':
        setActiveToolName('Circle'); // Update UI state
        toolManagerRef.current.setActiveTool('Circle'); // Update tool manager
        break;

      case 'y': // Changed from 's' to 'y' to avoid conflict with 'Select'
        setActiveToolName('Spline'); // Update UI state
        toolManagerRef.current.setActiveTool('Spline'); // Update tool manager
        break;

      case 'r':
        setActiveToolName('Rectangle'); // Update UI state
        toolManagerRef.current.setActiveTool('Rectangle'); // Update tool manager
        break;

      case 'shift' && 'z':
        setIsOrthoChecked((prev) => !prev); // Toggle Ortho checkbox state
        constraintManagerRef.current.toggleConstraint(ConstraintType.Orthogonal, 'both');
        break;

      case 'f3' && 'x':
        setIsSnapChecked((prev) => !prev); // Toggle Snap checkbox state
        constraintManagerRef.current.toggleConstraint(ConstraintType.Snap, 'both');
        break;

      default:
        toolManagerRef.current.getActiveTool()?.onKeyDown(event);
        break;
    }
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    toolManagerRef.current?.getZoomTool().onWheelScroll(event);
  };

  return (
    <>
      <CommandToolbar activeTool={activeToolName} />
      <ButtonToolbar
        toolManagerRef={toolManagerRef}
        setActiveToolName={setActiveToolName}
      />
      <ConstraintToolbar
        constraintToolbarRef={constraintManagerRef}
        isSnapChecked={isSnapChecked}
        setIsSnapChecked={setIsSnapChecked}
        isOrthoChecked={isOrthoChecked}
        setIsOrthoChecked={setIsOrthoChecked}
      />
<canvas ref={canvasRef} style={{ display: 'block', overflow: 'hidden' }} />
</>
  );
};

export default WebGPUCanvas;
