import { useCallback } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { searchProducts, getSearchSuggestions } from '../services/api'

/**
 * Custom hook for product search functionality
 */
export function useSearchProducts() {
  const { i18n } = useTranslation()
  const { language } = useLanguage()
  const { 
    setSearching, 
    setSearchResults, 
    setError, 
    clearError,
    filters 
  } = useApp()

  // Main search mutation
  const searchMutation = useMutation(searchProducts, {
    onMutate: () => {
      setSearching(true)
      clearError()
    },
    onSuccess: (data) => {
      setSearchResults(data.products || [])
      setSearching(false)
    },
    onError: (error) => {
      setError(error.message)
      setSearching(false)
      setSearchResults([])
    },
  })

  // Search function with filters applied
  const search = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setError('Please enter a search query')
      return
    }

    const searchParams = {
      query: query.trim(),
      language: language,
      max_results: 50,
      include_alternatives: true,
      // Apply current filters
      min_price: filters.priceRange.min,
      max_price: filters.priceRange.max,
      preferred_retailers: filters.selectedRetailers,
    }

    try {
      await searchMutation.mutateAsync(searchParams)
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Search error:', error)
    }
  }, [language, filters, searchMutation, setError])

  // Quick search without full error handling (for suggestions)
  const quickSearch = useCallback(async (query) => {
    try {
      const response = await searchProducts({
        query: query.trim(),
        language: language,
        max_results: 10,
        include_alternatives: false,
      })
      return response.products || []
    } catch (error) {
      console.warn('Quick search failed:', error.message)
      return []
    }
  }, [language])

  return {
    searchProducts: search,
    quickSearch,
    isSearching: searchMutation.isLoading,
    searchError: searchMutation.error,
  }
}

/**
 * Custom hook for search suggestions
 */
export function useSearchSuggestions(query, enabled = true) {
  const { language } = useLanguage()

  return useQuery(
    ['suggestions', query, language],
    () => getSearchSuggestions(query, language),
    {
      enabled: enabled && query && query.length > 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: false, // Don't retry failed suggestion requests
      refetchOnWindowFocus: false,
    }
  )
}

/**
 * Custom hook for search history management
 */
export function useSearchHistory() {
  const STORAGE_KEY = 'waffar_search_history'
  const MAX_HISTORY = 10

  const getHistory = useCallback(() => {
    try {
      const history = localStorage.getItem(STORAGE_KEY)
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.warn('Failed to load search history:', error)
      return []
    }
  }, [])

  const addToHistory = useCallback((query) => {
    try {
      const history = getHistory()
      const cleanQuery = query.trim().toLowerCase()
      
      // Remove if already exists
      const filtered = history.filter(item => item.toLowerCase() !== cleanQuery)
      
      // Add to beginning
      const newHistory = [query.trim(), ...filtered].slice(0, MAX_HISTORY)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }, [getHistory])

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }, [])

  return {
    getHistory,
    addToHistory,
    clearHistory,
  }
}

/**
 * Custom hook for debounced search
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}