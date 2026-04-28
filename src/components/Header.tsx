"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, LogOut, FolderOpen, HelpCircle, Settings, Home, LayoutGrid, Bell, Briefcase, ChevronRight, HandCoins, HardHat, Compass, PenTool, X, Send } from "lucide-react"
import { getActiveObra } from "@/lib/storage"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("U")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [obraAtiva, setObraAtiva] = useState<string | null>(null)
  const [activeObraId, setActiveObraId] = useState<string | null>(null)
  const [obraNomeCliente, setObraNomeCliente] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [espModal, setEspModal] = useState<"engenheiro" | "arquiteto" | null>(null)
  const [espForm, setEspForm] = useState({ assunto: "", descricao: "" })
  const [enviandoEsp, setEnviandoEsp] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2>(2) // 0=logo, 1=obra, 2=done
  const menuRef = useRef<HTMLDivElement>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadUserData = async () => {
    const userProfileStr = localStorage.getItem("userProfile")
    const userDataStr = localStorage.getItem("user")

    let name = ""
    let email = ""
    let avatar: string | null = null

    if (userProfileStr) {
      const profile = JSON.parse(userProfileStr)
      name = profile.name || ""
      email = profile.email || ""
      avatar = profile.avatarDataUrl || null
    } else if (userDataStr) {
      const user = JSON.parse(userDataStr)
      name = user.name || ""
      email = user.email || ""
      avatar = user.avatarDataUrl || null
    }

    const cachedAvatar = localStorage.getItem("cachedAvatarUrl")
    const cachedTs = Number(localStorage.getItem("cachedAvatarTs") || 0)
    if (cachedAvatar) avatar = cachedAvatar

    setUserName(name)
    setUserEmail(email)
    setAvatarUrl(avatar)

    if (name) {
      const parts = name.trim().split(" ")
      setUserInitials(parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0])
    } else if (email) {
      setUserInitials(email[0])
    } else {
      setUserInitials("U")
    }

    const FIVE_MIN = 5 * 60 * 1000
    if (cachedAvatar && Date.now() - cachedTs < FIVE_MIN) return

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single()

      const fresh = profileData?.avatar_url ?? null
      if (fresh && fresh !== cachedAvatar) {
        setAvatarUrl(fresh)
        localStorage.setItem("cachedAvatarUrl", fresh)
        localStorage.setItem("cachedAvatarTs", String(Date.now()))
      } else if (fresh) {
        localStorage.setItem("cachedAvatarTs", String(Date.now()))
      } else if (cachedAvatar) {
        localStorage.removeItem("cachedAvatarUrl")
        localStorage.removeItem("cachedAvatarTs")
        setAvatarUrl(null)
      }
    } catch {
      // mantém o cache; sem fallback adicional
    }
  }

  useEffect(() => {
    loadUserData()

    // Carregar perfil do usuário
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserProfile(user.profile || null)
      } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error)
        setUserProfile(null)
      }
    }

    // Carregar obra ativa do Supabase
    const loadActiveObra = async () => {
      try {
        const { getActiveObraFromSupabase } = await import("@/lib/storage")
        const obra = await getActiveObraFromSupabase()

        if (obra) {
          setObraAtiva(obra.nome)
          setActiveObraId(obra.id)
          setObraNomeCliente(obra.nomeCliente || null)

          const onboardingDone = localStorage.getItem("headerOnboardingDone")
          if (!onboardingDone) {
            tooltipTimeoutRef.current = setTimeout(() => {
              setOnboardingStep(0)
            }, 500)
          }
        } else {
          // Limpar estado se não houver obra ativa
          setObraAtiva(null)
          setActiveObraId(null)
          setObraNomeCliente(null)
        }
      } catch (error) {
        console.error("Erro ao carregar obra ativa:", error)
        setObraAtiva(null)
        setActiveObraId(null)
        setObraNomeCliente(null)
      }
    }

    loadActiveObra()

    // Listener para atualização de perfil
    const handleProfileUpdate = () => {
      loadUserData()
    }

    // Listener para atualização de obra ativa
    const handleObraUpdate = () => {
      loadActiveObra()
    }

    window.addEventListener("userProfileUpdated", handleProfileUpdate)
    window.addEventListener("obraAtualizada", handleObraUpdate)

    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate)
      window.removeEventListener("obraAtualizada", handleObraUpdate)
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [pathname])

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    // Fazer logout do Supabase
    try {
      const { supabase } = await import("@/lib/supabase")
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Erro ao fazer logout do Supabase:", error)
    }

    // Limpar apenas dados de sessão, mas manter o perfil do usuário
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("activeObraId")

    // NÃO remover userProfile e user para manter avatar e dados entre sessões
    // localStorage.removeItem("userProfile")
    // localStorage.removeItem("user")

    router.push("/login")
  }

  const handleNavigation = (path: string) => {
    setMenuOpen(false)
    router.push(path)
  }

  const handleOpenProfileModal = () => {
    setMenuOpen(false)
    router.push("/dashboard/plano")
  }

  const handleLogoClick = () => {
    if (pathname?.startsWith("/admin")) {
      router.push("/admin")
    } else {
      router.push("/obras")
    }
  }

  const handleObraDashboardClick = () => {
    if (activeObraId) {
      router.push("/dashboard/obra")
    }
  }

  const handleDismissOnboarding = () => {
    if (onboardingStep === 0) {
      if (obraAtiva && pathname !== "/obras") {
        setOnboardingStep(1)
      } else {
        setOnboardingStep(2)
        localStorage.setItem("headerOnboardingDone", "true")
      }
    } else {
      setOnboardingStep(2)
      localStorage.setItem("headerOnboardingDone", "true")
    }
  }

  // Verificar se está no dashboard da obra
  const isOnObraDashboard = pathname === "/dashboard/obra" || pathname?.startsWith("/dashboard/obra/")

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B3064] border-b border-white/[0.08] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo clicável */}
          <div className="relative">
            <button
              onClick={handleLogoClick}
              className="relative flex items-center bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg p-[3px] active:scale-95 transition-all duration-150"
              aria-label="Voltar para lista de obras"
            >
              <img
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/f350fbaf-266c-404d-8471-e0e89b5a6eda.jpg"
                alt="Obreasy"
                className="h-8 w-auto rounded-md"
              />
            </button>
            {onboardingStep === 0 && (
              <div className="absolute top-full left-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#1a2540] rotate-45 border-l border-t border-white/20" />
                <div className="bg-[#1a2540] border border-white/20 rounded-xl px-3 py-2.5 shadow-xl w-[200px]">
                  <p className="text-xs text-white font-medium text-center mb-2">Toque aqui para acessar suas obras</p>
                  <button onClick={handleDismissOnboarding} className="w-full text-[10px] font-semibold text-[#7eaaee] hover:text-white bg-white/[0.06] hover:bg-white/[0.10] rounded-lg py-1.5 transition-colors">Entendi</button>
                </div>
              </div>
            )}
          </div>

          {/* Centro - Obra ativa */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none max-w-[45vw] sm:max-w-[320px]">
            {obraAtiva && pathname !== "/obras" && (
              <div className="relative pointer-events-auto">
                <button
                  onClick={handleObraDashboardClick}
                  className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] rounded-lg px-2.5 py-1.5 active:scale-95 transition-all duration-150"
                  title="Voltar ao dashboard da obra"
                >
                  <Home className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
                  <span className="text-sm font-semibold text-white truncate">
                    {obraAtiva}
                  </span>
                </button>
                {onboardingStep === 1 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a2540] rotate-45 border-l border-t border-white/20" />
                    <div className="bg-[#1a2540] border border-white/20 rounded-xl px-3 py-2.5 shadow-xl min-w-[220px]">
                      <p className="text-xs text-white font-medium text-center mb-2">Toque aqui para voltar ao dashboard da obra</p>
                      <button onClick={handleDismissOnboarding} className="w-full text-[10px] font-semibold text-[#7eaaee] hover:text-white bg-white/[0.06] hover:bg-white/[0.10] rounded-lg py-1.5 transition-colors">Entendi</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ícones de ação e avatar */}
          <div className="flex items-center gap-3">
            {/* Avatar e menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative p-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors overflow-hidden ring-2 ring-white shadow-sm"
                aria-label="Menu do usuário"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover scale-110"
                  />
                ) : (
                  <span className="text-sm sm:text-base">{userInitials.toUpperCase()}</span>
                )}
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-60 max-w-xs bg-[#13151a] rounded-2xl shadow-2xl shadow-black/60 border border-white/[0.08] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* Cabeçalho — avatar + nome + perfil */}
                  <div className="flex items-center gap-3 px-3.5 py-3 border-b border-white/[0.06]">
                    <div className="w-9 h-9 rounded-full bg-[#0B3064] flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{userInitials.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate leading-tight">{userName || "Usuário"}</p>
                      {userProfile && (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-[#7eaaee]">
                          {userProfile === "builder" ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {userProfile === "builder" ? "Construtor / Profissional" : "Dono da Obra"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Todos os itens */}
                  <div className="p-1.5 space-y-0.5">
                    {([
                      { icon: User,        label: "Minha Conta",           action: () => handleNavigation("/dashboard/conta") },
                      { icon: LayoutGrid,  label: "Plano",                  action: handleOpenProfileModal },
                      { icon: FolderOpen,  label: "Minhas Obras",           action: () => handleNavigation("/obras") },
                      { icon: Bell,        label: "Configurar Alertas",     action: () => handleNavigation("/dashboard/configurar-alertas") },
                      { icon: HelpCircle,  label: "Suporte",                action: () => handleNavigation("/dashboard/suporte") },
                    ] as const).map(({ icon: Icon, label, action }) => (
                      <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10] transition-colors text-left">
                        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16 }}>
                          <Icon style={{ width: 16, height: 16, display: 'block' }} className="text-gray-500" />
                        </span>
                        {label}
                      </button>
                    ))}

                    <div className="pt-1 pb-0.5"><div className="border-t border-white/[0.06]" /></div>

                    <button onClick={() => { setMenuOpen(false); setEspModal("engenheiro"); setEspForm({ assunto: "", descricao: "" }) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10] transition-colors text-left">
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16 }}>
                        <HardHat style={{ width: 16, height: 16, display: 'block' }} className="text-gray-500" />
                      </span>
                      Fale com o Engenheiro
                    </button>
                    <button onClick={() => { setMenuOpen(false); setEspModal("arquiteto"); setEspForm({ assunto: "", descricao: "" }) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10] transition-colors text-left">
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16 }}>
                        <PenTool style={{ width: 16, height: 16, display: 'block' }} className="text-gray-500" />
                      </span>
                      Fale com o Arquiteto
                    </button>
                  </div>

                  {/* Sair */}
                  <div className="px-1.5 pb-1.5 border-t border-white/[0.06]">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/15 transition-colors text-left mt-1.5">
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16 }}>
                        <LogOut style={{ width: 16, height: 16, display: 'block' }} className="text-red-400" />
                      </span>
                      Sair da conta
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal Fale com Especialista */}
      {espModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEspModal(null)} />
          <div className="relative w-full sm:max-w-md bg-[#111c2e] sm:rounded-2xl rounded-t-2xl border border-slate-700/50 p-5 pb-8 sm:pb-5">
            {/* Header do modal */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${espModal === "engenheiro" ? "bg-orange-500/15" : "bg-purple-500/15"}`}>
                {espModal === "engenheiro"
                  ? <HardHat className="w-5 h-5 text-orange-400" />
                  : <Compass className="w-5 h-5 text-purple-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {espModal === "engenheiro" ? "Fale com o Engenheiro" : "Fale com o Arquiteto"}
                </p>
                <p className="text-xs text-gray-400">
                  {espModal === "engenheiro" ? "Dúvidas técnicas sobre sua obra" : "Dúvidas sobre projeto e estética"}
                </p>
              </div>
              <button onClick={() => setEspModal(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setEnviandoEsp(true)
                const tipo = espModal === "engenheiro" ? "Consulta com Engenheiro" : "Consulta com Arquiteto"
                try {
                  const res = await fetch("/api/suporte", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: userEmail, mensagem: espForm.descricao, assunto: espForm.assunto, tipo }),
                  })
                  if (!res.ok) throw new Error()
                  setEspModal(null)
                  setEspForm({ assunto: "", descricao: "" })
                } catch {
                  alert("Erro ao enviar mensagem. Tente novamente.")
                } finally {
                  setEnviandoEsp(false)
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Assunto *</label>
                <input
                  type="text"
                  required
                  value={espForm.assunto}
                  onChange={(e) => setEspForm({ ...espForm, assunto: e.target.value })}
                  placeholder={espModal === "engenheiro" ? "Ex: Dúvida sobre fundação..." : "Ex: Dúvida sobre revestimento..."}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Descrição da dúvida *</label>
                <textarea
                  required
                  rows={4}
                  value={espForm.descricao}
                  onChange={(e) => setEspForm({ ...espForm, descricao: e.target.value })}
                  placeholder="Descreva sua dúvida com o máximo de detalhes..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!espForm.assunto.trim() || !espForm.descricao.trim() || enviandoEsp}
                className={`w-full py-3 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  espModal === "engenheiro" ? "bg-orange-600 hover:bg-orange-700" : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {enviandoEsp ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {enviandoEsp ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
