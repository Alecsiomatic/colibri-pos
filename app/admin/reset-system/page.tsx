"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/admin-layout";
import { Trash2, AlertTriangle, Database } from "lucide-react";

export default function ResetSystemPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resetSystem = async () => {
    if (!confirm("⚠️ PELIGRO: Esto eliminará TODOS los pedidos. ¿Estás seguro?")) return;
    if (!confirm("⚠️ ÚLTIMA ADVERTENCIA: Esta acción NO se puede deshacer. ¿Continuar?")) return;

    setIsResetting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reset-system', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          ...data
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Error desconocido'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Error de conexión'
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🗑️ Resetear Sistema</h1>
          <p className="text-gray-300">Eliminar todos los pedidos y empezar desde cero</p>
        </div>

        <Card className="border-red-500/50 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ ZONA PELIGROSA
            </CardTitle>
            <CardDescription className="text-red-300">
              Esta acción es IRREVERSIBLE. Eliminará todos los pedidos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">🗑️ Se eliminarán:</h3>
              <ul className="text-red-300 space-y-1 ml-4">
                <li>• Todos los pedidos (cualquier estado)</li>
                <li>• Asignaciones de delivery</li>
                <li>• Movimientos de inventario</li>
                <li>• Se reseteará el inventario al stock inicial</li>
              </ul>
            </div>

            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
              <h3 className="font-semibold text-green-200 mb-2">✅ Se conservarán:</h3>
              <ul className="text-green-300 space-y-1 ml-4">
                <li>• Productos y categorías</li>
                <li>• Usuarios y permisos</li>
                <li>• Repartidores</li>
                <li>• Configuración del sistema</li>
              </ul>
            </div>

            <Button
              onClick={resetSystem}
              disabled={isResetting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
              size="lg"
            >
              {isResetting ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  🗑️ ELIMINAR TODOS LOS PEDIDOS
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500/50 bg-green-950/20" : "border-red-500/50 bg-red-950/20"}>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-400" : "text-red-400"}>
                {result.success ? "✅ Reset Exitoso" : "❌ Error en Reset"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-3">
                  <p className="text-green-300">{result.message}</p>
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                    <h4 className="font-semibold text-green-200 mb-2">📊 Resumen:</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>👥 Usuarios: {result.summary?.users}</li>
                      <li>🍔 Productos: {result.summary?.products}</li>
                      <li>📂 Categorías: {result.summary?.categories}</li>
                      <li>🚗 Repartidores: {result.summary?.drivers}</li>
                      <li>🛒 Pedidos eliminados: {result.deletedOrders}</li>
                      <li>📦 Asignaciones eliminadas: {result.deletedAssignments}</li>
                    </ul>
                  </div>
                  <div className="text-center pt-3">
                    <p className="text-2xl">🎉 ¡Sistema listo para empezar desde 0!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-300">Error: {result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}