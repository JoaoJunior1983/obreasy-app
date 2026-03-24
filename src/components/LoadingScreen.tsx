'use client'

import Image from 'next/image'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo com animação */}
        <div className="relative w-20 h-20 animate-pulse">
          <Image
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
            alt="OBREASY"
            width={80}
            height={80}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />

        {/* Mensagem */}
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-2">{message}</p>
          <p className="text-gray-400 text-sm">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  )
}
