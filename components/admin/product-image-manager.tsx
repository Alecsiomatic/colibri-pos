"use client"

import { useState, useEffect } from "react"
import { Upload, X, GripVertical, Star, StarOff, Eye } from "lucide-react"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface ProductImage {
  id: number
  product_id: number
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

interface ProductImageManagerProps {
  productId: number
  productName: string
}

export default function ProductImageManager({ productId, productName }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [productId])

  async function fetchImages() {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/images`)
      const data = await response.json()
      setImages(data.images || [])
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Error al cargar imágenes")
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(files: FileList) {
    if (!files.length) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("altText", `${productName} - imagen`)
      formData.append("isPrimary", images.length === 0 ? "true" : "false")

      const response = await fetch(`/api/products/${productId}/images`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`)
      }

      return response.json()
    })

    try {
      await Promise.all(uploadPromises)
      toast.success(`${files.length} imagen(es) subida(s) correctamente`)
      fetchImages()
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Error al subir algunas imágenes")
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!confirm("¿Estás seguro de eliminar esta imagen?")) return

    try {
      const response = await fetch(`/api/products/${productId}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete image")

      toast.success("Imagen eliminada correctamente")
      fetchImages()
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Error al eliminar imagen")
    }
  }

  async function handleSetPrimary(imageId: number) {
    try {
      // Actualizar localmente primero para mejor UX
      setImages(images.map((img) => ({ ...img, is_primary: img.id === imageId })))

      const response = await fetch(`/api/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, setPrimary: true }),
      })

      if (!response.ok) throw new Error("Failed to set primary image")

      toast.success("Imagen principal actualizada")
    } catch (error) {
      console.error("Error setting primary image:", error)
      toast.error("Error al establecer imagen principal")
      fetchImages() // Revertir cambios
    }
  }

  async function handleReorder(result: any) {
    if (!result.destination) return

    const newImages = Array.from(images)
    const [reorderedItem] = newImages.splice(result.source.index, 1)
    newImages.splice(result.destination.index, 0, reorderedItem)

    // Actualizar orden local
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index,
    }))
    setImages(updatedImages)

    // Actualizar en servidor
    try {
      const imageOrders = updatedImages.map((img, index) => ({
        id: img.id,
        order: index,
      }))

      const response = await fetch(`/api/products/${productId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageOrders }),
      })

      if (!response.ok) throw new Error("Failed to reorder images")
    } catch (error) {
      console.error("Error reordering images:", error)
      toast.error("Error al reordenar imágenes")
      fetchImages() // Revertir cambios
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">Imágenes del Producto</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-amber-900">Imágenes del Producto</h3>
        <span className="text-sm text-gray-600">{images.length} imagen(es)</span>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-300 border-dashed rounded-lg cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-amber-600" />
            <p className="mb-2 text-sm text-amber-700">
              <span className="font-semibold">Click para subir</span> o arrastra imágenes aquí
            </p>
            <p className="text-xs text-amber-600">PNG, JPG hasta 5MB (múltiples archivos)</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">Subiendo imágenes...</p>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 ? (
        <DragDropContext onDragEnd={handleReorder}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                          image.is_primary ? "border-amber-500" : "border-gray-200"
                        } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                      >
                        <img
                          src={image.image_url || "/placeholder.svg"}
                          alt={image.alt_text || productName}
                          className="w-full h-full object-cover"
                        />

                        {/* Primary Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Principal
                          </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              onClick={() => setPreviewImage(image.image_url)}
                              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                              title="Ver imagen"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleSetPrimary(image.id)}
                              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                              title={image.is_primary ? "Es principal" : "Marcar como principal"}
                            >
                              {image.is_primary ? <Star size={16} className="text-amber-500" /> : <StarOff size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                              title="Eliminar imagen"
                            >
                              <X size={16} className="text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical size={16} className="text-gray-600" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No hay imágenes para este producto</p>
          <p className="text-sm">Sube la primera imagen usando el área de arriba</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
