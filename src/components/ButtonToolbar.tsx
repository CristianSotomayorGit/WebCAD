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
    colorHex = colorHex.replace('#', '');
    const bigint = parseInt(colorHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const newColor = new Float32Array([r / 255, g / 255, b / 255, 1.0]);
    setActiveColor(newColor);
  };

  const tools = [
    { name: 'Point', icon: '/icons/point.svg' },
    { name: 'Line', icon: '/icons/line.svg' },
    { name: 'Polyline', icon: '/icons/polyline.svg' },
    { name: 'Circle', icon: '/icons/circle.svg' },
    { name: 'Arc', icon: '/icons/arc.svg' },
    { name: 'Spline', icon: '/icons/spline.svg' },
    { name: 'Rectangle', icon: '/icons/rectangle.svg' },
    { name: 'Polygon', icon: '/icons/polygon.svg' },
    { name: 'Ellipse', icon: '/icons/ellipse.svg' },
    { name: 'Pan', icon: '/icons/pan.svg' },
  ];

  return (
    <div style={toolbarStyle}>
      {tools.map((tool) => (
        <button
          key={tool.name}
          style={buttonStyle}
          onClick={() => handleToolChange(tool.name)}
          title={tool.name}
        >
          <img src={tool.icon} alt={`${tool.name} icon`} style={iconStyle} />
        </button>
      ))}
      <input type="color" defaultValue="#00FFFF" style={colorPickerStyle} onChange={handleColorChange} title='Color'/>
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50px',
  left: '0',
  width: '100px',
  height: '100vh',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridAutoRows: '40px',
  alignItems: 'center',
  padding: '8px',
  fontSize: '16px',
  gap: '2px', // Reduced gap for more compact horizontal spacing
  boxSizing: 'border-box',
  zIndex: 1000,
};

const buttonStyle: React.CSSProperties = {
  width: '35px',
  height: '35px',
  backgroundColor: '#34495e',
  color: '#ecf0f1',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
};

const colorPickerStyle: React.CSSProperties = {
  width: '80px',
  height: '25px',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  gridColumn: 'span 2',
  justifySelf: 'center',
};

export default ButtonToolbar;
