import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import RemoteConfigDisplay from './components/RemoteConfigDisplay'
import Upload from './components/Upload'
import GitConfig from './components/GitConfig'
import { config } from './config/environment'
import { RemoteConfigService } from './firebase/remoteConfig'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firebase Remote Config
        await RemoteConfigService.initialize()
        console.log('Firebase Remote Config initialized')
      } catch (error) {
        console.error('Failed to initialize Firebase Remote Config:', error)
      }

      const token = localStorage.getItem(config.AUTH_TOKEN_KEY)
      console.log('App: Checking for existing token:', token)
      if (token) {
        console.log('App: Found existing token, setting authenticated to true')
        setIsAuthenticated(true)
      } else {
        console.log('App: No existing token found, user not authenticated')
      }
      setLoading(false)
    }

    initializeApp()
  }, [])

  // Debug authentication state changes
  useEffect(() => {
    console.log('App: Authentication state changed to:', isAuthenticated)
  }, [isAuthenticated])

  const handleLogin = (token: string) => {
    console.log('App: Login successful, token received:', token)
    localStorage.setItem(config.AUTH_TOKEN_KEY, token)
    console.log('App: Token stored in localStorage:', config.AUTH_TOKEN_KEY)
    setIsAuthenticated(true)
    console.log('App: Authentication state set to true')
    
    // Force redirect to dashboard as a fallback
    setTimeout(() => {
      console.log('App: Attempting manual redirect to dashboard')
      window.location.href = '/dashboard'
    }, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
            <div className="text-xl font-bold" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Intializing Config Dashbaord
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Login onLogin={handleLogin} />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? 
            <Layout>
              <Dashboard />
            </Layout> : 
            <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/firebase-config" 
        element={
          isAuthenticated ? 
            <div className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
              <div className="max-w-6xl mx-auto">
                <RemoteConfigDisplay />
              </div>
            </div> : 
            <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/upload" 
        element={
          isAuthenticated ? 
            <Layout>
              <Upload />
            </Layout> : 
            <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/git-config" 
        element={
          isAuthenticated ? 
            <Layout>
              <GitConfig />
            </Layout> : 
            <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
    </Routes>
  )
}

export default App
