import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ViewportMeta from './components/ViewportMeta'
import './App.css'
import HomePage from './pages/HomePage'
import CateringIndexPage from './pages/CateringIndexPage'
import CateringListPage from './pages/CateringListPage'
import TrainListPage from './pages/TrainListPage'
import OrderPage from './pages/OrderPage'
import ProfilePage from './pages/ProfilePage'
import OrderDetailPage from './pages/OrderDetailPage'
import Login from './components/Login'
import Register from './components/Register'

function App() {
  return (
    <AuthProvider>
      <ViewportMeta />
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/train-list" element={<TrainListPage />} />
            <Route path="/catering" element={<CateringIndexPage />} />
            <Route path="/catering/list" element={<CateringListPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order-detail/:orderId" element={<OrderDetailPage />} />
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
