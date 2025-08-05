import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { Heart, Shield, Clock, Users } from 'lucide-react'

function Footer() {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold text-gray-900 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL ? 'عن وفر شكراً' : 'About Waffar Shokran'}
            </h3>
            <p className={`text-gray-600 text-sm leading-relaxed ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL 
                ? 'نساعدك في العثور على أفضل الأسعار للبقالة والمنتجات المنزلية من أكثر من 10 متاجر إلكترونية في مصر.'
                : 'We help you find the best prices for groceries and household items from 10+ online stores in Egypt.'
              }
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold text-gray-900 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL ? 'المميزات' : 'Features'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className={`flex items-center space-x-2 rtl:space-x-reverse ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}>
                <Clock className="w-4 h-4 text-egyptian-500" />
                <span>{isRTL ? 'بحث سريع أقل من 3 ثواني' : 'Fast search under 3 seconds'}</span>
              </li>
              <li className={`flex items-center space-x-2 rtl:space-x-reverse ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}>
                <Users className="w-4 h-4 text-egyptian-500" />
                <span>{isRTL ? 'أكثر من 10 متاجر' : '10+ stores'}</span>
              </li>
              <li className={`flex items-center space-x-2 rtl:space-x-reverse ${
                isRTL ? 'font-arabic' : 'font-english'
              }`}>
                <Shield className="w-4 h-4 text-egyptian-500" />
                <span>{isRTL ? 'أسعار محدثة ودقيقة' : 'Updated and accurate prices'}</span>
              </li>
            </ul>
          </div>

          {/* Popular Searches */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold text-gray-900 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL ? 'البحث الشائع' : 'Popular Searches'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {['أرز', 'زيت', 'سكر', 'شاي', 'قهوة', 'صابون'].map((item, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded ${
                    isRTL ? 'font-arabic' : 'font-english'
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold text-gray-900 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h3>
            <div className={`text-sm text-gray-600 space-y-2 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              <p>
                {isRTL ? 'للاستفسارات والاقتراحات' : 'For inquiries and suggestions'}
              </p>
              <p className="text-egyptian-600">
                info@waffarshokran.com
              </p>
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  {isRTL 
                    ? 'نحن نعمل على تحسين الخدمة باستمرار'
                    : 'We continuously work to improve our service'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={`bg-gray-50 rounded-lg p-4 mb-6 ${
          isRTL ? 'font-arabic' : 'font-english'
        }`}>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isRTL 
              ? 'الأسعار المعروضة قد تختلف عن الأسعار الفعلية في المتاجر. نحن نبذل قصارى جهدنا لضمان دقة المعلومات، ولكن ننصح بالتحقق من الأسعار مباشرة من المتاجر قبل الشراء.'
              : 'Displayed prices may differ from actual store prices. We do our best to ensure information accuracy, but we recommend verifying prices directly with stores before purchasing.'
            }
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className={`flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              <span>© {currentYear} وفر شكراً - Waffar Shokran</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>{isRTL ? 'صنع بحب في مصر' : 'Made with love in Egypt'}</span>
            </div>

            {/* Links */}
            <div className={`flex items-center space-x-6 rtl:space-x-reverse text-sm ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}>
              <a 
                href="#privacy" 
                className="text-gray-600 hover:text-egyptian-600 transition-colors duration-200"
              >
                {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </a>
              <a 
                href="#terms" 
                className="text-gray-600 hover:text-egyptian-600 transition-colors duration-200"
              >
                {isRTL ? 'شروط الاستخدام' : 'Terms of Use'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer