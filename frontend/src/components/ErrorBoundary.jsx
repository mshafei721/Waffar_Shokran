import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
    
    // In production, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              عذراً، حدث خطأ
            </h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Sorry, something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. Please try again or return to the home page.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRefresh}
                className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-3 bg-egyptian-600 text-white font-medium rounded-md hover:bg-egyptian-700 focus:outline-none focus:ring-2 focus:ring-egyptian-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>إعادة المحاولة / Retry</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-egyptian-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Home className="w-5 h-5" />
                <span>الصفحة الرئيسية / Home</span>
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-800 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Contact Info */}
            <div className="mt-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
              <p className="mb-1">
                إذا استمر المشكلة، يرجى الاتصال بنا
              </p>
              <p>
                If the problem persists, please contact us
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary