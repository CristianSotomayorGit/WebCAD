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

  const [showPopup, setShowPopup] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initRenderer = async () => {
      if (canvasRef.current) {
        rendererRef.current = new Renderer(
          canvasRef.current,
          entityManagerRef.current
        );

        try {
          await rendererRef.current.initialize();
        } catch (error) {
          console.error('Error during WebGPU initialization', error);
          setInitializationError(error instanceof Error ? error.message : String(error));
        }

        constraintManagerRef.current = new ConstraintManager(
          entityManagerRef.current,
          rendererRef.current
        );

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
    if (event.button === 0)
      toolManagerRef.current?.getActiveTool().onLeftClick(event);
    if (event.button === 1)
      toolManagerRef.current?.getPanTool().onWheelClick(event);
  };

  const handleMouseMove = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseMove(event);
    toolManagerRef.current?.getActiveTool().onMouseMove!(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    toolManagerRef.current?.getPanTool().onMouseUp(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!constraintManagerRef.current || !toolManagerRef.current) return;

    switch (event.key.toLowerCase()) {
      case 'l':
        setActiveToolName('Line');
        toolManagerRef.current.setActiveTool('Line');
        break;
      case 's':
        setActiveToolName('Select');
        toolManagerRef.current.setActiveTool('Select');
        break;
      case 'p':
        setActiveToolName('Polygon');
        toolManagerRef.current.setActiveTool('Polygon');
        break;
      case 'c':
        setActiveToolName('Circle');
        toolManagerRef.current.setActiveTool('Circle');
        break;
      case 'y':
        setActiveToolName('Spline');
        toolManagerRef.current.setActiveTool('Spline');
        break;
      case 'r':
        setActiveToolName('Rectangle');
        toolManagerRef.current.setActiveTool('Rectangle');
        break;
      case 'e':
        setActiveToolName('Ellipse');
        toolManagerRef.current.setActiveTool('Ellipse');
        break;
      case 'shift' && 'z':
        setIsOrthoChecked((prev) => !prev);
        constraintManagerRef.current.toggleConstraint(
          ConstraintType.Orthogonal,
          'both'
        );
        break;
      case 'f3' && 'x':
        setIsSnapChecked((prev) => !prev);
        constraintManagerRef.current.toggleConstraint(
          ConstraintType.Snap,
          'both'
        );
        break;
      default:
        toolManagerRef.current.getActiveTool()?.onKeyDown!(event);
        break;
    }
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    toolManagerRef.current?.getZoomTool().onWheel(event);
  };

  return (
    <>
      {showPopup && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>
              <img src="/OtterCAD_logo.png" alt="Logo" style={logoStyle} />
              <h1 style={popupTitleStyle}>OtterCAD</h1>
            </div>
            <p style={popupVersionStyle}>
              Version: Alpha 0.0.1            
            </p>
            <p style={popupDescriptionStyle}>
            This is the first release of OtterCAD. I've chosen to make it available early 
            to share my progress. Currently, the application is in an experimental stage, 
            offering only basic drawing functionality. this app is an exploration of WebGPU for 2D drafting, 
            which is still highly experimental but has the potential to significantly enhance performance.

            <br></br>
            <br></br>


            I chose the name OtterCAD because I believe our tools should get out of the way and enable 
            us to work as seamlessly as otters swim. My goal is to develop OtterCAD into a reliable web-
            based CAD tool, equipped with professional features and robust performance.
            </p>
            {initializationError && (
              <p style={errorStyle}>{initializationError}</p>
            )}
            <button
              onClick={() => setShowPopup(false)}
              style={popupButtonStyle}
            >
              Launch App
            </button>
          </div>
        </div>
      )}
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
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100vh' }}
      />
    </>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // Gray overlay
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999, // Ensure it's on top
};

const popupStyle: React.CSSProperties = {
  backgroundColor: '#2c3e50', // Same as toolbar background
  color: '#ecf0f1', // Same as toolbar text color
  padding: '40px',
  borderRadius: '8px',
  textAlign: 'center',
  maxWidth: '600px',
  width: '90%',
};

const popupHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
};

const logoStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  marginRight: '20px',
};

const popupTitleStyle: React.CSSProperties = {
  fontSize: '48px',
  margin: 0,
  fontFamily: 'Arial, sans-serif',
};

const popupVersionStyle: React.CSSProperties = {
  fontSize: '24px',
  marginBottom: '40px',
};

const popupDescriptionStyle: React.CSSProperties = {
  fontSize: '18px',
  marginBottom: '40px',
  textAlign: 'left'
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: '20px',
};

const popupButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '15px 30px',
  backgroundColor: '#34495e', // Button background color
  color: '#ecf0f1', // Button text color
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '18px',
  fontFamily: 'Arial, sans-serif',
  transition: 'background-color 0.3s',
  border: 'none',
  cursor: 'pointer',
};

export default WebGPUCanvas;
