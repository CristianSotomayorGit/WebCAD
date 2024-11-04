import React, { MutableRefObject } from 'react';
import { ToolManager } from '../domain/managers/ToolManager';

interface ButtonToolbarProps {
  toolManagerRef: MutableRefObject<ToolManager | undefined>;
  setActiveToolName: (toolName: string) => void;
  setActiveColor: (color: Float32Array) => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  toolManagerRef,
  setActiveToolName,
  setActiveColor,
}) => {
  const handleToolChange = (toolName: string) => {
    setActiveToolName(toolName);
    toolManagerRef.current?.setActiveTool(toolName);
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let colorHex = event.target.value;

    // Remove the hash symbol if present
    colorHex = colorHex.replace('#', '');

    // Parse the hexadecimal string into RGB components
    const bigint = parseInt(colorHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Normalize RGB values to the range [0.0, 1.0]
    const newColor = new Float32Array([r / 255, g / 255, b / 255, 1.0])
    setActiveColor(newColor)
  };

  return (
    <div style={toolbarStyle}>
      <button style={buttonStyle} onClick={() => handleToolChange('Point')}>Point</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Line')}>Line</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Polyline')}>Polyline</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Circle')}>Circle</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Arc')}>Arc</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Spline')}>Spline</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Rectangle')}>Rectangle</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Polygon')}>Polygon</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Ellipse')}>Ellipse</button>
      <button style={buttonStyle} onClick={() => handleToolChange('Pan')}>Pan</button>
      <input type="color" defaultValue="#00FFFF" style={colorPickerStyle} onChange={handleColorChange} />
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: '40px',
  left: 0,
  width: '120px',
  height: '100%',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '16px',
  fontSize: '18px',
  boxSizing: 'border-box',
  zIndex: 1000,
  gap: '10px',
};

const buttonStyle: React.CSSProperties = {
  width: '100px',
  height: '30px',
  backgroundColor: '#34495e',
  color: '#ecf0f1',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
};

const colorPickerStyle: React.CSSProperties = {
  width: '100px',
  height: '30px',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

export default ButtonToolbar;
