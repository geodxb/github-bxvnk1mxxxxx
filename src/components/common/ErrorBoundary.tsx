import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error details
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    console.error('🚨 Component Stack:', errorInfo.componentStack);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = "Something went wrong", fallbackMessage = "An unexpected error occurred" } = this.props;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-300 shadow-xl p-8 max-w-2xl w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                {fallbackTitle}
              </h1>
              
              <p className="text-gray-700 mb-6 uppercase tracking-wide text-sm font-medium">
                {fallbackMessage}
              </p>
              
              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-6 text-left">
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wide">Error Details:</h3>
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide flex items-center space-x-2"
                >
                  <RefreshCw size={18} />
                  <span>RELOAD PAGE</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide flex items-center space-x-2"
                >
                  <Home size={18} />
                  <span>GO HOME</span>
                </button>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Interactive Brokers LLC | Error ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;