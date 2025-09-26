import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Settings, Sun, Moon } from 'lucide-react'
import { apiClient } from '../utils/api'
import { config } from '../config/environment'

interface LoginProps {
  onLogin: (token: string) => void
}

const Login = ({ onLogin }: LoginProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'development' | 'master' | 'prod'>('master')
  const [showAuthToggle, setShowAuthToggle] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(true)

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark')
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark'
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let data
      
      // Set API mode based on selected environment
      const originalAuthMode = config.AUTH_MODE
      if (authMode === 'master') {
        // Temporarily set to master API mode
        Object.defineProperty(config, 'AUTH_MODE', { value: 'api', writable: true })
        Object.defineProperty(config, 'API_BASE_URL', { value: 'https://dashboard.integ.moving.tech/api/dev/bap', writable: true })
      } else if (authMode === 'prod') {
        // Temporarily set to production API mode
        Object.defineProperty(config, 'AUTH_MODE', { value: 'api', writable: true })
        Object.defineProperty(config, 'API_BASE_URL', { value: 'https://dashboard.moving.tech/api/dev/bap', writable: true })
      } else {
        // Development mode - use API
        Object.defineProperty(config, 'AUTH_MODE', { value: 'api', writable: true })
      }
      
      try {
        data = await apiClient.login(formData.email, formData.password)
      } catch (firstError) {
        console.log('First login attempt failed, trying alternative format:', firstError)
        
        try {
          data = await apiClient.loginAlternative(formData.email, formData.password)
        } catch (secondError) {
          console.log('Second login attempt failed, trying form data:', secondError)
          
          try {
            data = await apiClient.loginFormData(formData.email, formData.password)
          } catch (thirdError) {
            console.log('All login attempts failed:', thirdError)
            throw firstError // Throw the original error
          }
        }
      } finally {
        // Restore original auth mode
        Object.defineProperty(config, 'AUTH_MODE', { value: originalAuthMode, writable: true })
      }
      
      // Check for success indicators - either explicit success flag or presence of any token field
      const hasToken = data.token || data.access_token || (data as any).authToken || data.data?.token
      const isSuccess = data.success || data.message?.toLowerCase().includes('success') || hasToken
      
      if (isSuccess) {
        // Store the token (could be in different fields depending on API response)
        const token = data.token || data.access_token || (data as any).authToken || data.data?.token
        console.log('Login response data:', data)
        console.log('Extracted token:', token)
        
        if (token) {
          console.log('Calling onLogin with token:', token)
          onLogin(token)
          console.log('onLogin called successfully')
        } else {
          console.error('No token found in response:', data)
          setError('No authentication token received from server.')
        }
      } else {
        console.error('Login failed, response:', data)
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        if (error.message.includes('HTTP error! status: 401')) {
          setError('Invalid username or password')
        } else if (error.message.includes('HTTP error! status: 403')) {
          setError('Access denied. Please contact administrator.')
        } else if (error.message.includes('HTTP error! status: 400')) {
          setError('Invalid request format. Please contact support.')
        } else if (error.message.includes('HTTP error! status: 500')) {
          setError('Server error. Please try again later.')
        } else {
          setError('Network error. Please check your connection.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Lock className="w-8 h-8" style={{ color: 'var(--text-accent)' }} />
          </div>
          <h1 className="login-title">Config Dashboard</h1>
          <p className="login-subtitle">Authentication Portal</p>
          
          {/* Theme Toggle */}
          <div className="login-theme-toggle">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              data-theme={isDarkTheme ? 'dark' : 'light'}
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            >
              <Sun className="theme-toggle-icon sun" height={20} width={20}/>
              <Moon className="theme-toggle-icon moon" style= {{paddingLeft : 5}}height={20} width={20}/>
              <div className="theme-toggle-slider"></div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-container">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input-login"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input-login"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <>
                <div className="loader"></div>
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {/* Authentication Mode Toggle */}
        {config.ENABLE_AUTH_TOGGLE && (
          <div className="auth-mode-toggle">
            <button
              type="button"
              onClick={() => setShowAuthToggle(!showAuthToggle)}
              className="auth-toggle-button"
            >
              <Settings className="w-4 h-4" />
              <span>Environment: {authMode.toUpperCase()}</span>
            </button>
            
            {showAuthToggle && (
              <div className="auth-mode-options">
                <label className="auth-mode-option">
                  <input
                    type="radio"
                    name="authMode"
                    value="master"
                    checked={authMode === 'master'}
                    onChange={(e) => setAuthMode(e.target.value as 'development' | 'master' | 'prod')}
                  />
                  <span>Master Environment (API)</span>
                </label>
                <label className="auth-mode-option">
                  <input
                    type="radio"
                    name="authMode"
                    value="prod"
                    checked={authMode === 'prod'}
                    onChange={(e) => setAuthMode(e.target.value as 'development' | 'master' | 'prod')}
                  />
                  <span>Production Environment (API)</span>
                </label>
              </div>
            )}
          </div>
        )}
        
        {/* Debug section - remove in production */}
        {import.meta.env.DEV && (
          <div className="debug-section" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--cyber-primary)' }}>
            <h4 style={{ color: 'var(--cyber-accent)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>DEBUG MODE</h4>
            <p style={{ color: 'var(--cyber-accent)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
              Environment: {authMode} | API: {authMode === 'development' ? '/api (local)' : authMode === 'master' ? 'https://dashboard.integ.moving.tech/api/dev/bap' : 'https://dashboard.moving.tech/api/dev/bap'}
            </p>
            <button 
              onClick={() => {
                console.log('Testing API endpoint...')
                fetch('/api/user/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'test@example.com', password: 'test' })
                })
                .then(res => res.text())
                .then(text => console.log('Raw response:', text))
                .catch(err => console.error('Test error:', err))
              }}
              style={{ 
                padding: '0.5rem', 
                background: 'var(--cyber-primary)', 
                color: 'var(--cyber-dark)', 
                border: 'none', 
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Test API Endpoint
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
