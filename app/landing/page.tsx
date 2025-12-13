"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Zap,
  TrendingUp,
  Users,
  ShoppingCart,
  Smartphone,
  Truck,
  CreditCard,
  BarChart3,
  Clock,
  Receipt,
  Utensils,
  QrCode,
  Printer,
  ChefHat,
  DollarSign,
  Target,
  Sparkles,
  ArrowRight,
  Star,
  Shield,
  Wifi,
  Cloud,
  MessageSquare,
  PlayCircle,
  ExternalLink,
  Gift,
  Calculator,
} from "lucide-react"

export default function LandingPage() {
  // Cotizador state
  const [selectedCentral, setSelectedCentral] = useState<"renta" | "compra" | null>(null)
  const [selectedKiosko, setSelectedKiosko] = useState<"renta" | "compra" | null>(null)
  const [selectedCocina, setSelectedCocina] = useState<"impresora" | "display" | "hibrida" | null>(null)
  const [includeDelivery, setIncludeDelivery] = useState(false)
  const [includeDashboard, setIncludeDashboard] = useState(false)

  const calculateQuote = () => {
    let inicio = 0
    let mensual = 0

    // Módulo Central (REQUERIDO)
    if (selectedCentral === "renta") {
      inicio += 3900
      mensual += 1290
    } else if (selectedCentral === "compra") {
      inicio += 12900
      mensual += 590
    }

    // Módulo Kiosko
    if (selectedKiosko === "renta") {
      inicio += 4900
      mensual += 1690
    } else if (selectedKiosko === "compra") {
      inicio += 16900
      mensual += 690
    }

    // Módulo Cocina
    if (selectedCocina === "impresora") {
      inicio += 900
      mensual += 350
    } else if (selectedCocina === "display") {
      inicio += 2900
      mensual += 890
    } else if (selectedCocina === "hibrida") {
      inicio += 3500
      mensual += 1190
    }

    // Software adicional
    if (includeDelivery) mensual += 990
    if (includeDashboard) mensual += 690

    return { inicio, mensual }
  }

  const quote = calculateQuote()
  const hasSelection = selectedCentral !== null

  const features = [
    {
      icon: ShoppingCart,
      title: "Sistema POS Completo",
      description: "Terminal punto de venta profesional con gestión de productos, categorías, modificadores y inventario en tiempo real.",
      highlight: "Control total",
    },
    {
      icon: Utensils,
      title: "Gestión de Mesas",
      description: "Administra tu comedor con sistema de mesas interactivo. Asignación de meseros, división de cuentas y cierre automático.",
      highlight: "Para restaurantes",
    },
    {
      icon: Truck,
      title: "Delivery Integrado",
      description: "Sistema completo de pedidos a domicilio con tracking GPS en tiempo real, asignación automática de repartidores y gestión de zonas.",
      highlight: "Aumenta ventas 40%",
    },
    {
      icon: QrCode,
      title: "Menú Digital QR",
      description: "Tus clientes ordenan desde su celular escaneando QR. Sin apps, sin contacto, sin errores. Actualizaciones instantáneas.",
      highlight: "Sin meseros",
    },
    {
      icon: Smartphone,
      title: "Kiosko de Autoservicio",
      description: "Pantalla táctil para que clientes ordenen directamente. Reduce tiempos de espera y aumenta ticket promedio 30%.",
      highlight: "Más ventas",
    },
    {
      icon: CreditCard,
      title: "Múltiples Métodos de Pago",
      description: "Efectivo, tarjetas, transferencias y MercadoPago integrado. Cobra como quieras, donde quieras.",
      highlight: "Todo incluido",
    },
    {
      icon: Receipt,
      title: "Turnos de Caja",
      description: "Control exhaustivo de apertura y cierre de caja. Arqueos automáticos, reportes de diferencias y cuadre perfecto.",
      highlight: "Cero errores",
    },
    {
      icon: BarChart3,
      title: "Reportes Avanzados",
      description: "Analítica en tiempo real: ventas, productos más vendidos, horarios pico, desempeño de meseros y mucho más.",
      highlight: "Data que vende",
    },
    {
      icon: Printer,
      title: "Impresión Automática",
      description: "Comandas a cocina por USB, red o Bluetooth. Separa por estaciones: grill, fríos, bar. Cero confusión.",
      highlight: "Cocina ordenada",
    },
    {
      icon: Users,
      title: "Multi-Usuario con Roles",
      description: "Admin, cajeros, meseros, cocineros, repartidores. Cada uno ve y hace solo lo que debe. Seguridad total.",
      highlight: "Control empresarial",
    },
    {
      icon: ChefHat,
      title: "Modificadores Ilimitados",
      description: "Extras, tamaños, ingredientes, personalizaciones. Todo lo que tus clientes pidan, el sistema lo maneja.",
      highlight: "Sin límites",
    },
    {
      icon: Cloud,
      title: "100% En La Nube",
      description: "Accede desde cualquier dispositivo, en cualquier lugar. Backups automáticos. Nunca pierdes información.",
      highlight: "Siempre disponible",
    },
  ]

  const benefits = [
    {
      metric: "$15,000",
      label: "En bonos incluidos",
      description: "Ingeniería + Capacitación + Renovación",
    },
    {
      metric: "< 24h",
      label: "Garantía de reemplazo",
      description: "O tu mensualidad es gratis",
    },
    {
      metric: "+20%",
      label: "Ticket promedio",
      description: "Con kiosko o devolvemos tu dinero",
    },
    {
      metric: "$60K",
      label: "Ahorras en hardware",
      description: "Sin descapitalizar tu negocio",
    },
  ]

  const testimonials = [
    {
      name: "Carlos Mendoza",
      business: "Tacos El Patrón - CDMX",
      image: "/testimonial-1.jpg",
      quote: "En 2 meses recuperamos la inversión. El delivery integrado y el kiosko nos permitieron atender 3x más pedidos en hora pico. Nuestras ventas subieron 45% sin contratar más personal.",
      rating: 5,
    },
    {
      name: "Ana García",
      business: "Café La Esquina - Guadalajara",
      image: "/testimonial-2.jpg",
      quote: "El menú QR y el sistema de mesas nos cambió la vida. Los clientes piden desde su mesa y todo llega directo a cocina. Cero errores, cero papelitos. El ticket promedio subió 30%.",
      rating: 5,
    },
    {
      name: "Roberto Silva",
      business: "Wings & Beer - Monterrey",
      image: "/testimonial-3.jpg",
      quote: "Los reportes son increíbles. Ahora sé qué producto vende más, en qué horario y cuánto gano realmente. Optimizamos el menú y eliminamos lo que no servía. Rentabilidad +35%.",
      rating: 5,
    },
  ]

  const pricing = {
    monthly: {
      basico: { price: 1290, label: "mensual", setup: 3900 },
      profesional: { price: 3330, label: "mensual", setup: 9700 },
      empresarial: { price: 5310, label: "mensual", setup: 13200 },
    },
    annual: {
      basico: { price: 1290, label: "mensual", setup: 3900, total: 15480 },
      profesional: { price: 3330, label: "mensual", setup: 9700, total: 39960 },
      empresarial: { price: 5310, label: "mensual", setup: 13200, total: 63720 },
    },
  }

  const plans = [
    {
      name: "Básico",
      description: "Estación Central (Renta)",
      color: "from-colibri-green to-colibri-gold",
      features: [
        "🖥️ Mini PC i5 + Monitor Touch 16.1\"",
        "📋 Licencia de Software Ilimitada",
        "🎨 Ingeniería de Menú ($6,000 incluido)",
        "🎓 Capacitación Completa ($5,000 incluido)",
        "🔄 Renovación Tecnológica ($4,000 incluido)",
        "⚡ Garantía: Reemplazo &lt; 24h o paga cero",
        "🛡️ Protección total sin límites",
        "🔧 Soporte técnico prioritario",
        "📊 Sistema POS completo",
        "🍽️ Gestión de productos y mesas",
      ],
      popular: false,
      setupFee: "$3,900 MXN único",
      bonuses: "$15,000 MXN en bonos incluidos",
    },
    {
      name: "Profesional",
      description: "Central + Kiosko + Cocina",
      color: "from-colibri-wine to-colibri-green",
      features: [
        "✅ Todo en Básico +",
        "📱 Kiosko Auto-Servicio Touch",
        "🎯 Garantía +20% ticket o dinero de vuelta",
        "🖨️ Impresora o Kitchen Display",
        "🚚 Delivery Propio + QR en Mesa ($990/mes)",
        "⚡ Venta sugestiva automática",
        "📈 Aumenta ventas sin presión humana",
        "🔄 3 módulos de hardware incluidos",
        "👥 Usuarios ilimitados",
        "📊 Reportes avanzados en tiempo real",
        "💳 MercadoPago integrado",
        "🎁 Bonos totales: $15,000 + garantías",
      ],
      popular: true,
      setupFee: "$9,700 MXN único",
      bonuses: "Incluye todos los bonos + garantía de ticket",
    },
    {
      name: "Empresarial",
      description: "Solución completa multi-sucursal",
      color: "from-colibri-gold to-colibri-wine",
      features: [
        "✅ Todo en Profesional +",
        "🏢 Dashboard CEO Multi-Sucursal ($690/mes)",
        "📊 Control total desde un solo lugar",
        "🔍 Decisiones basadas en datos",
        "📈 Información consolidada al instante",
        "🔄 Módulos ilimitados",
        "👥 Equipo completo capacitado",
        "🎯 Gerente de cuenta dedicado",
        "⚡ Soporte 24/7 prioritario",
        "🛡️ Todas las garantías premium",
        "🔧 Personalización avanzada",
        "💼 Ideal para cadenas y franquicias",
      ],
      popular: false,
      setupFee: "$13,200 MXN único",
      bonuses: "Máximo valor + soporte empresarial",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-colibri-beige/30 to-white">
      {/* Hero Section */}
      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url(/resta.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-colibri-green/95 via-colibri-wine/90 to-colibri-gold/85" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/logo-colibri.png"
                alt="Colibrí-REST"
                width={120}
                height={120}
                className="drop-shadow-2xl animate-float"
              />
            </div>

            {/* Badge */}
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-sm px-4 py-2 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Sistema #1 para restaurantes en México
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Reinventamos Tu Restaurante
              <br />
              <span className="text-colibri-beige">Con Tecnología Que Funciona</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Cada pedido fluye sin esfuerzo. Cada mesa atendida con precisión. Cada decisión respaldada por datos.
              <br />
              <span className="font-semibold text-colibri-beige">Elige entre Renta con garantía total o Compra para máxima flexibilidad fiscal.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="bg-white text-colibri-green hover:bg-colibri-beige text-lg px-8 py-6 shadow-2xl"
              >
                <Link href="#pricing">
                  <Zap className="w-5 h-5 mr-2" />
                  Ver Planes y Precios
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm"
              >
                <Link href="#demo">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Ver Demo en Vivo
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Hosting seguro en México</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>4.9/5 en Google</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>+300 restaurantes confían en nosotros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight className="w-8 h-8 text-white rotate-90" />
        </div>
      </div>

      {/* Demo Section */}
      <section className="py-20 bg-white" id="demo">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-wine/10 text-colibri-wine border-colibri-wine/20">
              <PlayCircle className="w-4 h-4 mr-2 inline" />
              Prueba el Sistema
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-colibri-green mb-4">
              Experimenta Colibrí-REST en Acción
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              No necesitas registrarte. Inicia sesión con cualquiera de nuestros usuarios demo y explora todo el sistema.
              <br />
              <span className="font-semibold text-colibri-wine">100% funcional con datos reales.</span>
            </p>

            <div className="flex flex-col items-center gap-6">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white text-2xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-colibri-wine/50 transition-all hover:scale-105">
                  <PlayCircle className="w-8 h-8 mr-3" />
                  INICIAR DEMO
                </Button>
              </Link>
              
              <div className="bg-colibri-beige/30 rounded-xl p-6 max-w-2xl">
                <p className="text-sm text-gray-600 mb-4 font-semibold">👥 Usuarios disponibles para probar:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-colibri-wine/20">
                    <p className="font-bold text-colibri-green">👨‍💼 Admin</p>
                    <p className="text-xs text-gray-500">Panel completo</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-colibri-green/20">
                    <p className="font-bold text-colibri-green">💰 Cajero</p>
                    <p className="text-xs text-gray-500">Punto de venta</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-colibri-gold/20">
                    <p className="font-bold text-colibri-green">🍽️ Mesero</p>
                    <p className="text-xs text-gray-500">Gestión mesas</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-colibri-wine/20">
                    <p className="font-bold text-colibri-green">🚚 Repartidor</p>
                    <p className="text-xs text-gray-500">Delivery</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  🔐 Selecciona tu rol en la página de login y las credenciales se cargarán automáticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-wine/10 text-colibri-wine border-colibri-wine/20">
              <Target className="w-4 h-4 mr-2 inline" />
              Resultados Reales
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-colibri-green mb-4">
              Los Números No Mienten
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Esto es lo que logran nuestros clientes en promedio durante los primeros 90 días
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="p-8 text-center glass-effect border-colibri-gold/30 hover:shadow-colibri-green/50 transition-all duration-300"
              >
                <div className="text-5xl font-bold text-colibri-wine mb-2">{benefit.metric}</div>
                <div className="text-lg font-semibold text-colibri-green mb-2">{benefit.label}</div>
                <div className="text-sm text-gray-600">{benefit.description}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-colibri-beige/20 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-green/10 text-colibri-green border-colibri-green/20">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Todo Incluido
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-colibri-green mb-4">
              12 Sistemas En Uno Solo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No necesitas contratar 10 proveedores diferentes. Colibrí-REST lo tiene TODO.
              <br />Y cada módulo habla con los demás en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="p-6 glass-effect border-colibri-gold/30 hover:shadow-colibri-green/50 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-colibri-green to-colibri-wine rounded-xl text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-2 bg-colibri-wine/10 text-colibri-wine text-xs border-0">
                        {feature.highlight}
                      </Badge>
                      <h3 className="text-xl font-bold text-colibri-green mb-2">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-wine/10 text-colibri-wine border-colibri-wine/20">
              <MessageSquare className="w-4 h-4 mr-2 inline" />
              Testimonios
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-colibri-green mb-4">
              Ellos Ya Lo Están Usando
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Y están ganando más dinero, con menos estrés, y clientes más felices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 glass-effect border-colibri-gold/30 hover:shadow-colibri-green/50 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-colibri-green to-colibri-wine rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-colibri-green">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.business}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Inversión Section */}
      <section className="py-20 bg-gradient-to-b from-colibri-beige/20 to-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-green/10 text-colibri-green border-colibri-green/20">
              <Gift className="w-4 h-4 mr-2 inline" />
              Tu Inversión
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-colibri-green mb-4">
              Una Oferta Imposible de Rechazar
            </h2>
          </div>

          {/* Valor vs Inversión */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 text-center bg-gradient-to-br from-colibri-green/10 to-colibri-wine/10 border-colibri-green/30">
                <div className="text-sm text-colibri-wine mb-2">Valor Total de los Bonos</div>
                <div className="text-5xl font-bold text-colibri-green mb-2">$15,000</div>
                <div className="text-sm text-gray-600">MXN</div>
                <div className="text-xs text-gray-500 mt-2">Ingeniería + Capacitación + Renovación Programada</div>
              </Card>

              <Card className="p-8 text-center bg-gradient-to-br from-colibri-wine/10 to-colibri-gold/10 border-colibri-wine/30">
                <div className="text-sm text-colibri-wine mb-2">Tu Inversión Real</div>
                <div className="text-5xl font-bold text-colibri-wine mb-2">$3,900</div>
                <div className="text-sm text-gray-600">MXN</div>
                <div className="text-xs text-gray-500 mt-2">Setup Fee Único</div>
              </Card>

              <Card className="p-8 text-center bg-gradient-to-br from-colibri-gold/10 to-colibri-green/10 border-colibri-gold/30">
                <div className="text-sm text-colibri-wine mb-2">Desde</div>
                <div className="text-5xl font-bold text-colibri-wine mb-2">$1,290</div>
                <div className="text-sm text-gray-600">/mes + IVA</div>
                <div className="text-xs text-gray-500 mt-2">Módulo Estación Central (Renta)</div>
              </Card>
            </div>

            <Card className="mt-8 p-8 bg-gradient-to-r from-colibri-green/5 to-colibri-wine/5 border-colibri-green/30">
              <div className="text-center mb-4">
                <Gift className="w-8 h-8 text-colibri-wine mx-auto mb-2" />
                <h3 className="text-xl font-bold text-colibri-green mb-2">🎁 Lo que obtienes HOY:</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span>Ingeniería de Menú Profesional ($6,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span>Capacitación Hands-On Completa ($5,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span>Garantía de Renovación Tecnológica ($4,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span>Garantía Triple de Continuidad O Paga Cero</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span>Soporte VIP 24/7 con Prioridad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-colibri-green shrink-0" />
                  <span><strong>Ahorro Real:</strong> Evitas descapitalizar $60K-$80K MXN</span>
                </div>
              </div>
              <div className="text-center mt-6">
                <p className="text-xs text-gray-500 mb-4">en hardware obsoleto que perderá valor en 24 meses</p>
                <Button className="bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white">
                  ¡Quiero Obtener $15,000 en Valor por Solo $3,900!
                </Button>
              </div>
            </Card>
          </div>

          {/* Garantía de Desempeño */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="p-10 bg-gradient-to-br from-colibri-wine/10 to-colibri-green/10 border-colibri-wine/30">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-colibri-wine text-white">
                  <Target className="w-4 h-4 mr-2 inline" />
                  Garantía de Desempeño
                </Badge>
                <h3 className="text-3xl font-bold text-colibri-green mb-4">
                  Garantía de Aumento de Ticket Promedio
                </h3>
                <p className="text-lg text-gray-600">(Módulo Kiosko)</p>
              </div>

              <div className="bg-white rounded-xl p-6 mb-6">
                <p className="text-center text-lg text-gray-700 mb-4">
                  Si después de <strong className="text-colibri-wine">90 días</strong> usando el Kiosko, tu ticket promedio no se incrementa...
                </p>
                <p className="text-center text-xl font-bold text-colibri-wine">
                  Te devolvemos la Cuota de Instalación del Kiosko y te regalamos los primeros 3 meses de licencia
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-colibri-wine shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-colibri-green mb-1">🎯 Venta Sugestiva Automática</h4>
                    <p className="text-sm text-gray-600">El kiosko sugiere complementos, upgrades y promociones en el momento exacto. Aumenta ventas sin presión humana.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-colibri-wine shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-colibri-green mb-1">💎 Objetivo: +20% en Ticket Promedio</h4>
                    <p className="text-sm text-gray-600">Basado en datos reales de restaurantes similares. Si no lo logras en 90 días, recuperas tu inversión.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Cotizador Personalizado */}
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-colibri-gold/10 text-colibri-wine border-colibri-gold/30">
                <Calculator className="w-4 h-4 mr-2 inline" />
                Cotizador Personalizado
              </Badge>
              <h2 className="text-4xl font-bold text-colibri-green mb-4">
                🧮 Arma Tu Solución Ideal
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Selecciona los módulos que necesitas y obtén tu cotización personalizada al instante. Envíala directamente a WhatsApp con todos los detalles.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Módulo 1: Estación Central */}
              <div className="lg:col-span-3">
                <Card className="p-8 bg-gradient-to-br from-colibri-green/5 to-white border-colibri-green/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-colibri-green mb-2">Módulo 1: Estación Central (Caja)</h3>
                      <p className="text-sm text-gray-600">Mini PC i5 + Monitor Touch 16.1" + Licencia Ilimitada</p>
                      <Badge className="mt-2 bg-colibri-wine text-white">REQUERIDO</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedCentral === "renta"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedCentral("renta")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Renta Todo Incluido</h4>
                          <p className="text-xs text-gray-500">Protección total sin límites</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCentral === "renta" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedCentral === "renta" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-3xl font-bold text-colibri-wine">$3,900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$1,290 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Equipo nuevo si falla</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Tranquilidad absoluta</li>
                      </ul>
                    </Card>

                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedCentral === "compra"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedCentral("compra")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Compra Inteligente</h4>
                          <p className="text-xs text-gray-500">Deducible fiscalmente</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCentral === "compra" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedCentral === "compra" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-3xl font-bold text-colibri-wine">$12,900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$590 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Activo de tu empresa</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Libertad total</li>
                      </ul>
                    </Card>
                  </div>
                </Card>
              </div>

              {/* Módulo 2: Kiosko */}
              <div className="lg:col-span-3">
                <Card className="p-8 bg-gradient-to-br from-colibri-wine/5 to-white border-colibri-wine/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-colibri-green mb-2">Módulo 2: Kiosko Auto-Servicio</h3>
                      <p className="text-sm text-gray-600">Pantalla Touch 21.5" + Venta Sugestiva + Garantía +20% Ticket</p>
                      <Badge className="mt-2 bg-colibri-gold text-colibri-wine">OPCIONAL</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedKiosko === "renta"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedKiosko(selectedKiosko === "renta" ? null : "renta")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Renta Todo Incluido</h4>
                          <p className="text-xs text-gray-500">Instalado y listo</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedKiosko === "renta" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedKiosko === "renta" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-3xl font-bold text-colibri-wine">$4,900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$1,690 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Seguridad garantizada</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Sin complicaciones</li>
                      </ul>
                    </Card>

                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedKiosko === "compra"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedKiosko(selectedKiosko === "compra" ? null : "compra")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Compra Inteligente</h4>
                          <p className="text-xs text-gray-500">Ventas automáticas 24/7</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedKiosko === "compra" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedKiosko === "compra" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-3xl font-bold text-colibri-wine">$16,900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$690 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Incrementa ticket promedio</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Inversión que se paga sola</li>
                      </ul>
                    </Card>
                  </div>
                </Card>
              </div>

              {/* Módulo 3: Cocina */}
              <div className="lg:col-span-3">
                <Card className="p-8 bg-gradient-to-br from-colibri-gold/5 to-white border-colibri-gold/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-colibri-green mb-2">Módulo 3: Gestión de Cocina</h3>
                      <p className="text-sm text-gray-600">Impresora Térmica, Kitchen Display o Estación Híbrida</p>
                      <Badge className="mt-2 bg-colibri-gold text-colibri-wine">OPCIONAL</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedCocina === "impresora"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedCocina(selectedCocina === "impresora" ? null : "impresora")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Impresora Esencial</h4>
                          <p className="text-xs text-gray-500">Confiable y probada</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCocina === "impresora" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedCocina === "impresora" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-2xl font-bold text-colibri-wine">$900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xl font-bold text-colibri-green">$350 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> Perfecta para empezar</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> Cero curva de aprendizaje</li>
                      </ul>
                    </Card>

                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedCocina === "display"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedCocina(selectedCocina === "display" ? null : "display")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Kitchen Display Digital</h4>
                          <p className="text-xs text-gray-500">Cocina sin papel</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCocina === "display" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedCocina === "display" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-2xl font-bold text-colibri-wine">$2,900 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xl font-bold text-colibri-green">$890 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> Todo visible en pantalla</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> Velocidad incomparable</li>
                      </ul>
                    </Card>

                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        selectedCocina === "hibrida"
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setSelectedCocina(selectedCocina === "hibrida" ? null : "hibrida")}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Estación Híbrida Pro</h4>
                          <p className="text-xs text-gray-500">Lo mejor de ambos mundos</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCocina === "hibrida" ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {selectedCocina === "hibrida" && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">Inicio:</div>
                        <div className="text-2xl font-bold text-colibri-wine">$3,500 <span className="text-sm text-gray-500">MXN</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xl font-bold text-colibri-green">$1,190 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> Flexibilidad total</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-colibri-green shrink-0" /> El favorito de los chefs</li>
                      </ul>
                    </Card>
                  </div>
                </Card>
              </div>

              {/* Módulo 4: Software Adicional */}
              <div className="lg:col-span-3">
                <Card className="p-8 bg-gradient-to-br from-colibri-beige/30 to-white border-colibri-green/30">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-colibri-green mb-2">Módulo 4: Potenciadores de Software</h3>
                    <p className="text-sm text-gray-600">Funcionalidades premium que multiplican tus ventas</p>
                    <Badge className="mt-2 bg-colibri-gold text-colibri-wine">OPCIONAL</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        includeDelivery
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setIncludeDelivery(!includeDelivery)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Delivery Propio + QR en Mesa</h4>
                          <p className="text-xs text-gray-500">Tu marca, tus clientes</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          includeDelivery ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {includeDelivery && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$990 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Adiós a las comisiones</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Pedidos desde el móvil</li>
                      </ul>
                    </Card>

                    <Card
                      className={`p-6 cursor-pointer transition-all ${
                        includeDashboard
                          ? "border-colibri-wine border-2 shadow-lg"
                          : "border-gray-300 hover:border-colibri-green"
                      }`}
                      onClick={() => setIncludeDashboard(!includeDashboard)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-colibri-green mb-1">Dashboard CEO Multi-Sucursal</h4>
                          <p className="text-xs text-gray-500">Controla todo desde un lugar</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          includeDashboard ? "border-colibri-wine bg-colibri-wine" : "border-gray-300"
                        }`}>
                          {includeDashboard && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-colibri-green">$690 <span className="text-sm text-gray-500">MXN/mes</span></div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Decisiones basadas en datos</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-colibri-green shrink-0" /> Información al instante</li>
                      </ul>
                    </Card>
                  </div>
                </Card>
              </div>

              {/* Resumen de Cotización */}
              <div className="lg:col-span-3">
                <Card className="p-8 bg-gradient-to-br from-colibri-wine/10 to-colibri-green/10 border-colibri-wine/50 shadow-2xl">
                  <div className="text-center mb-6">
                    <Calculator className="w-12 h-12 text-colibri-wine mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-colibri-green mb-2">Tu Cotización</h3>
                    {!hasSelection && (
                      <p className="text-gray-600">Selecciona al menos el Módulo Central para ver tu cotización</p>
                    )}
                  </div>

                  {hasSelection && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Cuota de Inicio</div>
                        <div className="text-5xl font-bold text-colibri-wine mb-2">
                          ${quote.inicio.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">MXN</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Pago Mensual</div>
                        <div className="text-5xl font-bold text-colibri-green mb-2">
                          ${quote.mensual.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">MXN</div>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-600 mb-4">
                      Incluye bonos por valor de <strong className="text-colibri-wine">$15,000 MXN</strong>
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                      *Precios + IVA. Incluye ingeniería de menú, instalación premium y capacitación total.
                    </p>
                    <Button
                      disabled={!hasSelection}
                      className="bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white text-lg px-8 py-6 disabled:opacity-50"
                      onClick={() => {
                        const mensaje = `¡Hola! Me interesa Colibrí-REST con:\n\n${selectedCentral ? `✅ Estación Central (${selectedCentral})\n` : ""}${selectedKiosko ? `✅ Kiosko (${selectedKiosko})\n` : ""}${selectedCocina ? `✅ Cocina (${selectedCocina})\n` : ""}${includeDelivery ? "✅ Delivery + QR\n" : ""}${includeDashboard ? "✅ Dashboard CEO\n" : ""}\n💰 Inversión inicial: $${quote.inicio.toLocaleString()} MXN\n💳 Mensualidad: $${quote.mensual.toLocaleString()} MXN\n\n¿Pueden enviarme más información?`
                        window.open(`https://wa.me/5215512345678?text=${encodeURIComponent(mensaje)}`, "_blank")
                      }}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Enviar Cotización por WhatsApp
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: "url(/resta.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-colibri-green/95 via-colibri-wine/90 to-colibri-gold/95" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              ¿Listo Para Transformar Tu Restaurante?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Más de $15,000 MXN en bonos incluidos. Garantía de reemplazo en 24h o paga cero ese mes.
              <br />
              <span className="font-semibold text-colibri-beige">Renta desde $1,290/mes o compra con deducción fiscal completa.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-white text-colibri-green hover:bg-colibri-beige text-lg px-8 py-6 shadow-2xl">
                <Link href="#pricing">
                  <Zap className="w-5 h-5 mr-2" />
                  Ver Planes Completos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm"
              >
                <Link href="#demo">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contactar Ventas
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>$15,000 en bonos incluidos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Garantía {"<"} 24h o paga cero</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Soporte premium 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Renta o compra, tú decides</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-colibri-green text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo-colibri.png" alt="Colibrí-REST" width={40} height={40} />
                <span className="font-bold text-xl">Colibrí-REST</span>
              </div>
              <p className="text-white/80 text-sm">
                El sistema completo para restaurantes que quieren vender más y trabajar menos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2025 Colibrí-REST. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
