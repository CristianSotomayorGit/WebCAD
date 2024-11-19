import React from 'react';
import { ToolManager } from '../../domain/managers/ToolManager';
import styles from './ButtonToolbar.module.css';

interface ButtonToolbarProps {
  toolManagerRef: React.MutableRefObject<ToolManager | null>;
  setActiveToolName: (toolName: string) => void;
  setActiveColor: (color: Float32Array) => void;
  setActiveFont: (fontName: string) => void;
  setActiveFontSize: (fontSize: number) => void;
  activeToolName: string;
  activeColor: Float32Array;
  activeFont: string;
  activeFontSize: number;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  toolManagerRef,
  setActiveToolName,
  setActiveColor,
  setActiveFont,
  setActiveFontSize,
  activeToolName,
  activeColor,
  activeFont,
  activeFontSize,
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
    const fontName = event.target.value;
    setActiveFont(fontName);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fontSize = Math.max(10, Math.min(99, parseInt(event.target.value) || 12));
    setActiveFontSize(fontSize);
  };

  const tools = [
    { name: 'Select', icon: '/icons/select.svg' },
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
    { name: 'Text', icon: '/icons/text.svg' }
  ];

  return (
    <div className={styles.toolbarStyle}>
      {tools.map((tool) => (
        <button
          key={tool.name}
          className={`${styles.buttonStyle} ${activeToolName === tool.name ? styles.activeTool : ''}`}
          onClick={() => handleToolChange(tool.name)}
          title={tool.name}
        >
          <img src={tool.icon} alt={`${tool.name} icon`} className={styles.iconStyle} />
        </button>
      ))}
      <input
        type="color"
        value={`#${((1 << 24) | (Math.round(activeColor[0] * 255) << 16) | (Math.round(activeColor[1] * 255) << 8) | Math.round(activeColor[2] * 255)).toString(16).slice(1)}`}
        className={styles.colorPickerStyle}
        onChange={handleColorChange}
        title="Color"
      />
      <input
        type="number"
        className={styles.fontSizeInputStyle}
        value={activeFontSize}
        title="Font Size"
        onChange={handleFontSizeChange}
        min="10"
        max="99"
      />
      <select
        className={styles.fontPickerStyle}
        value={activeFont}
        title="Font"
        onChange={handleFontChange}
      >
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

export default ButtonToolbar;
