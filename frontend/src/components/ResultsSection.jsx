import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import ResultsTable from './ResultsTable'
import FilterPanel from './FilterPanel'
import LoadingSpinner from './ui/LoadingSpinner'
import ErrorMessage from './ui/ErrorMessage'
import EmptyState from './ui/EmptyState'
import { Filter } from 'lucide-react'

function ResultsSection() {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { searchResults, isSearching, error, searchQuery } = useApp()
  const [showFilters, setShowFilters] = React.useState(false)

  // Don't render if no search has been made
  if (!searchQuery && !isSearching && !error) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'font-arabic' : 'font-english'}`}>
            {t('results.title')}
          </h2>
          {searchQuery && !isSearching && (
            <p className={`text-gray-600 mt-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
              {searchResults.length > 0 
                ? t('search.resultsFor', { query: searchQuery, count: searchResults.length })
                : t('search.noResultsFor', { query: searchQuery })
              }
            </p>
          )}
        </div>

        {searchResults.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
              isRTL ? 'font-arabic' : 'font-english'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{t('filters.title')}</span>
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage error={error} />
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="flex justify-center py-12">
          <LoadingSpinner message={t('results.loading')} />
        </div>
      )}

      {/* Results Content */}
      {!isSearching && !error && (
        <>
          {searchResults.length > 0 ? (
            <div className="space-y-6">
              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <FilterPanel />
                </div>
              )}

              {/* Results Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <ResultsTable results={searchResults} />
              </div>
            </div>
          ) : searchQuery ? (
            <EmptyState query={searchQuery} />
          ) : null}
        </>
      )}
    </section>
  )
}

export default ResultsSection