import React from 'react';
import styles from './WelcomePopUp.module.css';

interface WelcomePopUpProps {
    didLoad: boolean;
    initializationError: string;
    setShowPopup(show: boolean): void;
}

const WelcomePopUp: React.FC<WelcomePopUpProps> = ({ didLoad, initializationError, setShowPopup }) => {
    return (
        <div className={styles.overlayStyle}>
            <div className={styles.popupStyle}>
                <div className={styles.popupHeaderStyle}>
                    <img src="/OtterCAD_logo.png" alt="Logo" className={styles.logoStyle} />
                    <h1 className={styles.popupTitleStyle}>OtterCAD</h1>
                </div>
                <p className={styles.popupVersionStyle}>Version: Alpha 0.0.4</p>
                <p className={styles.popupDescriptionStyle}>
                    From the dev:
                    <br />
                    <br />
                    This is the first release of OtterCAD. I've chosen to make it available early to share my progress.
                    Currently, the application is in an experimental stage, offering only basic drawing functionality. This
                    app is an exploration of WebGPU for 2D drafting, which is still highly experimental but has the potential
                    to significantly enhance performance.
                    <br />
                    <br />
                    I chose the name OtterCAD because I believe our tools should get out of the way and enable us to work as
                    seamlessly as otters swim. My goal is to develop OtterCAD into a reliable web-based CAD tool, equipped
                    with professional features and robust performance.
                </p>

                {didLoad && (
                    <button onClick={() => setShowPopup(false)} className={styles.popupButtonStyle}>
                        Launch App
                    </button>
                )}

                {!didLoad && !initializationError && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <span className={styles.loadingText}>Loading...</span>
                    </div>)}

                {initializationError && (
                    <>
                        <p className={styles.errorStyle}>{initializationError}</p>
                        <ul className={styles.troubleshootingListStyle}>
                            <li>
                                <strong>Use Firefox Nightly:</strong>
                                <p>
                                    Firefox Nightly is the preferred browser of the OtterCAD dev team and offers the latest WebGPU
                                    features. Ensure you’re running the latest version and that WebGPU is enabled in the browser settings.
                                </p>
                            </li>
                            <li>
                                <strong>Update Other Browsers:</strong>
                                <p>
                                    Use the newest versions of <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                                    Make sure to enable WebGPU in their experimental flags or settings to ensure proper functionality.
                                </p>
                            </li>
                            <li>
                                <strong>Check Graphics Drivers:</strong>
                                <p>
                                    Ensure your graphics drivers are up to date. Outdated drivers can prevent WebGPU from functioning
                                    correctly and may cause compatibility issues.
                                </p>
                            </li>
                            <li>
                                <strong>Verify Hardware Compatibility:</strong>
                                <p>
                                    Some older or integrated graphics cards might not support WebGPU. Verify that your hardware meets
                                    the necessary requirements for WebGPU support.
                                </p>
                            </li>
                            <li>
                                <strong>Avoid Virtual Environments:</strong>
                                <p>
                                    Running OtterCAD in virtual machines or environments with disabled hardware acceleration can block
                                    WebGPU support. Use a native environment with hardware acceleration enabled for the best experience.
                                </p>
                            </li>
                            <li>
                                <strong>Contact Us on LinkedIn:</strong>
                                <p>
                                    If you continue to experience issues, feel free to reach out for support on{' '}
                                    <a
                                        href="https://www.linkedin.com/in/cristian-sotomayor/"
                                        className={styles.linkStyle}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        LinkedIn
                                    </a>.
                                </p>
                            </li>
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

export default WelcomePopUp;
