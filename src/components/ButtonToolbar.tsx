import React, { MutableRefObject } from 'react';
import { ToolManager } from '../domain/managers/ToolManager';

interface ButtonToolbarProps {
  toolManagerRef: MutableRefObject<ToolManager | undefined>;
  setActiveToolName: (toolName: string) => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  toolManagerRef,
  setActiveToolName,
}) => {
  const handleToolChange = (toolName: string) => {
    setActiveToolName(toolName);
    toolManagerRef.current?.setActiveTool(toolName);
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
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: '40px',
    left: 0,
    width: '120px', // Changed from '100%' to fixed width for vertical stacking
    height: '100%', // Changed from '40px' to '100%' to span full viewport height
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    display: 'flex',
    flexDirection: 'column', // Added to stack buttons vertically
    alignItems: 'center',
    paddingTop: '16px', // Changed from 'paddingLeft' to 'paddingTop'
    fontSize: '18px',
    boxSizing: 'border-box',
    zIndex: 1000, // Ensures it stays on top
    gap: '10px', // Optional: Adds spacing between buttons
};

const buttonStyle: React.CSSProperties = {
    width: '100px', // Adjust button width as needed
    height: '30px', // Adjust button height as needed
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
};

export default ButtonToolbar;
