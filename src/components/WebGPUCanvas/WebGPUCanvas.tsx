import React from 'react';
import styles from './WebGPUCanvas.module.css';

interface WebGPUCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeToolName: string;
}

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ canvasRef, activeToolName }) => {
  return (
    <canvas ref={canvasRef} className={activeToolName !== 'Select' ? styles.canvasStyle : styles.canvasStyleSelecting} />
  );
};

export default WebGPUCanvas;