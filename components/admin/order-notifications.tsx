"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, BellOff } from "lucide-react"

function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close()
  } catch {}
}

export default function OrderNotifications() {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const savedMute = localStorage.getItem("orderNotificationsMuted")
    if (savedMute) {
      setMuted(savedMute === "true")
    }
  }, [])

  // Guardar preferencia de mute en localStorage
  useEffect(() => {
    localStorage.setItem("orderNotificationsMuted", muted.toString())
  }, [muted])

  const toggleMute = () => {
    setMuted(!muted)
  }

  // Solo mostrar el botón de mute por ahora (sin notificaciones activas)
  return (
    <div className="fixed bottom-6 left-6 z-30">
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full shadow-lg flex items-center justify-center ${
          muted ? "bg-gray-500 text-white" : "bg-amber-700 text-white"
        }`}
        title={muted ? "Activar notificaciones" : "Silenciar notificaciones"}
      >
        {muted ? <BellOff size={24} /> : <Bell size={24} />}
      </button>
    </div>
  )
}
