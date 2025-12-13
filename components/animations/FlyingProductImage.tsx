'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface FlyingImageProps {
  imageSrc: string
  productName: string
  fromElement: HTMLElement
  toElement: HTMLElement
  onComplete: () => void
}

export function FlyingProductImage({ imageSrc, productName, fromElement, toElement, onComplete }: FlyingImageProps) {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [endPos, setEndPos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const fromRect = fromElement.getBoundingClientRect()
    const toRect = toElement.getBoundingClientRect()
    
    setStartPos({
      x: fromRect.left + fromRect.width / 2,
      y: fromRect.top + fromRect.height / 2
    })
    
    setEndPos({
      x: toRect.left + toRect.width / 2,
      y: toRect.top + toRect.height / 2
    })
  }, [fromElement, toElement])

  return (
    <motion.div
      initial={{
        position: 'fixed',
        left: startPos.x,
        top: startPos.y,
        x: '-50%',
        y: '-50%',
        scale: 1,
        opacity: 1,
        zIndex: 9999
      }}
      animate={{
        left: endPos.x,
        top: endPos.y,
        scale: [1, 1.1, 0.2],
        opacity: [1, 1, 0],
        rotate: [0, 0, 360]
      }}
      transition={{
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.5, 1]
      }}
      onAnimationComplete={onComplete}
      className="pointer-events-none"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.6)] border-2 border-purple-400">
        <Image
          src={imageSrc}
          alt={productName}
          fill
          className="object-cover"
        />
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 mix-blend-overlay" />
      </div>
    </motion.div>
  )
}

interface FlyingImageManagerProps {
  items: Array<{
    id: string
    imageSrc: string
    productName: string
    fromElement: HTMLElement
  }>
  cartButtonRef?: React.RefObject<HTMLElement>
}

export function FlyingImageManager({ items, cartButtonRef }: FlyingImageManagerProps) {
  const [activeAnimations, setActiveAnimations] = useState<typeof items>([])
  const [cartElement, setCartElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Try to get cart element from ref or querySelector
    const findCartElement = () => {
      if (cartButtonRef?.current) {
        setCartElement(cartButtonRef.current)
        return true
      } else {
        const element = document.querySelector('[data-floating-cart]') as HTMLElement
        if (element) {
          setCartElement(element)
          return true
        }
      }
      return false
    }

    // Try immediately
    if (!findCartElement()) {
      // If not found, retry every 100ms for up to 2 seconds
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (findCartElement() || attempts > 20) {
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [cartButtonRef])

  useEffect(() => {
    if (items.length > 0 && cartElement) {
      // Small delay to ensure cart button position is stable
      const timer = setTimeout(() => {
        setActiveAnimations(prev => [...prev, ...items])
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [items, cartElement])

  const handleComplete = (id: string) => {
    setActiveAnimations(prev => prev.filter(item => item.id !== id))
  }

  if (!cartElement) return null

  return (
    <AnimatePresence>
      {activeAnimations.map(item => (
        <FlyingProductImage
          key={item.id}
          imageSrc={item.imageSrc}
          productName={item.productName}
          fromElement={item.fromElement}
          toElement={cartElement}
          onComplete={() => handleComplete(item.id)}
        />
      ))}
    </AnimatePresence>
  )
}
