import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import EmployeeManagement from './pages/Employees';
import PlanningGenerator from './pages/Planning';
import ConstraintsManager from './pages/Constraints';
import Dashboard from './pages/Dashboard';
import AbsenceStats from './pages/AbsenceStats';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Router basename="/plan">
      <div className="App">
        <header className="App-header">
          <h1>🍞 Planning Boulangerie</h1>
          <nav className="nav-tabs">
            <Link 
              to="/dashboard" 
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Tableau de bord
            </Link>
            <Link 
              to="/employees" 
              className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              👥 Employés
            </Link>
            <Link 
              to="/constraints" 
              className={`nav-tab ${activeTab === 'constraints' ? 'active' : ''}`}
              onClick={() => setActiveTab('constraints')}
            >
              📅 Contraintes
            </Link>
            <Link 
              to="/planning" 
              className={`nav-tab ${activeTab === 'planning' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning')}
            >
              📋 Générer Planning
            </Link>
            <Link 
              to="/absence-stats" 
              className={`nav-tab ${activeTab === 'absence-stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('absence-stats')}
            >
              📊 État Absences
            </Link>
          </nav>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/constraints" element={<ConstraintsManager />} />
            <Route path="/planning" element={<PlanningGenerator />} />
            <Route path="/absence-stats" element={<AbsenceStats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

