import { useState, useEffect } from 'react'
import { RefreshCw, Download, Copy, CheckCircle, AlertCircle, Settings, ArrowLeft, Key, Search, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RemoteConfigService, RemoteConfigData } from '../firebase/remoteConfig'

const RemoteConfigDisplay = () => {
  const [configData, setConfigData] = useState<RemoteConfigData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Service Account states
  const [accessToken] = useState<string | null>(null)
  
  // Key Selector states
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [viewMode, setViewMode] = useState<'full' | 'keys'>('keys')


  const fetchRemoteConfig = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await RemoteConfigService.fetchAndActivateConfig()
      const data = RemoteConfigService.getAllConfigAsJSON()
      console.log('SDK Remote Config data:', data)
      console.log('SDK Keys in data:', Object.keys(data))
      setConfigData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch remote config')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (configData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(configData, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const downloadConfig = () => {
    if (configData) {
      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `remote-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Key management functions
  const getConfigKeys = () => {
    if (!configData) {
      console.log('No configData available')
      return []
    }
    const allKeys = Object.keys(configData)
    console.log('All keys from configData:', allKeys)
    const filteredKeys = allKeys.filter(key => 
      searchTerm === '' || key.toLowerCase().includes(searchTerm.toLowerCase())
    )
    console.log('Filtered keys:', filteredKeys)
    return filteredKeys
  }

  const currentConfigKeys = getConfigKeys();
  console.log('currentConfigKEys' , currentConfigKeys );

  const getKeyValue = (key: string) => {
    if (!configData) return null
    const value = configData[key]
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }

  // const startEditing = (key: string) => {
  //   setEditingKey(key)
  //   setEditingValue(getKeyValue(key) || '')
  // }
  const startCopying = (key:string) =>{
    if (configData) {
      const valueToCopy = getKeyValue(key)
      if (valueToCopy !== null) {
        try {
          navigator.clipboard.writeText(valueToCopy)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error('Failed to copy key value to clipboard:', err)
        }
      }
    }
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditingValue('')
  }

  const saveEditing = () => {
    if (!editingKey || !configData) return
    
    try {
      // Try to parse as JSON, if it fails, treat as string
      let newValue: any = editingValue
      try {
        newValue = JSON.parse(editingValue)
      } catch {
        // Keep as string if not valid JSON
      }
      
      setConfigData(prev => prev ? { ...prev, [editingKey]: newValue } : null)
      setEditingKey(null)
      setEditingValue('')
    } catch (err) {
      setError('Failed to save key value')
    }
  }

  useEffect(() => {
    fetchRemoteConfig()
  }, [])

  return (
    <div className="remote-config-container">
      {/* Header */}
      <div className="remote-config-header">
        <div className="header-left">
          <div className="header-title">
            <Settings className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
            <div>
              <h1>Firebase Remote Config</h1>
              <p className="header-subtitle">Manage your Firebase configuration parameters</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link 
            to="/dashboard" 
            className="header-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="remote-config-main">
        <div className="remote-config-content">

          {/* Key Selector Section */}
          {configData && (
            <div className="config-section">
              <div className="section-header">
                <h3>Configuration Keys</h3>
                <p className="section-description">View and manage your Firebase Remote Config parameters</p>
              </div>
            
            {/* Debug Info */}
            <div className="debug-info">
              <p>ConfigData exists: {configData ? 'Yes' : 'No'}</p>
              <p>ConfigData keys: {configData ? Object.keys(configData).length : 0}</p>
            </div>
            
            <div className="space-y-4">
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('full')}
                  className={`toggle-btn ${viewMode === 'full' ? 'active' : ''}`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Full View</span>
                </button>
                <button
                  onClick={() => setViewMode('keys')}
                  className={`toggle-btn ${viewMode === 'keys' ? 'active' : ''}`}
                >
                  <Key className="w-4 h-4" />
                  <span>Key Selector</span>
                </button>
              </div>

              {viewMode === 'keys' && (
                <>
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search keys..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="keys-list">
                    {getConfigKeys().length === 0 ? (
                      <div className="no-keys">
                        <AlertCircle className="w-4 h-4" />
                        <span>No keys found. Make sure you have Remote Config parameters set up in Firebase.</span>
                      </div>
                    ) : (
                      getConfigKeys().map((item) => (
                        <div key={item} className="key-item">
                          <div className="key-header">
                            <span className="key-name">{item}</span>
                            <div className="key-actions">
                              <button
                                onClick={() => setSelectedKey(selectedKey === item ? null : item)}
                                className="key-btn"
                              >
                                {selectedKey === item ? 'Hide' : 'View'}
                              </button>
                              <button
                                onClick={() => startCopying(item)}
                                className="key-btn key-btn-edit"
                                disabled={editingKey === item}
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                          </div>

                          {selectedKey === item && (
                            <div className="key-content">
                              {editingKey === item ? (
                                <div className="key-editor">
                                  <textarea
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="textarea"
                                    rows={6}
                                  />
                                  <div className="key-editor-actions">
                                    <button
                                      onClick={saveEditing}
                                      className="key-btn key-btn-save"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="key-btn key-btn-cancel"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <pre className="key-value">
                                  {getKeyValue(item)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="config-controls">
          <button
            onClick={fetchRemoteConfig}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="loader"></div>
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{accessToken ? 'Fetch with Manual Auth' : 'Fetch with SDK'}</span>
              </>
            )}
          </button>
          
          {configData && (
            <>
              <button
                onClick={copyToClipboard}
                className="btn btn-secondary"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              
              <button
                onClick={downloadConfig}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </>
          )}
        </div>

        {/* Status */}
        <div className="config-status">
          {lastUpdated && (
            <div className="status-item">
              <span className="status-label">Last Updated:</span>
              <span className="status-value">{lastUpdated.toLocaleString()}</span>
            </div>
          )}
          
          {error && (
            <div className="error-status">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Config Display */}
        {configData && viewMode === 'full' && (
          <div className="config-display">
            <pre className="config-json">
              {JSON.stringify(configData, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Info */}
        {configData && (
          <div className="config-summary">
            <h4 className="summary-title">Config Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Config Keys:</span>
                <span className="summary-value">
                  {Object.keys(configData).length} Total
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Key Names:</span>
                <span className="summary-value">
                  {Object.keys(configData).join(', ') || 'No keys found'}
                </span>
              </div>
            </div>
            
            {/* Debug Raw Data */}
            <div className="debug-section">
              <h5 className="debug-title">Debug: Raw Config Data</h5>
              <pre className="debug-data">
                {JSON.stringify(configData, null, 2)}
              </pre>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RemoteConfigDisplay
