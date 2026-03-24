"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, BellOff, Plus, X, RotateCcw, Building2, HardHat } from "lucide-react"
import { loadAlertConfig, saveAlertConfig, getDefaultConfig, type AlertConfig } from "@/lib/alert-config"

// ── sub-components fora do render para evitar re-mount ─────────────────────

function ToggleSwitch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={e => !disabled && (e.key === " " || e.key === "Enter") && onToggle()}
      style={{
        width: 51,
        height: 31,
        minWidth: 51,
        borderRadius: 100,
        padding: 2,
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: on ? "#2563eb" : "#3a3a3c",
        transition: "background-color 0.2s ease",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 27,
          height: 27,
          minWidth: 27,
          borderRadius: "50%",
          backgroundColor: "white",
          boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
          transform: on ? "translateX(20px)" : "translateX(0px)",
          transition: "transform 0.2s ease",
          flexShrink: 0,
        }}
      />
    </div>
  )
}

function ThresholdPill({
  value,
  onRemove,
  disabled,
}: {
  value: number
  onRemove: () => void
  disabled?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#7eaaee]">
      {value}%
      {!disabled && (
        <button
          onClick={onRemove}
          className="text-[#7eaaee]/50 hover:text-red-400 transition-colors leading-none ml-0.5"
          aria-label={`Remover ${value}%`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

// ── section card (fora do render para evitar re-mount) ───────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  globalDisabled,
  thresholds,
  inputValue,
  setInput,
  error,
  setError,
  inputRef,
  onAdd,
  onRemove,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  enabled: boolean
  onToggle: () => void
  globalDisabled: boolean
  thresholds: number[]
  inputValue: string
  setInput: (v: string) => void
  error: string
  setError: (e: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  onAdd: () => void
  onRemove: (value: number) => void
}) {
  const isDisabled = globalDisabled || !enabled

  return (
    <div className={`bg-[#1f2228]/80 border rounded-2xl overflow-hidden transition-opacity
      ${globalDisabled ? "border-white/[0.05] opacity-40 pointer-events-none" : "border-white/[0.08]"}`}>

      {/* header da seção */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            ${enabled && !globalDisabled ? "bg-[#0B3064]/20" : "bg-white/[0.06]"}`}>
            <span className={enabled && !globalDisabled ? "text-[#7eaaee]" : "text-[#555]"}>
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{title}</p>
            <p className="text-xs text-[#666] mt-0.5 leading-tight">{subtitle}</p>
          </div>
        </div>
        <ToggleSwitch on={enabled} onToggle={onToggle} disabled={globalDisabled} />
      </div>

      {/* marcos */}
      {enabled && !globalDisabled && (
        <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5 space-y-4">
          {thresholds.length === 0 ? (
            <p className="text-xs text-[#555] italic">Nenhum marco definido. Adicione abaixo.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {thresholds.map(t => (
                <ThresholdPill
                  key={t}
                  value={t}
                  onRemove={() => onRemove(t)}
                  disabled={isDisabled}
                />
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={inputValue}
                  onChange={e => { setInput(e.target.value); setError("") }}
                  onKeyDown={e => e.key === "Enter" && onAdd()}
                  placeholder="Novo marco (1–100)"
                  className="w-full bg-[#2a2d35] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white
                    placeholder-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors
                    [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">%</span>
              </div>
              <button
                onClick={onAdd}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#0B3064] hover:bg-[#082551]
                  active:bg-blue-800 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Adicionar</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

export default function ConfigurarAlertasPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [inputObra, setInputObra] = useState("")
  const [inputProf, setInputProf] = useState("")
  const [errorObra, setErrorObra] = useState("")
  const [errorProf, setErrorProf] = useState("")
  const [salvo, setSalvo] = useState(false)
  const inputObraRef = useRef<HTMLInputElement>(null)
  const inputProfRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setConfig(loadAlertConfig())
  }, [])

  if (!config) return null

  // ── helpers ──────────────────────────────────────────────────────────────

  const persist = (next: AlertConfig) => {
    saveAlertConfig(next)
    setConfig(next)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const addThreshold = (type: "obra" | "profissional", raw: string, setError: (e: string) => void) => {
    const v = parseInt(raw, 10)
    if (isNaN(v) || v <= 0 || v > 100) {
      setError("Digite um número entre 1 e 100")
      return
    }
    if (config[type].thresholds.includes(v)) {
      setError("Este marco já existe")
      return
    }
    setError("")
    const sorted = [...config[type].thresholds, v].sort((a, b) => a - b)
    persist({ ...config, [type]: { ...config[type], thresholds: sorted } })
    if (type === "obra") setInputObra("")
    else setInputProf("")
  }

  const removeThreshold = (type: "obra" | "profissional", value: number) => {
    persist({ ...config, [type]: { ...config[type], thresholds: config[type].thresholds.filter(t => t !== value) } })
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      {/* Salvo toast */}
      {salvo && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#1f2228] border border-green-500/30
          backdrop-blur-sm rounded-full text-xs font-medium text-green-400 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          ✓ Configuração salva
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 sm:px-6">
        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#0B3064]/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-[#7eaaee]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Configurar Alertas</h1>
            <p className="text-xs text-[#666] mt-0.5">Defina quando o app deve te avisar sobre gastos.</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Toggle global */}
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl px-4 py-4 sm:px-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.enabled ? "bg-[#0B3064]/20" : "bg-white/[0.06]"}`}>
                {config.enabled
                  ? <Bell className="w-4 h-4 text-[#7eaaee]" />
                  : <BellOff className="w-4 h-4 text-[#555]" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Alertas de orçamento</p>
                <p className="text-xs text-[#666] mt-0.5">
                  {config.enabled ? "Notificações ativas" : "Todas as notificações desativadas"}
                </p>
              </div>
            </div>
            <ToggleSwitch on={config.enabled} onToggle={() => persist({ ...config, enabled: !config.enabled })} />
          </div>

          {/* Orçamento da obra */}
          <SectionCard
            icon={<Building2 className="w-4 h-4" />}
            title="Orçamento da obra"
            subtitle="Alerta ao atingir % do orçamento total"
            enabled={config.obra.enabled}
            onToggle={() => persist({ ...config, obra: { ...config.obra, enabled: !config.obra.enabled } })}
            globalDisabled={!config.enabled}
            thresholds={config.obra.thresholds}
            inputValue={inputObra}
            setInput={setInputObra}
            error={errorObra}
            setError={setErrorObra}
            inputRef={inputObraRef}
            onAdd={() => addThreshold("obra", inputObra, setErrorObra)}
            onRemove={(v) => removeThreshold("obra", v)}
          />

          {/* Profissionais */}
          <SectionCard
            icon={<HardHat className="w-4 h-4" />}
            title="Profissionais (mão de obra)"
            subtitle="Alerta ao atingir % do valor combinado"
            enabled={config.profissional.enabled}
            onToggle={() => persist({ ...config, profissional: { ...config.profissional, enabled: !config.profissional.enabled } })}
            globalDisabled={!config.enabled}
            thresholds={config.profissional.thresholds}
            inputValue={inputProf}
            setInput={setInputProf}
            error={errorProf}
            setError={setErrorProf}
            inputRef={inputProfRef}
            onAdd={() => addThreshold("profissional", inputProf, setErrorProf)}
            onRemove={(v) => removeThreshold("profissional", v)}
          />

          {/* Como funciona */}
          <div className="bg-[#1f2228]/50 border border-white/[0.06] rounded-2xl px-4 py-4 sm:px-5 space-y-2">
            <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Como funciona</p>
            <p className="text-xs text-[#666] leading-relaxed">
              Os alertas aparecem <span className="text-[#aaa] font-medium">antes de confirmar</span> um lançamento, quando o valor atingir ou cruzar um marco configurado.
            </p>
            <p className="text-xs text-[#666] leading-relaxed">
              Ao ultrapassar 100% do combinado com um profissional, o app sugere a revisão do contrato.
            </p>
          </div>

          {/* Restaurar padrões */}
          <button
            onClick={() => persist(getDefaultConfig())}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.08]
              text-sm text-[#666] hover:text-white hover:border-white/[0.12] hover:bg-[#1f2228]/60
              transition-colors active:bg-[#1f2228]"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar configurações padrão
          </button>
        </div>
      </div>
    </div>
  )
}
