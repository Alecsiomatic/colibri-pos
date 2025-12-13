"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, X, Camera } from "lucide-react"

interface ProductImage {
  id: number
  image_url: string
  alt_text: string | null
  is_primary: boolean
  display_order: number
}

interface AppleCoverFlowProps {
  productId: string | number
  productName: string
  fallbackImage?: string
  className?: string
  mode?: "home" | "product"
  autoPlay?: boolean
  autoPlayInterval?: number
  showReflections?: boolean
}

export default function AppleCoverFlow({
  productId,
  productName,
  fallbackImage = "/placeholder.svg",
  className = "",
  mode = "product",
  autoPlay = false,
  autoPlayInterval = 4000,
  showReflections = true,
}: AppleCoverFlowProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isHovered, setIsHovered] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [lastMoveTime, setLastMoveTime] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const numericProductId = typeof productId === "string" ? Number.parseInt(productId, 10) : productId

  // Responsive breakpoints
  const isMobile = dimensions.width < 640
  const isTablet = dimensions.width >= 640 && dimensions.width < 1024
  const isDesktop = dimensions.width >= 1024

  // Dynamic configuration based on screen size
  const getConfig = useCallback(() => {
    // Ensure dimensions are valid
    const validWidth = dimensions.width || 320
    const validHeight = dimensions.height || 200

    const baseSize = Math.min(validWidth * 0.4, validHeight * 0.7)

    if (isMobile) {
      return {
        itemSize: Math.max(200, baseSize),
        spacing: validWidth * 0.3,
        perspective: validWidth * 2,
        rotationAngle: 55,
        zSpacing: 80,
        maxVisible: 3,
        scaleStep: 0.25,
        opacityStep: 0.3,
        reflectionHeight: 0.4,
        centerScale: 1.0,
      }
    } else if (isTablet) {
      return {
        itemSize: Math.max(250, baseSize),
        spacing: validWidth * 0.2,
        perspective: validWidth * 1.8,
        rotationAngle: 65,
        zSpacing: 100,
        maxVisible: 4,
        scaleStep: 0.2,
        opacityStep: 0.25,
        reflectionHeight: 0.5,
        centerScale: 1.0,
      }
    } else {
      return {
        itemSize: Math.max(300, baseSize),
        spacing: validWidth * 0.15,
        perspective: validWidth * 1.5,
        rotationAngle: 70,
        zSpacing: 120,
        maxVisible: 6,
        scaleStep: 0.15,
        opacityStep: 0.2,
        reflectionHeight: 0.6,
        centerScale: 1.0,
      }
    }
  }, [dimensions, isMobile, isTablet])

  // Container size tracking with ResizeObserver
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Auto-play with intelligent pausing
  useEffect(() => {
    if (isPlaying && !isHovered && !isDragging && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, autoPlayInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, isHovered, isDragging, images.length, autoPlayInterval])

  // Fetch images
  useEffect(() => {
    if (numericProductId && !isNaN(numericProductId)) {
      fetchImages()
    } else {
      setLoading(false)
    }
  }, [numericProductId])

  async function fetchImages() {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${numericProductId}/images`)

      if (!response.ok) {
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
      console.warn("Error fetching images:", error)
      setImages([])
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

  // Apple-style Cover Flow transformation with physics
  const getCoverFlowTransform = useCallback(
    (index: number) => {
      const config = getConfig()
      const distance = index - currentIndex + dragOffset / (config.spacing * 0.5)
      const absDistance = Math.abs(distance)

      // Position calculation with smooth curve
      const x = distance * config.spacing
      const z = -absDistance * config.zSpacing

      // Apple's signature arc effect
      const yOffset = absDistance > 0 ? Math.pow(absDistance, 1.2) * 8 : 0

      // Rotation with progressive increase
      let rotateY = 0
      if (distance !== 0) {
        const baseRotation = distance > 0 ? -config.rotationAngle : config.rotationAngle
        const progressiveMultiplier = 1 + (absDistance - 1) * 0.2
        rotateY = baseRotation * Math.min(progressiveMultiplier, 2)
      }

      // Scale with smooth falloff - Add validation
      const scale =
        absDistance === 0 ? config.centerScale : Math.max(0.4, config.centerScale - absDistance * config.scaleStep)

      // Opacity with smooth transition - Add NaN protection
      let opacity = 1
      if (absDistance > config.maxVisible) {
        opacity = 0
      } else {
        opacity = Math.max(0.1, 1 - absDistance * config.opacityStep)
      }

      // Ensure opacity is always a valid number
      opacity = isNaN(opacity) || !isFinite(opacity) ? 1 : opacity

      // Blur for depth perception - Add validation
      const blur = absDistance > 1 ? Math.min(absDistance * 0.5, 2) : 0
      const validBlur = isNaN(blur) || !isFinite(blur) ? 0 : blur

      return {
        transform: `translate3d(${x}px, ${yOffset}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        filter: validBlur > 0 ? `blur(${validBlur}px)` : "none",
        zIndex: 1000 - Math.floor(absDistance * 10),
        width: `${config.itemSize}px`,
        height: `${config.itemSize}px`,
      }
    },
    [currentIndex, dragOffset, getConfig],
  )

  // Enhanced touch/mouse handling with momentum
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    setDragStart({ x: clientX, y: clientY })
    setDragOffset(0)
    setVelocity(0)
    setLastMoveTime(Date.now())

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return

      const now = Date.now()
      const deltaTime = now - lastMoveTime
      const deltaX = clientX - dragStart.x

      setDragOffset(deltaX)

      if (deltaTime > 0) {
        setVelocity(deltaX / deltaTime)
      }

      setLastMoveTime(now)
    },
    [isDragging, dragStart.x, lastMoveTime],
  )

  const handleEnd = useCallback(() => {
    if (!isDragging) return

    const config = getConfig()
    const threshold = config.spacing * 0.3
    const momentumThreshold = Math.abs(velocity) > 0.5

    let indexChange = 0

    if (Math.abs(dragOffset) > threshold || momentumThreshold) {
      if (dragOffset > 0 || velocity > 0.5) {
        indexChange = -1
      } else if (dragOffset < 0 || velocity < -0.5) {
        indexChange = 1
      }
    }

    if (indexChange !== 0) {
      const newIndex = Math.max(0, Math.min(images.length - 1, currentIndex + indexChange))
      setCurrentIndex(newIndex)
    }

    setIsDragging(false)
    setDragOffset(0)
    setVelocity(0)
  }, [isDragging, dragOffset, velocity, currentIndex, images.length, getConfig])

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientX, e.clientY)
    },
    [handleStart],
  )

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    },
    [handleStart],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleMove(touch.clientX)
    },
    [handleMove],
  )

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Global mouse/touch listeners
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleMouseUp = () => handleEnd()
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    }
    const handleTouchEnd = () => handleEnd()

    document.addEventListener("mousemove", handleMouseMove, { passive: false })
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, handleMove, handleEnd])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          prevImage()
          break
        case "ArrowRight":
          e.preventDefault()
          nextImage()
          break
        case " ":
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case "Escape":
          setShowFullscreen(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextImage, prevImage, isPlaying])

  if (loading) {
    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl flex items-center justify-center min-h-[200px]">
          <div className="text-gray-400 text-sm font-medium">Loading Gallery...</div>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
          <img
            src={fallbackImage || "/placeholder.svg"}
            alt={productName}
            className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative ${className} flex items-center justify-center group`}>
        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
          <img
            src={images[0].image_url || "/placeholder.svg"}
            alt={images[0].alt_text || productName}
            className="max-w-full max-h-full object-contain rounded-xl shadow-lg cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => mode === "product" && setShowFullscreen(true)}
          />
        </div>
        {mode === "product" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
              <ZoomIn size={16} />
              <span>Click to enlarge</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const config = getConfig()

  return (
    <div
      ref={containerRef}
      className={`relative ${className} overflow-hidden select-none touch-pan-y`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        perspective: `${config.perspective}px`,
        minHeight: isMobile ? "250px" : "300px",
      }}
    >
      {/* Cover Flow Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transformStyle: "preserve-3d",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        {/* Images */}
        {images.map((image, index) => {
          const transform = getCoverFlowTransform(index)
          const distance = Math.abs(index - currentIndex)

          if (distance > config.maxVisible) return null

          return (
            <div
              key={image.id}
              className="absolute transition-all duration-700 ease-out"
              style={transform}
              onClick={() => {
                if (index === currentIndex && mode === "product") {
                  setShowFullscreen(true)
                } else {
                  goToImage(index)
                }
              }}
            >
              {/* Image Container */}
              <div className="relative w-full h-full group/item">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.alt_text || productName}
                  className="w-full h-full object-cover rounded-xl shadow-2xl"
                  draggable={false}
                  loading="lazy"
                />

                {/* Overlay for non-center images */}
                {index !== currentIndex && (
                  <div className="absolute inset-0 bg-black/30 rounded-xl transition-opacity duration-300" />
                )}

                {/* Center image indicator */}
                {index === currentIndex && mode === "product" && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                      <ZoomIn size={14} />
                      <span className="hidden sm:inline">Click center image to enlarge</span>
                      <span className="sm:hidden">Tap</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection */}
              {showReflections && !isMobile && index === currentIndex && (
                <div
                  className="absolute top-full left-0 w-full overflow-hidden"
                  style={{
                    height: `${config.reflectionHeight * 100}%`,
                    transform: "scaleY(-1)",
                    opacity: 0.3,
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 70%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 70%)",
                  }}
                >
                  <img
                    src={image.image_url || "/placeholder.svg"}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                    draggable={false}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation Controls */}
      {!isMobile && (
        <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <button
            onClick={prevImage}
            disabled={images.length <= 1}
            className="ml-6 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextImage}
            disabled={images.length <= 1}
            className="mr-6 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {/* Pagination Dots */}
        <div className="flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? `${isMobile ? "w-3 h-3" : "w-4 h-4"} bg-white shadow-lg scale-110`
                  : `${isMobile ? "w-2 h-2" : "w-2.5 h-2.5"} bg-white/60 hover:bg-white/80`
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Top Info Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Camera size={14} />
            <span>
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          {mode === "product" && (
            <>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <ZoomIn size={14} />
                <span className="hidden sm:inline">Click center image to enlarge</span>
                <span className="sm:hidden">Tap to enlarge</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Gesture Hint */}
      {isMobile && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">Swipe to navigate</div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && mode === "product" && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-6 right-6 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Close fullscreen"
          >
            <X size={24} />
          </button>

          <div className="relative max-w-5xl max-h-full flex items-center justify-center">
            <img
              src={images[currentIndex]?.image_url || "/placeholder.svg"}
              alt={images[currentIndex]?.alt_text || productName}
              className="max-w-full max-h-full object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
