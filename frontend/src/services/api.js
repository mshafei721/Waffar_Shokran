import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds to accommodate search time
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding common headers
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for tracking
    config.metadata = { startTime: new Date() }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime
    
    // Log slow requests (> 5 seconds)
    if (duration > 5000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`)
    }
    
    return response
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          throw new Error(data.detail || 'Invalid request')
        case 404:
          throw new Error('Service not found')
        case 408:
          throw new Error('Search timeout - retailers may be temporarily unavailable')
        case 429:
          throw new Error('Too many requests - please wait a moment')
        case 500:
          throw new Error('Server error - please try again later')
        default:
          throw new Error(data.detail || `Server error (${status})`)
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error - please check your connection')
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

/**
 * Search for products across Egyptian retailers
 * @param {Object} params - Search parameters
 * @param {string} params.query - Product search query
 * @param {string} params.language - Language preference ('ar' or 'en')
 * @param {number} params.max_results - Maximum number of results
 * @param {number} params.min_price - Minimum price filter
 * @param {number} params.max_price - Maximum price filter
 * @param {Array} params.preferred_retailers - List of preferred retailers
 * @returns {Promise} API response with product results
 */
export const searchProducts = async (params) => {
  const searchParams = {
    query: params.query,
    language: params.language || 'ar',
    max_results: params.max_results || 50,
    include_alternatives: params.include_alternatives !== false,
    ...params
  }

  try {
    const response = await api.post('/search', searchParams)
    return response.data
  } catch (error) {
    // Add context to search errors
    throw new Error(`Search failed: ${error.message}`)
  }
}

/**
 * Get list of supported retailers
 * @returns {Promise} List of retailers with their status
 */
export const getRetailers = async () => {
  try {
    const response = await api.get('/retailers')
    return response.data
  } catch (error) {
    throw new Error(`Failed to load retailers: ${error.message}`)
  }
}

/**
 * Health check endpoint
 * @returns {Promise} API health status
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`)
  }
}

/**
 * Get search suggestions based on query
 * @param {string} query - Partial search query
 * @param {string} language - Language preference
 * @returns {Promise} List of search suggestions
 */
export const getSearchSuggestions = async (query, language = 'ar') => {
  try {
    const response = await api.get('/suggestions', {
      params: { q: query, lang: language }
    })
    return response.data
  } catch (error) {
    // Don't throw error for suggestions, just return empty array
    console.warn('Search suggestions failed:', error.message)
    return { suggestions: [] }
  }
}

/**
 * Get popular search terms
 * @param {string} language - Language preference
 * @returns {Promise} List of popular searches
 */
export const getPopularSearches = async (language = 'ar') => {
  try {
    const response = await api.get('/popular-searches', {
      params: { lang: language }
    })
    return response.data
  } catch (error) {
    console.warn('Popular searches failed:', error.message)
    return { popular_searches: [] }
  }
}

// Export the axios instance for advanced usage
export default api