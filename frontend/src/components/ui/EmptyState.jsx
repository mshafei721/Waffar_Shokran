import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../contexts/LanguageContext'
import { useApp } from '../../contexts/AppContext'
import { useSearchProducts } from '../../hooks/useSearchProducts'
import { Search, ShoppingBag, Lightbulb } from 'lucide-react'

function EmptyState({ query }) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { popularSearches, setSearchQuery } = useApp()
  const { searchProducts } = useSearchProducts()

  // Suggestions based on query
  const getSuggestions = (searchQuery) => {
    const suggestions = []
    const queryLower = searchQuery.toLowerCase()
    
    // Common spelling corrections in Arabic
    const corrections = {
      'ارز': 'أرز',
      'سكار': 'سكر',
      'زيت': 'زيت طبخ',
      'لبن': 'حليب',
      'خبز': 'عيش',
      'شامبو': 'شامبو للشعر',
      'صابون': 'صابون استحمام',
    }
    
    // Add spelling corrections
    for (const [wrong, correct] of Object.entries(corrections)) {
      if (queryLower.includes(wrong)) {
        suggestions.push(correct)
      }
    }
    
    // Add related terms
    if (queryLower.includes('أرز') || queryLower.includes('rice')) {
      suggestions.push('أرز مصري', 'أرز أبيض', 'أرز بسمتي')
    }
    
    if (queryLower.includes('زيت') || queryLower.includes('oil')) {
      suggestions.push('زيت عباد الشمس', 'زيت الذرة', 'زيت الزيتون')
    }
    
    if (queryLower.includes('سكر') || queryLower.includes('sugar')) {
      suggestions.push('سكر أبيض', 'سكر بني', 'سكر ناعم')
    }
    
    return suggestions.slice(0, 4)
  }

  const suggestions = getSuggestions(query)

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    searchProducts(suggestion)
  }

  const handlePopularSearchClick = (popularQuery) => {
    setSearchQuery(popularQuery)
    searchProducts(popularQuery)
  }

  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Search className="w-10 h-10 text-gray-400" />
      </div>

      {/* Main message */}
      <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${
        isRTL ? 'font-arabic' : 'font-english'
      }`}>
        {t('search.noResults')}
      </h3>
      
      <p className={`text-gray-600 mb-6 max-w-md mx-auto ${
        isRTL ? 'font-arabic' : 'font-english'
      }`}>
        {isRTL 
          ? `لم نجد أي منتجات تتطابق مع "${query}". جرب البحث بكلمات مختلفة أو تحقق من الاقتراحات أدناه.`
          : `We couldn't find any products matching "${query}". Try searching with different keywords or check the suggestions below.`
        }
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-4">
            <Lightbulb className="w-5 h-5 text-egyptian-500" />
            <h4 className={`text-lg font-medium text-gray-900 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {t('search.suggestions')}
            </h4>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-2 bg-egyptian-100 text-egyptian-700 rounded-full hover:bg-egyptian-200 transition-colors duration-200 ${
                  isRTL ? 'font-arabic' : 'font-english'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-4">
          <ShoppingBag className="w-5 h-5 text-gray-500" />
          <h4 className={`text-lg font-medium text-gray-900 ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {t('search.popularSearches')}
          </h4>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          {popularSearches.slice(0, 6).map((popularQuery, index) => (
            <button
              key={index}
              onClick={() => handlePopularSearchClick(popularQuery)}
              className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200 ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}
            >
              {popularQuery}
            </button>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div className={`mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto ${
        isRTL ? 'font-arabic' : 'font-english'
      }`}>
        <h5 className="font-semibold text-blue-900 mb-2">
          {isRTL ? 'نصائح للبحث:' : 'Search tips:'}
        </h5>
        <ul className="text-sm text-blue-800 space-y-1 text-left rtl:text-right">
          <li>• {isRTL ? 'استخدم كلمات مفتاحية بسيطة مثل "أرز" بدلاً من "أرز أبيض عالي الجودة"' : 'Use simple keywords like "rice" instead of "high quality white rice"'}</li>
          <li>• {isRTL ? 'جرب البحث بالإنجليزية والعربية' : 'Try searching in both Arabic and English'}</li>
          <li>• {isRTL ? 'تحقق من الإملاء' : 'Check your spelling'}</li>
          <li>• {isRTL ? 'استخدم أسماء الماركات المشهورة' : 'Use popular brand names'}</li>
        </ul>
      </div>
    </div>
  )
}

export default EmptyState