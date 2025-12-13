"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Obtener la redirección si existe
  const redirect = searchParams?.get("redirect") || "/menu"

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push(redirect)
      }
    }

    checkSession()
  }, [router, redirect, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      // Intento de inicio de sesión con Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Error de Supabase:", signInError)

        // Mensajes de error más amigables
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.")
        } else if (signInError.message.includes("Email not confirmed")) {
          throw new Error("Correo no confirmado. Por favor verifica tu bandeja de entrada.")
        } else {
          throw signInError
        }
      }

      if (data.user) {
        setMessage("🚀 Conexión establecida. Iniciando viaje espacial...")

        // Asegurarnos que la redirección funcione correctamente
        try {
          // Esperar un momento para que el usuario vea el mensaje de éxito
          setTimeout(() => {
            console.log("Redirigiendo a:", redirect)
            router.push(redirect)
            // Forzar un refresh completo en caso de que la navegación del router falle
            setTimeout(() => {
              window.location.href = redirect
            }, 500)
          }, 1000)
        } catch (redirectError) {
          console.error("Error en redirección:", redirectError)
          // Fallback a redirección manual
          window.location.href = redirect
        }
      }
    } catch (err: any) {
      console.error("Error detallado de inicio de sesión:", err)
      setError(err.message || "Error al conectar con la galaxia. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Función alternativa para intentar con el sistema legacy si es necesario
  const handleLegacyLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      if (data.success) {
        setMessage("🚀 Conexión establecida. Iniciando viaje espacial...")

        try {
          setTimeout(() => {
            console.log("Redirigiendo a:", redirect)
            router.push(redirect)
            // Fallback
            setTimeout(() => {
              window.location.href = redirect
            }, 500)
          }, 1000)
        } catch (redirectError) {
          console.error("Error en redirección:", redirectError)
          window.location.href = redirect
        }
      }
    } catch (err: any) {
      console.error("Error en login legacy:", err)
      setError(err.message || "Error al conectar con la galaxia")
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
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Acceso Espacial
          </h2>
          <p className="text-gray-400 text-sm mt-2">Conecta con tu cuenta galáctica</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm">
            <div className="flex items-center">
              <span className="mr-2">✨</span>
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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
              disabled={loading}
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
              disabled={loading}
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
                Conectando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Iniciar Viaje
              </div>
            )}
          </button>

          {error && (
            <button
              type="button"
              onClick={handleLegacyLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">🛸</span>
                Método Alternativo
              </div>
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            ¿Nuevo en la galaxia?{" "}
            <Link
              href="/register"
              className="text-purple-400 hover:text-pink-400 hover:underline transition-colors duration-300 font-medium"
            >
              Únete a nosotros
            </Link>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-400 rounded-full animate-ping"></div>
      </div>
    </div>
  )
}
