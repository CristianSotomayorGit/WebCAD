import React, { MutableRefObject } from 'react';
import { ToolManager } from '../domain/managers/ToolManager';

interface ButtonToolbarProps {
  toolManagerRef: MutableRefObject<ToolManager | undefined>;
  setActiveToolName: (toolName: string) => void;
  setActiveColor: (color: Float32Array) => void;
  setActiveFont: (fontName: string) => void;
  setActiveFontSize: (fontSize: number) => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  toolManagerRef,
  setActiveToolName,
  setActiveColor,
  setActiveFont,
  setActiveFontSize,
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

  const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let fontName = event.target.value;
    setActiveFont(fontName);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let fontSize = parseInt(event.target.value);
    setActiveFontSize(fontSize);
  }

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
    { name: 'Text', icon: '/icons/text.svg'}
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
      <input type="color" defaultValue="#00FFFF" style={colorPickerStyle} onChange={handleColorChange} title="Color" />

      <select style={fontSizePickerStyle} title="Font Size" onChange={handleFontSizeChange}>
        <option value='12'>12 px</option>
        <option value="16">16 px</option>
        <option value="20">20 px</option>
        <option value="24">24 px</option>
        <option value="32">32 px</option>
        <option value="40">40 px</option>
        <option value="48">48 px</option>
        <option value="56">56 px</option>
      </select>

      <select style={fontPickerStyle} title="Font" onChange={handleFontChange}>
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Georgia">Georgia</option>
        <option value="Palatino">Palatino</option>
        <option value="Garamond">Garamond</option>
      </select>
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

const fontSizePickerStyle: React.CSSProperties = {
  width: '80px',
  height: '25px',
  backgroundColor: '#34495e',
  border: 'none',
  color: '#ecf0f1',
  fontSize: '14px',
  cursor: 'pointer',
  gridColumn: 'span 2',
  justifySelf: 'center',
  textAlign: 'center',
  borderRadius: '4px',
};

const fontPickerStyle: React.CSSProperties = {
  width: '80px',
  height: '25px',
  backgroundColor: '#34495e',
  border: 'none',
  color: '#ecf0f1',
  fontSize: '14px',
  cursor: 'pointer',
  gridColumn: 'span 2',
  justifySelf: 'center',
  textAlign: 'center',
  borderRadius: '4px',
};

export default ButtonToolbar;
