"use client"

import { useState, useEffect } from "react"
import { Camera, ZoomIn, X } from "lucide-react"
import AppleCoverFlow from "./apple-cover-flow"

interface ProductImage {
  id: number
  image_url: string
  alt_text: string | null
  is_primary: boolean
  display_order: number
}

interface ProductImagePreviewProps {
  productId: string | number
  productName: string
  fallbackImage?: string
  className?: string
  showImageCount?: boolean
}

export default function ProductImagePreview({
  productId,
  productName,
  fallbackImage = "/placeholder.svg",
  className = "",
  showImageCount = true,
}: ProductImagePreviewProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalDimensions, setModalDimensions] = useState({ width: 0, height: 0 })

  const numericProductId = typeof productId === "string" ? Number.parseInt(productId, 10) : productId

  useEffect(() => {
    if (numericProductId && !isNaN(numericProductId)) {
      fetchImages()
    } else {
      setLoading(false)
    }
  }, [numericProductId])

  // Track modal dimensions for optimal layout
  useEffect(() => {
    if (showModal) {
      const updateDimensions = () => {
        setModalDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }

      updateDimensions()
      window.addEventListener("resize", updateDimensions)

      // Prevent body scroll
      document.body.style.overflow = "hidden"

      return () => {
        window.removeEventListener("resize", updateDimensions)
        document.body.style.overflow = "unset"
      }
    }
  }, [showModal])

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

  const primaryImage = images.length > 0 ? images[0] : null
  const hasMultipleImages = images.length > 1

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false)
      }
    }

    if (showModal) {
      window.addEventListener("keydown", handleEscape)
      return () => window.removeEventListener("keydown", handleEscape)
    }
  }, [showModal])

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Preview Card */}
      <div
        className={`relative ${className} group cursor-pointer overflow-hidden rounded-lg bg-gray-100`}
        onClick={() => hasMultipleImages && setShowModal(true)}
      >
        {/* Primary Image */}
        <img
          src={primaryImage?.image_url || fallbackImage}
          alt={primaryImage?.alt_text || productName}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          {hasMultipleImages && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <ZoomIn size={16} />
                <span className="hidden sm:inline">View Gallery</span>
                <span className="sm:hidden">Gallery</span>
              </div>
            </div>
          )}
        </div>

        {/* Image Count Badge */}
        {hasMultipleImages && showImageCount && (
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <Camera size={10} />
            <span className="font-medium">{images.length}</span>
          </div>
        )}

        {/* Gallery Indicator */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/95 backdrop-blur-sm text-gray-900 p-2 rounded-full shadow-lg">
              <Camera size={14} />
            </div>
          </div>
        )}

        {/* Ripple Effect */}
        {hasMultipleImages && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        )}
      </div>

      {/* Full-Screen Modal */}
      {showModal && hasMultipleImages && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-lg sm:text-xl lg:text-2xl font-semibold truncate max-w-md lg:max-w-2xl">
                {productName}
              </h2>
              <div className="hidden sm:flex items-center gap-2 text-white/70 text-sm">
                <Camera size={16} />
                <span>{images.length} images</span>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="flex-shrink-0 text-white p-2 sm:p-3 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close gallery"
            >
              <X size={20} className="sm:hidden" />
              <X size={24} className="hidden sm:block" />
            </button>
          </div>

          {/* Cover Flow Container - Uses remaining space */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8">
            <AppleCoverFlow
              productId={productId}
              productName={productName}
              fallbackImage={fallbackImage}
              className="w-full h-full"
              mode="product"
              showReflections={true}
            />
          </div>

          {/* Footer with additional controls */}
          <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
              <div className="hidden sm:flex items-center gap-2">
                <span>Use arrow keys or swipe to navigate</span>
              </div>
              <div className="sm:hidden">
                <span>Swipe to navigate</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
