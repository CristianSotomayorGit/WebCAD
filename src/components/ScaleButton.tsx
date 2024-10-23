// src/components/ScaleButton.tsx

import React, { useState, MutableRefObject, useRef } from 'react';
import { ScaleManager } from '../domain/managers/ScaleManager';
import { ToolManager } from '../domain/managers/ToolManager';

const scales = [
  '1/8"',
  '1/4"',
  '1/2"',
  '1"',
  '2"',
  '5"',
];

interface ScaleButtonProps {
  toolManagerRef: MutableRefObject<ToolManager | undefined>;
}


const ScaleButton: React.FC<ScaleButtonProps> = ({toolManagerRef}) => {
  const [isOpen, setIsOpen] = useState(false);

  
  if (!toolManagerRef) throw new Error('toolManagerRef is null')


  let zoomTool = toolManagerRef.current?.getZoomTool()

  const scaleManagerRef = useRef(new ScaleManager(zoomTool!));

  const handleScaleSelect = (scale: string) => {
    scaleManagerRef.current?.setActiveScale(scale);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div style={toolbarStyle}>
      {isOpen && (
        <ul style={ulStyle}>
          {scales.map((scale, index) => (
            <li key={index} style={liStyle}>
              <button
                style={dropdownButtonStyle}
                onClick={() => handleScaleSelect(scale)}
              >
                {scale}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button style={buttonStyle} onClick={toggleDropdown}>
        Scale: {scaleManagerRef.current?.getActiveScaleName()}
      </button>
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '140px',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  // paddingBottom: '10px',
  fontSize: '16px',
  boxSizing: 'border-box',
  zIndex: 1000,
};

const ulStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: '0',
  margin: '0 0 10px 0',
  backgroundColor: '#34495e',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  width: '100%',
};

const liStyle: React.CSSProperties = {
  width: '100%',
};

const dropdownButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  backgroundColor: 'transparent',
  color: '#ecf0f1',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
  width: '140px',
  height: '40px',
  backgroundColor: '#34495e',
  color: '#ecf0f1',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
};

export default ScaleButton;
