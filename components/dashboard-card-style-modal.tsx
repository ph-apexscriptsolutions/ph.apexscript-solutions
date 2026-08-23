"use client"

import React, { useState } from "react"
import { X, Sparkles, Sun, Moon, Check, RotateCcw, Paintbrush, Sliders, Type } from "lucide-react"

export interface DashboardCardStyle {
  bgGradient: string
  borderColor: string
  borderWidth: string
  textColor: string
  headerColor: string
  labelColor: string
  valueColor: string
  fontFamily: string
  customBorderColor?: string
  customHeaderColor?: string
  customTextColor?: string
  customLabelColor?: string
  customValueColor?: string
}

interface Preset {
  id: string
  name: string
  icon: string
  style: DashboardCardStyle
}

const CURATED_PRESETS: Preset[] = [
  {
    id: "executive-light",
    name: "Executive Light",
    icon: "☀️",
    style: {
      bgGradient: "from-white to-slate-100",
      borderColor: "border-slate-300",
      borderWidth: "border",
      headerColor: "text-slate-900",
      textColor: "text-slate-800",
      labelColor: "text-slate-500",
      valueColor: "text-slate-900",
      fontFamily: "font-sans",
      customBorderColor: "#cbd5e1",
      customHeaderColor: "#0f172a",
      customTextColor: "#1e293b",
      customLabelColor: "#64748b",
      customValueColor: "#0f172a",
    },
  },
  {
    id: "ice-blue",
    name: "Ice Blue",
    icon: "❄️",
    style: {
      bgGradient: "from-sky-50 to-blue-50/80",
      borderColor: "border-sky-200",
      borderWidth: "border",
      headerColor: "text-sky-950",
      textColor: "text-slate-800",
      labelColor: "text-sky-700",
      valueColor: "text-blue-700",
      fontFamily: "font-sans",
      customBorderColor: "#bae6fd",
      customHeaderColor: "#082f49",
      customTextColor: "#1e293b",
      customLabelColor: "#0369a1",
      customValueColor: "#1d4ed8",
    },
  },
  {
    id: "emerald-mint",
    name: "Emerald Mint",
    icon: "🌿",
    style: {
      bgGradient: "from-emerald-50 to-teal-50/80",
      borderColor: "border-emerald-200",
      borderWidth: "border",
      headerColor: "text-emerald-950",
      textColor: "text-emerald-950",
      labelColor: "text-emerald-700",
      valueColor: "text-teal-700",
      fontFamily: "font-sans",
      customBorderColor: "#a7f3d0",
      customHeaderColor: "#022c22",
      customTextColor: "#064e3b",
      customLabelColor: "#047857",
      customValueColor: "#0f766e",
    },
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    icon: "🔥",
    style: {
      bgGradient: "from-amber-50 to-orange-50/70",
      borderColor: "border-amber-200",
      borderWidth: "border",
      headerColor: "text-amber-950",
      textColor: "text-zinc-800",
      labelColor: "text-amber-800",
      valueColor: "text-orange-700",
      fontFamily: "font-sans",
      customBorderColor: "#fde68a",
      customHeaderColor: "#451a03",
      customTextColor: "#27272a",
      customLabelColor: "#92400e",
      customValueColor: "#c2410c",
    },
  },
  {
    id: "midnight-pro",
    name: "Midnight Pro",
    icon: "🌙",
    style: {
      bgGradient: "from-slate-900 to-slate-950",
      borderColor: "border-slate-700",
      borderWidth: "border",
      headerColor: "text-white",
      textColor: "text-slate-200",
      labelColor: "text-slate-400",
      valueColor: "text-cyan-400",
      fontFamily: "font-sans",
      customBorderColor: "#334155",
      customHeaderColor: "#ffffff",
      customTextColor: "#e2e8f0",
      customLabelColor: "#94a3b8",
      customValueColor: "#22d3ee",
    },
  },
  {
    id: "cyber-cyan",
    name: "Cyber Cyan",
    icon: "💎",
    style: {
      bgGradient: "from-slate-950 to-cyan-950",
      borderColor: "border-cyan-500/30",
      borderWidth: "border",
      headerColor: "text-cyan-100",
      textColor: "text-slate-200",
      labelColor: "text-cyan-300/80",
      valueColor: "text-cyan-300",
      fontFamily: "font-sans",
      customBorderColor: "#06b6d4",
      customHeaderColor: "#cffafe",
      customTextColor: "#e2e8f0",
      customLabelColor: "#67e8f9",
      customValueColor: "#67e8f9",
    },
  },
  {
    id: "obsidian-dark",
    name: "Obsidian Onyx",
    icon: "🖤",
    style: {
      bgGradient: "from-zinc-900 to-black",
      borderColor: "border-zinc-800",
      borderWidth: "border",
      headerColor: "text-white",
      textColor: "text-zinc-300",
      labelColor: "text-zinc-400",
      valueColor: "text-white",
      fontFamily: "font-sans",
      customBorderColor: "#27272a",
      customHeaderColor: "#ffffff",
      customTextColor: "#d4d4d8",
      customLabelColor: "#a1a1aa",
      customValueColor: "#ffffff",
    },
  },
  {
    id: "royal-violet",
    name: "Royal Violet",
    icon: "👑",
    style: {
      bgGradient: "from-slate-950 to-purple-950",
      borderColor: "border-purple-500/30",
      borderWidth: "border",
      headerColor: "text-purple-100",
      textColor: "text-slate-200",
      labelColor: "text-purple-300/80",
      valueColor: "text-purple-300",
      fontFamily: "font-sans",
      customBorderColor: "#a855f7",
      customHeaderColor: "#f3e8ff",
      customTextColor: "#e2e8f0",
      customLabelColor: "#d8b4fe",
      customValueColor: "#d8b4fe",
    },
  },
]

interface GradientOption {
  name: string
  value: string
  isLight: boolean
  accentColor?: string
  defaultBorder?: string
}

const GRADIENT_OPTIONS: GradientOption[] = [
  // Light Gradients
  { name: "Executive White", value: "from-white to-slate-100", isLight: true, accentColor: "text-slate-900", defaultBorder: "border-slate-300" },
  { name: "Ice Blue", value: "from-sky-50 to-blue-50/80", isLight: true, accentColor: "text-blue-700", defaultBorder: "border-sky-200" },
  { name: "Emerald Mint", value: "from-emerald-50 to-teal-50/80", isLight: true, accentColor: "text-emerald-700", defaultBorder: "border-emerald-200" },
  { name: "Violet Soft", value: "from-violet-50 to-purple-50/80", isLight: true, accentColor: "text-purple-700", defaultBorder: "border-purple-200" },
  { name: "Rose Blush", value: "from-rose-50 to-pink-50/80", isLight: true, accentColor: "text-rose-700", defaultBorder: "border-rose-200" },
  { name: "Warm Amber", value: "from-amber-50 to-yellow-50/80", isLight: true, accentColor: "text-orange-700", defaultBorder: "border-amber-200" },
  { name: "Sunset Peach", value: "from-orange-50 to-red-50/80", isLight: true, accentColor: "text-orange-700", defaultBorder: "border-orange-200" },
  { name: "Nordic Slate", value: "from-slate-100 to-zinc-200/80", isLight: true, accentColor: "text-zinc-900", defaultBorder: "border-zinc-300" },
  
  // Dark Gradients
  { name: "Slate Midnight", value: "from-slate-900 to-slate-950", isLight: false, accentColor: "text-cyan-400", defaultBorder: "border-slate-700" },
  { name: "Cyber Cyan", value: "from-slate-950 to-cyan-950", isLight: false, accentColor: "text-cyan-300", defaultBorder: "border-cyan-500/30" },
  { name: "Deep Navy", value: "from-slate-950 to-blue-950", isLight: false, accentColor: "text-blue-300", defaultBorder: "border-blue-500/30" },
  { name: "Emerald Night", value: "from-slate-950 to-emerald-950", isLight: false, accentColor: "text-emerald-400", defaultBorder: "border-emerald-500/30" },
  { name: "Purple Eclipse", value: "from-slate-950 to-purple-950", isLight: false, accentColor: "text-purple-300", defaultBorder: "border-purple-500/30" },
  { name: "Crimson Velvet", value: "from-slate-950 to-rose-950", isLight: false, accentColor: "text-rose-400", defaultBorder: "border-rose-500/30" },
  { name: "Amber Torch", value: "from-slate-950 to-amber-950", isLight: false, accentColor: "text-amber-300", defaultBorder: "border-amber-500/30" },
  { name: "Obsidian Black", value: "from-zinc-900 to-black", isLight: false, accentColor: "text-white", defaultBorder: "border-zinc-800" },
]

interface DashboardCardStyleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  cardType: "worker" | "bank" | "stats" | "production"
  styleData: DashboardCardStyle
  onStyleChange: (newStyle: DashboardCardStyle) => void
  onSave: () => void
  onReset: () => void
  extraHeaderField?: {
    label: string
    value: string
    onChange: (val: string) => void
    placeholder?: string
  }
  helperNote?: React.ReactNode
}

export function DashboardCardStyleModal({
  isOpen,
  onClose,
  title,
  description,
  cardType,
  styleData,
  onStyleChange,
  onSave,
  onReset,
  extraHeaderField,
  helperNote,
}: DashboardCardStyleModalProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets")

  if (!isOpen) return null

  // Auto-contrast background changer
  const handleSelectGradient = (grad: GradientOption) => {
    if (grad.isLight) {
      onStyleChange({
        ...styleData,
        bgGradient: grad.value,
        headerColor: "text-zinc-900",
        textColor: "text-zinc-800",
        labelColor: "text-zinc-600",
        valueColor: grad.accentColor || "text-cyan-700",
        borderColor: grad.defaultBorder || "border-zinc-300",
        customHeaderColor: "#111827",
        customTextColor: "#1f2937",
        customLabelColor: "#4b5563",
        customValueColor: "#0e7490",
        customBorderColor: "#d4d4d8",
      })
    } else {
      onStyleChange({
        ...styleData,
        bgGradient: grad.value,
        headerColor: "text-white",
        textColor: "text-zinc-200",
        labelColor: "text-zinc-400",
        valueColor: grad.accentColor || "text-cyan-300",
        borderColor: grad.defaultBorder || "border-slate-700/60",
        customHeaderColor: "#ffffff",
        customTextColor: "#e4e4e7",
        customLabelColor: "#9ca3af",
        customValueColor: "#67e8f9",
        customBorderColor: "#334155",
      })
    }
  }

  const handleApplyPreset = (preset: Preset) => {
    onStyleChange({
      ...styleData,
      ...preset.style,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-gradient-to-r from-zinc-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 shadow-sm">
              <Paintbrush className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Optional Helper Note */}
          {helperNote}

          {/* Extra field (e.g. Worker Title) */}
          {extraHeaderField && (
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">{extraHeaderField.label}</label>
              <input
                type="text"
                value={extraHeaderField.value}
                onChange={(e) => extraHeaderField.onChange(e.target.value)}
                placeholder={extraHeaderField.placeholder || "Enter title..."}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          )}

          {/* ── LIVE PREVIEW CARD ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Live Card Preview
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Real-time contrast check</span>
            </div>

            <div className={`rounded-2xl ${styleData.borderWidth || 'border'} ${styleData.borderColor || 'border-zinc-300'} bg-gradient-to-br ${styleData.bgGradient} p-5 shadow-lg transition-all duration-200 ${styleData.fontFamily || 'font-sans'}`}>
              
              {/* Worker Profile Preview */}
              {cardType === "worker" && (
                <div>
                  <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold shadow-md">
                        JD
                      </div>
                      <div>
                        <h4 className={`font-bold text-base ${styleData.headerColor}`}>John Doe</h4>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-semibold text-current opacity-80">
                          {extraHeaderField?.value || "WORKER"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-3 space-y-1.5 text-xs ${styleData.textColor}`}>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">📋</span>
                      <span>Audio Transcriber</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">🏢</span>
                      <span>Legal Department</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">📍</span>
                      <span>United States 🇺🇸</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Details Preview */}
              {cardType === "bank" && (
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 mb-3">
                    <div>
                      <h4 className={`font-bold text-sm ${styleData.headerColor}`}>Bank Details</h4>
                      <p className={`text-[11px] ${styleData.labelColor}`}>Direct Deposit Account</p>
                    </div>
                  </div>
                  <div className={`space-y-1.5 text-xs ${styleData.textColor}`}>
                    <div className="flex items-center justify-between">
                      <span className={styleData.labelColor}>Bank Name:</span>
                      <span className={`font-semibold ${styleData.valueColor}`}>Chase Bank N.A.</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={styleData.labelColor}>Account Number:</span>
                      <span className={`font-mono font-semibold ${styleData.valueColor}`}>•••• 8492</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={styleData.labelColor}>Routing Number:</span>
                      <span className={`font-mono font-semibold ${styleData.valueColor}`}>122000496</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards Preview */}
              {cardType === "stats" && (
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2 mb-2">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${styleData.headerColor}`}>Total Files</h4>
                    <div className="h-6 w-6 rounded-md bg-black/10 dark:bg-white/20 flex items-center justify-center text-xs">
                      📁
                    </div>
                  </div>
                  <div className={`text-2xl font-extrabold tracking-tight ${styleData.textColor}`}>1,482</div>
                  <p className={`text-[10px] mt-0.5 ${styleData.labelColor}`}>All Time Completed</p>
                </div>
              )}

              {/* Production Table Preview */}
              {cardType === "production" && (
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 mb-3">
                    <h4 className={`font-bold text-sm ${styleData.headerColor}`}>Production Records</h4>
                    <span className={`text-[11px] font-semibold ${styleData.labelColor}`}>4 files listed</span>
                  </div>
                  <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden text-xs">
                    <div className={`flex justify-between px-3 py-1.5 font-bold uppercase text-[10px] bg-black/10 dark:bg-white/10 ${styleData.headerColor}`}>
                      <span>File Name</span>
                      <span>Size (KB)</span>
                    </div>
                    <div className={`flex justify-between px-3 py-2 border-t border-black/10 dark:border-white/10 ${styleData.textColor}`}>
                      <span>interview_audio_01.mp3</span>
                      <span className={`font-bold ${styleData.valueColor}`}>420.5 KB</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── QUICK CONTRAST AUTO PRESETS ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600" /> Quick Contrast Auto Presets
              </label>
              <span className="text-[11px] text-zinc-400">One-click guaranteed readability</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CURATED_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white hover:border-cyan-400 hover:shadow-md transition text-left group"
                >
                  <div className={`h-7 w-7 rounded-lg border border-zinc-200/80 bg-gradient-to-br ${preset.style.bgGradient} flex items-center justify-center text-xs shadow-inner shrink-0`}>
                    {preset.icon}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-800 group-hover:text-cyan-700 truncate">{preset.name}</p>
                    <p className="text-[10px] text-zinc-400">{preset.style.bgGradient.includes("slate-9") || preset.style.bgGradient.includes("black") ? "Dark" : "Light"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── TABS: BACKGROUND GRADIENTS & FINE-TUNE ── */}
          <div className="border-t border-zinc-200 pt-4">
            <div className="flex border-b border-zinc-200 mb-4">
              <button
                onClick={() => setActiveTab("presets")}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === "presets"
                    ? "border-cyan-600 text-cyan-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Sun className="h-3.5 w-3.5" /> Background Gradients (Auto-Contrast)
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === "custom"
                    ? "border-cyan-600 text-cyan-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" /> Fine-Tune Colors & Typography
              </button>
            </div>

            {/* TAB 1: Background Gradients with visual swatches */}
            {activeTab === "presets" && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-zinc-700 mb-2 flex items-center gap-1">
                    <span>☀️</span> Light Themes (Auto-Sets Crisp Dark Text)
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GRADIENT_OPTIONS.filter((g) => g.isLight).map((grad) => {
                      const isSelected = styleData.bgGradient === grad.value
                      return (
                        <button
                          key={grad.value}
                          onClick={() => handleSelectGradient(grad)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-20 relative ${
                            isSelected
                              ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md"
                              : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                          } bg-gradient-to-br ${grad.value}`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-zinc-900 px-1 py-0.5 rounded bg-white/70 backdrop-blur-sm self-start shadow-sm">
                            {grad.name}
                          </span>
                          <span className="text-[9px] text-zinc-600 font-medium">Auto Contrast</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-zinc-700 mb-2 flex items-center gap-1">
                    <span>🌙</span> Dark Themes (Auto-Sets Luminous White Text)
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GRADIENT_OPTIONS.filter((g) => !g.isLight).map((grad) => {
                      const isSelected = styleData.bgGradient === grad.value
                      return (
                        <button
                          key={grad.value}
                          onClick={() => handleSelectGradient(grad)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-20 relative ${
                            isSelected
                              ? "border-cyan-400 ring-2 ring-cyan-400/20 shadow-md"
                              : "border-zinc-700/60 hover:border-zinc-500 hover:shadow-sm"
                          } bg-gradient-to-br ${grad.value}`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-[10px]">
                              <Check className="h-2.5 w-2.5 font-bold" />
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-black/50 backdrop-blur-sm self-start shadow-sm">
                            {grad.name}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-medium">Auto Contrast</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Fine-tuning */}
            {activeTab === "custom" && (
              <div className="space-y-4">
                
                {/* Border Width & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Border Width</label>
                    <div className="flex gap-1.5">
                      {[
                        { name: "None", value: "" },
                        { name: "Thin", value: "border" },
                        { name: "Medium", value: "border-2" },
                        { name: "Thick", value: "border-4" },
                      ].map((w) => (
                        <button
                          key={w.value}
                          onClick={() => onStyleChange({ ...styleData, borderWidth: w.value })}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                            styleData.borderWidth === w.value
                              ? "border-cyan-500 bg-cyan-50 text-cyan-700 font-bold"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                          }`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Border Color</label>
                    <div className="flex gap-2">
                      <select
                        value={styleData.borderColor}
                        onChange={(e) => onStyleChange({ ...styleData, borderColor: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800 outline-none"
                      >
                        <option value="border-zinc-200">Light Gray</option>
                        <option value="border-zinc-300">Medium Gray</option>
                        <option value="border-slate-700/60">Slate Dark</option>
                        <option value="border-zinc-800">Black/Zinc 800</option>
                        <option value="border-cyan-300">Cyan</option>
                        <option value="border-cyan-500/30">Cyan Translucent</option>
                        <option value="border-emerald-300">Emerald</option>
                        <option value="border-emerald-500/30">Emerald Translucent</option>
                        <option value="border-purple-300">Purple</option>
                        <option value="border-purple-500/30">Purple Translucent</option>
                        <option value="border-orange-300">Orange</option>
                        <option value="border-rose-300">Rose</option>
                      </select>
                      <input
                        type="color"
                        value={styleData.customBorderColor || "#cbd5e1"}
                        onChange={(e) =>
                          onStyleChange({
                            ...styleData,
                            borderColor: `border-[${e.target.value}]`,
                            customBorderColor: e.target.value,
                          })
                        }
                        className="h-8 w-10 rounded cursor-pointer border border-zinc-300"
                        title="Pick custom border color"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Font Typography</label>
                  <div className="flex gap-2">
                    {[
                      { name: "Modern Sans", value: "font-sans" },
                      { name: "Editorial Serif", value: "font-serif" },
                      { name: "Technical Mono", value: "font-mono" },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => onStyleChange({ ...styleData, fontFamily: f.value })}
                        className={`flex-1 p-2 rounded-lg border text-xs font-medium transition ${
                          styleData.fontFamily === f.value
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700 font-bold"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Text Overrides */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Header Text Color</label>
                    <div className="flex gap-1.5">
                      <select
                        value={styleData.headerColor}
                        onChange={(e) => onStyleChange({ ...styleData, headerColor: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none"
                      >
                        <option value="text-zinc-900">Black / Deep Zinc</option>
                        <option value="text-white">Pure White</option>
                        <option value="text-slate-800">Dark Slate</option>
                        <option value="text-cyan-100">Cyan Light</option>
                        <option value="text-emerald-100">Emerald Light</option>
                        <option value="text-purple-100">Purple Light</option>
                      </select>
                      <input
                        type="color"
                        value={styleData.customHeaderColor || "#111827"}
                        onChange={(e) =>
                          onStyleChange({
                            ...styleData,
                            headerColor: `text-[${e.target.value}]`,
                            customHeaderColor: e.target.value,
                          })
                        }
                        className="h-8 w-8 rounded cursor-pointer border border-zinc-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Body Text Color</label>
                    <div className="flex gap-1.5">
                      <select
                        value={styleData.textColor}
                        onChange={(e) => onStyleChange({ ...styleData, textColor: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none"
                      >
                        <option value="text-zinc-800">Dark Slate (800)</option>
                        <option value="text-zinc-900">Black (900)</option>
                        <option value="text-zinc-200">Light Gray (200)</option>
                        <option value="text-white">White</option>
                        <option value="text-slate-300">Soft Slate</option>
                      </select>
                      <input
                        type="color"
                        value={styleData.customTextColor || "#1f2937"}
                        onChange={(e) =>
                          onStyleChange({
                            ...styleData,
                            textColor: `text-[${e.target.value}]`,
                            customTextColor: e.target.value,
                          })
                        }
                        className="h-8 w-8 rounded cursor-pointer border border-zinc-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Label Color</label>
                    <div className="flex gap-1.5">
                      <select
                        value={styleData.labelColor}
                        onChange={(e) => onStyleChange({ ...styleData, labelColor: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none"
                      >
                        <option value="text-zinc-600">Medium Gray (600)</option>
                        <option value="text-zinc-500">Subtle Gray (500)</option>
                        <option value="text-zinc-400">Soft Light (400)</option>
                        <option value="text-cyan-700">Cyan Dark</option>
                        <option value="text-cyan-300/80">Cyan Luminous</option>
                        <option value="text-emerald-700">Emerald Dark</option>
                        <option value="text-amber-800">Amber Dark</option>
                      </select>
                      <input
                        type="color"
                        value={styleData.customLabelColor || "#4b5563"}
                        onChange={(e) =>
                          onStyleChange({
                            ...styleData,
                            labelColor: `text-[${e.target.value}]`,
                            customLabelColor: e.target.value,
                          })
                        }
                        className="h-8 w-8 rounded cursor-pointer border border-zinc-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Value / Accent Color</label>
                    <div className="flex gap-1.5">
                      <select
                        value={styleData.valueColor}
                        onChange={(e) => onStyleChange({ ...styleData, valueColor: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none"
                      >
                        <option value="text-cyan-700">Cyan Accent (Dark)</option>
                        <option value="text-cyan-400">Cyan Accent (Light)</option>
                        <option value="text-blue-700">Blue Accent</option>
                        <option value="text-emerald-700">Emerald Accent</option>
                        <option value="text-orange-700">Orange Accent</option>
                        <option value="text-purple-700">Purple Accent</option>
                        <option value="text-zinc-900">Black / Deep Zinc</option>
                        <option value="text-white">White</option>
                      </select>
                      <input
                        type="color"
                        value={styleData.customValueColor || "#0e7490"}
                        onChange={(e) =>
                          onStyleChange({
                            ...styleData,
                            valueColor: `text-[${e.target.value}]`,
                            customValueColor: e.target.value,
                          })
                        }
                        className="h-8 w-8 rounded cursor-pointer border border-zinc-300"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-zinc-200 px-6 py-4 bg-zinc-50">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave()
                onClose()
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:from-cyan-700 hover:to-sky-700 transition"
            >
              <Check className="h-4 w-4" /> Apply & Save
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
