// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import WebGPUCanvas from './components/WebGPUCanvas';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<WebGPUCanvas />} />
      </Routes>
    </Router>
  );
};

export default App;
