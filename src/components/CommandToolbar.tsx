import React from 'react';

interface CommandToolbarProps {
  activeTool: string;
}

const CommandToolbar: React.FC<CommandToolbarProps> = ({ activeTool }) => {
  return (
    <div style={toolbarStyle}>
      {/* Left side: Active tool name */}
      <span style={toolNameStyle}>{`Active Tool: ${activeTool}`}</span>

      {/* Right side: Logo and OtterCAD */}
      <div style={rightSideStyle}>
        <img style={logoStyle} src="/OtterCAD_logo.png" alt="OtterCAD Logo" />
        <span>OtterCAD</span>
      </div>
    </div>
  );
};

// Main toolbar style
const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '50px',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'flex',
  justifyContent: 'space-between', // To space items between left and right
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px', // Add padding on the right to ensure spacing
  fontSize: '18px',
  boxSizing: 'border-box',
  zIndex: 1000, // Ensure it stays on top
};

// Right side style (Logo and OtterCAD text)
const rightSideStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

// Style for the logo image
const logoStyle: React.CSSProperties = {
  height: '30px',
  marginRight: '10px', // Space between the logo and "OtterCAD"
};

// Bold text for Active Tool
const toolNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
};

export default CommandToolbar;
