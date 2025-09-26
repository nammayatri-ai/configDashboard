export interface FileInfo {
  name: string
  content: string
  exists: boolean
}

export interface FileResponse {
  success: boolean
  message: string
  file?: FileInfo
  error?: string
}

export class FileManager {
  private static instance: FileManager
  private baseUrl = '/api/files'

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager()
    }
    return FileManager.instance
  }

  /**
   * Check if a file exists in the configs folder
   */
  async checkFileExists(filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/exists/${filename}.json`)
      const data = await response.json()
      return data.exists || false
    } catch (error) {
      console.error('Error checking file existence:', error)
      return false
    }
  }

  /**
   * Get list of all files in configs folder
   */
  async getFileList(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list`)
      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('Error getting file list:', error)
      return []
    }
  }

  /**
   * Save a file to the configs folder and push to git
   */
  async saveFile(filename: string, content: string): Promise<FileResponse> {
    try {
      // First check if file exists
      const exists = await this.checkFileExists(filename)
      if (exists) {
        return {
          success: false,
          message: `File '${filename}.json' already exists. Please choose a different name.`,
          error: 'FILE_EXISTS'
        }
      }

      // Validate JSON content
      try {
        JSON.parse(content)
      } catch (jsonError) {
        return {
          success: false,
          message: 'Invalid JSON format. Please fix the syntax errors.',
          error: 'INVALID_JSON'
        }
      }

      // Save file via API
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          content: content
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          message: `File '${filename}.json' has been saved and pushed to git repository.`,
          file: {
            name: filename,
            content: content,
            exists: true
          }
        }
      } else {
        return {
          success: false,
          message: data.message || 'Failed to save file',
          error: data.error || 'SAVE_ERROR'
        }
      }
    } catch (error) {
      console.error('Error saving file:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      }
    }
  }

  /**
   * Update an existing file
   */
  async updateFile(filename: string, content: string): Promise<FileResponse> {
    try {
      // Validate JSON content
      try {
        JSON.parse(content)
      } catch (jsonError) {
        return {
          success: false,
          message: 'Invalid JSON format. Please fix the syntax errors.',
          error: 'INVALID_JSON'
        }
      }

      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          content: content
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          message: `File '${filename}.json' has been updated and pushed to git repository.`,
          file: {
            name: filename,
            content: content,
            exists: true
          }
        }
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update file',
          error: data.error || 'UPDATE_ERROR'
        }
      }
    } catch (error) {
      console.error('Error updating file:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      }
    }
  }

  /**
   * Delete a file from configs folder
   */
  async deleteFile(filename: string): Promise<FileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/delete/${filename}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          message: `File '${filename}.json' has been deleted and changes pushed to git repository.`
        }
      } else {
        return {
          success: false,
          message: data.message || 'Failed to delete file',
          error: data.error || 'DELETE_ERROR'
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      }
    }
  }

  /**
   * Get file content
   */
  async getFileContent(filename: string): Promise<FileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${filename}`)
      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          message: 'File content retrieved successfully',
          file: {
            name: filename,
            content: data.content,
            exists: true
          }
        }
      } else {
        return {
          success: false,
          message: data.message || 'Failed to get file content',
          error: data.error || 'GET_ERROR'
        }
      }
    } catch (error) {
      console.error('Error getting file content:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      }
    }
  }
}

export const fileManager = FileManager.getInstance()
