'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Icon header */}
            <div className="flex flex-col items-center px-6 pt-8 pb-5">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-base font-bold text-white text-center mb-1.5">
                Ops! Algo deu errado
              </h1>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Encontramos um problema ao carregar a aplicação. Por favor, tente novamente.
              </p>
            </div>

            {/* Action */}
            <div className="px-4 pb-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recarregar página
              </button>
            </div>

            {/* Technical details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="border-t border-white/[0.06]">
                <details className="text-[11px] text-gray-500">
                  <summary className="cursor-pointer px-4 py-2.5 hover:text-gray-400 transition-colors select-none">
                    Detalhes técnicos
                  </summary>
                  <pre className="px-4 pb-4 text-[10px] text-gray-500 overflow-x-auto leading-relaxed">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
