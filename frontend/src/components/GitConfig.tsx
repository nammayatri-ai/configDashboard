import { useState } from 'react'
import { GitBranch, Settings, Save, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { config } from '../config/environment'

interface GitConfigProps {
  onLogout?: () => void
}

interface GitConfigData {
  repository: {
    url: string
    branch: string
    remote: string
  }
  git: {
    user: {
      name: string
      email: string
    }
    token: string
    commit: {
      prefix: string
      template: string
    }
  }
  settings: {
    autoCommit: boolean
    autoPush: boolean
    validateJson: boolean
    createBackup: boolean
    maxFileSize: string
  }
}

const GitConfig = ({ onLogout }: GitConfigProps) => {
  const navigate = useNavigate()
  
  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const [gitConfig, setGitConfig] = useState<GitConfigData>(config.GIT_CONFIG)
  
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(true)

  // Theme management
  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark'
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Debug: Log what we're sending
      console.log('Saving git config:', gitConfig)
      console.log('Token length:', gitConfig.git?.token?.length || 0)
      
      // Save configuration to the backend
      const response = await fetch('http://localhost:8090/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gitConfig)
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Git configuration saved successfully!'
        })
      } else {
        const errorData = await response.json()
        setMessage({
          type: 'error',
          text: errorData.message || 'Failed to save configuration. Please try again.'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save configuration. Please check your connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Test git repository connection
      const response = await fetch('/api/health')
      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully connected to ${gitConfig.repository.url}`
        })
      } else {
        throw new Error('Connection failed')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to connect to repository. Please check your configuration.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setGitConfig({
      repository: {
        url: 'git@github.com:nammayatri/configDashboard.git',
        branch: 'main',
        remote: 'origin'
      },
      git: {
        user: {
          name: 'Config Dashboard',
          email: 'dhruv.singh@nammayatri.in'
        },
        token: '',
        commit: {
          prefix: '[Config Dashboard]',
          template: '{prefix} {action} {filename}.json'
        }
      },
      settings: {
        autoCommit: true,
        autoPush: true,
        validateJson: true,
        createBackup: false,
        maxFileSize: '10MB'
      }
    })
    setMessage(null)
  }

  return (
    <div className="git-config-container">
      {/* Header */}
      <div className="git-config-header">
        <div className="header-left">
          <div className="header-title">
            <GitBranch className="w-6 h-6 text-emerald-500" />
            <div>
              <h1>Git Configuration</h1>
              <p>Configure repository settings and git integration</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            data-theme={isDarkTheme ? 'dark' : 'light'}
            title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
          >
            <div className="theme-toggle-icon sun">☀️</div>
            <div className="theme-toggle-icon moon">🌙</div>
            <div className="theme-toggle-slider"></div>
          </button>
          
          {onLogout && (
            <button className="header-btn-primary" onClick={onLogout}>Logout</button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="git-config-main">
        <div className="git-config-content">
          
          {/* Repository Configuration */}
          <div className="config-section">
            <div className="config-section-header">
              <Settings className="w-5 h-5 text-blue-500" />
              <h3>Repository Settings</h3>
            </div>
            
            <div className="config-form">
              <div className="form-group">
                <label htmlFor="repoUrl">Repository URL</label>
                <input
                  id="repoUrl"
                  type="url"
                  value={gitConfig.repository.url}
                  onChange={(e) => setGitConfig(prev => ({
                    ...prev,
                    repository: { ...prev.repository, url: e.target.value }
                  }))}
                  className="form-input"
                  placeholder="https://github.com/username/repository"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branch">Default Branch</label>
                  <input
                    id="branch"
                    type="text"
                    value={gitConfig.repository.branch}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      repository: { ...prev.repository, branch: e.target.value }
                    }))}
                    className="form-input"
                    placeholder="main"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="remote">Remote Name</label>
                  <input
                    id="remote"
                    type="text"
                    value={gitConfig.repository.remote}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      repository: { ...prev.repository, remote: e.target.value }
                    }))}
                    className="form-input"
                    placeholder="origin"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Git User Configuration */}
          <div className="config-section">
            <div className="config-section-header">
              <GitBranch className="w-5 h-5 text-green-500" />
              <h3>Git User Settings</h3>
            </div>
            
            <div className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="userName">User Name</label>
                  <input
                    id="userName"
                    type="text"
                    value={gitConfig.git.user.name}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      git: { ...prev.git, user: { ...prev.git.user, name: e.target.value } }
                    }))}
                    className="form-input"
                    placeholder="Config Dashboard"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="userEmail">User Email</label>
                  <input
                    id="userEmail"
                    type="email"
                    value={gitConfig.git.user.email}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      git: { ...prev.git, user: { ...prev.git.user, email: e.target.value } }
                    }))}
                    className="form-input"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gitToken">GitHub Personal Access Token</label>
                  <input
                    id="gitToken"
                    type="password"
                    value={gitConfig.git.token}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      git: { ...prev.git, token: e.target.value }
                    }))}
                    className="form-input"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <small className="form-help">
                    Required for pushing to GitHub. Create one at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      GitHub Settings → Developer settings → Personal access tokens
                    </a>
                  </small>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="commitPrefix">Commit Prefix</label>
                  <input
                    id="commitPrefix"
                    type="text"
                    value={gitConfig.git.commit.prefix}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      git: { ...prev.git, commit: { ...prev.git.commit, prefix: e.target.value } }
                    }))}
                    className="form-input"
                    placeholder="[Config Dashboard]"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="commitTemplate">Commit Template</label>
                  <input
                    id="commitTemplate"
                    type="text"
                    value={gitConfig.git.commit.template}
                    onChange={(e) => setGitConfig(prev => ({
                      ...prev,
                      git: { ...prev.git, commit: { ...prev.git.commit, template: e.target.value } }
                    }))}
                    className="form-input"
                    placeholder="{prefix} {action} {filename}.json"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="config-section">
            <div className="config-section-header">
              <Settings className="w-5 h-5 text-purple-500" />
              <h3>Application Settings</h3>
            </div>
            
            <div className="config-form">
              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={gitConfig.settings.autoCommit}
                      onChange={(e) => setGitConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings, autoCommit: e.target.checked }
                      }))}
                      className="setting-checkbox"
                    />
                    <span>Auto Commit Changes</span>
                  </label>
                  <p className="setting-description">Automatically commit changes when files are saved</p>
                </div>
                
                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={gitConfig.settings.autoPush}
                      onChange={(e) => setGitConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings, autoPush: e.target.checked }
                      }))}
                      className="setting-checkbox"
                    />
                    <span>Auto Push to Remote</span>
                  </label>
                  <p className="setting-description">Automatically push commits to the remote repository</p>
                </div>
                
                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={gitConfig.settings.validateJson}
                      onChange={(e) => setGitConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings, validateJson: e.target.checked }
                      }))}
                      className="setting-checkbox"
                    />
                    <span>Validate JSON</span>
                  </label>
                  <p className="setting-description">Validate JSON syntax before saving files</p>
                </div>
                
                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={gitConfig.settings.createBackup}
                      onChange={(e) => setGitConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings, createBackup: e.target.checked }
                      }))}
                      className="setting-checkbox"
                    />
                    <span>Create Backups</span>
                  </label>
                  <p className="setting-description">Create backup copies before overwriting files</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="config-actions">
            <button 
              className="action-btn secondary"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
            
            <button 
              className="action-btn secondary"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset to Defaults
            </button>
            
            <button 
              className="action-btn primary"
              onClick={handleSaveConfig}
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className={`message ${message.type}`}>
              {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {message.type === 'info' && <RefreshCw className="w-4 h-4" />}
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GitConfig
