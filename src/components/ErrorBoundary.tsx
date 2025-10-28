'use client'

import React, { ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-dark">
          <div className="max-w-md w-full bg-dark/80 shadow-lg shadow-yellow-400/20 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-pink mr-2" />
              <h1 className="text-lg font-semibold text-white">
                Algo salió mal
              </h1>
            </div>
            <p className="text-primary/80 mb-4">
              Lo sentimos, ha ocurrido un error inesperado. Por favor, recarga la página o inténtalo más tarde.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Recargar página
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 bg-dark-light text-white px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-primary/60">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-pink bg-dark-light p-2 rounded">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}