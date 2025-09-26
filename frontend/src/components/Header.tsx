import { useState } from 'react'
import { LogOut, AlertTriangle } from 'lucide-react'
import { apiClient } from '../utils/api'

interface HeaderProps {
  onLogout: () => void
}

const Header = ({ onLogout }: HeaderProps) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      // Call logout API
      await apiClient.logout()
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with logout even if API call fails
    } finally {
      onLogout()
      setShowLogoutConfirm(false)
    }
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  return (
    <>
      <header className="dark-header">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="text-xl font-bold text-white tracking-wide">
              config dashboard
            </div>
            
            {/* Center: Divider line */}
            <div className="flex-1 mx-8">
              <div className="border-t border-gray-600"></div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center space-x-8">
              <button className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                view diff
              </button>
              
              <button
                onClick={handleLogoutClick}
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
              >
                logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-purple-500/20 rounded-xl shadow-xl max-w-md w-full mx-4 backdrop-blur-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to logout? Any unsaved changes will be lost.
                </p>
                <p className="text-sm text-gray-400">
                  You will need to log back in to access the dashboard.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelLogout}
                  className="btn btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={confirmLogout}
                  className="btn btn-danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header