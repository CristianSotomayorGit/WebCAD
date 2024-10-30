import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from '../infrastructure/rendering/Renderer';
import { EntityManager } from '../domain/managers/EntityManager';
import { ToolManager } from '../domain/managers/ToolManager';
import CommandToolbar from './CommandToolbar';
import ButtonToolbar from './ButtonToolbar';

const WebGPUCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>();
  const entityManagerRef = useRef(new EntityManager());
  const toolManagerRef = useRef<ToolManager>();
  const [activeToolName, setActiveToolName] = useState('Select');

  const [showPopup, setShowPopup] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

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
    if (!toolManagerRef.current) return;
    toolManagerRef.current.getActiveTool()?.onKeyDown!(event);
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
      <canvas ref={canvasRef} style={{ display: 'block', overflow: 'hidden' }} />
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
