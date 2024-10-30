import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div style={homepageContainerStyle}>
      {/* Logo and Title Container */}
      <div style={logoTitleContainerStyle}>
        <img src="/OtterCAD_logo.png" alt="OtterCAD Logo" style={logoStyle} />
        <h1 style={homepageTitleStyle}>OtterCAD</h1>
      </div>
      <p style={homepageDescriptionStyle}>
        Draw shapes, modify them, and explore the capabilities of WebGPU with TypeScript.
      </p>
      <div style={homepageButtonsStyle}>
        <Link to="/draft" style={homepageButtonStyle}>
          Launch App
        </Link>
      </div>
    </div>
  );
};

const homepageContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#2c3e50', // Same as toolbar background
  color: '#ecf0f1', // Same as toolbar text color
};

const logoTitleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px',
};

const logoStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  marginRight: '20px',
};

const homepageTitleStyle: React.CSSProperties = {
  fontSize: '48px',
  fontFamily: 'Arial, sans-serif', // Adjust based on your app's font
};

const homepageDescriptionStyle: React.CSSProperties = {
  fontSize: '24px',
  marginBottom: '40px',
  textAlign: 'center',
  maxWidth: '600px',
};

const homepageButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
};

const homepageButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '15px 30px',
  backgroundColor: '#34495e', // Button background color from your app
  color: '#ecf0f1', // Button text color
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '18px',
  fontFamily: 'Arial, sans-serif', // Adjust based on your app's font
  transition: 'background-color 0.3s',
};

// Optional: Add hover effect for the button
const homepageButtonHoverStyle: React.CSSProperties = {
  backgroundColor: '#3d566e',
};

export default HomePage;
