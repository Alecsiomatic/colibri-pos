'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Image as ImageIcon, Check } from 'lucide-react'
import Image from 'next/image'

interface ImageSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (imageUrl: string) => void
  currentImage?: string
}

interface ImageFile {
  name: string
  url: string
}

export function ImageSelector({ open, onOpenChange, onSelect, currentImage }: ImageSelectorProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<string>(currentImage || '')

  useEffect(() => {
    if (open) {
      loadImages()
      setSelectedImage(currentImage || '')
    }
  }, [open, currentImage])

  const loadImages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/product-images', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Seleccionar Imagen del Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>📁 /public/uploads/products/</span>
            <span>{filteredImages.length} imágenes disponibles</span>
          </div>

          {/* Grid de imágenes */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p>No hay imágenes disponibles</p>
                <p className="text-xs mt-1">Sube imágenes a /public/uploads/products/</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.url}
                    onClick={() => setSelectedImage(image.url)}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all overflow-hidden group ${
                      selectedImage === image.url
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                  >
                    {/* Imagen */}
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={image.url}
                        alt={image.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      {selectedImage === image.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-2">
                            <Check className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Nombre */}
                    <div className="p-2 bg-background">
                      <p className="text-xs truncate" title={image.name}>
                        {image.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Botones */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedImage && (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Imagen seleccionada
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!selectedImage}
              >
                Seleccionar Imagen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
