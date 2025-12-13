import { Suspense } from "react"
import Link from "next/link"
import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 py-12 relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-[url('/cosmic-background.png')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        <div className="absolute top-16 right-16 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 left-16 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 right-1/4 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute top-48 left-1/3 w-1 h-1 bg-pink-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/supernova-logo.png" alt="Supernova Burgers & Wings" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Únete a la Galaxia
          </h1>
          <p className="text-lg text-gray-300">Crea tu cuenta y descubre hamburguesas de otro mundo</p>
          <div className="mt-2 text-sm text-colibri-gold">✨ Regístrate en el sistema de gestión para restaurantes</div>
        </div>

        <Suspense
          fallback={
            <div className="max-w-md mx-auto p-8 bg-black/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-800/50 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-colibri-green mt-4">Preparando tu cuenta...</p>
            </div>
          }
        >
          <RegisterForm />
        </Suspense>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-colibri-green hover:text-colibri-gold hover:underline transition-colors duration-300"
          >
            <span className="mr-2">🌌</span>
            Volver al universo principal
          </Link>
        </div>

        {/* Benefits section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-800/30">
              <div className="text-2xl mb-2">🍔</div>
              <h3 className="text-purple-300 font-semibold">Hamburguesas Cósmicas</h3>
              <p className="text-gray-400 text-sm">Sabores de otra galaxia</p>
            </div>
            <div className="p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-800/30">
              <div className="text-2xl mb-2">🍗</div>
              <h3 className="text-purple-300 font-semibold">Alitas Estelares</h3>
              <p className="text-gray-400 text-sm">Crujientes como meteoritos</p>
            </div>
            <div className="p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-800/30">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-purple-300 font-semibold">Entrega Rápida</h3>
              <p className="text-gray-400 text-sm">A la velocidad de la luz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
