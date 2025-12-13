'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const router = useRouter()
  const toast = useToast()

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos')
      return false
    }

    if (name.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return false
    }

    if (!email.includes('@')) {
      setError('Por favor, ingresa un email válido')
      return false
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await register(name, email, password)
      
      if (result.success) {
        toast.success('¡Cuenta creada!', 'Tu cuenta ha sido creada exitosamente')
        router.push('/login')
      } else {
        setError(result.message || 'Error al crear la cuenta')
      }
    } catch (error) {
      console.error('Error de registro:', error)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-colibri-green via-colibri-wine to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Supernova Burgers
          </h1>
          <p className="text-colibri-beige">Únete a nuestro universo gastronómico</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-center text-colibri-gold">
              Regístrate para comenzar a ordenar
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
                <Label htmlFor="name" className="text-white">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-colibri-gold" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

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
                    className="pl-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige"
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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-colibri-gold" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-colibri-gold hover:text-white"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs text-colibri-gold/80 space-y-1">
                <p>• La contraseña debe tener al menos 6 caracteres</p>
                <p>• Usa una combinación de letras y números</p>
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
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-colibri-gold text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    href="/login"
                    className="text-colibri-beige hover:text-white underline"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
                
                <Link
                  href="/"
                  className="text-colibri-beige hover:text-white text-sm underline"
                >
                  Volver al inicio
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Terms and conditions */}
        <Card className="backdrop-blur-sm bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <p className="text-blue-100 text-xs text-center">
              Al crear una cuenta, aceptas nuestros{' '}
              <Link href="/tos" className="underline hover:text-white">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link href="/privacy" className="underline hover:text-white">
                Política de Privacidad
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}