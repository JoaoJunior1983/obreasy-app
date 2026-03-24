"use client"

import { useState, useRef } from "react"
import { Upload, X, Eye, Camera, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface FileUploadProps {
  label: string
  accept?: string
  maxSize?: number // em MB
  value?: string | null
  onChange: (file: File | null, preview: string | null) => void
  className?: string
}

export function FileUpload({
  label,
  accept = "image/jpeg,image/png,application/pdf",
  maxSize = 10,
  value,
  onChange,
  className = ""
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [fileName, setFileName] = useState<string>("")
  const [fileType, setFileType] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`)
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreview(result)
      setFileName(file.name)
      setFileType(file.type)
      onChange(file, result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName("")
    setFileType("")
    onChange(null, null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleView = () => {
    if (!preview) return

    if (fileType.includes("image")) {
      setShowModal(true)
    } else if (fileType.includes("pdf")) {
      // data: URLs são bloqueadas pelo browser — converter para Blob URL
      const base64Data = preview.split(",")[1]
      const byteChars = atob(base64Data)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i)
      }
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank")
    }
  }

  const getFileIcon = () => {
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />
    if (fileType.includes("image")) return <ImageIcon className="w-5 h-5 text-[#7eaaee]" />
    return <FileText className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Modal lightbox para imagens */}
      {showModal && preview && fileType.includes("image") && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-1 hover:bg-black/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={preview}
            alt="Comprovante"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <Label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
        <Upload className="w-3.5 h-3.5 text-[#7eaaee]" />
        {label}
        <span className="text-xs text-gray-500 font-normal">(opcional)</span>
      </Label>

      {!preview ? (
        <div className="flex gap-2">
          {/* Botão de Upload */}
          <div className="relative flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-9 text-xs bg-[#1E293B] hover:bg-[#243552] border border-dashed border-[#334155] hover:border-[#3B82F6] text-[#94A3B8] hover:text-[#F8FAFC] rounded-[10px] transition-all"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 text-[#94A3B8]" />
              Arquivo
            </Button>
          </div>

          {/* Botão de Câmera */}
          <div className="relative flex-1">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-9 text-xs bg-[#1E293B] hover:bg-[#243552] border border-dashed border-[#334155] hover:border-[#3B82F6] text-[#94A3B8] hover:text-[#F8FAFC] rounded-[10px] transition-all"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5 text-[#94A3B8]" />
              Foto
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[#334155] rounded-[10px] px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon()}
            <p className="text-xs text-[#F8FAFC] font-medium truncate">
              {fileName || "Arquivo anexado"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              type="button"
              onClick={handleView}
              size="sm"
              className="h-7 w-7 p-0 bg-[#0B3064] hover:bg-[#082551] text-white rounded-md"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              onClick={handleRemove}
              size="sm"
              className="h-7 w-7 p-0 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
