import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { ExternalLink, ShoppingBag, Star } from 'lucide-react'

function ProductCard({ product, isCheapest }) {
  const { t } = useTranslation()
  const { isRTL, formatCurrency } = useLanguage()

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${
      isCheapest ? 'ring-2 ring-green-500 bg-green-50' : ''
    }`}>
      {/* Cheapest Badge */}
      {isCheapest && (
        <div className="flex items-center space-x-1 rtl:space-x-reverse mb-2">
          <Star className="w-4 h-4 text-green-600" />
          <span className={`text-sm font-semibold text-green-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('results.cheapest')}
          </span>
        </div>
      )}

      <div className="flex space-x-4 rtl:space-x-reverse">
        {/* Product Image */}
        {product.image_url && (
          <div className="flex-shrink-0">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {/* Product Name */}
            <h3 className={`text-sm font-medium text-gray-900 truncate ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {product.name}
            </h3>

            {/* Brand and Weight */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {product.brand && (
                <span className={`px-2 py-1 bg-gray-100 rounded ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {product.brand}
                </span>
              )}
              {product.weight && (
                <span className={isRTL ? 'font-arabic' : 'font-english'}>
                  {product.weight} {product.weight_unit?.value || ''}
                </span>
              )}
            </div>

            {/* Price and Retailer */}
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${isCheapest ? 'text-green-600' : 'text-gray-900'} ${isRTL ? 'font-arabic' : 'font-english'}`}>
                  {formatCurrency(product.price)}
                </div>
                {product.price_per_unit && (
                  <div className={`text-xs text-gray-500 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                    {formatCurrency(product.price_per_unit)} {t('results.unit')}
                  </div>
                )}
              </div>
              
              <div className={`text-sm text-gray-600 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {t(`retailers.${product.retailer.toLowerCase().replace(/\s+/g, '_')}`) || product.retailer}
              </div>
            </div>

            {/* Availability and Action */}
            <div className="flex items-center justify-between pt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                product.in_stock 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              } ${isRTL ? 'font-arabic' : 'font-english'}`}>
                {product.in_stock ? t('results.availability') : t('results.outOfStock')}
              </span>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 text-sm font-medium text-egyptian-600 hover:text-egyptian-700 transition-colors duration-200 ${
                  isRTL ? 'font-arabic' : 'font-english'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('results.visitStore')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard