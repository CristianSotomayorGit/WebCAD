import React from 'react';
import styles from './SignUpPopUp.module.css'; // Import the CSS module

interface SignUpPopUpProps {
    isSigningUp: boolean;
    setIsSigningUp(isSigningUp: boolean): void;
    isSigningIn: boolean;
    setIsSigningIn(isSigningIn: boolean): void;
}

const SignUpPopUp: React.FC<SignUpPopUpProps> = ({ isSigningUp, setIsSigningUp, isSigningIn, setIsSigningIn }) => {

    const handleSignInClick = () => {
        setIsSigningIn(!isSigningIn)
        setIsSigningUp(!isSigningUp)
    }

    return (
        <div className={styles.overlayStyle}>
            <div className={styles.popupStyle}>
                <div className={styles.popupHeaderStyle}>
                    <h1 className={styles.popupTitleStyle}>Sign Up</h1>
                </div>
                <form className={styles.formStyle}>
                    <input
                        type="text"
                        placeholder="First Name"
                        className={styles.inputTopStyle}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        className={styles.inputMiddleStyle}
                    />
                    <input
                        type="text"
                        placeholder="Email"
                        className={styles.inputMiddleStyle}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className={styles.inputBottomStyle}
                    />
                        <a className={styles.signInLink} onClick={handleSignInClick}>Sign in here</a>
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
                            onClick={() => setIsSigningUp(!isSigningUp)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPopUp;
