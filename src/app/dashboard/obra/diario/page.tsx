"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Camera, Plus, Trash2, Edit3, Share2, X, Calendar } from "lucide-react"
import { toast } from "sonner"

interface DiarioEntry {
  id: string
  foto_url: string
  descricao: string | null
  data_registro: string
  criado_em: string
}

// Comprime imagem para no máximo maxDim px no lado maior
async function compressImage(file: File, maxDim = 1280): Promise<File> {
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
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) =>
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
              : file
          ),
        "image/jpeg",
        0.85
      )
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

function formatDatePT(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${day} ${months[parseInt(month) - 1]} ${year}`
}

function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function groupByDate(entries: DiarioEntry[]): [string, DiarioEntry[]][] {
  const map: Record<string, DiarioEntry[]> = {}
  for (const e of entries) {
    if (!map[e.data_registro]) map[e.data_registro] = []
    map[e.data_registro].push(e)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

export default function DiarioObraPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<DiarioEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [obraId, setObraId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [obraNome, setObraNome] = useState("")

  // Upload
  const [uploading, setUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ descricao: "", data_registro: getTodayISO() })
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addPreview, setAddPreview] = useState<string | null>(null)

  // Edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEntry, setEditEntry] = useState<DiarioEntry | null>(null)
  const [editForm, setEditForm] = useState({ descricao: "", data_registro: "" })

  // Menu de contexto (long press)
  const [menuEntry, setMenuEntry] = useState<DiarioEntry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Arquivo pré-carregado para share (evita await antes do navigator.share)
  const menuFileRef = useRef<File | null>(null)
  const [menuFileReady, setMenuFileReady] = useState(false)


  // Visualizar foto
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    try {
      const activeObraId = localStorage.getItem("activeObraId")
      if (!activeObraId) { router.push("/obras"); return }

      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      setObraId(activeObraId)
      setUserId(user.id)

      // Buscar nome da obra
      const { data: obraData } = await supabase
        .from("obras")
        .select("nome")
        .eq("id", activeObraId)
        .single()
      if (obraData) setObraNome(obraData.nome)

      const { data, error } = await supabase
        .from("diario_obra")
        .select("*")
        .eq("obra_id", activeObraId)
        .eq("user_id", user.id)
        .order("data_registro", { ascending: false })
        .order("criado_em", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (e) {
      console.error(e)
      toast.error("Erro ao carregar diário")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAddFile(file)
    setAddPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!addFile || !obraId || !userId) {
      toast.error("Selecione uma foto")
      return
    }
    setUploading(true)
    try {
      const compressed = await compressImage(addFile)
      const { supabase } = await import("@/lib/supabase")
      const path = `${userId}/${obraId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from("diario-obra")
        .upload(path, compressed, { cacheControl: "3600", upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("diario-obra").getPublicUrl(path)

      const { error: insertError } = await supabase.from("diario_obra").insert({
        user_id: userId,
        obra_id: obraId,
        foto_url: urlData.publicUrl,
        descricao: addForm.descricao.trim() || null,
        data_registro: addForm.data_registro,
      })
      if (insertError) throw insertError

      toast.success("Foto salva no diário!")
      setShowAddModal(false)
      setAddFile(null)
      if (addPreview) URL.revokeObjectURL(addPreview)
      setAddPreview(null)
      setAddForm({ descricao: "", data_registro: getTodayISO() })
      await loadEntries()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar foto"
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (entry: DiarioEntry) => {
    setDeleting(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      // Remover do storage
      const urlObj = new URL(entry.foto_url)
      const parts = urlObj.pathname.split("/object/public/diario-obra/")
      if (parts[1]) {
        await supabase.storage.from("diario-obra").remove([decodeURIComponent(parts[1])])
      }
      const { error } = await supabase.from("diario_obra").delete().eq("id", entry.id)
      if (error) throw error
      toast.success("Foto excluída")
      setMenuEntry(null)
      setConfirmDelete(false)
      setDeleting(false)
      await loadEntries()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSave = async () => {
    if (!editEntry) return
    try {
      const { supabase } = await import("@/lib/supabase")
      const { error } = await supabase
        .from("diario_obra")
        .update({
          descricao: editForm.descricao.trim() || null,
          data_registro: editForm.data_registro,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", editEntry.id)
      if (error) throw error
      toast.success("Registro atualizado")
      setShowEditModal(false)
      setEditEntry(null)
      await loadEntries()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao atualizar"
      toast.error(msg)
    }
  }

  const fetchImageAsFile = async (url: string, filename: string): Promise<File | null> => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      return new File([blob], filename, { type: blob.type || "image/jpeg" })
    } catch {
      return null
    }
  }

  // Pré-busca a imagem assim que o menu abre, para que o share seja síncrono
  useEffect(() => {
    menuFileRef.current = null
    setMenuFileReady(false)
    if (!menuEntry) return
    fetchImageAsFile(
      menuEntry.foto_url,
      `obra-${menuEntry.data_registro}-${menuEntry.id.slice(0, 6)}.jpg`
    ).then((f) => {
      menuFileRef.current = f
      setMenuFileReady(true)
    })
  }, [menuEntry])


  const handleDownload = async (entry: DiarioEntry) => {
    const file = menuFileRef.current
    setMenuEntry(null)

    // Tenta Web Share API com arquivo (iOS e Android salvam na galeria)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Diário da Obra" })
        return
      } catch {
        // usuário cancelou ou API falhou — cai no fallback
      }
    }

    // Fallback: download via <a> (funciona em desktop e Android Chrome)
    if (file) {
      const objUrl = URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = objUrl
      a.download = `diario-obra-${entry.data_registro}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objUrl)
      toast.success("Foto baixada!")
    } else {
      window.open(entry.foto_url, "_blank")
    }
  }


  // Long press
  const startLongPress = (entry: DiarioEntry) => {
    longPressTimer.current = setTimeout(() => {
      setMenuEntry(entry)
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTap = (entry: DiarioEntry) => {
    setViewPhoto(entry.foto_url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const grouped = groupByDate(entries)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Camera className="w-3.5 h-3.5 text-[#7eaaee]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white">Diário da Obra</h1>
          {obraNome && <p className="text-[11px] text-gray-500 truncate">{obraNome}</p>}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#1f2228]/80 border border-white/[0.08] flex items-center justify-center">
              <Camera className="w-10 h-10 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm mb-1">Nenhuma foto registrada</p>
              <p className="text-xs text-gray-500 max-w-xs">Documente o progresso da sua obra com fotos dia a dia</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              <Camera className="w-4 h-4" /> Adicionar primeira foto
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, dayEntries]) => (
              <div key={date}>
                {/* Label da data */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-2.5 py-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{formatDatePT(date)}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[10px] text-gray-600">{dayEntries.length} foto{dayEntries.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Grid 2 colunas */}
                <div className="grid grid-cols-2 gap-2">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden cursor-pointer select-none active:scale-[0.97] transition-all duration-150"
                      onTouchStart={() => { cancelLongPress(); startLongPress(entry) }}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={() => startLongPress(entry)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onClick={() => handleTap(entry)}
                      onContextMenu={(e) => { e.preventDefault(); setMenuEntry(entry) }}
                    >
                      <div className="aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.foto_url}
                          alt={entry.descricao || "Foto da obra"}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                          draggable={false}
                          style={{ WebkitTouchCallout: "none", userSelect: "none" }}
                        />
                      </div>
                      {entry.descricao && (
                        <div className="px-2.5 py-2">
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-tight">{entry.descricao}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-4 w-14 h-14 bg-[#0B3064] hover:bg-[#082551] active:scale-90 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ====== MENU DE CONTEXTO ====== */}
      {menuEntry && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => { setMenuEntry(null); setConfirmDelete(false) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex gap-3 items-center px-4 py-3 border-b border-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={menuEntry.foto_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{formatDatePT(menuEntry.data_registro)}</p>
                <p className="text-xs text-gray-500 truncate">{menuEntry.descricao || "Sem descrição"}</p>
              </div>
            </div>

            {confirmDelete ? (
              <div className="p-4">
                <p className="text-sm text-white font-semibold mb-1">Excluir esta foto?</p>
                <p className="text-xs text-gray-500 mb-4">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 bg-white/[0.07] text-white text-sm font-medium rounded-xl">Cancelar</button>
                  <button onClick={() => handleDelete(menuEntry)} disabled={deleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
                    {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Excluir</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-1">
                <button className="flex items-center gap-3 w-full px-4 py-3.5 text-white hover:bg-white/[0.05] transition-colors" onClick={() => { setEditEntry(menuEntry); setEditForm({ descricao: menuEntry.descricao || "", data_registro: menuEntry.data_registro }); setShowEditModal(true); setMenuEntry(null) }}>
                  <Edit3 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Editar dados</span>
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-3.5 text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50" onClick={() => handleDownload(menuEntry)} disabled={!menuFileReady}>
                  {menuFileReady ? <Share2 className="w-4 h-4 text-gray-400" /> : <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin flex-shrink-0" />}
                  <span className="text-sm">{menuFileReady ? "Baixar e compartilhar" : "Preparando..."}</span>
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-3.5 text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Excluir foto</span>
                </button>
              </div>
            )}
            <div className="h-5" />
          </div>
        </div>
      )}

      {/* ====== MODAL ADICIONAR FOTO ====== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => { if (!uploading) setShowAddModal(false) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Novo registro</h2>
              <button onClick={() => { if (!uploading) setShowAddModal(false) }} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!addPreview ? (
                <div className="flex gap-3">
                  <label className="flex-1 flex flex-col items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:border-[#0B3064]/50 rounded-xl p-4 cursor-pointer transition-colors">
                    <Camera className="w-7 h-7 text-gray-500" />
                    <span className="text-xs text-gray-400 font-medium">Câmera</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  </label>
                  <label className="flex-1 flex flex-col items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:border-[#0B3064]/50 rounded-xl p-4 cursor-pointer transition-colors">
                    <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-xs text-gray-400 font-medium">Galeria</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={addPreview} alt="Preview" className="w-full max-h-56 object-cover" />
                  <button onClick={() => { setAddFile(null); URL.revokeObjectURL(addPreview); setAddPreview(null) }} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1.5 text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs text-gray-500 font-medium">Data do registro</label>
                <input type="date" value={addForm.data_registro} onChange={(e) => setAddForm({ ...addForm, data_registro: e.target.value })} style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 12px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-gray-500 font-medium">Descrição <span className="text-gray-700">(opcional)</span></label>
                <textarea value={addForm.descricao} onChange={(e) => setAddForm({ ...addForm, descricao: e.target.value })} placeholder="Ex: Fundação concluída, armação do pilar..." rows={3} className="w-full bg-[#2a2d35] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064]/50 transition-colors resize-none" />
              </div>

              <button onClick={handleSave} disabled={!addFile || uploading} className="w-full py-3 bg-[#0B3064] hover:bg-[#082551] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mb-2">
                {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</> : <><Camera className="w-4 h-4" />Salvar foto</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL EDITAR ====== */}
      {showEditModal && editEntry && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowEditModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Editar registro</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editEntry.foto_url} alt="" className="w-full h-36 object-cover rounded-xl" />

              <div className="space-y-1.5">
                <label className="block text-xs text-gray-500 font-medium">Data</label>
                <input type="date" value={editForm.data_registro} onChange={(e) => setEditForm({ ...editForm, data_registro: e.target.value })} style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 12px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-gray-500 font-medium">Descrição</label>
                <textarea value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })} placeholder="Descrição da foto..." rows={3} className="w-full bg-[#2a2d35] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064]/50 transition-colors resize-none" />
              </div>

              <button onClick={handleEditSave} className="w-full py-3 bg-[#0B3064] hover:bg-[#082551] text-white text-sm font-semibold rounded-xl transition-all mb-2">
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== VISUALIZADOR DE FOTO ====== */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setViewPhoto(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewPhoto} alt="Foto da obra" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
