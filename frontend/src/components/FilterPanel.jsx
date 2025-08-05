import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { X, Filter } from 'lucide-react'

function FilterPanel() {
  const { t } = useTranslation()
  const { isRTL, formatCurrency } = useLanguage()
  const { filters, updateFilters, resetFilters, searchResults } = useApp()
  
  const [localFilters, setLocalFilters] = useState(filters)

  // Get unique retailers from search results
  const availableRetailers = React.useMemo(() => {
    const retailers = [...new Set(searchResults.map(product => product.retailer))]
    return retailers.sort()
  }, [searchResults])

  // Get price range from search results
  const priceRange = React.useMemo(() => {
    if (searchResults.length === 0) return { min: 0, max: 1000 }
    
    const prices = searchResults.map(product => product.price)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    }
  }, [searchResults])

  const handlePriceRangeChange = useCallback((field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [field]: parseInt(value) }
    }))
  }, [])

  const handleRetailerToggle = useCallback((retailer) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedRetailers: prev.selectedRetailers.includes(retailer)
        ? prev.selectedRetailers.filter(r => r !== retailer)
        : [...prev.selectedRetailers, retailer]
    }))
  }, [])

  const handleSortChange = useCallback((sortBy) => {
    setLocalFilters(prev => ({ ...prev, sortBy }))
  }, [])

  const handleAvailabilityToggle = useCallback(() => {
    setLocalFilters(prev => ({ ...prev, availableOnly: !prev.availableOnly }))
  }, [])

  const handleApplyFilters = useCallback(() => {
    updateFilters(localFilters)
  }, [localFilters, updateFilters])

  const handleResetFilters = useCallback(() => {
    const defaultFilters = {
      priceRange: { min: priceRange.min, max: priceRange.max },
      selectedRetailers: [],
      sortBy: 'price',
      sortOrder: 'asc',
      availableOnly: false,
    }
    setLocalFilters(defaultFilters)
    resetFilters()
  }, [priceRange, resetFilters])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold text-gray-900 flex items-center space-x-2 rtl:space-x-reverse ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          <Filter className="w-5 h-5" />
          <span>{t('filters.title')}</span>
        </h3>
        
        <button
          onClick={handleResetFilters}
          className={`text-sm text-egyptian-600 hover:text-egyptian-700 ${isRTL ? 'font-arabic' : 'font-english'}`}
        >
          {t('filters.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Price Range */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('filters.priceRange')}
          </label>
          <div className="space-y-2">
            <div className="flex space-x-2 rtl:space-x-reverse">
              <div className="flex-1">
                <label className={`block text-xs text-gray-500 mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t('common.min')}
                </label>
                <input
                  type="number"
                  value={localFilters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  min={priceRange.min}
                  max={priceRange.max}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-egyptian-500 focus:border-egyptian-500 ${
                    isRTL ? 'text-right font-arabic' : 'font-english'
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className={`block text-xs text-gray-500 mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t('common.max')}
                </label>
                <input
                  type="number"
                  value={localFilters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  min={priceRange.min}
                  max={priceRange.max}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-egyptian-500 focus:border-egyptian-500 ${
                    isRTL ? 'text-right font-arabic' : 'font-english'
                  }`}
                />
              </div>
            </div>
            <div className={`text-xs text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {formatCurrency(localFilters.priceRange.min)} - {formatCurrency(localFilters.priceRange.max)}
            </div>
          </div>
        </div>

        {/* Retailers */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('filters.retailers')}
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableRetailers.map(retailer => (
              <label key={retailer} className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  checked={localFilters.selectedRetailers.includes(retailer)}
                  onChange={() => handleRetailerToggle(retailer)}
                  className="w-4 h-4 text-egyptian-600 border-gray-300 rounded focus:ring-egyptian-500"
                />
                <span className={`text-sm text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t(`retailers.${retailer.toLowerCase().replace(/\s+/g, '_')}`) || retailer}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('filters.sortBy')}
          </label>
          <div className="space-y-2">
            {['price', 'retailer', 'availability'].map(option => (
              <label key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="radio"
                  name="sortBy"
                  checked={localFilters.sortBy === option}
                  onChange={() => handleSortChange(option)}
                  className="w-4 h-4 text-egyptian-600 border-gray-300 focus:ring-egyptian-500"
                />
                <span className={`text-sm text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {t(`filters.sort${option.charAt(0).toUpperCase() + option.slice(1)}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('filters.availability')}
          </label>
          <label className="flex items-center space-x-2 rtl:space-x-reverse">
            <input
              type="checkbox"
              checked={localFilters.availableOnly}
              onChange={handleAvailabilityToggle}
              className="w-4 h-4 text-egyptian-600 border-gray-300 rounded focus:ring-egyptian-500"
            />
            <span className={`text-sm text-gray-700 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {t('filters.availableOnly')}
            </span>
          </label>
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleApplyFilters}
          className={`px-6 py-2 bg-egyptian-600 text-white font-medium rounded-md hover:bg-egyptian-700 focus:outline-none focus:ring-2 focus:ring-egyptian-500 focus:ring-offset-2 transition-colors duration-200 ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}
        >
          {t('filters.apply')}
        </button>
      </div>
    </div>
  )
}

export default FilterPanel