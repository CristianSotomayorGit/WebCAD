// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Desk from './components/Desk/Desk';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Desk />} />
      </Routes>
    </Router>
  );
};

export default App;
