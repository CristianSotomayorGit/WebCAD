import React from 'react';

interface CommandToolbarProps {
  activeTool: string;
}

const CommandToolbar: React.FC<CommandToolbarProps> = ({ activeTool }) => {
  return (
    <div style={toolbarStyle}>
      <div>
        <button>Point</button>
        <button>Line</button>
        <button>Polyline</button>
        <button>Circle</button>
        <button>Arc</button>
      </div>
      <span style={toolNameStyle}>{ `  Active Tool: ${activeTool}`}</span>
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '40px',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  fontSize: '18px',
  boxSizing: 'border-box',
  zIndex: 1000, // Ensure it stays on top
};

const toolNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
};

export default CommandToolbar;
