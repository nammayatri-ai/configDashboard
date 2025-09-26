import { ReactNode } from 'react'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="dashboard-container min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Layout
