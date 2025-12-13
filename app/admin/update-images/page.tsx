'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { RefreshCw, Image, Check, X, AlertCircle } from 'lucide-react'

export default function UpdateImagesPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const updateImages = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/admin/update-product-images', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(data)
      } else {
        alert('❌ Error: ' + (data.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Actualizar Imágenes de Productos</h1>
          <p className="text-purple-300">Sincroniza las imágenes de la base de datos con los archivos en /public/uploads/products/</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-black rounded-lg border border-purple-500/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">¿Qué hace esto?</h3>
              <ul className="text-purple-200 space-y-1 text-sm">
                <li>✓ Lee todos los productos de la base de datos</li>
                <li>✓ Busca archivos coincidentes en /public/uploads/products/</li>
                <li>✓ Actualiza las rutas de imagen automáticamente</li>
                <li>✓ Matching inteligente (ignora mayúsculas, acentos, etc.)</li>
              </ul>
            </div>
            <Image className="h-16 w-16 text-purple-400" />
          </div>

          <Button
            onClick={updateImages}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Image className="mr-2 h-4 w-4" />
                Actualizar Imágenes
              </>
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{results.summary.total}</div>
                <div className="text-blue-300 text-sm">Total Productos</div>
              </div>
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{results.summary.updated}</div>
                <div className="text-green-300 text-sm">Actualizados</div>
              </div>
              <div className="bg-gray-900/30 border border-gray-500/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{results.summary.unchanged}</div>
                <div className="text-gray-300 text-sm">Sin Cambios</div>
              </div>
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{results.summary.notFound}</div>
                <div className="text-red-300 text-sm">Sin Imagen</div>
              </div>
            </div>

            {/* Detalles */}
            <div className="bg-black/50 rounded-lg border border-purple-500/50 overflow-hidden">
              <div className="p-4 bg-purple-900/50 border-b border-purple-500/50">
                <h3 className="text-white font-semibold">Detalles de la Actualización</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-purple-900/30 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-white text-sm">ID</th>
                      <th className="px-4 py-2 text-left text-white text-sm">Producto</th>
                      <th className="px-4 py-2 text-left text-white text-sm">Estado</th>
                      <th className="px-4 py-2 text-left text-white text-sm">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-800/30">
                    {results.results.map((item: any) => (
                      <tr key={item.id} className="hover:bg-purple-900/10">
                        <td className="px-4 py-3 text-gray-300 font-mono">#{item.id}</td>
                        <td className="px-4 py-3 text-white">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.status === 'updated' && (
                            <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                              <Check className="h-4 w-4" />
                              Actualizado
                            </span>
                          )}
                          {item.status === 'unchanged' && (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              Sin cambios
                            </span>
                          )}
                          {item.status === 'not_found' && (
                            <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                              <X className="h-4 w-4" />
                              Sin imagen
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.status === 'updated' && (
                            <div className="text-purple-300">
                              <div className="line-through text-red-400">{item.before}</div>
                              <div className="text-green-400">→ {item.after}</div>
                            </div>
                          )}
                          {item.status === 'unchanged' && (
                            <div className="text-gray-400">{item.image}</div>
                          )}
                          {item.status === 'not_found' && (
                            <div className="text-red-400">No se encontró archivo coincidente</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
