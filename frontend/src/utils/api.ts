// API utility functions for the Moving Tech dashboard
import { config } from '../config/environment'

interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  token?: string
  access_token?: string
  user?: any
}

class ApiClient {
  private localBaseUrl: string

  constructor(localBaseUrl: string = 'http://localhost:8090/api') {
    this.localBaseUrl = localBaseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Determine which base URL to use based on endpoint
    const isAuthEndpoint = endpoint === '/user/login' || endpoint === '/user/logout' || endpoint === '/user/profile'
    
    let url: string
    if (isAuthEndpoint) {
      // For auth endpoints, use the Vite proxy (which will route to external dashboard)
      url = `/api${endpoint}`
    } else {
      // For local endpoints, use the local backend
      url = `${this.localBaseUrl}${endpoint}`
    }
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if token exists
    const token = localStorage.getItem(config.AUTH_TOKEN_KEY)
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
      defaultHeaders['token'] = token  // Also add token header for server compatibility
    }

    const requestConfig: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, requestConfig)
      
      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage += ` - ${JSON.stringify(errorData)}`
        } catch (e) {
          // If response is not JSON, just use status
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      
      // Handle CORS errors specifically
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error('CORS policy blocked the request. Please check the proxy configuration or contact the backend team.')
      }
      
      throw error
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse> {
    console.log('Attempting login with email:', username)
    
    // The API expects email field, not username
    const loginData = { email: username, password }
    console.log('Sending login request with JSON data:', loginData)
    
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    })
  }

  // Alternative login method with form data
  async loginFormData(username: string, password: string): Promise<ApiResponse> {
    console.log('Attempting login with form data for email:', username)
    
    const formData = new FormData()
    formData.append('email', username)
    formData.append('password', password)
    
    const url = `/api/user/login`
    
    // For FormData, we need to handle headers differently
    const token = localStorage.getItem(config.AUTH_TOKEN_KEY)
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      headers['token'] = token  // Also add token header for server compatibility
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage += ` - ${JSON.stringify(errorData)}`
        } catch (e) {
          // If response is not JSON, just use status
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('FormData login request failed:', error)
      throw error
    }
  }

  // Alternative login method with different field names
  async loginAlternative(username: string, password: string): Promise<ApiResponse> {
    console.log('Attempting login with alternative format for username:', username)
    
    const loginData = { email: username, password } // Try email field
    console.log('Sending login request with alternative data:', loginData)
    
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/user/logout', {
      method: 'POST',
    })
  }

  // User methods
  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/user/profile')
  }

  // Configuration methods (placeholder for future implementation)
  async getConfigurations(): Promise<ApiResponse> {
    return this.request('/configurations')
  }

  async updateConfiguration(config: any): Promise<ApiResponse> {
    return this.request('/configurations', {
      method: 'PUT',
      body: JSON.stringify(config),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }
