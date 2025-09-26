// CORS proxy utility for development
// This is a fallback solution if the Vite proxy doesn't work

export const corsProxy = {
  // You can use a public CORS proxy service for development
  // Note: This is only for development and should not be used in production
  getProxyUrl: (url: string) => {
    if (import.meta.env?.DEV) {
      // Using a public CORS proxy (use with caution in development only)
      return `https://cors-anywhere.herokuapp.com/${url}`
    }
    return url
  },

  // Alternative: Use a different CORS proxy service
  getAlternativeProxyUrl: (url: string) => {
    if (import.meta.env?.DEV) {
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    }
    return url
  }
}

// Instructions for setting up local CORS proxy
export const corsSetupInstructions = `
CORS Setup Instructions:

1. Vite Proxy (Recommended):
   - The vite.config.ts has been updated with a proxy configuration
   - Restart the dev server: npm run dev
   - API calls will go through localhost:3000/api/*

2. Browser Extension (Alternative):
   - Install "CORS Unblock" or "Disable CORS" extension
   - Enable it for localhost:3000

3. Chrome with disabled security (Development only):
   - Close all Chrome instances
   - Run: chrome --disable-web-security --user-data-dir=/tmp/chrome_dev
   - WARNING: Only for development, never use for browsing

4. Backend Solution (Best for production):
   - Ask the backend team to add CORS headers:
     Access-Control-Allow-Origin: http://localhost:3000
     Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
     Access-Control-Allow-Headers: Content-Type, Authorization
`
