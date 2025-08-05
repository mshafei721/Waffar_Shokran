import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import ProductCard from './ProductCard'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

function ResultsTable({ results }) {
  const { t } = useTranslation()
  const { isRTL, formatCurrency } = useLanguage()
  const { filters, updateFilters } = useApp()

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results.filter(product => {
      // Price range filter
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false
      }

      // Retailer filter
      if (filters.selectedRetailers.length > 0 && !filters.selectedRetailers.includes(product.retailer)) {
        return false
      }

      // Availability filter
      if (filters.availableOnly && !product.in_stock) {
        return false
      }

      return true
    })

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'price':
          comparison = a.price - b.price
          break
        case 'retailer':
          comparison = a.retailer.localeCompare(b.retailer)
          break
        case 'availability':
          comparison = (b.in_stock ? 1 : 0) - (a.in_stock ? 1 : 0)
          break
        default:
          comparison = 0
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [results, filters])

  const handleSort = (sortBy) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    updateFilters({ sortBy, sortOrder: newSortOrder })
  }

  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4" />
    }
    return filters.sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  if (filteredResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className={`text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
          {t('search.noResults')}
        </p>
      </div>
    )
  }

  // Find cheapest price for comparison
  const cheapestPrice = Math.min(...filteredResults.filter(p => p.in_stock).map(p => p.price))

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                  isRTL ? 'text-right font-arabic' : 'text-left font-english'
                }`}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>{t('results.product')}</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                  isRTL ? 'text-right font-arabic' : 'text-left font-english'
                }`}
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>{t('results.price')}</span>
                  {getSortIcon('price')}
                </div>
              </th>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                  isRTL ? 'text-right font-arabic' : 'text-left font-english'
                }`}
                onClick={() => handleSort('retailer')}
              >
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>{t('results.retailer')}</span>
                  {getSortIcon('retailer')}
                </div>
              </th>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                  isRTL ? 'text-right font-arabic' : 'text-left font-english'
                }`}
                onClick={() => handleSort('availability')}
              >
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>{t('results.availability')}</span>
                  {getSortIcon('availability')}
                </div>
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResults.map((product, index) => (
              <tr 
                key={`${product.retailer}-${product.name}-${index}`}
                className={`hover:bg-gray-50 ${product.price === cheapestPrice && product.in_stock ? 'bg-green-50' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {product.name}
                      </div>
                      {product.brand && (
                        <div className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                          {product.brand}
                        </div>
                      )}
                      {product.weight && (
                        <div className={`text-xs text-gray-400 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                          {product.weight} {product.weight_unit?.value || ''}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm font-semibold ${product.price === cheapestPrice && product.in_stock ? 'text-green-600' : 'text-gray-900'} ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {formatCurrency(product.price)}
                    {product.price === cheapestPrice && product.in_stock && (
                      <span className={`ml-2 rtl:mr-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {t('results.cheapest')}
                      </span>
                    )}
                  </div>
                  {product.price_per_unit && (
                    <div className={`text-xs text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {formatCurrency(product.price_per_unit)} {t('results.unit')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {t(`retailers.${product.retailer.toLowerCase().replace(/\s+/g, '_')}`) || product.retailer}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.in_stock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  } ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {product.in_stock ? t('results.availability') : t('results.outOfStock')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right rtl:text-left">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-egyptian-600 hover:bg-egyptian-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-egyptian-500 transition-colors duration-200 ${
                      isRTL ? 'font-arabic' : 'font-english'
                    }`}
                  >
                    {t('results.visitStore')}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {filteredResults.map((product, index) => (
          <ProductCard 
            key={`${product.retailer}-${product.name}-${index}`}
            product={product}
            isCheapest={product.price === cheapestPrice && product.in_stock}
          />
        ))}
      </div>
    </div>
  )
}

export default ResultsTable