import React from 'react';
import styles from './SignInPopUp.module.css'; // Import the CSS module

interface SignInPopUpProps {
    isSigningIn: boolean;
    setIsSigningIn(isSigningIn: boolean): void;
    isSigningUp: boolean;
    setIsSigningUp(isSigningUp: boolean): void
}

const SignInPopUp: React.FC<SignInPopUpProps> = ({ isSigningIn, setIsSigningIn, isSigningUp, setIsSigningUp }) => {
    const handleSignUpClick = () => {
        setIsSigningIn(!isSigningIn)
        setIsSigningUp(!isSigningUp)
    }
    return (
        <div className={styles.overlayStyle}>
            <div className={styles.popupStyle}>
                <div className={styles.popupHeaderStyle}>
                    <h1 className={styles.popupTitleStyle}>Sign In</h1>
                </div>
                <form className={styles.formStyle}>
                    <input
                        type="text"
                        placeholder="Email"
                        className={styles.inputTopStyle}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className={styles.inputBottomStyle}
                    />
                    <a className={styles.signUpLink} onClick={handleSignUpClick}>Sign up here</a>
                    <div className={styles.buttonContainerStyle}>
                        <button
                            type="submit"
                            className={styles.submitButtonStyle}

                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            className={styles.cancelButtonStyle}
                            onClick={() => setIsSigningIn(!isSigningIn)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default SignInPopUp;
