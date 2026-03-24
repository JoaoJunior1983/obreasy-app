"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onLoginClick: () => void
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: altura reduzida h-14 / Desktop: h-16 */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
              alt="OBREASY Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <span className="font-poppins font-bold text-xl sm:text-2xl text-gray-900">
              OBREASY
            </span>
          </div>

          {/* CTA Button - Mobile: menor / Desktop: normal */}
          <Button
            onClick={onLoginClick}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-inter font-semibold px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base leading-tight sm:leading-normal flex items-center"
          >
            Entrar / Criar conta
          </Button>
        </div>
      </div>
    </nav>
  )
}
