"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, Clock, MapPin, CreditCard, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Cargar Confetti dinámicamente solo en el cliente
const Confetti = dynamic(() => import("react-confetti"), { ssr: false })

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Múltiples métodos para obtener los parámetros
  const orderId = searchParams.get("orderId")
  const paymentMethod = searchParams.get("payment")
  const status = searchParams.get("status")
  
  // Método alternativo usando window.location
  const [urlParams, setUrlParams] = useState<{orderId?: string, payment?: string, status?: string}>({})
  
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    console.log('🎉 Thank You Page cargada')
    console.log('📋 orderId desde params:', orderId)
    console.log('� tipo de orderId:', typeof orderId)
    console.log('📋 orderId length:', orderId?.length)
    console.log('�💳 paymentMethod:', paymentMethod)
    console.log('📊 status:', status)
    console.log('🔍 searchParams completos:', Object.fromEntries(searchParams.entries()))
    console.log('🔍 URL actual:', window.location.href)
    
    // Si no hay orderId, esperar un momento antes de redirigir para debug
    if (!orderId || orderId === '' || orderId === 'undefined' || orderId === 'null') {
      console.error('❌ No hay orderId válido, orderId recibido:', orderId)
      console.error('🕐 Esperando 3 segundos antes de redirigir para debug...')
      
      // Esperar 3 segundos para poder ver los logs
      setTimeout(() => {
        console.error('🔄 Redirigiendo al menú por falta de orderId')
        router.push("/menu")
      }, 3000)
      return
    }

    console.log('✅ Thank You Page inicializada correctamente con orderId:', orderId)
    console.log('⏰ Iniciando timer de confetti por 5 segundos...')

    // Configurar tamaño de ventana
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)

    // Ocultar confetti después de 5 segundos
    const timer = setTimeout(() => {
      console.log('🎊 Ocultando confetti')
      setShowConfetti(false)
    }, 5000)

    return () => {
      console.log('🧹 Cleanup de Thank You Page')
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [orderId, router])

  if (!orderId) {
    return null
  }

  const isPaid = paymentMethod === "mercadopago" && status === "success"
  const isPending = paymentMethod === "mercadopago" && status === "pending"
  const isCash = paymentMethod === "efectivo"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 py-12">
      {showConfetti && windowSize.width > 0 && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false} 
          numberOfPieces={500} 
        />
      )}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-purple-200 text-lg">
            Gracias por tu orden galáctica 🚀
          </p>
        </div>

        {/* Order Info Card */}
        <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-purple-300 text-sm mb-2">Número de pedido</p>
              <p className="text-4xl font-bold text-white">#{orderId}</p>
            </div>

            {/* Payment Status */}
            {isPaid && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 text-green-400 mr-3" />
                <div>
                  <p className="text-green-400 font-semibold">Pago confirmado</p>
                  <p className="text-green-300 text-sm">Tu pago con tarjeta fue procesado exitosamente</p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6 flex items-center">
                <Clock className="w-6 h-6 text-yellow-400 mr-3" />
                <div>
                  <p className="text-yellow-400 font-semibold">Pago pendiente</p>
                  <p className="text-yellow-300 text-sm">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
                </div>
              </div>
            )}

            {isCash && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6 flex items-center">
                <Package className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <p className="text-blue-400 font-semibold">Pago en efectivo</p>
                  <p className="text-blue-300 text-sm">Prepara el monto exacto para cuando llegue tu pedido</p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg mb-3">¿Qué sigue?</h3>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Confirmación de pedido</p>
                  <p className="text-purple-300 text-sm">Recibirás un mensaje de confirmación por WhatsApp</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Preparación</p>
                  <p className="text-purple-300 text-sm">Nuestro equipo comenzará a preparar tu orden</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Entrega</p>
                  <p className="text-purple-300 text-sm">Podrás rastrear tu pedido en tiempo real cuando esté en camino</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href={`/orders/${orderId}`} className="block">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Package className="w-4 h-4 mr-2" />
              Ver mi pedido
            </Button>
          </Link>

          <Link href="/orders" className="block">
            <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-600/20">
              <Clock className="w-4 h-4 mr-2" />
              Mis pedidos
            </Button>
          </Link>

          <Link href="/menu" className="block">
            <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-600/20">
              <Truck className="w-4 h-4 mr-2" />
              Seguir ordenando
            </Button>
          </Link>
        </div>

        {/* Tracking Info */}
        <Card className="backdrop-blur-sm bg-white/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-purple-400 mr-2" />
              <h3 className="text-white font-semibold">Seguimiento en tiempo real</h3>
            </div>
            <p className="text-purple-300 text-sm mb-3">
              Cuando tu pedido esté en camino, podrás ver la ubicación de tu repartidor en vivo y saber exactamente cuándo llegará.
            </p>
            <p className="text-purple-400 text-xs">
              💡 Tip: Guarda esta página o revisa tu email para el enlace de seguimiento
            </p>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-purple-300 text-sm">
            ¿Necesitas ayuda? Contáctanos por{" "}
            <a href="https://wa.me/5214426783827" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
