'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  
  // Pre-cargar credenciales según el rol
  const getCredentialsByRole = (role: string | null) => {
    switch (role) {
      case 'admin':
        return { email: 'admin@supernova.com', password: 'admin123' }
      case 'cajero':
        return { email: 'cajero@supernova.com', password: 'admin123' }
      case 'mesero':
        return { email: 'mesero@supernova.com', password: 'admin123' }
      case 'driver':
        return { email: 'driver@supernova.com', password: 'admin123' }
      default:
        return { email: '', password: '' }
    }
  }

  const initialCredentials = getCredentialsByRole(roleParam)
  const [email, setEmail] = useState(initialCredentials.email)
  const [password, setPassword] = useState(initialCredentials.password)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessName, setBusinessName] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    fetch('/api/business-info').then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBusinessName(d.name || '') }).catch(() => {})
  }, [])

  // Actualizar credenciales si cambia el parámetro de rol
  useEffect(() => {
    const credentials = getCredentialsByRole(roleParam)
    setEmail(credentials.email)
    setPassword(credentials.password)
  }, [roleParam])

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
        
        // Redirigir según tipo de usuario
        const response = await fetch('/api/users/profile', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            console.log('🔍 Usuario después del login:', data.user)
            console.log('🔍 is_driver:', data.user.is_driver, 'tipo:', typeof data.user.is_driver)
            
            // Normalizar valores booleanos (0/1 a false/true)
            const isAdmin = data.user.is_admin === true || data.user.is_admin === 1
            const isDriver = data.user.is_driver === true || data.user.is_driver === 1
            const isWaiter = data.user.is_waiter === true || data.user.is_waiter === 1
            
            console.log('✅ Roles normalizados:', { isAdmin, isDriver, isWaiter })
            
            // Redirigir según el rol del usuario (orden de prioridad)
            if (isAdmin && !isDriver && !isWaiter) {
              console.log('➡️ Redirigiendo a: /admin/dashboard')
              router.push('/admin/dashboard')
            } else if (isDriver) {
              console.log('➡️ Redirigiendo a: /driver/dashboard')
              router.push('/driver/dashboard')
            } else if (isWaiter) {
              console.log('➡️ Redirigiendo a: /mesero/mesas-abiertas')
              router.push('/mesero/mesas-abiertas')
            } else if (data.user.email?.includes('cajero')) {
              console.log('➡️ Redirigiendo a: /caja')
              router.push('/caja')
            } else {
              console.log('➡️ Redirigiendo a: /demo')
              // Usuario normal va al demo (hero + productos destacados)
              router.push('/demo')
            }
            return
          }
        }
        // Fallback
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
  <div className="min-h-screen flex items-center justify-center bg-black/60 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            {businessName || 'Bienvenido'}
          </h1>
          <p className="text-colibri-beige">Inicia sesión para continuar</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Iniciar Sesión
              {roleParam && (
                <span className="text-lg block mt-2 text-colibri-gold">
                  {roleParam === 'admin' && '👨‍💼 Admin'}
                  {roleParam === 'cajero' && '💰 Cajero'}
                  {roleParam === 'mesero' && '🍽️ Mesero'}
                  {roleParam === 'driver' && '🚚 Repartidor'}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-center text-colibri-gold">
              {roleParam 
                ? 'Credenciales pre-cargadas, haz clic en Iniciar Sesión'
                : 'Ingresa a tu cuenta para ordenar'
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-colibri-gold" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-gold/70"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-colibri-gold" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-gold/70"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-colibri-gold hover:text-white"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-colibri-green hover:bg-colibri-green/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              {/* Botones de acceso rápido por rol */}
              {!roleParam && (
                <div className="w-full pt-4 border-t border-white/20">
                  <p className="text-center text-white text-sm mb-3">🎯 Acceso Rápido Demo</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-colibri-wine/50 text-colibri-wine hover:bg-colibri-wine hover:text-white text-xs"
                      onClick={() => {
                        setEmail('admin@supernova.com')
                        setPassword('admin123')
                      }}
                    >
                      👨‍💼 Admin
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-colibri-green/50 text-colibri-green hover:bg-colibri-green hover:text-white text-xs"
                      onClick={() => {
                        setEmail('cajero@supernova.com')
                        setPassword('admin123')
                      }}
                    >
                      💰 Cajero
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-colibri-gold/50 text-colibri-gold hover:bg-colibri-gold hover:text-white text-xs"
                      onClick={() => {
                        setEmail('mesero@supernova.com')
                        setPassword('admin123')
                      }}
                    >
                      🍽️ Mesero
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-colibri-wine/50 text-colibri-wine hover:bg-colibri-wine hover:text-white text-xs"
                      onClick={() => {
                        setEmail('driver@supernova.com')
                        setPassword('admin123')
                      }}
                    >
                      🚚 Repartidor
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-500 hover:text-white text-xs col-span-2"
                      onClick={() => {
                        setEmail('cliente@supernova.com')
                        setPassword('admin123')
                      }}
                    >
                      🛒 Usuario Demo
                    </Button>
                  </div>
                  <p className="text-center text-white/60 text-xs mt-2">
                    Haz clic en un rol y luego en "Iniciar Sesión"
                  </p>
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-colibri-beige text-sm">
                  ¿No tienes una cuenta?{' '}
                  <Link
                    href="/register"
                    className="text-colibri-gold hover:text-white underline"
                  >
                    Regístrate aquí
                  </Link>
                </p>
                
                <Link
                  href="/"
                  className="text-colibri-gold hover:text-white text-sm underline"
                >
                  Volver al inicio
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>


      </div>
    </div>
  )
}