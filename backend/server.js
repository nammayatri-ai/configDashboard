import express from 'express'
import cors from 'cors'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.server file
dotenv.config({ path: path.join(__dirname, '.env') })

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 8090

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Increase JSON payload limit to 50MB

// Load git configuration 
let gitConfig = {
  repository: { 
    url: process.env.GIT_REPOSITORY_URL || 'git@github.com:nammayatri-ai/configDashboard.git', 
    branch: 'main', 
    remote: 'origin' 
  },
  git: { 
    user: { 
      name: process.env.GIT_USER_NAME || 'Config Dashboard', 
      email: process.env.GIT_USER_EMAIL || 'dhruv.singh@nammayatri.in' 
    } 
  },
  settings: { autoCommit: true, autoPush: true, validateJson: true }
}

// Git authentication setup
let gitAuthMethod = 'ssh' // 'ssh' or 'token'
let gitToken = null

async function loadGitConfig() {
  try {
    // First try to load from JSON file
    const configPath = path.join(__dirname, 'config', 'git-config.json')
    const configData = JSON.parse(await fs.readFile(configPath, 'utf8'))
    gitConfig = configData
    console.log('✅ Git configuration loaded from file:', gitConfig.repository.url)
  } catch (error) {
    console.warn('⚠️  Could not load git config from file, using defaults')
  }
  
  // Override with environment variables if available
  if (process.env.GIT_REPOSITORY_URL) {
    gitConfig.repository.url = process.env.GIT_REPOSITORY_URL
    console.log('🔄 Git repository URL overridden from environment:', gitConfig.repository.url)
  }
  if (process.env.GIT_USER_NAME) {
    gitConfig.git.user.name = process.env.GIT_USER_NAME
  }
  if (process.env.GIT_USER_EMAIL) {
    gitConfig.git.user.email = process.env.GIT_USER_EMAIL
  }
  if (process.env.GIT_BRANCH) {
    gitConfig.repository.branch = process.env.GIT_BRANCH
  }
  if (process.env.GIT_REMOTE) {
    gitConfig.repository.remote = process.env.GIT_REMOTE
  }
}

async function reloadGitConfig() {
  try {
    const configPath = path.join(__dirname, 'config', 'git-config.json')
    const configData = JSON.parse(await fs.readFile(configPath, 'utf8'))
    gitConfig = configData
    console.log('🔄 Git configuration reloaded:', gitConfig.repository.url)
  } catch (error) {
    console.error('❌ Failed to reload git config:', error.message)
  }
}

// Setup Git authentication
async function setupGitAuth() {
  try {
    // Check for Git token in environment variables
    if (process.env.GIT_TOKEN) {
      gitToken = process.env.GIT_TOKEN
      gitAuthMethod = 'token'
      
      // Convert SSH URL to HTTPS URL with token
      const sshUrl = gitConfig.repository.url
      if (sshUrl.startsWith('git@github.com:')) {
        const repoPath = sshUrl.replace('git@github.com:', '')
        const httpsUrl = `https://${gitToken}@github.com/${repoPath}`
        
        // Set up Git with token authentication
        await execAsync(`git remote set-url origin ${httpsUrl}`)
        console.log('✅ Git token authentication configured')
        console.log('🔐 Using HTTPS with token for Git operations')
      }
    } else {
      gitAuthMethod = 'ssh'
      console.log('⚠️  No Git token found, using SSH keys')
      console.log('🔑 Using SSH authentication for Git operations')
    }
  } catch (error) {
    console.error('❌ Failed to setup Git authentication:', error.message)
    console.log('⚠️  Falling back to SSH authentication')
    gitAuthMethod = 'ssh'
  }
}

const CONFIGS_DIR = path.join(__dirname, 'configs')

// Ensure configs directory exists
async function ensureConfigsDir() {
  try {
    await fs.access(CONFIGS_DIR)
  } catch {
    await fs.mkdir(CONFIGS_DIR, { recursive: true })
  }
}

// Git operations
async function gitAdd(filePath) {
  try {
    await execAsync(`git add "${filePath}"`)
    console.log('✅ Git add successful')
  } catch (error) {
    console.error('Git add error:', error)
    throw error
  }
}

async function gitCommit(message) {
  try {
    // Set git user if configured
    if (gitConfig.git?.user?.name) {
      await execAsync(`git config user.name "${gitConfig.git.user.name}"`)
    }
    if (gitConfig.git?.user?.email) {
      await execAsync(`git config user.email "${gitConfig.git.user.email}"`)
    }
    
    // Check if there are changes to commit
    try {
      const statusResult = await execAsync('git diff --cached --quiet')
      // If we get here, there are no changes staged
      console.log('⚠️  No changes to commit, but forcing commit anyway')
    } catch (statusError) {
      // If we get an error, it means there are changes staged (good!)
      console.log('📝 Changes detected, proceeding with commit')
    }
    
    await execAsync(`git commit --allow-empty -m "${message}"`)
    console.log('✅ Git commit successful')
  } catch (error) {
    console.error('Git commit error:', error)
    throw error
  }
}

async function gitPush() {
  try {
    const remote = gitConfig.repository?.remote || 'origin'
    const branch = gitConfig.repository?.branch || 'main'
    
    console.log('🔧 Git push starting...')
    console.log('Authentication method:', gitAuthMethod)
    console.log('Repository URL:', gitConfig.repository.url)
    console.log('Remote:', remote)
    console.log('Branch:', branch)
    
    // Check if remote exists
    try {
      const remoteUrl = await execAsync(`git remote get-url ${remote}`)
      console.log('📤 Remote exists:', remoteUrl.stdout.trim())
      
      // Attempt push
      const pushResult = await execAsync(`git push ${remote} ${branch}`)
      console.log('✅ Git push successful:', pushResult.stdout)
      
      // Log authentication method used
      if (gitAuthMethod === 'token') {
        console.log('🔐 Push completed using Git token authentication')
      } else {
        console.log('🔑 Push completed using SSH key authentication')
      }
      
    } catch (remoteError) {
      console.log('⚠️  No remote repository configured, skipping push')
      console.log('📝 Files committed locally only')
      // Don't throw error, just skip the push
    }
  } catch (error) {
    console.error('❌ Git push error:', error.message)
    console.error('Error details:', error)
    
    // Provide helpful error message based on authentication method
    if (gitAuthMethod === 'token') {
      console.error('💡 Token authentication failed. Check if GIT_TOKEN is valid and has proper permissions.')
    } else {
      console.error('💡 SSH authentication failed. Check if SSH keys are properly configured.')
    }
    
    throw error
  }
}

// Initialize git repository with remote
async function initializeGitRepo() {
  try {
    // Check if git is initialized
    try {
      await execAsync('git status')
    } catch {
      // Initialize git repository
      await execAsync('git init')
      console.log('✅ Git repository initialized')
    }

    // Set default branch
    try {
      await execAsync(`git branch -M ${gitConfig.repository.branch}`)
    } catch (error) {
      console.warn('Could not set default branch:', error.message)
    }

    // Check if remote exists and configure it
    try {
      await execAsync('git remote get-url origin')
      console.log('✅ Git remote already configured')
      
      // Check if we have commits to push
      try {
        await execAsync('git log --oneline -1')
        console.log('✅ Git repository has commits')
      } catch {
        // No commits yet, create initial commit
        console.log('📝 Creating initial commit...')
        await execAsync('git add .')
        await execAsync('git commit -m "Initial commit from Docker container"')
        console.log('✅ Initial commit created')
      }
      
      // Set upstream branch
      try {
        // First try to pull any remote changes
        try {
          await execAsync('git pull origin main --allow-unrelated-histories')
          console.log('✅ Pulled remote changes')
        } catch (pullError) {
          console.log('⚠️  Could not pull remote changes:', pullError.message)
        }
        
        // Then set upstream and push
        await execAsync('git push -u origin main')
        console.log('✅ Upstream branch set and push completed')
      } catch (pushError) {
        console.log('⚠️  Could not set upstream branch:', pushError.message)
      }
      
    } catch {
      console.log('ℹ️  No remote repository configured - files will be committed locally only')
    }

  } catch (error) {
    console.error('Git initialization error:', error)
  }
}

// Check if file exists
app.get('/api/files/exists/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    console.log('fileName');
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    try {
      await fs.access(filePath)
      res.json({ exists: true })
    } catch {
      res.json({ exists: false })
    }
  } catch (error) {
    console.error('Error checking file existence:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get list of files
app.get('/api/files/list', async (req, res) => {
  try {
    await ensureConfigsDir()
    const files = await fs.readdir(CONFIGS_DIR)
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
    
    res.json({ files: jsonFiles })
  } catch (error) {
    console.error('Error getting file list:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save new file
app.post('/api/files/save', async (req, res) => {
  try {
    const { filename, content } = req.body
    
    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Missing filename or content',
        message: 'Both filename and content are required'
      })
    }

    // Validate JSON
    try {
      JSON.parse(content)
    } catch (jsonError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Content must be valid JSON'
      })
    }

    await ensureConfigsDir()
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    // Check if file already exists
    try {
      await fs.access(filePath)
      return res.status(409).json({
        error: 'File exists',
        message: `File '${filename}.json' already exists`
      })
    } catch {
      // File doesn't exist, proceed
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf8')
    
    // Git operations
    try {
      await gitAdd(filePath)
      const commitMessage = gitConfig.git?.commit?.template 
        ? gitConfig.git.commit.template.replace('{prefix}', gitConfig.git.commit.prefix || '[Config Dashboard]')
          .replace('{action}', 'Add')
          .replace('{filename}', filename)
        : `[Config Dashboard] Add ${filename}.json`
      
      await gitCommit(commitMessage)
      await gitPush()
      
      res.json({
        success: true,
        message: `File '${filename}.json' saved and pushed to ${gitConfig.repository.url}`,
        repository: gitConfig.repository.url
      })
    } catch (gitError) {
      console.error('Git operations failed:', gitError)
      // File was saved but git operations failed
      res.json({
        success: true,
        message: `File '${filename}.json' saved locally, but git push failed`,
        warning: 'Git operations failed',
        repository: gitConfig.repository.url
      })
    }
  } catch (error) {
    console.error('Error saving file:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to save file'
    })
  }
})

// Update existing file
app.put('/api/files/update', async (req, res) => {
  try {
    const { filename, content } = req.body
    
    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Missing filename or content',
        message: 'Both filename and content are required'
      })
    }

    // Validate JSON
    try {
      JSON.parse(content)
    } catch (jsonError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Content must be valid JSON'
      })
    }

    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({
        error: 'File not found',
        message: `File '${filename}.json' does not exist`
      })
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf8')
    
    // Git operations
    try {
      await gitAdd(filePath)
      const commitMessage = gitConfig.git?.commit?.template 
        ? gitConfig.git.commit.template.replace('{prefix}', gitConfig.git.commit.prefix || '[Config Dashboard]')
          .replace('{action}', 'Update')
          .replace('{filename}', filename)
        : `[Config Dashboard] Update ${filename}.json`
      
      await gitCommit(commitMessage)
      await gitPush()
      
      res.json({
        success: true,
        message: `File '${filename}.json' updated and pushed to ${gitConfig.repository.url}`,
        repository: gitConfig.repository.url
      })
    } catch (gitError) {
      console.error('Git operations failed:', gitError)
      res.json({
        success: true,
        message: `File '${filename}.json' updated locally, but git push failed`,
        warning: 'Git operations failed',
        repository: gitConfig.repository.url
      })
    }
  } catch (error) {
    console.error('Error updating file:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update file'
    })
  }
})

// Delete file
app.delete('/api/files/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({
        error: 'File not found',
        message: `File '${filename}.json' does not exist`
      })
    }

    // Delete file
    await fs.unlink(filePath)
    
    // Git operations
    try {
      await gitAdd(filePath)
      const commitMessage = gitConfig.git?.commit?.template 
        ? gitConfig.git.commit.template.replace('{prefix}', gitConfig.git.commit.prefix || '[Config Dashboard]')
          .replace('{action}', 'Delete')
          .replace('{filename}', filename)
        : `[Config Dashboard] Delete ${filename}.json`
      
      await gitCommit(commitMessage)
      await gitPush()
      
      res.json({
        success: true,
        message: `File '${filename}.json' deleted and changes pushed to ${gitConfig.repository.url}`,
        repository: gitConfig.repository.url
      })
    } catch (gitError) {
      console.error('Git operations failed:', gitError)
      res.json({
        success: true,
        message: `File '${filename}.json' deleted locally, but git push failed`,
        warning: 'Git operations failed',
        repository: gitConfig.repository.url
      })
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete file'
    })
  }
})

// Get file content
app.get('/api/files/content/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    try {
      const content = await fs.readFile(filePath, 'utf8')
      res.json({ content })
    } catch {
      res.status(404).json({
        error: 'File not found',
        message: `File '${filename}.json' does not exist`
      })
    }
  } catch (error) {
    console.error('Error getting file content:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to get file content'
    })
  }
})

// Upload file to git and return GitHub URL
app.post('/api/files/upload-to-git', async (req, res) => {
  try {
    const { filename, content } = req.body
    
    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Missing filename or content',
        message: 'Both filename and content are required'
      })
    }

    // Validate JSON
    try {
      JSON.parse(content)
    } catch (jsonError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Content must be valid JSON'
      })
    }

    await ensureConfigsDir()
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    // Check if file already exists
    let isUpdate = false
    try {
      await fs.access(filePath)
      isUpdate = true
    } catch {
      // File doesn't exist, proceed with creation
    }

    // Write file
    console.log('📝 Writing file to:', filePath)
    await fs.writeFile(filePath, content, 'utf8')
    console.log('✅ File written successfully')
    
    // Git operations
    try {
      console.log('🔄 Starting git operations...')
      await gitAdd(filePath)
      console.log('✅ Git add successful')
      
      const commitMessage = gitConfig.git?.commit?.template 
        ? gitConfig.git.commit.template.replace('{prefix}', gitConfig.git.commit.prefix || '[Config Dashboard]')
          .replace('{action}', isUpdate ? 'Update' : 'Add')
          .replace('{filename}', filename)
        : `[Config Dashboard] ${isUpdate ? 'Update' : 'Add'} ${filename}.json`
      
      console.log('📝 Commit message:', commitMessage)
      await gitCommit(commitMessage)
      console.log('✅ Git commit successful')
      
      await gitPush()
      console.log('✅ Git push successful')
      
      // Generate GitHub URL
      const githubUrl = `https://github.com/nammayatri-ai/configDashboard/blob/${gitConfig.repository.branch}/configs/${filename}.json`
      const rawUrl = `https://github.com/nammayatri-ai/configDashboard/raw/${gitConfig.repository.branch}/configs/${filename}.json`
      
      res.json({
        success: true,
        message: `File '${filename}.json' ${isUpdate ? 'updated' : 'uploaded'} and pushed to GitHub`,
        githubUrl: githubUrl,
        rawUrl: rawUrl,
        repository: gitConfig.repository.url,
        filename: `${filename}.json`
      })
    } catch (gitError) {
      console.error('Git operations failed:', gitError)
      // File was saved but git operations failed
      res.status(500).json({
        error: 'Git operations failed',
        message: `File '${filename}.json' saved locally, but git push failed`,
        details: gitError.message
      })
    }
  } catch (error) {
    console.error('Error uploading file to git:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to upload file to git'
    })
  }
})

// Delete file from git
app.delete('/api/files/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(CONFIGS_DIR, `${filename}.json`)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({
        error: 'File not found',
        message: `File '${filename}.json' does not exist`
      })
    }

    // Delete file locally
    await fs.unlink(filePath)
    
    // Git operations
    try {
      await gitAdd(filePath) // This will stage the deletion
      const commitMessage = gitConfig.git?.commit?.template 
        ? gitConfig.git.commit.template.replace('{prefix}', gitConfig.git.commit.prefix || '[Config Dashboard]')
          .replace('{action}', 'Delete')
          .replace('{filename}', filename)
        : `[Config Dashboard] Delete ${filename}.json`
      
      await gitCommit(commitMessage)
      await gitPush()
      
      res.json({
        success: true,
        message: `File '${filename}.json' deleted and changes pushed to GitHub`,
        repository: gitConfig.repository.url,
        filename: `${filename}.json`
      })
    } catch (gitError) {
      console.error('Git operations failed:', gitError)
      // File was deleted locally but git operations failed
      res.json({
        success: true,
        message: `File '${filename}.json' deleted locally, but git push failed`,
        warning: 'Git operations failed',
        repository: gitConfig.repository.url
      })
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete file'
    })
  }
})

// Save git configuration
app.post('/api/config/save', async (req, res) => {
  try {
    const newConfig = req.body
    
    // Validate required fields
    if (!newConfig.repository?.url || !newConfig.git?.user?.name || !newConfig.git?.user?.email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Repository URL, git user name, and email are required'
      })
    }

    // Save to file first
    const configPath = path.join(__dirname, 'config', 'git-config.json')
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8')
    
    // Update the in-memory config
    gitConfig = newConfig
    
    console.log('✅ Git configuration saved:', newConfig.repository.url)
    console.log('📝 Config file updated at:', configPath)
    
    // Reload config to ensure it's properly loaded
    await reloadGitConfig()
    
    res.json({
      success: true,
      message: 'Git configuration saved successfully'
    })
  } catch (error) {
    console.error('Error saving git config:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save git configuration'
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK NICE', timestamp: new Date().toISOString() , testVar : process.env.GIT_USER_EMAIL })
})

// Git authentication status
app.get('/api/git/status', async (req, res) => {
  try {
    const remote = gitConfig.repository?.remote || 'origin'
    let remoteUrl = null
    
    try {
      const result = await execAsync(`git remote get-url ${remote}`)
      remoteUrl = result.stdout.trim()
    } catch (error) {
      remoteUrl = 'No remote configured'
    }
    
    res.json({
      status: 'OK',
      authentication: {
        method: gitAuthMethod,
        hasToken: !!gitToken,
        tokenLength: gitToken ? gitToken.length : 0
      },
      repository: {
        url: gitConfig.repository.url,
        remoteUrl: remoteUrl,
        branch: gitConfig.repository.branch,
        remote: gitConfig.repository.remote
      },
      git: {
        user: gitConfig.git.user
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Git status',
      message: error.message
    })
  }
})

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 File Manager API server running on port ${PORT}`)
  console.log(`📁 Configs directory: ${CONFIGS_DIR}`)
  
  // Load git configuration
  await loadGitConfig()
  console.log(`🔗 Target repository: ${gitConfig.repository.url}`)
  
  // Setup Git authentication
  await setupGitAuth()
  
  // Initialize git repository
  await initializeGitRepo()
})

export default app
