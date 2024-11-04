// src/components/ButtonToolbar.tsx

import React, { MutableRefObject } from 'react';
import { ToolManager } from '../domain/managers/ToolManager';
import { FileManager } from '../domain/managers/FileManager';

interface ButtonToolbarProps {
  toolManagerRef: MutableRefObject<ToolManager | undefined>;
  setActiveToolName: (toolName: string) => void;
  fileManagerRef: MutableRefObject<FileManager | undefined>;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  toolManagerRef,
  setActiveToolName,
  fileManagerRef,
}) => {
  const handleToolChange = (toolName: string) => {
    setActiveToolName(toolName);
    toolManagerRef.current?.setActiveTool(toolName);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      fileManagerRef.current?.loadDXF(file);
    }
  };

  return (
    <div style={toolbarStyle}>
      <button style={buttonStyle} onClick={() => handleToolChange('Point')}>
        Point
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Line')}>
        Line
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Polyline')}>
        Polyline
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Circle')}>
        Circle
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Arc')}>
        Arc
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Spline')}>
        Spline
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Rectangle')}>
        Rectangle
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Polygon')}>
        Polygon
      </button>
      <button style={buttonStyle} onClick={() => handleToolChange('Ellipse')}>
        Ellipse
      </button>
      <label style={buttonStyle}>
        Import DXF
        <input
          type="file"
          accept=".dxf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </label>
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

export default ButtonToolbar;
