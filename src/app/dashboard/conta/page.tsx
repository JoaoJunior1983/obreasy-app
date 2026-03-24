"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Camera, Save, X, Eye, EyeOff, Home, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react"
import { getUserProfile, setUserProfile, type UserProfile as UserProfileType } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation"

interface UserProfile {
  name: string
  email: string
  phone: string
  avatarDataUrl: string | null
  password?: string
}

export default function MinhaContaPage() {
  const router = useRouter()
  const [loading, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  // Estados do formulário
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatarDataUrl: null,
  })

  const [originalData, setOriginalData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatarDataUrl: null,
  })

  // Estados de senha
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados de perfil de uso
  const [userProfileType, setUserProfileType] = useState<UserProfileType>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedNewProfile, setSelectedNewProfile] = useState<UserProfileType>(null)

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Carregar dados do usuário
    loadUserData()

    // Carregar perfil de uso
    const profile = getUserProfile()
    setUserProfileType(profile)
  }, [router])

  const loadUserData = async () => {
    try {
      // Buscar do Supabase primeiro
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          const userData: UserProfile = {
            name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            email: user.email || "",
            phone: profile.phone || "",
            avatarDataUrl: profile.avatar_url || null,
          }

          setFormData(userData)
          setOriginalData(userData)
          return
        }
      }
    } catch (error) {
      console.warn("Erro ao carregar perfil do Supabase, usando localStorage:", error)
    }

    // Fallback para localStorage se Supabase falhar
    const userDataStr = localStorage.getItem("user")
    const userProfileStr = localStorage.getItem("userProfile")

    let userData: UserProfile = {
      name: "",
      email: "",
      phone: "",
      avatarDataUrl: null,
    }

    // Priorizar userProfile se existir
    if (userProfileStr) {
      const profile = JSON.parse(userProfileStr)
      userData = {
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatarDataUrl: profile.avatarDataUrl || null,
      }
    } else if (userDataStr) {
      // Fallback para user antigo
      const user = JSON.parse(userDataStr)
      userData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatarDataUrl: user.avatarDataUrl || null,
      }
    }

    setFormData(userData)
    setOriginalData(userData)
  }

  const showMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    // Duração aumentada para 4 segundos para mensagens mais legíveis
    setTimeout(() => setShowToast(false), 4000)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      showMessage("Formato de imagem inválido. Por favor, use JPG, PNG ou WEBP.", "error")
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("A imagem é muito grande. O tamanho máximo é de 5MB.", "error")
      return
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setFormData(prev => ({ ...prev, avatarDataUrl: dataUrl }))
    }
    reader.onerror = () => {
      showMessage("Não foi possível carregar a imagem. Tente novamente.", "error")
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")

    // Aplica máscara (##) #####-####
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateForm = (): string | null => {
    // Nome: mínimo 2 caracteres
    if (formData.name.trim().length < 2) {
      return "O nome deve ter pelo menos 2 caracteres."
    }

    // Email: obrigatório e válido
    if (!formData.email.trim()) {
      return "Por favor, informe seu e-mail."
    }
    if (!validateEmail(formData.email)) {
      return "O e-mail informado não é válido."
    }

    // Telefone: se preenchido, validar mínimo de dígitos
    if (formData.phone) {
      const numbers = formData.phone.replace(/\D/g, "")
      if (numbers.length > 0 && numbers.length < 10) {
        return "O telefone deve ter pelo menos 10 dígitos."
      }
    }

    // Validação de senha: se algum campo de senha foi preenchido
    const isChangingPassword = currentPassword || newPassword || confirmPassword

    if (isChangingPassword) {
      // Se está tentando alterar senha, senha atual é obrigatória
      if (!currentPassword) {
        return "Por favor, informe sua senha atual para alterá-la."
      }

      // Validação robusta da nova senha
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return passwordValidation.error!
      }

      // Validar confirmação de senha
      const passwordMatchValidation = validatePasswordMatch(newPassword, confirmPassword)
      if (!passwordMatchValidation.isValid) {
        return passwordMatchValidation.error!
      }
    }

    return null
  }

  const handleSave = async () => {
    // Validar
    const error = validateForm()
    if (error) {
      showMessage(error, "error")
      return
    }

    setSaving(true)

    try {
      // Verificar se está alterando senha
      const isChangingPassword = currentPassword && newPassword && confirmPassword

      // Se está alterando senha, validar senha atual via Supabase Auth
      if (isChangingPassword) {
        // Tentar autenticar com a senha atual para validá-la
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: currentPassword,
        })

        if (signInError) {
          showMessage("Senha atual incorreta. Por favor, verifique e tente novamente.", "error")
          setSaving(false)
          return
        }

        // Senha atual validada! Agora atualizar para a nova senha via Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (updateError) {
          console.error("Erro ao atualizar senha no Supabase:", updateError)
          showMessage("Não foi possível atualizar a senha. Tente novamente em alguns instantes.", "error")
          setSaving(false)
          return
        }
      }

      // Atualizar perfil do usuário na tabela user_profiles
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user

      // Declarar fora do if(user) para evitar ReferenceError quando user é null
      let avatarUrl = formData.avatarDataUrl

      if (user) {

        if (formData.avatarDataUrl && formData.avatarDataUrl.startsWith("data:")) {
          try {
            console.log("[AVATAR] Iniciando upload para Supabase Storage...")

            // Converter base64 para blob
            const response = await fetch(formData.avatarDataUrl)
            const blob = await response.blob()
            console.log("[AVATAR] Blob criado:", blob.type, blob.size, "bytes")

            // Nome único para o arquivo
            const fileExt = blob.type.split("/")[1] || "png"
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}` // Usar root do bucket

            console.log("[AVATAR] Tentando upload no bucket 'avatars':", filePath)

            // Upload para o Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(filePath, blob, {
                contentType: blob.type,
                upsert: true,
                cacheControl: '3600'
              })

            if (uploadError) {
              console.error("[AVATAR] ❌ ERRO no upload:", uploadError)
              console.error("[AVATAR] Detalhes:", {
                message: uploadError.message,
                statusCode: (uploadError as any).statusCode,
                error: uploadError
              })

              // Mostrar erro ao usuário - bucket pode não existir
              showMessage(`Erro ao salvar foto: ${uploadError.message}. Verifique se o bucket 'avatars' existe no Supabase Storage.`, "error")
              setSaving(false)
              return
            } else {
              console.log("[AVATAR] ✅ Upload bem-sucedido:", uploadData)

              // Obter URL pública se o upload foi bem-sucedido
              const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath)

              console.log("[AVATAR] URL pública gerada:", publicUrl)
              avatarUrl = publicUrl
            }
          } catch (uploadErr) {
            console.error("[AVATAR] ❌ Erro inesperado no upload:", uploadErr)
            showMessage("Erro ao processar upload da foto. Tente novamente.", "error")
            setSaving(false)
            return
          }
        }

        // Extrair primeiro e último nome
        const nameParts = formData.name.trim().split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""

        // Atualizar perfil na tabela user_profiles (somente UPDATE, não INSERT)
        try {
          const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone: formData.phone.trim(),
              avatar_url: avatarUrl
            })
            .eq('id', user.id)

          if (profileUpdateError) {
            console.warn("Perfil não sincronizado com banco de dados (usando armazenamento local):", profileUpdateError)
            // Continuar mesmo com erro - dados locais serão salvos
          }
        } catch (profileError) {
          console.warn("Perfil não sincronizado com banco de dados (usando armazenamento local):", profileError)
          // Continuar mesmo com erro
        }
      }

      // Preparar dados para salvar localmente (usar avatarUrl que contém a URL do Supabase)
      const profileToSave: UserProfile = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatarDataUrl: avatarUrl, // Usar a URL do Supabase, não o base64
      }

      // Salvar no localStorage
      try {
        localStorage.setItem("userProfile", JSON.stringify(profileToSave))

        // Atualizar também o "user" antigo para compatibilidade
        try {
          const oldUser = JSON.parse(localStorage.getItem("user") || "{}")
          const updatedUser = {
            ...oldUser,
            name: profileToSave.name,
            email: profileToSave.email,
            phone: profileToSave.phone,
            avatarDataUrl: avatarUrl,
          }
          localStorage.setItem("user", JSON.stringify(updatedUser))
        } catch {
          // Ignorar erro no "user" legado
        }
      } catch (storageError) {
        console.warn("Erro ao salvar no localStorage:", storageError)
        // Continuar mesmo com erro de storage local
      }

      // Atualizar estados
      setOriginalData(profileToSave)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Disparar evento customizado para atualizar Header
      window.dispatchEvent(new Event("userProfileUpdated"))

      // Mensagens de sucesso específicas e claras
      if (isChangingPassword) {
        showMessage("✓ Senha atualizada com sucesso!", "success")
      } else {
        showMessage("✓ Dados atualizados com sucesso!", "success")
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error("Erro ao salvar perfil:", error)
      showMessage(`Não foi possível salvar as alterações: ${msg}`, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Voltar para o dashboard
    router.push("/dashboard")
  }

  const getInitials = (name: string, email: string): string => {
    if (name) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0]
      }
      return parts[0][0]
    }
    return email ? email[0] : "U"
  }

  const handleOpenProfileModal = () => {
    setSelectedNewProfile(userProfileType)
    setShowProfileModal(true)
  }

  const handleConfirmProfileChange = async () => {
    if (!selectedNewProfile) return

    // BLOQUEIO: Mudança de "owner" para "builder" requer upgrade de plano
    if (userProfileType === "owner" && selectedNewProfile === "builder") {
      showMessage("⚠️ Para alternar para o perfil de Construtor/Profissional, você precisa fazer upgrade do seu plano. Entre em contato conosco para mais informações.", "error")
      setShowProfileModal(false)
      return
    }

    const success = await setUserProfile(selectedNewProfile)
    if (success) {
      setUserProfileType(selectedNewProfile)
      setShowProfileModal(false)
      showMessage("✓ Plano de uso atualizado com sucesso!", "success")
    } else {
      showMessage("Não foi possível alterar o perfil. Tente novamente.", "error")
    }
  }

  const getProfileLabel = (profile: UserProfileType): string => {
    if (profile === "owner") return "Dono da obra"
    if (profile === "builder") return "Construtor / Profissional"
    return "Não definido"
  }

  const inputCls = "w-full h-11 px-3 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064]/60 transition-colors"
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-xl mx-auto space-y-3">

        {/* Toast */}
        {showToast && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-sm font-medium text-white max-w-sm w-[calc(100vw-2rem)] ${
            toastType === "success" ? "bg-[#1f2228] border-emerald-500/30" : "bg-[#1f2228] border-red-500/30"
          }`}>
            {toastType === "success"
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span className="flex-1 text-gray-200">{toastMessage}</span>
            <button onClick={() => setShowToast(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <h1 className="text-sm font-bold text-white">Minha Conta</h1>
        </div>

        {/* Avatar */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {formData.avatarDataUrl ? (
              <img src={formData.avatarDataUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#0B3064]/20 border-2 border-[#0B3064]/40 flex items-center justify-center">
                <span className="text-xl font-bold text-[#7eaaee]">{getInitials(formData.name, formData.email).toUpperCase()}</span>
              </div>
            )}
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0B3064] hover:bg-[#082551] rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
              <Camera className="w-3 h-3 text-white" />
              <input id="avatar-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{formData.name || "Sem nome"}</p>
            <p className="text-xs text-gray-500 truncate">{formData.email}</p>
            <p className="text-[10px] text-gray-600 mt-1">Toque no ícone para trocar a foto</p>
          </div>
        </div>

        {/* Dados pessoais */}
        <p className={labelCls}>Dados pessoais</p>
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <p className="text-[11px] text-gray-500 mb-1.5">Nome completo</p>
            <input type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)}
              className={inputCls} placeholder="Seu nome completo" />
          </div>
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <p className="text-[11px] text-gray-500 mb-1.5">E-mail <span className="text-gray-600">(não editável)</span></p>
            <input type="email" value={formData.email} disabled
              className="w-full h-11 px-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm text-gray-600 cursor-not-allowed" />
          </div>
          <div className="px-3 py-3">
            <p className="text-[11px] text-gray-500 mb-1.5">Telefone</p>
            <input type="tel" value={formData.phone} onChange={(e) => handlePhoneChange(e.target.value)}
              className={inputCls} placeholder="(00) 00000-0000" maxLength={15} />
          </div>
        </div>

        {/* Alterar senha */}
        <p className={labelCls + " mt-1"}>Alterar senha</p>
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          {[
            { label: "Senha atual", value: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggle: () => setShowCurrentPassword(v => !v), placeholder: "Digite sua senha atual" },
            { label: "Nova senha", value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(v => !v), placeholder: "Mínimo 6 caracteres" },
            { label: "Confirmar nova senha", value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(v => !v), placeholder: "Repita a nova senha" },
          ].map(({ label, value, setter, show, toggle, placeholder }, i, arr) => (
            <div key={label} className={`px-3 py-3 ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
              <p className="text-[11px] text-gray-500 mb-1.5">{label}</p>
              <div className="relative">
                <input type={show ? "text" : "password"} value={value} onChange={(e) => setter(e.target.value)}
                  className={inputCls + " pr-10"} placeholder={placeholder} />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 px-1 -mt-1">Preencha apenas se quiser alterar a senha. Mínimo 6 caracteres com letras e números.</p>

        {/* Botão salvar */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-11 bg-[#0B3064] hover:bg-[#082551] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
          ) : (
            <><Save className="w-4 h-4" />Salvar alterações</>
          )}
        </button>

      </div>
    </div>
  )
}
