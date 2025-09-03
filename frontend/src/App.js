import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmployeeManagement from './pages/Employees';
import PlanningGenerator from './pages/Planning';
import ConstraintsManager from './pages/Constraints';
import Dashboard from './pages/Dashboard';
import AbsenceStatusPage from './pages/AbsenceStatusPage';

function App() {
  return (
    <Router basename="/plan">
      <div className="App">
        <Header />
        <div className="app-container">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/constraints" element={<ConstraintsManager />} />
              <Route path="/planning" element={<PlanningGenerator />} />
              <Route path="/absences" element={<AbsenceStatusPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

