"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, DollarSign, Users, HandCoins } from "lucide-react"

const navItems = [
  {
    icon: DollarSign,
    label: "Despesas",
    path: "/despesas",
    match: (p: string) => p === "/despesas" || p.startsWith("/dashboard/despesas"),
  },
  {
    icon: HandCoins,
    label: "Clientes",
    path: "/dashboard/clientes",
    match: (p: string) => p.startsWith("/dashboard/clientes"),
  },
  {
    icon: Home,
    label: "Obras",
    path: "/obras",
    center: true,
    match: (p: string) => p === "/obras",
  },
  {
    icon: Users,
    label: "Equipe",
    path: "/equipe",
    match: (p: string) => p === "/equipe" || p.startsWith("/dashboard/profissionais"),
  },
]

const HIDDEN_PATHS = ["/relatorio", "/imprimir", "/preview", "/reset-password", "/test-supabase"]

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  if (!pathname) return null
  if (pathname === "/") return null
  if (HIDDEN_PATHS.some((p) => pathname.includes(p))) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-white/[0.08]">
      <div className="flex items-end justify-around px-2 pb-2 pt-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon

          if (item.center) {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                  active
                    ? "bg-blue-500 border-blue-400"
                    : "bg-[#0B3064] hover:bg-[#082551] border-blue-700"
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-[#7eaaee]" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? "text-[#7eaaee]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
