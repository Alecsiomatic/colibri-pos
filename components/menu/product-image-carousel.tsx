"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, AlertCircle, ZoomIn, Maximize2, Camera } from "lucide-react"

interface ProductImage {
  id: number
  image_url: string
  alt_text: string | null
  is_primary: boolean
  display_order: number
}

interface ProductImageCarouselProps {
  productId: string | number
  productName: string
  fallbackImage?: string
  className?: string
  mode?: "preview" | "gallery" // Nuevo: modo adaptativo
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function ProductImageCarousel({
  productId,
  productName,
  fallbackImage = "/placeholder.svg",
  className = "",
  mode = "gallery",
  autoPlay = false,
  autoPlayInterval = 4000,
}: ProductImageCarouselProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Convertir productId a number de forma segura
  const numericProductId = typeof productId === "string" ? Number.parseInt(productId, 10) : productId

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || isHovered || images.length <= 1 || mode !== "preview") return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, isHovered, images.length, autoPlayInterval, mode])

  useEffect(() => {
    if (numericProductId && !isNaN(numericProductId)) {
      fetchImages()
    } else {
      setError("ID de producto inválido")
      setLoading(false)
    }
  }, [numericProductId])

  async function fetchImages() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${numericProductId}/images`)

      if (!response.ok) {
        console.warn(`API failed for product ${numericProductId}, using fallback`)
        setImages([])
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const sortedImages = data.images.sort((a: ProductImage, b: ProductImage) => {
          if (a.is_primary) return -1
          if (b.is_primary) return 1
          return a.display_order - b.display_order
        })
        setImages(sortedImages)
        setCurrentIndex(0)
      } else {
        setImages([])
      }
    } catch (error) {
      console.warn("Error fetching images, using fallback:", error)
      setImages([])
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }, [images.length])

  const prevImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [images.length])

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Manejo de gestos táctiles
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && images.length > 1) {
      nextImage()
    }
    if (isRightSwipe && images.length > 1) {
      prevImage()
    }
  }

  // Keyboard navigation (solo en modo gallery)
  useEffect(() => {
    if (mode !== "gallery") return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
      if (e.key === "Escape") setShowFullscreen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mode, nextImage, prevImage])

  // Loading state
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <div className="text-xs">Error cargando imagen</div>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay imágenes, mostrar fallback
  if (images.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={fallbackImage || "/placeholder.svg"}
          alt={productName}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg"
          }}
        />
      </div>
    )
  }

  // MODO PREVIEW (para home/cards)
  if (mode === "preview") {
    return (
      <div
        className={`relative group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Imagen principal */}
        <div className="relative w-full h-full overflow-hidden rounded-lg">
          <img
            src={images[currentIndex]?.image_url || fallbackImage}
            alt={images[currentIndex]?.alt_text || productName}
            className="w-full h-full object-cover transition-all duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = fallbackImage || "/placeholder.svg"
            }}
          />

          {/* Overlay sutil */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Indicadores simples */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white scale-125 shadow-lg" : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Imagen ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Indicador de múltiples fotos */}
        {images.length > 1 && (
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Camera size={10} />
              <span>+{images.length - 1}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // MODO GALLERY (para páginas de producto)
  return (
    <div
      className={`relative group ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Imagen principal */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <img
          src={images[currentIndex]?.image_url || fallbackImage}
          alt={images[currentIndex]?.alt_text || productName}
          className="w-full h-full object-cover transition-transform duration-300 cursor-zoom-in"
          onClick={() => setShowFullscreen(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = fallbackImage || "/placeholder.svg"
          }}
        />

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Hint de zoom */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ZoomIn size={12} />
            <span>Click para ampliar</span>
          </div>
        </div>
      </div>

      {/* Controles de navegación */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={24} className="text-gray-800" />
          </button>

          {/* Thumbnails navegables */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`relative overflow-hidden rounded transition-all duration-300 ${
                  index === currentIndex
                    ? "w-16 h-12 scale-110 ring-2 ring-white shadow-lg"
                    : "w-12 h-9 opacity-70 hover:opacity-100 hover:scale-105"
                }`}
                style={{
                  transform: `perspective(200px) rotateY(${
                    index === currentIndex ? 0 : index < currentIndex ? 15 : -15
                  }deg) ${index === currentIndex ? "scale(1.1)" : ""}`,
                }}
              >
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.alt_text || `${productName} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
              </button>
            ))}
          </div>

          {/* Contador e indicadores */}
          <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
            <button
              onClick={() => setShowFullscreen(true)}
              className="bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
              aria-label="Ver en pantalla completa"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Indicadores de puntos */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white scale-125 shadow-lg" : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal Fullscreen */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <ChevronLeft size={24} className="rotate-45" />
          </button>
          <img
            src={images[currentIndex]?.image_url || fallbackImage}
            alt={images[currentIndex]?.alt_text || productName}
            className="max-w-full max-h-full object-contain"
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
