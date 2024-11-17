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
import styles from './WebGPUCanvas.module.css'

export type Font = {
  size: string;
  name: string;
}

interface WeGPUCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  rendererRef: Renderer;
}

const WebGPUCanvas: React.FC<WeGPUCanvasProps> = ({canvasRef, rendererRef}) => {
  // const rendererRef = useRef<Renderer>();
  const entityManagerRef = useRef(new EntityManager());
  const toolManagerRef = useRef<ToolManager>();
  const activeColorRef = useRef<Float32Array>(new Float32Array([0.0, 1.0, 1.0, 1.0])); // Default cyan color
  const [activeToolName, setActiveToolName] = useState('Select'); // Keep default tool as 'Select'
  const [activeColor, setActiveColor] = useState(new Float32Array([0.0, 1.0, 1.0, 1.0]));

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
        // rendererRef.current = new Renderer(canvasRef.current, entityManagerRef.current);

        try {
          // await rendererRef.current.initialize();
        } catch (error) {
          console.error('Error during WebGPU initialization', error);
          setInitializationError(error instanceof Error ? error.message : String(error));
        }

        // toolManagerRef.current = new ToolManager(entityManagerRef.current, rendererRef.current);

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
        // rendererRef.current.dispose();
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
      {showPopup && (
        <div className={styles.overlayStyle}>
          <div className={styles.popupStyle}>
            <div className={styles.popupHeaderStyle}>
              <img src="/OtterCAD_logo.png" alt="Logo" className={styles.logoStyle} />
              <h1 className={styles.popupTitleStyle}>OtterCAD</h1>
            </div>
            <p className={styles.popupVersionStyle}>Version: Alpha 0.0.3</p>
            <p className={styles.popupDescriptionStyle}>
              From the dev:
              <br />
              <br />
              This is the first release of OtterCAD. I've chosen to make it available early to share my progress.
              Currently, the application is in an experimental stage, offering only basic drawing functionality. This
              app is an exploration of WebGPU for 2D drafting, which is still highly experimental but has the potential
              to significantly enhance performance.
              <br />
              <br />
              I chose the name OtterCAD because I believe our tools should get out of the way and enable us to work as
              seamlessly as otters swim. My goal is to develop OtterCAD into a reliable web-based CAD tool, equipped
              with professional features and robust performance.
            </p>
            {initializationError && (
              <>
                <p className={styles.errorStyle}>{initializationError}</p>

                <ul className={styles.troubleshootingListStyle}>
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
                      <a href="https://www.linkedin.com/in/cristian-sotomayor/" className={styles.linkStyle} target="_blank" rel="noopener noreferrer">LinkedIn</a>.
                    </p>
                  </li>
                </ul>

              </>
            )}
            {!initializationError && (
              <button onClick={() => setShowPopup(false)} className={styles.popupButtonStyle}>
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
      <canvas ref={canvasRef} className={styles.canvasStyle} />
    </>
  );
};



export default WebGPUCanvas;
