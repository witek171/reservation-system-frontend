import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import PrivateRoute from './components/PrivateRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';
import CompanySelectPage from './pages/CompanySelectPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/select-company"
            element={
              <PrivateRoute>
                <CompanySelectPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute requireCompany>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
