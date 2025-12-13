"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, BellOff } from "lucide-react"

export default function OrderNotifications() {
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Inicializar audio y cargar preferencias
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3")

    // Cargar preferencia de mute del localStorage
    const savedMute = localStorage.getItem("orderNotificationsMuted")
    if (savedMute) {
      setMuted(savedMute === "true")
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
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
