"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden en esta dimensión")
      return
    }

    if (password.length < 6) {
      setError("El código de acceso debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password /*, username si existe */ }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error desconocido al registrar.")
      }

      // Registro exitoso
      // Podrías mostrar un mensaje y luego redirigir, o redirigir directamente.
      // Ejemplo: router.push('/login?message=Registro exitoso, por favor inicia sesión');
      router.push("/menu") // O donde sea apropiado
    } catch (err: any) {
      console.error("Error en el registro (llamada a API):", err)
      setError(err.message || "Error al unirse a la galaxia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-black/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-800/50 relative overflow-hidden">
      {/* Cosmic glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl"></div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Registro Galáctico
          </h2>
          <p className="text-gray-400 text-sm mt-2">Crea tu cuenta en el universo Supernova</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-purple-300 mb-2 font-medium">
              📧 Correo Espacial
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-purple-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-purple-300 mb-2 font-medium">
              🔐 Código de Acceso
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-purple-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-purple-400 mt-1 flex items-center">
              <span className="mr-1">🛡️</span>
              Mínimo 6 caracteres para protección galáctica
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-purple-300 mb-2 font-medium">
              🔒 Confirmar Código
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-purple-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creando cuenta...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Unirse a la Galaxia
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            ¿Ya eres parte de la galaxia?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-pink-400 hover:underline transition-colors duration-300 font-medium"
            >
              Inicia tu viaje
            </Link>
          </p>
        </div>

        {/* Benefits preview */}
        <div className="mt-6 p-4 bg-black/30 rounded-xl border border-purple-800/30">
          <h3 className="text-purple-300 font-semibold text-sm mb-2 flex items-center">
            <span className="mr-2">🎁</span>
            Beneficios Galácticos
          </h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li className="flex items-center">
              <span className="w-1 h-1 bg-purple-400 rounded-full mr-2"></span>
              Acceso a hamburguesas exclusivas
            </li>
            <li className="flex items-center">
              <span className="w-1 h-1 bg-pink-400 rounded-full mr-2"></span>
              Descuentos en alitas estelares
            </li>
            <li className="flex items-center">
              <span className="w-1 h-1 bg-orange-400 rounded-full mr-2"></span>
              Entrega a velocidad luz
            </li>
          </ul>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-400 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 right-2 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}
