import React from 'react';
import styles from "./CommandToolbar.module.css"

interface CommandToolbarProps {
  activeTool: string;
  isSigningIn: boolean;
  setSigningIn(isSigningIn: boolean): void;
  isSigningUp: boolean;
  setSigningUp(isSigningUp: boolean): void;
}

const CommandToolbar: React.FC<CommandToolbarProps> = ({ activeTool, isSigningIn, setSigningIn, isSigningUp, setSigningUp }) => {
  return (
    <div className={styles.toolbarStyle}>
      <span className={styles.toolNameStyle}>{`Active Tool: ${activeTool}`}</span>
      <div className={styles.rightSideStyle}>
        <button className={styles.signInButton} onClick={() => setSigningIn(!isSigningIn)}>Sign In</button>
        <button className={styles.signUpButton} onClick={() => setSigningUp(!isSigningUp)}>Sign Up</button>
        <img className={styles.logoStyle} src="/OtterCAD_logo.png" alt="OtterCAD Logo" />
        <span>OtterCAD</span>
      </div>
    </div>
  );
};

export default CommandToolbar;
