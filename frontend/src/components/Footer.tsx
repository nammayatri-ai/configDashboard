
const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="dashboard-footer flex flex" >
      <div className="footer-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Right Section */}
            <div className="footer-copyright">
              <span>&copy; {currentYear} Config Systems</span>
              <span className="text-gray-400">|</span>
              <span>v2.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer