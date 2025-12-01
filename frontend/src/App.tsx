import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ViewportMeta from './components/ViewportMeta'
import './App.css'
import HomePage from './pages/HomePage'
import TrainListPage from './pages/TrainListPage'
import OrderPage from './pages/OrderPage'
import ProfilePage from './pages/ProfilePage'
import OrderDetailPage from './pages/OrderDetailPage'
import Login from './components/Login'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ForgotPasswordVerifyPage from './pages/ForgotPasswordVerifyPage'
import ForgotPasswordResetPage from './pages/ForgotPasswordResetPage'
import ForgotPasswordDonePage from './pages/ForgotPasswordDonePage'
import Register from './components/Register'
import PayOrderPage from './pages/PayOrderPage'

function App() {
  return (
    <AuthProvider>
      <ViewportMeta />
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/train-list" element={<TrainListPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/pay-order" element={<PayOrderPage />} />
            <Route path="/order-detail/:orderId" element={<OrderDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/forgot-password/verify" element={<ForgotPasswordVerifyPage />} />
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
            <Route path="/forgot-password/done" element={<ForgotPasswordDonePage />} />
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
