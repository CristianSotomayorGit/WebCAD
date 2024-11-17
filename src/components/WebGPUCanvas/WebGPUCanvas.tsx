import React from 'react';
import styles from './WebGPUCanvas.module.css';

interface WebGPUCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ canvasRef }) => {
  return (
    <canvas ref={canvasRef} className={styles.canvasStyle} />
  );
};

export default WebGPUCanvas;
