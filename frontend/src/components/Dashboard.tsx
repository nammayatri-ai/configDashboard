import { useState, useEffect } from 'react'
import { Upload, Search, FileText, ArrowLeft, Sun, Moon, GitBranch, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { apiClient } from '../utils/api'
import { config } from '../config/environment'

interface DiffResult {
  lineNumber: number
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  original: string
  changed: string
}

const Dashboard = () => {
  const [originalText, setOriginalText] = useState('')
  const [changedText, setChangedText] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const navigate = useNavigate()

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


  const findDifference = () => {
    setShowDiff(true)
    console.log('Finding differences between texts...')
  }

  // Simple diff algorithm to compare texts line by line
  const getDiffResults = () => {
    if (!originalText || !changedText) return null

    const originalLines = originalText.split('\n')
    const changedLines = changedText.split('\n')
    
    const diffResults: DiffResult[] = []
    const maxLines = Math.max(originalLines.length, changedLines.length)
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || ''
      const changedLine = changedLines[i] || ''
      
      if (originalLine === changedLine) {
        // Lines are identical
        diffResults.push({
          lineNumber: i + 1,
          type: 'unchanged',
          original: originalLine,
          changed: changedLine
        })
      } else if (!originalLine && changedLine) {
        // Line was added
        diffResults.push({
          lineNumber: i + 1,
          type: 'added',
          original: '',
          changed: changedLine
        })
      } else if (originalLine && !changedLine) {
        // Line was removed
        diffResults.push({
          lineNumber: i + 1,
          type: 'removed',
          original: originalLine,
          changed: ''
        })
      } else {
        // Line was modified
        diffResults.push({
          lineNumber: i + 1,
          type: 'modified',
          original: originalLine,
          changed: changedLine
        })
      }
    }
    
    return diffResults
  }

  const handleViewConfig = () => {
    navigate('/firebase-config')
  }

  const handleLogout = async () => {
    console.log('Logout button clicked')
    try {
      // Only call API logout if not using dummy authentication
      if (config.AUTH_MODE !== 'dummy') {
        try {
          await apiClient.logout()
          console.log('API logout successful')
        } catch (apiError) {
          console.error('API logout error:', apiError)
          // Continue with Firebase logout even if API call fails
        }
      } else {
        console.log('Skipping API logout for dummy authentication')
      }

      // Firebase logout
      await signOut(auth)
      console.log('Firebase logout successful')

      // Clear any stored tokens
      localStorage.removeItem(config.AUTH_TOKEN_KEY)
      localStorage.removeItem('firebase:authUser')
      
      console.log('About to navigate to /login')
      // Try navigate first
      navigate('/login')
      
      // If navigate doesn't work, force reload after a short delay
      setTimeout(() => {
        console.log('Fallback: forcing page reload to /login')
        window.location.href = '/login'
      }, 100)
      
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if logout fails, clear local storage and redirect
      localStorage.removeItem(config.AUTH_TOKEN_KEY)
      localStorage.removeItem('firebase:authUser')
      console.log('About to navigate to /login (error case)')
      navigate('/login')
      
      // Fallback
      setTimeout(() => {
        console.log('Fallback: forcing page reload to /login (error case)')
        window.location.href = '/login'
      }, 100)
    }
  }

  return (
    <div className="diff-checker-container">
      {/* Header */}
      <div className="diff-checker-header">
        <div className="header-left">
          <div className="header-title">
            <FileText className="w-6 h-6 text-emerald-500" />
            <div>
              <h1>Config Dashboard</h1>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="header-btn" style = {{padding : 10 }} onClick={() => navigate('/dashboard')}>
            <Home className="w-2 h-2" />
            Diff Checker
          </button>
          <button className="header-btn" onClick={() => navigate('/upload')}>
            <Upload className="w-4 h-4" />
            Upload Config
          </button>
          <button className="header-btn" onClick={() => navigate('/git-config')}>
            <GitBranch className="w-4 h-4" />
            Git Config
          </button>
          <button className="header-btn" onClick={handleViewConfig}>
            <ArrowLeft className="w-4 h-4" />
            View Config
          </button>
          
          {/* Theme Toggle */}
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
          
          <button className="header-btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="diff-checker-main">
        <div className="diff-checker-content">

          <div className="text-areas-container">
            {/* Original Text */}
            <div className="text-area-section">
              <div className="text-area-header">
                <h3 className="text-area-title">Original text</h3>
               
              </div>
              <div className="text-area-wrapper">
                <div className="line-numbers">
                  {originalText.split('\n').map((_, index) => (
                    <div key={index} className="line-number">{index + 1}</div>
                  ))}
                  {!originalText && <div className="line-number">1</div>}
                </div>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="text-area"
                  placeholder="Paste your original text here..."
                  rows={20}
                />
              </div>
            </div>

            {/* Changed Text */}
            <div className="text-area-section">
              <div className="text-area-header">
                <h3 className="text-area-title">Changed text</h3>
              </div>
              <div className="text-area-wrapper">
                <div className="line-numbers">
                  {changedText.split('\n').map((_, index) => (
                    <div key={index} className="line-number">{index + 1}</div>
                  ))}
                  {!changedText && <div className="line-number">1</div>}
                </div>
                <textarea
                  value={changedText}
                  onChange={(e) => setChangedText(e.target.value)}
                  className="text-area"
                  placeholder="Paste your changed text here..."
                  rows={20}
                />
              </div>
            </div>
          </div>

          {/* Find Difference Button */}
          <div className="diff-button-container">
            <button 
              onClick={findDifference}
              className="find-diff-btn"
              disabled={!originalText.trim() || !changedText.trim()}
            >
              <Search className="w-4 h-4" />
              Find difference
            </button>
          </div>

          {/* Diff Results */}
          {showDiff && (
            <div className="diff-results">
              <div className="diff-results-header">
                <h3>Comparison Results</h3>
              </div>
              
              {/* Side-by-side diff display */}
              <div className="diff-content">
                <div className="diff-side">
                  <h4 className="diff-side-title">Original</h4>
                  <div className="diff-text-container">
                    {getDiffResults()?.map((result, index) => (
                      <div key={index} className={`diff-line diff-line-${result.type}`}>
                        <span className="line-number">{result.lineNumber}</span>
                        <pre className="diff-text">{result.original || ''}</pre>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="diff-side">
                  <h4 className="diff-side-title">Changed</h4>
                  <div className="diff-text-container">
                    {getDiffResults()?.map((result, index) => (
                      <div key={index} className={`diff-line diff-line-${result.type}`}>
                        <span className="line-number">{result.lineNumber}</span>
                        <pre className="diff-text">{result.changed || ''}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="diff-summary">
                <h4>Summary</h4>
                <div className="summary-stats">
                  {(() => {
                    const results = getDiffResults()
                    const unchanged = results?.filter(r => r.type === 'unchanged').length || 0
                    const added = results?.filter(r => r.type === 'added').length || 0
                    const removed = results?.filter(r => r.type === 'removed').length || 0
                    const modified = results?.filter(r => r.type === 'modified').length || 0
                    
                    return (
                      <>
                        <div className="stat-item unchanged">
                          <span className="stat-label">Unchanged:</span>
                          <span className="stat-value">{unchanged}</span>
                        </div>
                        <div className="stat-item added">
                          <span className="stat-label">Added:</span>
                          <span className="stat-value">{added}</span>
                        </div>
                        <div className="stat-item removed">
                          <span className="stat-label">Removed:</span>
                          <span className="stat-value">{removed}</span>
                        </div>
                        <div className="stat-item modified">
                          <span className="stat-label">Modified:</span>
                          <span className="stat-value">{modified}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
