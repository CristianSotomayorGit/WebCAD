import React from 'react';
import styles from "./CommandToolbar.module.css"

interface CommandToolbarProps {
  activeTool: string;
}

const CommandToolbar: React.FC<CommandToolbarProps> = ({ activeTool }) => {
  return (
    <div className={styles.toolbarStyle}>
      {/* Left side: Active tool name */}
      <span className={styles.toolNameStyle}>{`Active Tool: ${activeTool}`}</span>

      {/* Right side: Logo and OtterCAD */}
      <div className={styles.rightSideStyle}>
        <img className={styles.logoStyle} src="/OtterCAD_logo.png" alt="OtterCAD Logo" />
        <span>OtterCAD</span>
      </div>
    </div>
  );
};


export default CommandToolbar;
