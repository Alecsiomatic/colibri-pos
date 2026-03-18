"use client"

import { useState, useEffect, useRef } from "react"
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
  Cloud,
  MessageSquare,
  PlayCircle,
  ArrowRight,
  Star,
  Shield,
  Sparkles,
  Gift,
  Phone,
  MonitorSmartphone,
  Layers,
  MousePointerClick,
} from "lucide-react"

// ── Hook: Intersection Observer for scroll animations ──
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

// ── Animated Counter ──
function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 2000,
}: {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView()

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// ── Floating Particles Background ──
function ParticlesBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${3 + (i % 5)}px`,
            height: `${3 + (i % 5)}px`,
            left: `${(i * 5.3) % 100}%`,
            top: `${(i * 7.1) % 100}%`,
            animation: `float-particle ${12 + (i % 8)}s linear infinite`,
            animationDelay: `${(i * 0.7) % 5}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Feature Card with hover animation ──
function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  highlight: string
  delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="group relative h-full p-6 bg-white/80 backdrop-blur-sm border border-colibri-gold/20 hover:border-colibri-green/50 hover:shadow-2xl hover:shadow-colibri-green/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-colibri-green/5 to-transparent rounded-bl-full transition-all duration-500 group-hover:w-48 group-hover:h-48" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-colibri-green to-colibri-wine flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <Badge className="mb-3 text-[10px] bg-colibri-green/10 text-colibri-green border-colibri-green/20">
            {highlight}
          </Badge>
          <h3 className="text-lg font-bold text-colibri-green mb-2 group-hover:text-colibri-wine transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </Card>
    </div>
  )
}

// ── Step Card Component ──
function StepCard({
  step,
  index,
}: {
  step: { number: string; title: string; description: string; icon: React.ComponentType<{ className?: string }> }
  index: number
}) {
  const { ref, inView } = useInView()
  const Ic = step.icon
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div className="relative text-center group">
        <div className="text-8xl font-black text-white/5 absolute -top-6 left-1/2 -translate-x-1/2 select-none group-hover:text-white/10 transition-colors duration-500">
          {step.number}
        </div>
        <div className="relative pt-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 border border-white/10">
            <Ic className="w-10 h-10 text-colibri-gold" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
          <p className="text-colibri-beige/70">{step.description}</p>
        </div>
        {index < 2 && (
          <div className="hidden md:block absolute top-1/3 -right-4 translate-x-1/2">
            <ArrowRight className="w-8 h-8 text-colibri-gold/30" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Demo Role Card ──
function DemoRoleCard({
  emoji,
  role,
  desc,
  color,
  delay,
}: {
  emoji: string
  role: string
  desc: string
  color: string
  delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-center text-white hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-default`}
      >
        <div className="text-3xl mb-2">{emoji}</div>
        <p className="font-bold text-sm">{role}</p>
        <p className="text-[11px] text-white/70">{desc}</p>
      </div>
    </div>
  )
}

// ── Testimonial Card ──
function TestimonialCard({
  name,
  biz,
  quote,
  stars,
  delay,
}: {
  name: string
  biz: string
  quote: string
  stars: number
  delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="h-full p-8 bg-white border border-colibri-gold/20 hover:shadow-xl hover:shadow-colibri-green/5 transition-all duration-500 hover:-translate-y-1">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="border-t border-gray-100 pt-4">
          <p className="font-bold text-colibri-green text-sm">{name}</p>
          <p className="text-xs text-gray-500">{biz}</p>
        </div>
      </Card>
    </div>
  )
}

// ── WhatsApp SVG Icon ──
const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6 mr-3 fill-current group-hover:scale-110 transition-transform"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const WhatsAppIconSmall = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 fill-white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [navVisible, setNavVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setNavVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: ShoppingCart,
      title: "Sistema POS Completo",
      description:
        "Terminal punto de venta profesional con productos, categorías, modificadores e inventario en tiempo real.",
      highlight: "Control total",
    },
    {
      icon: Utensils,
      title: "Gestión de Mesas",
      description:
        "Comedor interactivo con asignación de meseros, división de cuentas y cierre automático.",
      highlight: "Para restaurantes",
    },
    {
      icon: Truck,
      title: "Delivery Integrado",
      description:
        "Pedidos a domicilio con tracking GPS en tiempo real, asignación de repartidores y gestión de zonas.",
      highlight: "+40% ventas",
    },
    {
      icon: QrCode,
      title: "Menú Digital QR",
      description:
        "Tus clientes ordenan desde su celular escaneando QR. Sin apps, sin contacto, sin errores.",
      highlight: "Sin meseros",
    },
    {
      icon: Smartphone,
      title: "Kiosko Autoservicio",
      description:
        "Pantalla táctil para que clientes ordenen directamente. Reduce esperas y aumenta ticket promedio.",
      highlight: "+30% ticket",
    },
    {
      icon: CreditCard,
      title: "Múltiples Pagos",
      description:
        "Efectivo, tarjetas, transferencias y MercadoPago integrado. Cobra como quieras.",
      highlight: "Todo incluido",
    },
    {
      icon: Receipt,
      title: "Turnos de Caja",
      description:
        "Control de apertura/cierre de caja. Arqueos automáticos, reportes y cuadre perfecto.",
      highlight: "Cero errores",
    },
    {
      icon: BarChart3,
      title: "Reportes Avanzados",
      description:
        "Analítica en tiempo real: ventas, productos top, horarios pico, desempeño del equipo.",
      highlight: "Data que vende",
    },
    {
      icon: Printer,
      title: "Impresión Automática",
      description:
        "Comandas a cocina por USB, red o Bluetooth. Separa por estaciones: grill, fríos, bar.",
      highlight: "Cocina ordenada",
    },
    {
      icon: Users,
      title: "Multi-Usuario",
      description:
        "Admin, cajeros, meseros, cocineros, repartidores. Cada uno ve solo lo que debe.",
      highlight: "Control total",
    },
    {
      icon: ChefHat,
      title: "Modificadores",
      description:
        "Extras, tamaños, ingredientes, personalizaciones. Todo lo que tus clientes pidan.",
      highlight: "Sin límites",
    },
    {
      icon: Cloud,
      title: "100% En La Nube",
      description:
        "Accede desde cualquier dispositivo. Backups automáticos. Nunca pierdes información.",
      highlight: "Siempre activo",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Te contactamos",
      description:
        "Agenda una llamada y analizamos las necesidades de tu restaurante",
      icon: Phone,
    },
    {
      number: "02",
      title: "Configuramos todo",
      description:
        "Diseñamos tu menú digital, configuramos tu sistema y capacitamos a tu equipo",
      icon: MonitorSmartphone,
    },
    {
      number: "03",
      title: "¡A vender!",
      description:
        "Tu restaurante opera con tecnología de primer nivel desde el día 1",
      icon: Zap,
    },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Sticky Nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        <div className="bg-white/90 backdrop-blur-xl border-b border-colibri-gold/20 shadow-lg">
          <div className="container mx-auto px-4 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-colibri.png"
                alt="Colibrí-REST"
                width={36}
                height={36}
              />
              <span className="font-bold text-colibri-green text-lg">
                Colibrí-REST
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a
                href="#features"
                className="hover:text-colibri-green transition-colors"
              >
                Características
              </a>
              <a
                href="#demo"
                className="hover:text-colibri-green transition-colors"
              >
                Demo
              </a>
              <a
                href="#pricing"
                className="hover:text-colibri-green transition-colors"
              >
                Precios
              </a>
            </div>
            <a
              href="https://wa.me/5214447001387?text=Hola%2C%20me%20interesa%20Colibr%C3%AD-REST%20para%20mi%20restaurante"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="bg-gradient-to-r from-colibri-green to-colibri-wine text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Cotizar
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: "url(/resta.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-colibri-green/95 via-colibri-wine/85 to-colibri-green/90" />
        <ParticlesBackground />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo with glow */}
            <div className="flex justify-center mb-8 animate-[fadeInDown_1s_ease-out]">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-colibri-gold/30 rounded-full scale-150" />
                <Image
                  src="/logo-colibri.png"
                  alt="Colibrí-REST"
                  width={130}
                  height={130}
                  className="relative drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
              <Badge className="mb-6 bg-white/15 text-white border-white/25 text-sm px-5 py-2.5 backdrop-blur-md hover:bg-white/25 transition-colors cursor-default">
                <Sparkles className="w-4 h-4 mr-2 inline animate-pulse" />
                Sistema #1 para restaurantes en México
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
              <span className="block text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 leading-[0.95] tracking-tight">
                Reinventamos
              </span>
              <span className="block text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-[0.95] tracking-tight">
                <span className="bg-gradient-to-r from-colibri-beige via-colibri-gold to-colibri-beige bg-clip-text text-transparent">
                  Tu Restaurante
                </span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
              Cada pedido fluye sin esfuerzo. Cada mesa atendida con precisión.
              Cada decisión respaldada por datos.
              <span className="block mt-2 font-semibold text-colibri-beige">
                12 módulos. Una sola plataforma.
              </span>
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeInUp_0.8s_ease-out_0.8s_both]">
              <a
                href="https://wa.me/5214447001387?text=Hola%2C%20me%20interesa%20Colibr%C3%AD-REST%20para%20mi%20restaurante"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-white text-colibri-green hover:bg-colibri-beige text-lg px-10 py-7 shadow-2xl hover:shadow-white/25 hover:scale-105 transition-all duration-300 group"
                >
                  <MessageSquare className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Cotizar por WhatsApp
                </Button>
              </a>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/10 text-lg px-10 py-7 backdrop-blur-sm hover:border-white/70 transition-all duration-300"
              >
                <Link href="#demo">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Ver Demo en Vivo
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-6 mt-12 animate-[fadeInUp_0.8s_ease-out_1s_both]">
              {[
                { icon: Shield, text: "Hosting seguro en México", fill: false },
                { icon: Star, text: "4.9/5 en Google", fill: true },
                { icon: Users, text: "+300 restaurantes", fill: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-white/75 text-sm bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
                >
                  <item.icon
                    className={`w-4 h-4 ${item.fill ? "fill-yellow-400 text-yellow-400" : ""}`}
                  />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-10 h-16 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/80 rounded-full animate-[scrollPulse_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>

      {/* ── BENEFITS (Animated Counters) ── */}
      <section className="py-20 bg-gradient-to-b from-colibri-green to-colibri-green/95 relative overflow-hidden">
        <ParticlesBackground />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                value: 300,
                prefix: "+",
                suffix: "",
                label: "Restaurantes activos",
                icon: Utensils,
              },
              {
                value: 12,
                prefix: "",
                suffix: "",
                label: "Módulos integrados",
                icon: Layers,
              },
              {
                value: 40,
                prefix: "+",
                suffix: "%",
                label: "Aumento en ventas",
                icon: TrendingUp,
              },
              {
                value: 24,
                prefix: "<",
                suffix: "h",
                label: "Reemplazo garantizado",
                icon: Clock,
              },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500">
                  <stat.icon className="w-8 h-8 text-colibri-gold" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-white mb-1">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <p className="text-colibri-beige/80 text-sm font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (12 Systems) ── */}
      <section
        className="py-24 bg-gradient-to-b from-white to-colibri-beige/20"
        id="features"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-green/10 text-colibri-green border-colibri-green/20 text-xs">
              <Sparkles className="w-3 h-3 mr-1 inline" /> Todo Incluido
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-colibri-green mb-4 tracking-tight">
              12 Sistemas
              <br />
              <span className="bg-gradient-to-r from-colibri-wine to-colibri-green bg-clip-text text-transparent">
                En Uno Solo
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No necesitas 10 proveedores diferentes. Cada módulo habla con los
              demás en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-colibri-green relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(171,153,118,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(108,34,42,0.15),transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-colibri-beige border-white/20 text-xs">
              <MousePointerClick className="w-3 h-3 mr-1 inline" /> Así de
              fácil
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              3 Pasos Para
              <br />
              <span className="text-colibri-gold">Empezar</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO SECTION ── */}
      <section
        className="py-24 bg-gradient-to-b from-white to-colibri-beige/30"
        id="demo"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-wine/10 text-colibri-wine border-colibri-wine/20 text-xs">
              <PlayCircle className="w-3 h-3 mr-1 inline" /> Prueba gratis
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-colibri-green mb-4 tracking-tight">
              Pruébalo
              <br />
              <span className="bg-gradient-to-r from-colibri-wine to-colibri-green bg-clip-text text-transparent">
                Ahora Mismo
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sin registro. Sin tarjeta. Entra como cualquier rol y explora el
              sistema completo con datos reales.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Demo big button */}
            <div className="text-center mb-10">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white text-xl md:text-2xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-colibri-wine/30 transition-all hover:scale-105 group">
                  <PlayCircle className="w-7 h-7 mr-3 group-hover:scale-110 transition-transform" />
                  INICIAR DEMO EN VIVO
                </Button>
              </Link>
            </div>

            {/* Role cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  emoji: "👨‍💼",
                  role: "Admin",
                  desc: "Panel completo",
                  color: "from-colibri-green to-emerald-700",
                },
                {
                  emoji: "💰",
                  role: "Cajero",
                  desc: "Punto de venta",
                  color: "from-colibri-wine to-red-800",
                },
                {
                  emoji: "🍽️",
                  role: "Mesero",
                  desc: "Gestión mesas",
                  color: "from-colibri-gold to-amber-700",
                },
                {
                  emoji: "🚚",
                  role: "Repartidor",
                  desc: "Delivery GPS",
                  color: "from-blue-700 to-blue-900",
                },
                {
                  emoji: "👤",
                  role: "Cliente",
                  desc: "Pedir online",
                  color: "from-purple-700 to-purple-900",
                },
              ].map((r, i) => (
                <DemoRoleCard key={i} {...r} delay={i * 100} />
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              🔐 Selecciona tu rol en la página de login y las
              credenciales se cargarán automáticamente
            </p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-gold/10 text-colibri-wine border-colibri-gold/20 text-xs">
              <Star className="w-3 h-3 mr-1 inline fill-colibri-gold text-colibri-gold" />{" "}
              Casos reales
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-colibri-green mb-4 tracking-tight">
              Lo Que Dicen
              <br />
              <span className="text-colibri-wine">Nuestros Clientes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Carlos M.",
                biz: "Tacos El Patrón — CDMX",
                quote:
                  "En 2 meses recuperamos la inversión. El delivery integrado y el kiosko nos permitieron atender 3x más pedidos en hora pico.",
                stars: 5,
              },
              {
                name: "Ana G.",
                biz: "Café La Esquina — Guadalajara",
                quote:
                  "El menú QR y el sistema de mesas nos cambió la vida. Los clientes piden desde su mesa y todo llega directo a cocina.",
                stars: 5,
              },
              {
                name: "Roberto S.",
                biz: "Wings & Beer — Monterrey",
                quote:
                  "Los reportes son increíbles. Optimizamos el menú y eliminamos lo que no servía. Rentabilidad +35% en 3 meses.",
                stars: 5,
              },
            ].map((t, i) => (
              <TestimonialCard key={i} {...t} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        className="py-24 bg-gradient-to-b from-colibri-beige/20 to-white"
        id="pricing"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-colibri-green/10 text-colibri-green border-colibri-green/20 text-xs">
              <Gift className="w-3 h-3 mr-1 inline" /> Planes
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-colibri-green mb-4 tracking-tight">
              Planes y Precios
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Estamos preparando planes increíbles para ti
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="relative overflow-hidden border-2 border-colibri-gold/30 p-12 text-center bg-gradient-to-br from-white to-colibri-beige/30">
              <div className="absolute top-0 left-0 w-40 h-40 bg-colibri-green/5 rounded-br-full" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-colibri-wine/5 rounded-tl-full" />

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-colibri-green to-colibri-wine flex items-center justify-center shadow-xl">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-colibri-green mb-4">
                  Próximamente
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                  Estamos finalizando los planes perfectos para tu restaurante.
                  <br />
                  <span className="font-semibold text-colibri-wine">
                    Mientras tanto, cotiza directamente con nosotros y obtén un
                    precio especial de pre-lanzamiento.
                  </span>
                </p>

                <a
                  href="https://wa.me/5214447001387?text=Hola%2C%20me%20interesa%20conocer%20los%20precios%20de%20Colibr%C3%AD-REST"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg px-10 py-7 rounded-2xl shadow-2xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 group"
                  >
                    <WhatsAppIcon />
                    Cotizar por WhatsApp
                  </Button>
                </a>

                <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4 text-colibri-wine" />
                  Pregunta por nuestros bonos de pre-lanzamiento
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/resta.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-colibri-green/95 via-colibri-wine/90 to-colibri-green/95" />
        <ParticlesBackground />

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              ¿Listo Para
              <br />
              <span className="text-colibri-gold">
                Transformar Tu Restaurante?
              </span>
            </h2>
            <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
              Únete a los +300 restaurantes que ya venden más con
              Colibrí-REST.
              <br />
              <span className="font-semibold text-colibri-beige">
                La primera consulta es gratuita.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <a
                href="https://wa.me/5214447001387?text=Hola%2C%20quiero%20una%20demo%20personalizada%20de%20Colibr%C3%AD-REST"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-white text-colibri-green hover:bg-colibri-beige text-lg px-10 py-7 shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <MessageSquare className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Hablar con un Asesor
                </Button>
              </a>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/10 text-lg px-10 py-7 backdrop-blur-sm transition-all"
              >
                <Link href="#demo">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Probar Demo Gratis
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 text-white/75 text-sm">
              {[
                "Sin compromiso",
                "Setup en 24h",
                "Soporte premium",
                "Garantía total",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-colibri-gold" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-colibri-green text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo-colibri.png"
                  alt="Colibrí-REST"
                  width={44}
                  height={44}
                />
                <span className="font-bold text-xl">Colibrí-REST</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                El sistema completo para restaurantes que quieren vender más y
                trabajar menos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-colibri-gold">Producto</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Características
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#demo"
                    className="hover:text-white transition-colors"
                  >
                    Demo en Vivo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-colibri-gold">Contacto</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <a
                    href="https://wa.me/5214447001387"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-colibri-gold">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tos"
                    className="hover:text-white transition-colors"
                  >
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 pt-8 text-center text-sm text-white/50">
            <p>
              &copy; 2026 Colibrí-REST. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp Button ── */}
      <a
        href="https://wa.me/5214447001387?text=Hola%2C%20me%20interesa%20Colibr%C3%AD-REST"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group"
        aria-label="WhatsApp"
      >
        <WhatsAppIconSmall />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
      </a>
    </div>
  )
}
