"use client"

import { LucideIcon } from "lucide-react"

interface DashboardCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: string
    positive: boolean
  }
}

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = "text-[#7eaaee]",
  iconBg = "bg-[#0B3064]/10",
  trend 
}: DashboardCardProps) {
  return (
    <div className="bg-[#1f2228]/80 rounded-2xl p-6 border border-white/[0.08] hover:border-slate-600/50 hover:shadow-xl transition-all backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
            trend.positive 
              ? "bg-emerald-500/20 text-emerald-400" 
              : "bg-red-500/20 text-red-400"
          }`}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
