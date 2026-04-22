import { supabase } from "@/lib/supabase"

async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/")) return file
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(file)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) =>
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
              : file
          ),
        "image/jpeg",
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

export async function uploadComprovante(
  file: File,
  userId: string,
  folder: "despesas" | "pagamentos" = "despesas"
): Promise<{ url: string | null; error: string | null }> {
  try {
    const processed = await compressImage(file)
    const inferredExt = processed.type === "image/jpeg"
      ? "jpg"
      : (processed.name.split(".").pop() || "bin").toLowerCase()
    const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${inferredExt}`

    const { error } = await supabase.storage
      .from("comprovantes")
      .upload(path, processed, {
        cacheControl: "3600",
        upsert: false,
        contentType: processed.type || undefined,
      })

    if (error) {
      console.error("[uploadComprovante] Falha no upload:", error)
      return { url: null, error: error.message }
    }

    const { data } = supabase.storage.from("comprovantes").getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  } catch (e) {
    console.error("[uploadComprovante] Exceção:", e)
    return { url: null, error: e instanceof Error ? e.message : "Falha no upload do comprovante" }
  }
}
