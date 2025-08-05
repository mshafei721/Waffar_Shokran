import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../contexts/LanguageContext'
import { Search, ShoppingCart } from 'lucide-react'

function LoadingSpinner({ message, size = 'medium', variant = 'search' }) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const containerSizeClasses = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-8'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  const icons = {
    search: Search,
    shopping: ShoppingCart,
  }

  const Icon = icons[variant] || Search

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]}`}>
      {/* Animated Icon */}
      <div className="relative mb-4">
        <div className={`${sizeClasses[size]} animate-pulse text-egyptian-500`}>
          <Icon className="w-full h-full" />
        </div>
        
        {/* Rotating ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-egyptian-200 border-t-egyptian-500 rounded-full animate-spin`}>
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <p className={`${textSizeClasses[size]} text-gray-600 text-center max-w-xs ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          {message}
        </p>
      )}

      {/* Default messages */}
      {!message && (
        <div className={`${textSizeClasses[size]} text-gray-600 text-center ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          <p className="mb-1">
            {variant === 'search' ? t('search.searching') : t('common.loading')}
          </p>
          {variant === 'search' && (
            <p className="text-sm text-gray-500">
              {isRTL 
                ? 'جاري البحث في أكثر من 10 متاجر...' 
                : 'Searching across 10+ stores...'
              }
            </p>
          )}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex space-x-1 rtl:space-x-reverse mt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 bg-egyptian-300 rounded-full animate-bounce`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default LoadingSpinner