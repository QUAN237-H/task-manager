import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './auth'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'

function ProtectedRoute() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function PublicOnlyRoute() {
  const { token } = useAuth()
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'animate-toast text-[13px] font-medium',
          style: {
            background: '#ffffff',
            color: '#2b2926',
            border: '1px solid #e4ddd4',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(43, 41, 38, 0.08)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#f5d76e',
              secondary: '#2b2926',
            },
          },
          error: {
            style: {
              background: '#ffffff',
              color: '#2b2926',
              border: '1px solid #e4ddd4',
            },
            iconTheme: {
              primary: '#e34432',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
