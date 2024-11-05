// src/components/WebGPUCanvas.tsx

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
  const activeColorRef = useRef<Float32Array>();
  const [activeToolName, setActiveToolName] = useState('Select');
  const [activeColor, setActiveColor] = useState(new Float32Array([0.0, 1.0, 1.0, 1.0]));

  const [showPopup, setShowPopup] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    activeColorRef.current = activeColor
  }, [activeColor]);

  useEffect(() => {
    // Disable scrollbars globally
    document.body.style.overflow = 'hidden';

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

        toolManagerRef.current = new ToolManager(
          entityManagerRef.current,
          rendererRef.current
        );

        canvasRef.current.addEventListener('mousedown', handleMouseDown);
        canvasRef.current.addEventListener('mousemove', handleMouseMove);
        canvasRef.current.addEventListener('mouseup', handleMouseUp);
        canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
      }
    };

    initRenderer();

    return () => {
      // Re-enable scrolling when component unmounts
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
      if (!activeColorRef.current) return;
      toolManagerRef.current?.getActiveTool()?.onLeftClick(event, activeColorRef.current);
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
    event.preventDefault(); // Prevents default scrolling behavior
    toolManagerRef.current?.getZoomTool()?.onWheel(event);
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
              Version: Alpha 0.0.2
            </p>
            <p style={popupDescriptionStyle}>
              From the dev:
              <br /><br />
              This is the first release of OtterCAD. I've chosen to make it available early
              to share my progress. Currently, the application is in an experimental stage,
              offering only basic drawing functionality. This app is an exploration of WebGPU for 2D drafting,
              which is still highly experimental but has the potential to significantly enhance performance.
              <br /><br />
              I chose the name OtterCAD because I believe our tools should get out of the way and enable
              us to work as seamlessly as otters swim. My goal is to develop OtterCAD into a reliable web-based 
              CAD tool, equipped with professional features and robust performance.
            </p>
            {initializationError && (
              <>
                <p style={errorStyle}>{initializationError}</p>
                <ul style={troubleshootingListStyle}>
                  <li>
                    <strong>Use Firefox Nightly:</strong>
                    <p>
                      Firefox Nightly is the preferred browser of the OtterCAD dev team and offers the latest WebGPU features.
                      Ensure you’re running the latest version and that WebGPU is enabled in the browser settings.
                    </p>
                  </li>
                  <li>
                    <strong>Update Other Browsers:</strong>
                    <p>
                      Use the newest versions of <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                      Make sure to enable WebGPU in their experimental flags or settings to ensure proper functionality.
                    </p>
                  </li>
                  <li>
                    <strong>Check Graphics Drivers:</strong>
                    <p>
                      Ensure your graphics drivers are up to date. Outdated drivers can prevent WebGPU from functioning correctly
                      and may cause compatibility issues.
                    </p>
                  </li>
                  <li>
                    <strong>Verify Hardware Compatibility:</strong>
                    <p>
                      Some older or integrated graphics cards might not support WebGPU. Verify that your hardware meets the necessary
                      requirements for WebGPU support.
                    </p>
                  </li>
                  <li>
                    <strong>Avoid Virtual Environments:</strong>
                    <p>
                      Running OtterCAD in virtual machines or environments with disabled hardware acceleration can block WebGPU support.
                      Use a native environment with hardware acceleration enabled for the best experience.
                    </p>
                  </li>
                  <li>
                    <strong>Contact Us on LinkedIn:</strong>
                    <p>
                      If you continue to experience issues, feel free to reach out for support on{' '}
                      <a href="https://www.linkedin.com/in/cristian-sotomayor/" style={linkStyle} target="_blank" rel="noopener noreferrer">LinkedIn</a>.
                    </p>
                  </li>
                </ul>
              </>
            )}
            {!initializationError && (
              <button
                onClick={() => setShowPopup(false)}
                style={popupButtonStyle}
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      )}
      <CommandToolbar activeTool={activeToolName} />
      <ButtonToolbar
        toolManagerRef={toolManagerRef}
        setActiveToolName={setActiveToolName}
        setActiveColor={setActiveColor} // Pass setActiveColor to ButtonToolbar
      />
      <canvas ref={canvasRef} style={canvasStyle} />
    </>
  );
};

const canvasStyle: React.CSSProperties = {
  display: 'block',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden', // Prevents scrollbars on the canvas itself
  cursor: 'url(/Crosshairs.svg) 40 40, crosshair', // Center the cursor on the SVG
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
  maxHeight: '90vh',
  overflowY: 'auto',
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
  textAlign: 'left',
  backgroundColor: '#212830',
  padding: '20px',
  borderRadius: '4px',
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: '20px',
};

const troubleshootingListStyle: React.CSSProperties = {
  listStyleType: 'disc',
  paddingLeft: '20px',
  textAlign: 'left',
  marginBottom: '20px',
  backgroundColor: '#c0392b', // Aesthetic red background
  color: '#ecf0f1', // White text
  padding: '20px',
  borderRadius: '4px',
};

const linkStyle: React.CSSProperties = {
  color: '#ffdddd', // Light red for links
  textDecoration: 'underline',
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
