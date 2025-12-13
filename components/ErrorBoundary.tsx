'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
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
    console.error('Error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-colibri-beige via-colibri-gray to-colibri-gold/20 p-8 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Error de Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Ocurrió un error al cargar la página. Esto puede deberse a:
              </p>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Problemas de conexión a internet</li>
                <li>Archivos JavaScript corruptos</li>
                <li>Caché del navegador desactualizada</li>
              </ul>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar Página
                </Button>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false })}
                  className="border-purple-400 text-purple-400 hover:bg-purple-600/20"
                >
                  Reintentar
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Detalles técnicos
                  </summary>
                  <pre className="text-xs text-gray-400 mt-2 bg-gray-900/50 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}