// Environment configuration for the Moving Tech dashboard

export const config = {
  // Environment Configuration
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env?.MODE || 'master', // 'development' | 'master' | 'prod'
  
  // API Configuration based on environment
  API_BASE_URL: (() => {
    const env = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env?.MODE || 'master'
    switch (env) {
      case 'development':
        return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:8090/api' // Local backend server
      case 'master':
        return import.meta.env.VITE_API_BASE_URL_MASTER || 'https://dashboard.integ.moving.tech/api/dev/bap/api/dev/bap' // Master/Staging environment
      case 'prod':
        return import.meta.env.VITE_API_BASE_URL_PROD || 'https://dashboard.moving.tech/api/dev/bap' // Production environment
      default:
        return '/api'
    }
  })(),
  
  // Authentication Configuration
  AUTH_MODE: (() => {
    const env = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env?.MODE || 'master'
    switch (env) {
      case 'development':
        return import.meta.env.VITE_AUTH_MODE_DEV || 'api' // Use API authentication for development
      case 'master':
        return import.meta.env.VITE_AUTH_MODE_MASTER || 'api' // Use API authentication for master/staging
      case 'prod':
        return import.meta.env.VITE_AUTH_MODE_PROD || 'api' // Use API authentication for production
      default:
        return 'api'
    }
  })(),
  
  // Application Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'NEXUS Control System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
  
  // Authentication Configuration
  AUTH_TOKEN_KEY: 'nexus_auth_token',
  AUTH_REFRESH_KEY: 'nexus_refresh_token',
  
  // Feature Flags
  ENABLE_DEBUG_LOGGING: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true' || import.meta.env?.DEV || false,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,
  ENABLE_AUTH_TOGGLE: import.meta.env.VITE_ENABLE_AUTH_TOGGLE === 'true' || true, // Allow switching auth modes in development
  
  // UI Configuration
  THEME: import.meta.env.VITE_THEME || 'cyberpunk',
  ANIMATION_SPEED: import.meta.env.VITE_ANIMATION_SPEED || 'normal', // 'slow' | 'normal' | 'fast'
  
  // Git Configuration
  GIT_CONFIG: {
    repository: {
      url: import.meta.env.VITE_GIT_REPOSITORY_URL || 'https://github.com/your-username/your-repo',
      branch: import.meta.env.VITE_GIT_BRANCH || 'main',
      remote: import.meta.env.VITE_GIT_REMOTE || 'origin'
    },
    git: {
      user: {
        name: import.meta.env.VITE_GIT_USER_NAME || 'Config Dashboard',
        email: import.meta.env.VITE_GIT_USER_EMAIL || 'your.email@example.com'
      },
      token: import.meta.env.VITE_GIT_TOKEN || '',
      commit: {
        prefix: import.meta.env.VITE_GIT_COMMIT_PREFIX || '[Config Dashboard]',
        template: import.meta.env.VITE_GIT_COMMIT_TEMPLATE || '{prefix} {action} {filename}.json'
      }
    },
    settings: {
      autoCommit: import.meta.env.VITE_GIT_AUTO_COMMIT === 'true' || true,
      autoPush: import.meta.env.VITE_GIT_AUTO_PUSH === 'true' || true,
      validateJson: import.meta.env.VITE_GIT_VALIDATE_JSON === 'true' || true,
      createBackup: import.meta.env.VITE_GIT_CREATE_BACKUP === 'true' || false,
      maxFileSize: import.meta.env.VITE_GIT_MAX_FILE_SIZE || '10MB'
    }
  },
  
  // API Endpoints
  ENDPOINTS: {
    CONFIGURATIONS: '/configurations',
    HEALTH_CHECK: '/health'
  }
} as const

export type Config = typeof config
