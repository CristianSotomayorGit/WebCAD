import React from 'react';
import styles from "./CommandToolbar.module.css"
import { useAuth0 } from '@auth0/auth0-react';

interface CommandToolbarProps {
  activeTool: string;
  isSigningIn: boolean;
  setSigningIn(isSigningIn: boolean): void;
  isSigningUp: boolean;
  setSigningUp(isSigningUp: boolean): void;
}
const CommandToolbar: React.FC<CommandToolbarProps> = ({ activeTool, isSigningIn, setSigningIn, isSigningUp, setSigningUp }) => {

  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  return (
    <div className={styles.toolbarStyle}>
      <span className={styles.toolNameStyle}>{`Active Tool: ${activeTool}`}</span>
      <div className={styles.rightSideStyle}>
        {!isAuthenticated &&
          <>
            <button className={styles.signInButton} onClick={() => loginWithRedirect()}>Sign In</button>
            <button className={styles.signUpButton} onClick={() => setSigningUp(!isSigningUp)}>Sign Up</button>
          </>
        }
        {isAuthenticated &&
          <button className={styles.signInButton} onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log Out</button>

        }
        <img className={styles.logoStyle} src="/OtterCAD_logo.png" alt="OtterCAD Logo" />
        <span>OtterCAD</span>
      </div>
    </div>
  );
};

export default CommandToolbar;
