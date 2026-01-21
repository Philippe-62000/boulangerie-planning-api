import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import EmployeeManagement from './pages/Employees';
import PlanningGenerator from './pages/Planning';
import ConstraintsManager from './pages/Constraints';
import Dashboard from './pages/Dashboard';
import SalesStats from './pages/SalesStats';
import AbsenceStatusPage from './pages/AbsenceStatusPage';
import MealExpenses from './pages/MealExpenses';
import KmExpenses from './pages/KmExpenses';
import Parameters from './pages/Parameters';
import EmployeeStatusPrint from './pages/EmployeeStatusPrint';
import Tutors from './pages/Tutors';
// import SickLeaveUpload from './pages/SickLeaveUpload'; // Non utilisé
import SickLeaveUploadStandalone from './pages/SickLeaveUploadStandalone';
import SickLeaveAdmin from './pages/SickLeaveAdmin';
import SickLeaveHome from './pages/SickLeaveHome';
import VacationRequestAdmin from './pages/VacationRequestAdmin';
import VacationPlanning from './pages/VacationPlanning';
import TicketRestaurant from './pages/TicketRestaurant';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdvanceRequests from './pages/AdvanceRequests';
import Recup from './pages/Recup';
import Primes from './pages/Primes';
import MutuelleManagement from './pages/MutuelleManagement';

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
      <div className="App">
      <Header />
      <div className="app-container">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            } />
            <Route path="/constraints" element={
              <ProtectedRoute>
                <ConstraintsManager />
              </ProtectedRoute>
            } />
            <Route path="/planning" element={
              <ProtectedRoute requiredPermission="view_planning">
                <PlanningGenerator />
              </ProtectedRoute>
            } />
            <Route path="/sales-stats" element={
              <ProtectedRoute requiredPermission="view_sales_stats">
                <SalesStats />
              </ProtectedRoute>
            } />
            <Route path="/absences" element={
              <ProtectedRoute requiredPermission="view_absences">
                <AbsenceStatusPage />
              </ProtectedRoute>
            } />
            <Route path="/meal-expenses" element={
              <ProtectedRoute requiredPermission="view_meal_expenses">
                <MealExpenses />
              </ProtectedRoute>
            } />
            <Route path="/km-expenses" element={
              <ProtectedRoute requiredPermission="view_km_expenses">
                <KmExpenses />
              </ProtectedRoute>
            } />
            <Route path="/parameters" element={
              <ProtectedRoute adminOnly={true}>
                <Parameters />
              </ProtectedRoute>
            } />
            <Route path="/employee-status-print" element={
              <ProtectedRoute>
                <EmployeeStatusPrint />
              </ProtectedRoute>
            } />
            <Route path="/tutors" element={
              <ProtectedRoute adminOnly={true}>
                <Tutors />
              </ProtectedRoute>
            } />
            <Route path="/sick-leave" element={<Navigate to="/plan/sick-leave" replace />} />
            <Route path="/plan/sick-leave" element={<SickLeaveHome />} />
            <Route path="/sick-leave-upload" element={<SickLeaveUploadStandalone />} />
            <Route path="/plan/sick-leave-upload" element={<SickLeaveUploadStandalone />} />
            <Route path="/sick-leave-management" element={
              <ProtectedRoute adminOnly={true}>
                <SickLeaveAdmin />
              </ProtectedRoute>
            } />
            <Route path="/vacation-management" element={
              <ProtectedRoute adminOnly={true}>
                <VacationRequestAdmin />
              </ProtectedRoute>
            } />
            <Route path="/vacation-planning" element={
              <ProtectedRoute>
                <VacationPlanning />
              </ProtectedRoute>
            } />
            <Route path="/ticket-restaurant" element={
              <ProtectedRoute>
                <TicketRestaurant />
              </ProtectedRoute>
            } />
            <Route path="/employee-dashboard" element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/advance-requests" element={
              <ProtectedRoute>
                <AdvanceRequests />
              </ProtectedRoute>
            } />
            <Route path="/recup" element={
              <ProtectedRoute>
                <Recup />
              </ProtectedRoute>
            } />
            <Route path="/primes" element={
              <ProtectedRoute adminOnly={true}>
                <Primes />
              </ProtectedRoute>
            } />
            <Route path="/mutuelle-management" element={
              <ProtectedRoute adminOnly={true}>
                <MutuelleManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router basename="/plan">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;

