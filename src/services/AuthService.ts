import { useMainStore } from '@stores/useMainStore'

// Helper function to get backend port
const getPort = () => {
  const isDev = import.meta.env.DEV
  if (isDev) return 1865
  if (window.location.port === '443' || window.location.port === '80') return undefined
  return window.location.port || 1865
}

// Type for user credentials
interface UserCredentials {
  username: string
  password: string
}

/**
 * Service for handling authentication operations
 */
const AuthService = {
  /**
   * Authenticate user with credentials
   */
  authenticate: async (credentials: UserCredentials) => {
    try {
      // Dynamic backend URL construction
      const backendUrl = `${window.location.protocol}//${window.location.hostname}:${getPort()}/auth/token`
      
      // Direct fetch to auth endpoint
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      
      if (!response.ok) {
        throw new Error('Authentication failed')
      }
      
      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  },

  /**
   * Process URL parameters for authentication
   * Returns true if authentication was handled
   */
  processUrlParams: async () => {
    try {
      const url = new URL(window.location.href)
      const mainStore = useMainStore()
      
      // Check for token in URL
      const tokenParam = url.searchParams.get('token')
      if (tokenParam) {
        // Set cookie directly
        document.cookie = `ccat_user_token=${tokenParam}; Path=/;`
        mainStore.cookie = tokenParam
        
        // Clean URL by removing token parameter
        url.searchParams.delete('token')
        window.history.replaceState({}, document.title, url.toString())
        return true
      }
      
      // Check for username/password in URL (less secure, but supported for compatibility)
      const username = url.searchParams.get('username')
      const password = url.searchParams.get('password')
      
      if (username && password) {
        const token = await AuthService.authenticate({ username, password })
        
        if (token) {
          // Set cookie
          document.cookie = `ccat_user_token=${token}; Path=/;`
          mainStore.cookie = token
          
          // Store credentials in localStorage
          localStorage.setItem('username', username)
          localStorage.setItem('password', password)
          localStorage.setItem('token', token)
          
          // Clean URL
          url.searchParams.delete('username')
          url.searchParams.delete('password')
          window.history.replaceState({}, document.title, url.toString())
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error processing URL parameters:', error)
      return false
    }
  },
  
  /**
   * Log out the current user
   */
  logout: () => {
    // Clear localStorage
    localStorage.removeItem('username')
    localStorage.removeItem('password')
    localStorage.removeItem('token')
    
    // Clear cookie
    document.cookie = 'ccat_user_token=; Max-Age=0; Path=/;'
    
    // Update store
    const mainStore = useMainStore()
    mainStore.cookie = undefined
    
    // Reload page
    window.location.reload()
  }
}

export default AuthService