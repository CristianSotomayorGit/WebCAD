// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebGPUCanvas from './components/WebGPUCanvas';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WebGPUCanvas />} />
      </Routes>
    </Router>
  );
};

export default App;
