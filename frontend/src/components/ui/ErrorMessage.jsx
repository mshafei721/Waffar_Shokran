import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../contexts/LanguageContext'
import { useApp } from '../../contexts/AppContext'
import { AlertTriangle, RefreshCw, Wifi, Server, Clock } from 'lucide-react'

function ErrorMessage({ error, onRetry, className = '' }) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { clearError } = useApp()

  // Determine error type and appropriate icon
  const getErrorInfo = (errorMessage) => {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('network') || message.includes('connection')) {
      return {
        icon: Wifi,
        type: 'network',
        title: t('errors.networkError'),
        suggestion: isRTL 
          ? 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى'
          : 'Check your internet connection and try again'
      }
    }
    
    if (message.includes('timeout')) {
      return {
        icon: Clock,
        type: 'timeout',
        title: t('errors.searchTimeout'),
        suggestion: isRTL 
          ? 'البحث يستغرق وقتاً أطول من المعتاد. حاول مرة أخرى'
          : 'Search is taking longer than usual. Please try again'
      }
    }
    
    if (message.includes('server') || message.includes('500')) {
      return {
        icon: Server,
        type: 'server',
        title: t('errors.serverError'),
        suggestion: t('errors.tryAgainLater')
      }
    }
    
    return {
      icon: AlertTriangle,
      type: 'general',
      title: t('errors.searchError'),
      suggestion: t('errors.tryAgainLater')
    }
  }

  const errorInfo = getErrorInfo(error)
  const Icon = errorInfo.icon

  const handleRetry = () => {
    clearError()
    if (onRetry) {
      onRetry()
    }
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Icon className="w-5 h-5 text-red-600" />
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold text-red-800 mb-2 ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {errorInfo.title}
          </h3>
          
          <p className={`text-red-600 mb-3 ${
            isRTL ? 'font-arabic' : 'font-english'
          }`}>
            {errorInfo.suggestion}
          </p>

          {/* Technical error details (collapsed by default) */}
          <details className="mb-4">
            <summary className={`text-sm text-red-500 cursor-pointer hover:text-red-600 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL ? 'تفاصيل تقنية' : 'Technical details'}
            </summary>
            <div className={`mt-2 p-3 bg-red-100 rounded text-sm text-red-700 font-mono ${
              isRTL ? 'text-right' : 'text-left'
            }`}>
              {error}
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRetry}
              className={`inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('common.retry')}</span>
            </button>

            <button
              onClick={clearError}
              className={`inline-flex items-center px-4 py-2 border border-red-300 text-red-700 font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Help for Network Errors */}
      {errorInfo.type === 'network' && (
        <div className={`mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          <h4 className="text-sm font-semibold text-blue-800 mb-1">
            {isRTL ? 'نصائح للاتصال:' : 'Connection tips:'}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {isRTL ? 'تحقق من اتصال الواي فاي أو البيانات' : 'Check your WiFi or mobile data connection'}</li>
            <li>• {isRTL ? 'حاول إعادة تحميل الصفحة' : 'Try refreshing the page'}</li>
            <li>• {isRTL ? 'تأكد من عدم وجود حظر على الموقع' : 'Make sure the site is not blocked'}</li>
          </ul>
        </div>
      )}

      {/* Additional Help for Timeout Errors */}
      {errorInfo.type === 'timeout' && (
        <div className={`mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
            {isRTL ? 'لماذا يحدث هذا؟' : 'Why does this happen?'}
          </h4>
          <p className="text-sm text-yellow-700">
            {isRTL 
              ? 'نحن نبحث في أكثر من 10 متاجر في نفس الوقت. أحياناً قد يكون بعض المتاجر بطيئاً في الاستجابة.'
              : 'We search across 10+ stores simultaneously. Sometimes some stores may be slow to respond.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default ErrorMessage