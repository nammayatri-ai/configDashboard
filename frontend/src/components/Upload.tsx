import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, Edit3, Save, X, Eye, EyeOff, ArrowLeft, GitBranch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UploadProps {
  onLogout?: () => void
}

const Upload = ({ onLogout }: UploadProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newFileName, setNewFileName] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingFile, setIsCheckingFile] = useState(false)
  const [isUploadingToGit, setIsUploadingToGit] = useState(false)
  const [gitUrls, setGitUrls] = useState<{githubUrl: string, rawUrl: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  console.log
  // Theme management
  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark'
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is JSON
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please upload a JSON file only.')
      return
    }

    setError('')
    setSuccess('')
    setUploadedFile(file)
    setFileName(file.name.replace('.json', '')) // Remove .json extension for editing

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        // Validate JSON and format it
        const parsed = JSON.parse(content)
        setFileContent(JSON.stringify(parsed, null, 2))
      } catch (err) {
        setError('Invalid JSON file. Please check the file format.')
        setFileContent(content)
      }
    }
    reader.readAsText(file)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Validate JSON before saving
      try {
        JSON.parse(fileContent)
        setIsEditing(false)
        setError('')
      } catch (err) {
        setError('Invalid JSON format. Please fix the syntax errors.')
        return
      }
    } else {
      setIsEditing(true)
      setError('')
    }
  }

  const handleSaveFile = async () => {
    if (!fileName.trim()) {
      setError('Please enter a file name.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validate JSON first
      JSON.parse(fileContent)
      
      // Create download link for local saving
      const blob = new Blob([fileContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName.trim()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess(`File "${fileName.trim()}.json" has been saved to your downloads folder.`)
      setError('')
    } catch (err) {
      setError('Invalid JSON format. Please fix the syntax errors before saving.')
      setSuccess('')
    } finally {
      setIsSaving(false)
      setIsCheckingFile(false)
    }
  }

  const handleUploadToGit = async () => {
    if (!fileName.trim()) {
      setError('Please enter a file name.')
      return
    }

    setIsUploadingToGit(true)
    setError('')
    setSuccess('')
    setGitUrls(null)

    try {
      // Validate JSON first
      JSON.parse(fileContent)
      
      const response = await fetch('http://localhost:8090/api/files/upload-to-git', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName.trim(),
          content: fileContent
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(result.message)
        setGitUrls({
          githubUrl: result.githubUrl,
          rawUrl: result.rawUrl
        })
        console.log('[GIT] URLS: ', result.githubUrl, result.rawUrl);
        setError('')
      } else {
        setError(result.message || 'Failed to upload to git')
        setSuccess('')
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please fix the syntax errors before uploading.')
      } else {
        setError('Failed to upload to git. Please check your connection and try again.')
      }
      setSuccess('')
    } finally {
      setIsUploadingToGit(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!fileName.trim()) {
      setError('Please enter a file name.')
      return
    }

    setIsDeleting(true)
    setError('')
    setSuccess('')
    setGitUrls(null)

    try {
      const response = await fetch(`http://localhost:8090/api/files/delete/${fileName.trim()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(result.message)
        setError('')
        // Reset the form after successful deletion
        handleReset()
      } else {
        setError(result.message || 'Failed to delete file')
        setSuccess('')
      }
    } catch (err) {
      setError('Failed to delete file. Please check your connection and try again.')
      setSuccess('')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleReset = () => {
    setUploadedFile(null)
    setFileContent('')
    setFileName('')
    setIsEditing(false)
    setShowPreview(false)
    setError('')
    setSuccess('')
    setIsCreatingNew(false)
    setGitUrls(null)
    setShowDeleteConfirm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) {
      setError('Please enter a file name.')
      return
    }
    
    setIsCheckingFile(true)
    setError('')
    setSuccess('')

    try {
      // For now, skip the API check and proceed with creation
      // In a real implementation, this would check if file exists
      console.log(`Creating new file: ${newFileName.trim()}.json`)
      
      // File doesn't exist, proceed with creation
      setIsCreatingNew(true)
      setFileContent('{\n  \n}')
      setFileName(newFileName.trim())
      setUploadedFile(null)
      setIsEditing(true)
      setShowPreview(true)
      setError('')
      setSuccess('')
      setNewFileName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setError('Error creating file. Please try again.')
    } finally {
      setIsCheckingFile(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(fileContent)
      setFileContent(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (err) {
      setError('Cannot format invalid JSON.')
    }
  }

  const validateJson = () => {
    try {
      JSON.parse(fileContent)
      setError('')
      setSuccess('JSON is valid!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(`JSON Error: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
    }
  }

  return (
    <div className="upload-container">
      {/* Header */}
      <div className="upload-header">
        <div className="header-left">
          <div className="header-title">
            <UploadIcon className="w-6 h-6 text-emerald-500" />
            <div>
              <h1>Config Upload</h1>
              <p>Upload and edit JSON configuration files</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          {/* Theme Toggle */}
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
      <div className="upload-main">
        <div className="upload-content">
          <div className = "flex flex-row">

          {/* File Upload Section */}
          <div className="upload-section">
            <div className="upload-area">
              <div className="upload-icon">
                <UploadIcon className="w-12 h-12 text-gray-400" />
              </div>
              <div className="upload-text">
                <h3>Upload JSON Configuration File</h3>
                <p>Drag and drop your JSON file here, or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="file-input"
                />
              <div className="upload-buttons">
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  >
                  Choose File
                </button>
              </div>
            </div>
          </div>

          {/* Create New File Section */}
          <div className="create-section">
            <div className="create-area">
              <div className="create-icon">
                <FileText className="w-12 h-12 text-green-400" />
              </div>
              <div className="create-text">
                <h3>Create New JSON File</h3>
                <p>Enter a filename and create a new JSON configuration file</p>
              </div>
              <div className="create-input-group">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="create-input"
                  placeholder="Enter file name (without .json extension)"
                  onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                          handleCreateNewFile()
                        }
                    }}
                    />
                <button 
                  className="create-btn"
                  onClick={handleCreateNewFile}
                  disabled={!newFileName.trim() || isCheckingFile}
                  >
                  {isCheckingFile ? 'Checking...' : 'Create File'}
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* File Info and Controls */}
          {(uploadedFile || isCreatingNew) && (
            <div className="file-info-section">
              <div className="file-info-header">
                <div className="file-info-title">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span>{isCreatingNew ? 'New JSON File' : uploadedFile?.name}</span>
                </div>
                <div className="file-info-actions">
                  <button 
                    className="action-btn"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? 'Hide' : 'Preview'}
                  </button>
                  <button 
                    className="action-btn"
                    onClick={handleEditToggle}
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Cancel Edit' : 'Edit'}
                  </button>
                  <button 
                    className="action-btn primary"
                    onClick={handleSaveFile}
                    disabled={!fileName.trim() || isSaving || isCheckingFile}
                    >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : isCheckingFile ? 'Checking...' : 'Save File'}
                  </button>
                  <button 
                    className="action-btn success"
                    onClick={handleUploadToGit}
                    disabled={!fileName.trim() || isUploadingToGit || isCheckingFile}
                    >
                    <GitBranch className="w-4 h-4" />
                    {isUploadingToGit ? 'Uploading...' : 'Upload to Git'}
                  </button>
                  <button 
                    className="action-btn warning"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={!fileName.trim() || isDeleting || isCheckingFile}
                    >
                    <X className="w-4 h-4" />
                    Delete from Git
                  </button>
                  <button 
                    className="action-btn danger"
                    onClick={handleReset}
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* File Name Input */}
              <div className="file-name-section">
                <label htmlFor="fileName" className="file-name-label">
                  File Name (without .json extension):
                </label>
                <input
                  id="fileName"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="file-name-input"
                  placeholder="Enter file name..."
                />
              </div>

              {/* JSON Actions */}
              <div className="json-actions">
                <button 
                  className="json-btn"
                  onClick={formatJson}
                  disabled={!fileContent}
                >
                  Format JSON
                </button>
                <button 
                  className="json-btn"
                  onClick={validateJson}
                  disabled={!fileContent}
                >
                  Validate JSON
                </button>
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="message error">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="message success">
              <GitBranch className="w-4 h-4" />
              {success}
            </div>
          )}
          {gitUrls && (
            <div className="git-urls-section">
              <div className="git-url-item">
                {/* <label>GitHub URL:</label> */}
                {/* <div className="url-container">
                  <a 
                    href={gitUrls.githubUrl} 
                    target="disable" 
                    rel="noopener noreferrer"
                    className="url-link"
                  >
                    {gitUrls.githubUrl}
                  </a>
                </div> */}
              </div>
              <div className="git-url-item">
                <label>Raw URL:</label>
                <div className="url-container">
                  <a 
                    href={gitUrls.rawUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="url-link"
                  >
                    {gitUrls.rawUrl}
                  </a>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(gitUrls.rawUrl)}
                    title="Copy Raw URL"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}
          {(isSaving || isCheckingFile || isUploadingToGit || isDeleting) && (
            <div className="message info">
              <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
              {isSaving ? 'Saving file locally...' : isCheckingFile ? 'Checking file existence...' : isUploadingToGit ? 'Uploading to git repository...' : 'Deleting file from git...'}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="delete-confirm-dialog">
              <div className="delete-confirm-content">
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete <strong>{fileName}.json</strong> from the git repository?</p>
                <p className="delete-warning">This action cannot be undone and will remove the file from GitHub.</p>
                <div className="delete-confirm-actions">
                  <button 
                    className="action-btn danger"
                    onClick={handleDeleteFile}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* File Content Editor/Viewer */}
          {(uploadedFile || isCreatingNew) && (showPreview || isEditing) && (
            <div className="file-content-section">
              <div className="content-header">
                <h3>File Content</h3>
                <div className="content-actions">
                  <button 
                    className="content-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(fileContent)
                      setSuccess('Content copied to clipboard!')
                      setTimeout(() => setSuccess(''), 2000)
                    }}
                  >
                    Copy Content
                  </button>
                </div>
              </div>
              
              <div className="content-wrapper">
                <div className="line-numbers-upload">
                  {fileContent.split('\n').map((_, index) => (
                    <div key={index} className="line-number-upload">{index + 1}</div>
                  ))}
                  {!fileContent && <div className="line-number-upload">1</div>}
                </div>
                {isEditing ? (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="content-editor"
                    placeholder="Edit your JSON content here..."
                    rows={20}
                  />
                ) : (
                  <pre className="content-viewer">
                    {fileContent || 'No content to display'}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Upload
