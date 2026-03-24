"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface SplashScreenProps {
  onComplete?: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  // Retorna null imediatamente se não for produção
  const isProduction = process.env.NODE_ENV === "production"
  
  const [isVisible, setIsVisible] = useState(isProduction)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Se não for produção, executa callback e sai
    if (!isProduction) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    // Inicia o fade-out após 1200ms
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 1200)

    // Remove o componente completamente após fade-out (1200ms + 300ms de transição)
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 1500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [onComplete, isProduction])

  // Retorna null se não for produção ou após o tempo definido
  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo OBREASY centralizado */}
      <div
        className={`transition-all duration-700 ease-out ${
          fadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          transitionDelay: "100ms"
        }}
      >
        <Image
          src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
          alt="OBREASY"
          width={600}
          height={600}
          className="w-auto h-[35vh] sm:h-[40vh] md:h-[45vh] object-contain"
          priority
        />
      </div>
    </div>
  )
}
