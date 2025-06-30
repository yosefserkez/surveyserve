import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SurveyLibrary } from './components/Survey/SurveyLibrary';
import { SurveyHost } from './components/Survey/SurveyHost';
import { SurveyManagementDetail } from './components/Dashboard/SurveyManagementDetail';
import { PaymentSuccessPage } from './components/Payment/PaymentSuccessPage';
import { PaymentCancelPage } from './components/Payment/PaymentCancelPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DiagnosticInfo } from './components/DiagnosticInfo';
import { HealthCheck } from './components/HealthCheck';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes with Layout (includes navigation) */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/signin" element={<Layout><SignIn /></Layout>} />
          <Route path="/signup" element={<Layout><SignUp /></Layout>} />
          <Route path="/surveys" element={<Layout><SurveyLibrary /></Layout>} />
          <Route 
            path="/dashboard" 
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            } 
          />
          <Route 
            path="/manage/:linkId" 
            element={
              <Layout>
                <ProtectedRoute>
                  <SurveyManagementDetail />
                </ProtectedRoute>
              </Layout>
            } 
          />
          
          {/* Payment routes without Layout */}
          <Route 
            path="/payment/success" 
            element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/cancel" 
            element={
              <ProtectedRoute>
                <PaymentCancelPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Survey routes without Layout (no navigation) */}
          <Route path="/survey/:linkCode" element={<SurveyHost />} />
          
          {/* Health check route for debugging */}
          <Route path="/health" element={<HealthCheck />} />
        </Routes>
        
        {/* Show diagnostic info in development and production for debugging */}
        {(import.meta.env.MODE === 'development' || window.location.search.includes('debug=true')) && <DiagnosticInfo />}
      </Router>
    </AuthProvider>
  );
}

export default App;