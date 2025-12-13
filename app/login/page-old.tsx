'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos')
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, ingresa un email válido')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        toast.success('¡Bienvenido!', 'Has iniciado sesión correctamente')
        router.push('/')
      } else {
        setError(result.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      console.error('Error de login:', error)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 py-12 relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-[url('/cosmic-background.png')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-pink-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/supernova-logo.png" alt="Supernova Burgers & Wings" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Iniciar Sesión Espacial
          </h1>
          <p className="text-lg text-gray-300">Accede a tu cuenta para explorar nuestras hamburguesas cósmicas</p>
          <div className="mt-2 text-sm text-purple-300">🚀 Prepárate para un viaje gastronómico intergaláctico</div>
        </div>

        <Suspense
          fallback={
            <div className="max-w-md mx-auto p-8 bg-black/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-800/50 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-purple-300 mt-4">Conectando con la galaxia...</p>
            </div>
          }
        >
          <LoginFormWrapper />
        </Suspense>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-pink-400 hover:underline transition-colors duration-300"
          >
            <span className="mr-2">🌌</span>
            Volver al universo principal
          </Link>
        </div>

        {/* Additional cosmic elements */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Sistema en línea
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              Conexión segura
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
