'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays, Clock, Users, CheckCircle2, Phone, Mail,
  LoaderCircle, Search, ChevronLeft, ChevronRight, PartyPopper, XCircle, ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-notifications'
import Link from 'next/link'

interface TimeSlot {
  time: string
  display: string
  available: boolean
}

interface Config {
  is_active: boolean
  min_party_size: number
  max_party_size: number
  advance_days: number
}

type Step = 'form' | 'slots' | 'confirm' | 'success' | 'lookup'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente de confirmación', color: 'text-yellow-400' },
  confirmed: { label: 'Confirmada', color: 'text-green-400' },
  seated: { label: 'Sentados', color: 'text-blue-400' },
  completed: { label: 'Completada', color: 'text-gray-400' },
  cancelled: { label: 'Cancelada', color: 'text-red-400' },
  no_show: { label: 'No se presentó', color: 'text-orange-400' },
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

export default function ReservarPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Config | null>(null)
  const [step, setStep] = useState<Step>('form')

  // Form state
  const [date, setDate] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Customer info
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Success
  const [confirmationCode, setConfirmationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Lookup
  const [lookupCode, setLookupCode] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Load config
  useEffect(() => {
    fetch('/api/reservations?action=config')
      .then(r => r.json())
      .then(d => { if (d.success) setConfig(d.config) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Min/max dates
  const today = new Date().toISOString().split('T')[0]
  const maxDate = config ? (() => {
    const d = new Date()
    d.setDate(d.getDate() + config.advance_days)
    return d.toISOString().split('T')[0]
  })() : ''

  // Load time slots
  const loadSlots = useCallback(async () => {
    if (!date || !partySize) return
    setLoadingSlots(true)
    setSelectedSlot('')
    try {
      const res = await fetch(`/api/reservations?action=slots&date=${date}&party_size=${partySize}`)
      const data = await res.json()
      if (data.success) setSlots(data.slots || [])
      else toast.error(data.error || 'Error cargando horarios')
    } catch { toast.error('Error de conexión') }
    setLoadingSlots(false)
  }, [date, partySize, toast])

  const handleFindSlots = () => {
    if (!date) { toast.error('Selecciona una fecha'); return }
    loadSlots()
    setStep('slots')
  }

  const handleSelectSlot = (time: string) => {
    setSelectedSlot(time)
    setStep('confirm')
  }

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Nombre y teléfono son obligatorios')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          party_size: partySize,
          reservation_date: date,
          reservation_time: selectedSlot,
          special_requests: specialRequests.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConfirmationCode(data.confirmation_code)
        setStep('success')
      } else toast.error(data.error || 'Error al crear reservación')
    } catch { toast.error('Error de conexión') }
    setSubmitting(false)
  }

  const handleLookup = async () => {
    if (!lookupCode.trim()) { toast.error('Ingresa tu código de confirmación'); return }
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const res = await fetch(`/api/reservations?action=check&code=${encodeURIComponent(lookupCode.trim())}`)
      const data = await res.json()
      if (data.success) setLookupResult(data.reservation)
      else toast.error(data.error || 'No se encontró la reservación')
    } catch { toast.error('Error de conexión') }
    setLookupLoading(false)
  }

  const handleCancel = async () => {
    if (!lookupResult || !confirm('¿Cancelar tu reservación?')) return
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', code: lookupResult.confirmation_code }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reservación cancelada')
        setLookupResult({ ...lookupResult, status: 'cancelled' })
      } else toast.error(data.error || 'Error')
    } catch { toast.error('Error') }
  }

  const resetForm = () => {
    setStep('form')
    setDate('')
    setPartySize(2)
    setSlots([])
    setSelectedSlot('')
    setName('')
    setPhone('')
    setEmail('')
    setSpecialRequests('')
    setConfirmationCode('')
  }

  // ─── Loading / Inactive ────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-colibri-gold" />
      </div>
    )
  }

  if (!config?.is_active) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-black/85 backdrop-blur-md border-white/10">
          <CardContent className="p-8 text-center">
            <CalendarDays className="w-12 h-12 text-colibri-gold/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Reservaciones no disponibles</h2>
            <p className="text-colibri-beige/60">El sistema de reservaciones no está activo en este momento. Contáctanos directamente para reservar.</p>
            <Link href="/">
              <Button className="mt-6 bg-colibri-green hover:bg-colibri-green/80 text-white">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Main ──────────────────────────────────
  return (
    <div className="min-h-[60vh] py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <CalendarDays className="w-8 h-8 text-colibri-gold" /> Reservar Mesa
          </h1>
          <p className="text-colibri-beige/60 mt-2">Reserva tu mesa en minutos</p>
        </div>

        {/* Tab toggle: New vs Check */}
        {(step === 'form' || step === 'lookup') && (
          <div className="flex gap-2 justify-center">
            <Button variant={step === 'form' ? 'default' : 'outline'} size="sm"
              onClick={() => setStep('form')}
              className={step === 'form' ? 'bg-colibri-gold text-black font-semibold' : 'border-white/30 text-white hover:bg-white/10'}>
              Nueva Reservación
            </Button>
            <Button variant={step === 'lookup' ? 'default' : 'outline'} size="sm"
              onClick={() => setStep('lookup')}
              className={step === 'lookup' ? 'bg-colibri-gold text-black font-semibold' : 'border-white/30 text-white bg-white/10 hover:bg-white/20'}>
              <Search className="w-4 h-4 mr-1" /> Consultar Reservación
            </Button>
          </div>
        )}

        {/* ─── Step: Form ──────────────────────── */}
        {step === 'form' && (
          <Card className="bg-black/85 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">¿Cuándo quieres venir?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Fecha</Label>
                <Input type="date" value={date} min={today} max={maxDate}
                  onChange={e => setDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Número de personas</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" disabled={partySize <= (config?.min_party_size || 1)}
                    onClick={() => setPartySize(p => p - 1)}
                    className="border-colibri-gold/50 text-colibri-gold bg-colibri-gold/10 hover:bg-colibri-gold/20 h-10 w-10 p-0 text-lg font-bold">-</Button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{partySize}</span>
                  <Button variant="outline" size="sm" disabled={partySize >= (config?.max_party_size || 20)}
                    onClick={() => setPartySize(p => p + 1)}
                    className="border-colibri-gold/50 text-colibri-gold bg-colibri-gold/10 hover:bg-colibri-gold/20 h-10 w-10 p-0 text-lg font-bold">+</Button>
                  <span className="text-sm text-colibri-beige/50 ml-2">
                    <Users className="w-4 h-4 inline mr-1" /> personas
                  </span>
                </div>
              </div>
              <Button onClick={handleFindSlots} disabled={!date} className="w-full bg-colibri-gold text-black font-semibold hover:bg-colibri-gold/90 mt-2">
                <Clock className="w-4 h-4 mr-2" /> Ver Horarios Disponibles
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ─── Step: Slots ──────────────────────── */}
        {step === 'slots' && (
          <Card className="bg-black/85 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep('form')} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-white text-lg">Elige tu horario</CardTitle>
                  <CardDescription className="text-colibri-beige/70">
                    {new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {partySize} personas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <LoaderCircle className="w-6 h-6 animate-spin text-colibri-gold" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="w-10 h-10 text-red-400/40 mx-auto mb-2" />
                  <p className="text-colibri-beige">No hay horarios disponibles para esta fecha</p>
                  <Button variant="ghost" onClick={() => setStep('form')} className="mt-3 text-colibri-gold">
                    Elegir otra fecha
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(s => (
                    <Button key={s.time} variant="outline" disabled={!s.available}
                      onClick={() => handleSelectSlot(s.time)}
                      className={`h-12 text-sm ${s.available
                        ? 'border-colibri-gold/40 text-white bg-white/5 hover:bg-colibri-gold/20 hover:border-colibri-gold'
                        : 'border-white/10 text-white/30 cursor-not-allowed'}`}>
                      {s.display}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Step: Confirm ─────────────────────── */}
        {step === 'confirm' && (
          <Card className="bg-black/85 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep('slots')} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-white text-lg">Tus datos</CardTitle>
                  <CardDescription className="text-colibri-beige/70">
                    {new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(selectedSlot)} · {partySize} personas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Nombre completo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white" placeholder="Tu nombre" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Teléfono *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)}
                  className="bg-white/10 border-white/20 text-white" placeholder="Ej: 55 1234 5678" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Email (opcional)</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white" placeholder="email@ejemplo.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Peticiones especiales (opcional)</Label>
                <Textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                  className="bg-white/10 border-white/20 text-white" rows={2}
                  placeholder="Cumpleaños, silla alta, preferencia de zona..." />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-colibri-green hover:bg-colibri-green/80 text-white mt-2">
                {submitting ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirmar Reservación
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ─── Step: Success ─────────────────────── */}
        {step === 'success' && (
          <Card className="bg-black/85 backdrop-blur-md border-white/10">
            <CardContent className="p-8 text-center space-y-4">
              <PartyPopper className="w-14 h-14 text-colibri-gold mx-auto" />
              <h2 className="text-2xl font-bold text-white">¡Reservación Creada!</h2>
              <p className="text-colibri-beige/70">Tu reservación ha sido registrada exitosamente</p>
              <div className="p-4 rounded-xl bg-colibri-gold/10 border border-colibri-gold/30 inline-block">
                <p className="text-xs text-colibri-gold uppercase tracking-wide mb-1">Código de Confirmación</p>
                <p className="text-3xl font-mono font-bold text-colibri-gold tracking-widest">{confirmationCode}</p>
              </div>
              <p className="text-sm text-colibri-beige/50">
                Guarda este código para consultar o cancelar tu reservación
              </p>
              <div className="text-left max-w-xs mx-auto space-y-2 text-sm text-colibri-beige/70 mt-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-colibri-gold flex-shrink-0" />
                  {new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-colibri-gold flex-shrink-0" />
                  {formatTime(selectedSlot)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-colibri-gold flex-shrink-0" />
                  {partySize} personas
                </div>
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <Button onClick={resetForm} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
                  Nueva Reservación
                </Button>
                <Link href="/">
                  <Button variant="outline" className="border-white/20 text-colibri-beige hover:bg-white/5">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step: Lookup ─────────────────────── */}
        {step === 'lookup' && (
          <Card className="bg-black/85 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Consultar Reservación</CardTitle>
              <CardDescription className="text-colibri-beige/60">
                Ingresa tu código de confirmación para ver el estado o cancelar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={lookupCode} onChange={e => setLookupCode(e.target.value.toUpperCase())}
                  className="bg-white/10 border-white/20 text-white font-mono tracking-widest uppercase flex-1"
                  placeholder="CÓDIGO" maxLength={8}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()} />
                <Button onClick={handleLookup} disabled={lookupLoading} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
                  {lookupLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {lookupResult && (
                <div className="space-y-4 mt-4">
                  <Separator className="bg-white/10" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-colibri-beige/50 uppercase">Estado</p>
                      <p className={`font-semibold ${STATUS_MAP[lookupResult.status]?.color || 'text-white'}`}>
                        {STATUS_MAP[lookupResult.status]?.label || lookupResult.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-colibri-beige/50 uppercase">Nombre</p>
                      <p className="text-white">{lookupResult.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-colibri-beige/50 uppercase">Fecha</p>
                      <p className="text-white">
                        {new Date(lookupResult.reservation_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-colibri-beige/50 uppercase">Hora</p>
                      <p className="text-white">{formatTime(lookupResult.reservation_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-colibri-beige/50 uppercase">Personas</p>
                      <p className="text-white">{lookupResult.party_size}</p>
                    </div>
                    {lookupResult.table_name && (
                      <div>
                        <p className="text-xs text-colibri-beige/50 uppercase">Mesa</p>
                        <p className="text-white">{lookupResult.table_name}</p>
                      </div>
                    )}
                  </div>

                  {!['cancelled', 'completed', 'no_show'].includes(lookupResult.status) && (
                    <>
                      <Separator className="bg-white/10" />
                      <Button variant="outline" onClick={handleCancel}
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-900/20">
                        <XCircle className="w-4 h-4 mr-2" /> Cancelar Reservación
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
