import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { EntityManager } from '../domain/managers/EntityManager';
import { ToolManager } from '../domain/managers/ToolManager';
import CommandToolbar from './CommandToolbar';
import ButtonToolbar from './ButtonToolbar';
import ScaleButton from './ScaleButton';
import { ScaleManager } from '../domain/managers/ScaleManager';
import { SnapConstraint } from '../domain/constraints/SnapConstraint';
import { Line } from '../domain/entities/Line';
import { Point } from '../domain/entities/Point';



const WebGPUCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>();
  const entityManagerRef = useRef(new EntityManager());
  const toolManagerRef = useRef<ToolManager>();
  const [activeToolName, setActiveToolName] = useState('Select');
  const [isSnapping, setSnap] = useState(false);
  const isSnappingRef = useRef(isSnapping);



  useEffect(() => {
    const initRenderer = async () => {

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

  const calculateDistance = (mouseX: number, mouseY: number, pointX: number, pointY: number): number => {
    const dx = pointX - mouseX;
    const dy = pointY - mouseY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const handleMouseMove = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseMove(event);
    // toolManagerRef.current?.getActiveTool().onMouseMove(event);

    if (isSnappingRef.current) {
      // console.log('screen', event.clientX, event.clientY);
      // console.log('world', rendererRef.current?.screenToWorld(event.clientX, event.clientY));

      let nearest: Point | null = null;
      let minDist = Infinity;

      for (const entity of entityManagerRef.current?.getEntities()) {
        // console.log('screen', event.clientX, event.clientY);
        // console.log('world', rendererRef.current?.screenToWorld(event.clientX, event.clientY));

        const canvasRect = rendererRef.current?.getCanvas().getBoundingClientRect();


        if (!canvasRect) throw new Error('error canvasRect')
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        const mouse = rendererRef.current?.screenToWorld(x, y);

        if (!mouse) throw new Error('mouse error')
        if (entity instanceof Point) {
          const dist = calculateDistance(mouse.x, mouse.y, entity.getX(), entity.getY());
          // console.log(mouse.x, mouse.y, entity.getX(), entity.getY());
          if (dist < minDist && dist <= 0.02) {
            minDist = dist;
            nearest = entity;

            console.log('NEAR');

            nearest.setColor(new Float32Array([1.0, 1.0, 1.0, 1.0]));
          }

          else {
            entity.setColor(new Float32Array([0.5, 0.5, 0.5, 1.0]));

          }
        }
      }

    }
  };

  useEffect(() => {
    isSnappingRef.current = isSnapping;
  }, [isSnapping]);


  const handleMouseUp = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseUp(event);
    // toolManagerRef.current?.getActiveTool().onMouseUp(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {

    if (event.key === 'l' || event.key === 'L') {
      setActiveToolName('Line');
      toolManagerRef.current?.setActiveTool('Line');
      // } else if (event.key === 's' || event.key === 'S') {
      //   setActiveToolName('Select');
      //   toolManagerRef.current?.setActiveTool('Select');
    } else if (event.key === 'p' || event.key === 'P') {
      setActiveToolName('Polygon');
      toolManagerRef.current?.setActiveTool('Polygon');
    } else if (event.key === 'c' || event.key === 'C') {
      setActiveToolName('Circle');
      toolManagerRef.current?.setActiveTool('Circle');
    } else if (event.key === 's' || event.key === 'S') {
      setActiveToolName('Spline');
      toolManagerRef.current?.setActiveTool('Spline');
    } else if (event.key === 'r' || event.key === 'R') {
      setActiveToolName('Rectangle');
      toolManagerRef.current?.setActiveTool('Rectangle');
    } else if (event.key === 't' || event.key === 'T') {
      setSnap(prevState => !prevState); 


      console.log(isSnapping)

    } else {
      toolManagerRef.current?.getActiveTool().onKeyDown(event);
    }

    // } else if (event.key === 'p' || event.key === 'P') {
    //   setActiveToolName('Point');
    //   toolManagerRef.current?.setActiveTool('Point');
    // }
  };


  const handleWheel = (event: WheelEvent) => {
    toolManagerRef.current?.getZoomTool().onWheelScroll(event);
  };

  return (

    <>
      <CommandToolbar activeTool={activeToolName} />
      <ButtonToolbar
        toolManagerRef={toolManagerRef}
        setActiveToolName={setActiveToolName}
      />
      <ScaleButton
        toolManagerRef={toolManagerRef} />
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </>
  );
};

export default WebGPUCanvas;
