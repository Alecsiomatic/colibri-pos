'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook } from "lucide-react"

export default function Footer() {
  const [biz, setBiz] = useState({ name: '', slogan: '', logo_url: '', instagram: '', facebook: '' })

  useEffect(() => {
    fetch('/api/business-info')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBiz({ name: d.name || '', slogan: d.slogan || '', logo_url: d.logo_url || '', instagram: d.instagram || '', facebook: d.facebook || '' }) })
      .catch(() => {})
  }, [])

  const displayName = biz.name || 'Restaurante'

  return (
    <footer className="bg-gradient-to-r from-colibri-green via-colibri-wine to-colibri-gold text-white py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-colibri-wine/10 to-transparent"></div>
      <div className="absolute inset-0">
        <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-20 w-1 h-1 bg-colibri-beige rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-6 left-1/4 w-1 h-1 bg-colibri-gold rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-10 right-1/3 w-1 h-1 bg-colibri-beige rounded-full animate-pulse delay-1000"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">{displayName}</h3>
            {biz.slogan && <p className="mb-2">{biz.slogan}</p>}
            {biz.logo_url && (
              <div className="mt-4">
                <Image
                  src={biz.logo_url}
                  alt={`${displayName} Logo`}
                  width={150}
                  height={100}
                  className="rounded-md bg-white p-2"
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-colibri-beige transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-colibri-beige transition-colors">
                  Menú
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-colibri-beige transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-colibri-beige transition-colors">
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Información Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tos" className="hover:text-colibri-beige transition-colors">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-colibri-beige transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm">
                © {new Date().getFullYear()} {displayName}. Todos los derechos reservados.
              </p>
            </div>
            {(biz.instagram || biz.facebook) && (
              <div className="mt-4 space-y-2">
                <h3 className="text-lg font-semibold">Síguenos</h3>
                <div className="flex flex-col space-y-2">
                  {biz.instagram && (
                    <Link
                      href={biz.instagram.startsWith('http') ? biz.instagram : `https://www.instagram.com/${biz.instagram.replace('@', '')}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-colibri-beige transition-colors"
                    >
                      <Instagram className="mr-2" size={20} />
                      <span>Instagram</span>
                    </Link>
                  )}
                  {biz.facebook && (
                    <Link
                      href={biz.facebook.startsWith('http') ? biz.facebook : `https://www.facebook.com/${biz.facebook.replace('@', '')}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-colibri-beige transition-colors"
                    >
                      <Facebook className="mr-2" size={20} />
                      <span>Facebook</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
