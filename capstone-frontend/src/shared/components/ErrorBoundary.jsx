import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-screen w-full bg-gray-50 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600 shadow-sm border border-red-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">System Error Encountered</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            An unexpected error occurred in this module. We apologize for the inconvenience. The issue has been logged securely.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Reload System
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition shadow-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
