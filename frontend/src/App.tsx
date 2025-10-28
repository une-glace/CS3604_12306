import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import HomePage from './pages/HomePage'
import TrainListPage from './pages/TrainListPage'
import OrderPage from './pages/OrderPage'
import ProfilePage from './pages/ProfilePage'
import Login from './components/Login'
import Register from './components/Register'

interface LoginFormData {
  username: string;
  password: string;
  captcha: string;
  rememberUsername: boolean;
  autoLogin: boolean;
}

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  idType: string;
  realName: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  passengerType: string;
  phoneVerificationCode: string;
  agreementAccepted: boolean;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/train-list" element={<TrainListPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route 
              path="/login" 
              element={
                <Login 
                  onNavigateToRegister={() => window.location.href = '/register'}
                />
              } 
            />
            <Route 
              path="/register" 
              element={
                <Register 
                  onNavigateToLogin={() => window.location.href = '/login'}
                />
              } 
            />
            {/* 重定向未匹配的路由到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
