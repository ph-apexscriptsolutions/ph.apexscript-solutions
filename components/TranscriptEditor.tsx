'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2,
  Save,
  Download,
  Copy,
  Check,
  Search,
  RefreshCw,
  Type,
  Bold,
  Italic,
  Palette,
  Pilcrow,
  Cloud,
  CheckCircle2,
  Users,
  Eye,
  FileText,
  Clock,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react'

type AutoSaveState = 'saved' | 'saving' | 'unsaved' | 'offline' | 'idle'

interface WorkerOption {
  id: string
  full_name?: string
  role?: string
  department?: string
  last_seen?: string
}

interface SlotInfo {
  slot: number
  title: string
  hasContent: boolean
  wordCount: number
  charCount: number
  preview: string
  updatedAt: string | null
}

interface TranscriptEditorProps {
  role: 'admin' | 'worker'
  userId: string
  allWorkers?: WorkerOption[]
  initialWorkerId?: string
}

export default function TranscriptEditor({
  role,
  userId,
  allWorkers = [],
  initialWorkerId,
}: TranscriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  // Formatting marks display mode (Microsoft Word style Show/Hide ¶)
  const [showFormattingMarks, setShowFormattingMarks] = useState(false)

  // Target User ID (if admin is inspecting a worker, targetUserId is the selected worker's ID)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    role === 'admin' && initialWorkerId ? initialWorkerId : userId
  )
  const effectiveUserId = role === 'admin' ? selectedWorkerId : userId
  const effectiveRole = role === 'admin' && selectedWorkerId !== userId ? 'worker' : role

  // Multi-slot state (1 to 5)
  const [activeSlot, setActiveSlot] = useState<number>(1)
  const [slotsMeta, setSlotsMeta] = useState<SlotInfo[]>([])
  const [slotNames, setSlotNames] = useState<Record<number, string>>({
    1: 'Draft 1 / Main',
    2: 'Draft 2 / Revision',
    3: 'Draft 3 / Revision',
    4: 'Draft 4',
    5: 'Draft 5',
  })

  // Editor content & formatting
  const [content, setContent] = useState('')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [font, setFont] = useState('Calibri')
  const [fontSize, setFontSize] = useState(15)
  const [color, setColor] = useState('#1e293b')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveState>('idle')
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [replaceCount, setReplaceCount] = useState<number | null>(null)

  // Refresh slots metadata list
  const fetchSlotsList = useCallback(async (targetId: string, targetRole: string) => {
    if (!targetId) return
    setLoadingSlots(true)
    try {
      const res = await fetch(
        `/api/transcripts?action=list&role=${encodeURIComponent(targetRole)}&userId=${encodeURIComponent(targetId)}`
      )
      const data = await res.json()
      if (res.ok && data.slots) {
        setSlotsMeta(data.slots)
      }
    } catch (err) {
      console.error('Failed to fetch slots list', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  // Load active slot content
  const loadSlotContent = useCallback(
    async (targetId: string, targetRole: string, slotNum: number) => {
      if (!targetId) return
      setLoading(true)
      isInitialLoadRef.current = true

      const localKey = `transcript_draft_${targetRole}_${targetId}_slot${slotNum}`
      const localTimeKey = `transcript_draft_time_${targetRole}_${targetId}_slot${slotNum}`

      try {
        const localDraft = localStorage.getItem(localKey)
        const localTime = localStorage.getItem(localTimeKey)

        const res = await fetch(
          `/api/transcripts?role=${encodeURIComponent(targetRole)}&userId=${encodeURIComponent(
            targetId
          )}&slot=${slotNum}`
        )
        const data = await res.json()

        let cloudContent = ''
        if (res.ok && data.content) {
          cloudContent = data.content
          setContent(cloudContent)
          setAutoSaveStatus('saved')
          setLastSavedTime(new Date())
        }

        // Restore local draft if newer or cloud is empty
        if (localDraft && localDraft.trim() && (!cloudContent || localDraft.length >= cloudContent.length)) {
          setContent(localDraft)
          setAutoSaveStatus('saved')
          if (localTime) setLastSavedTime(new Date(parseInt(localTime, 10)))
        } else if (!cloudContent) {
          setContent('')
          setAutoSaveStatus('idle')
        }
      } catch (err) {
        console.error('Failed to load slot content', err)
        const localDraft = localStorage.getItem(localKey)
        if (localDraft) setContent(localDraft)
      } finally {
        setLoading(false)
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 300)
      }
    },
    []
  )

  // Load when worker or slot changes
  useEffect(() => {
    if (effectiveUserId) {
      fetchSlotsList(effectiveUserId, effectiveRole)
      loadSlotContent(effectiveUserId, effectiveRole, activeSlot)
    }
  }, [effectiveUserId, effectiveRole, activeSlot, fetchSlotsList, loadSlotContent])

  // Real-time Cloud Auto-Save Function
  const triggerCloudAutoSave = useCallback(
    async (textToSave: string, slotNum: number) => {
      if (!effectiveUserId || !textToSave.trim()) return
      setAutoSaveStatus('saving')
      try {
        const res = await fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: effectiveRole,
            userId: effectiveUserId,
            content: textToSave,
            slot: slotNum,
          }),
        })
        const data = await res.json()
        if (res.ok && !data.error) {
          setAutoSaveStatus('saved')
          setLastSavedTime(new Date())
          fetchSlotsList(effectiveUserId, effectiveRole)
        } else {
          setAutoSaveStatus('offline')
        }
      } catch (err) {
        console.error('Auto-save error', err)
        setAutoSaveStatus('offline')
      }
    },
    [effectiveUserId, effectiveRole, fetchSlotsList]
  )

  // Content change handler: instant localStorage update + debounced cloud auto-save
  const handleContentChange = (newText: string) => {
    setContent(newText)

    // 1. Immediate local storage snapshot
    const localKey = `transcript_draft_${effectiveRole}_${effectiveUserId}_slot${activeSlot}`
    const localTimeKey = `transcript_draft_time_${effectiveRole}_${effectiveUserId}_slot${activeSlot}`
    try {
      localStorage.setItem(localKey, newText)
      localStorage.setItem(localTimeKey, Date.now().toString())
    } catch (e) {}

    if (isInitialLoadRef.current) return

    setAutoSaveStatus('unsaved')

    // 2. Debounced cloud auto-save (1.5 seconds)
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      triggerCloudAutoSave(newText, activeSlot)
    }, 1500)
  }

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  const handlePasteIntercept = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (content.trim()) {
      const confirmPaste = window.confirm(
        'A transcript is already present in this slot. Pasting will replace the current content. Continue?'
      )
      if (!confirmPaste) {
        e.preventDefault()
        return
      }
    }
  }

  const performFindReplace = () => {
    if (!findText) {
      setStatusMessage({ type: 'error', text: 'Please enter text to find.' })
      return
    }
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    const matches = (content.match(regex) || []).length
    if (matches === 0) {
      setStatusMessage({ type: 'info', text: `No occurrences of "${findText}" found (case-sensitive).` })
      setReplaceCount(0)
      return
    }
    const updated = content.replace(regex, replaceText)
    handleContentChange(updated)
    setReplaceCount(matches)
    setStatusMessage({ type: 'success', text: `Replaced ${matches} occurrence${matches > 1 ? 's' : ''} of "${findText}".` })
  }

  const handleManualSave = async () => {
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: 'Transcript is empty. Nothing to save.' })
      return
    }
    if (!effectiveUserId) {
      setStatusMessage({ type: 'error', text: 'User ID not found.' })
      return
    }

    setSaving(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: effectiveRole,
          userId: effectiveUserId,
          content,
          slot: activeSlot,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatusMessage({ type: 'error', text: `Save failed: ${data.error || 'Unknown error'}` })
      } else {
        setAutoSaveStatus('saved')
        setLastSavedTime(new Date())
        setStatusMessage({ type: 'success', text: `Slot ${activeSlot} saved to cloud successfully!` })
        fetchSlotsList(effectiveUserId, effectiveRole)

        // Auto-download for workers
        if (role === 'worker') {
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `transcript_${effectiveUserId}_slot${activeSlot}.txt`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Unexpected error: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleManualDownload = () => {
    if (!content.trim()) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${effectiveRole}_${effectiveUserId}_slot${activeSlot}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Remove any literal '¶' characters that were previously typed/inserted into the document
  const removeLiteralPilcrows = () => {
    if (!content.includes('¶')) return
    const cleaned = content.replace(/¶/g, '')
    handleContentChange(cleaned)
    setStatusMessage({ type: 'info', text: 'Cleaned all literal ¶ characters from text.' })
  }

  // Microsoft Word Style Visual Formatting Marks Generator (¶ for paragraph ends, · for spaces, → for tabs)
  const renderFormattedMarks = (text: string) => {
    if (!showFormattingMarks || !text) return null

    const lines = text.split('\n')
    return lines.map((line, lineIdx) => {
      const parts: React.ReactNode[] = []
      let currentWord = ''

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === ' ') {
          if (currentWord) {
            parts.push(<span key={`w-${lineIdx}-${i}`} className="opacity-0">{currentWord}</span>)
            currentWord = ''
          }
          parts.push(
            <span key={`s-${lineIdx}-${i}`} className="text-purple-400 font-bold select-none inline-block">
              ·
            </span>
          )
        } else if (char === '\t') {
          if (currentWord) {
            parts.push(<span key={`w-${lineIdx}-${i}`} className="opacity-0">{currentWord}</span>)
            currentWord = ''
          }
          parts.push(
            <span key={`t-${lineIdx}-${i}`} className="text-indigo-400 font-bold select-none inline-block">
              →{'   '}
            </span>
          )
        } else {
          currentWord += char
        }
      }

      if (currentWord) {
        parts.push(<span key={`w-${lineIdx}-end`} className="opacity-0">{currentWord}</span>)
      }

      const isLastLine = lineIdx === lines.length - 1

      return (
        <React.Fragment key={lineIdx}>
          {parts}
          <span className="text-purple-600 font-extrabold select-none inline-block px-0.5 bg-purple-100/60 rounded-xs">
            ¶
          </span>
          {!isLastLine && '\n'}
        </React.Fragment>
      )
    })
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  const getFontFamilyStyle = () => {
    switch (font) {
      case 'Calibri':
        return 'Calibri, sans-serif'
      case 'Times New Roman':
        return '"Times New Roman", Times, serif'
      case 'Bahnschrift':
        return 'Bahnschrift, sans-serif'
      case 'Cambria':
        return 'Cambria, serif'
      default:
        return 'Calibri, sans-serif'
    }
  }

  // Selected worker details for Admin
  const selectedWorkerObj = allWorkers.find((w) => w.id === selectedWorkerId)

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* ── ADMIN WORKER PROGRESS & MONITOR BAR ── */}
      {role === 'admin' && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 rounded-2xl border border-indigo-500/30 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Worker Live Monitor</span>
                  {selectedWorkerObj?.last_seen && (() => {
                    const diffMins = (Date.now() - new Date(selectedWorkerObj.last_seen).getTime()) / 60000
                    return diffMins < 5 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online & Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                        <Clock className="h-2.5 w-2.5" />
                        Active {Math.floor(diffMins)}m ago
                      </span>
                    )
                  })()}
                </div>
                <p className="text-[11px] text-zinc-400">Inspect real-time progress & all 5 draft slots of any worker</p>
              </div>
            </div>

            {/* Worker Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300 font-medium">Select Worker:</span>
              <select
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(e.target.value)
                  setActiveSlot(1)
                }}
                className="rounded-xl border border-indigo-400/40 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
              >
                <option value={userId}>My Admin Transcripts</option>
                {allWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name || w.id} {w.department ? `(${w.department})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-2xl">
        {/* Controls & Formatting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compact Saved Drafts & Revisions Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-purple-200/90 hover:border-purple-300 px-2.5 py-1.5 rounded-xl shadow-xs transition-colors">
            <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">Draft Slot:</span>
            <select
              value={activeSlot}
              onChange={(e) => {
                const nextSlot = parseInt(e.target.value, 10)
                if (nextSlot !== activeSlot) {
                  setActiveSlot(nextSlot)
                }
              }}
              className="text-xs font-bold text-purple-950 bg-transparent outline-none cursor-pointer pr-1"
            >
              {[1, 2, 3, 4, 5].map((slotNum) => {
                const meta = slotsMeta.find((s) => s.slot === slotNum)
                const hasData = meta?.hasContent || (slotNum === activeSlot && content.trim().length > 0)
                const words = slotNum === activeSlot ? wordCount : meta?.wordCount || 0
                return (
                  <option key={slotNum} value={slotNum} className="text-zinc-900">
                    Slot {slotNum} {hasData ? `(${words} words)` : '(Empty)'}
                  </option>
                )
              })}
            </select>
            {/* Live slot status dot */}
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                (slotsMeta.find((s) => s.slot === activeSlot)?.hasContent || content.trim().length > 0)
                  ? 'bg-emerald-500 ring-2 ring-emerald-100'
                  : 'bg-zinc-300'
              }`}
              title={
                (slotsMeta.find((s) => s.slot === activeSlot)?.hasContent || content.trim().length > 0)
                  ? 'Saved content in active slot'
                  : 'Active slot is empty'
              }
            />
          </div>

          <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

          {/* Font Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-xs">
            <Type className="w-4 h-4 text-zinc-500" />
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="text-xs font-semibold text-zinc-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="Calibri">Calibri</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Bahnschrift">Bahnschrift</option>
              <option value="Cambria">Cambria</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-500 font-medium">Size</span>
            <input
              type="number"
              min={10}
              max={36}
              value={fontSize}
              onChange={(e) => setFontSize(Math.max(10, Math.min(36, parseInt(e.target.value) || 14)))}
              className="w-12 text-xs font-bold text-zinc-800 text-center bg-transparent outline-none"
            />
            <span className="text-[10px] text-zinc-400">px</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-xs">
            <Palette className="w-4 h-4 text-zinc-500" />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Text Color"
            />
          </div>

          {/* Bold & Italic */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsBold(!isBold)}
              className={`p-2 text-xs font-bold transition-colors ${
                isBold ? 'bg-purple-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsItalic(!isItalic)}
              className={`p-2 text-xs italic transition-colors border-l border-zinc-200 ${
                isItalic ? 'bg-purple-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Microsoft Word Style Show/Hide ¶ Button */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowFormattingMarks(!showFormattingMarks)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
                showFormattingMarks
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
              title="Show/Hide paragraph marks (¶) and formatting symbols like Microsoft Word"
            >
              <Pilcrow className="w-3.5 h-3.5" />
              <span>{showFormattingMarks ? 'Hide ¶' : 'Show ¶'}</span>
            </button>
            {content.includes('¶') && (
              <button
                type="button"
                onClick={removeLiteralPilcrows}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 border-l border-zinc-200 transition-colors"
                title="Remove literal ¶ characters accidentally typed in the text"
              >
                Clean literal ¶
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons & Google Docs Auto-Save Indicator */}
        <div className="flex items-center gap-2">
          {/* Google Docs-style Auto-Save Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/80 rounded-xl shadow-xs">
            {autoSaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span className="text-zinc-600 font-medium text-[11px]">Saving Slot {activeSlot}...</span>
              </>
            ) : autoSaveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-zinc-600 font-medium text-[11px]">
                  Saved to cloud • Slot {activeSlot} {lastSavedTime ? `(${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                </span>
              </>
            ) : autoSaveStatus === 'unsaved' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-zinc-500 text-[11px]">Auto-saving...</span>
              </>
            ) : autoSaveStatus === 'offline' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-zinc-600 font-medium text-[11px]">Saved locally</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 text-[11px]">Auto-save ready</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            type="button"
            onClick={handleManualDownload}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs"
            title="Download .txt"
          >
            <Download className="w-3.5 h-3.5" />
            Export .txt
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : `Save Slot ${activeSlot}`}
          </button>
        </div>
      </div>

      {/* ── FIND & REPLACE BAR ── */}
      <div className="flex flex-wrap items-center gap-2 bg-purple-50/60 border border-purple-200/60 p-2 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="Find (case-sensitive)..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-xl border border-purple-200 bg-white text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/30"
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full px-3 py-1 text-xs rounded-xl border border-purple-200 bg-white text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={performFindReplace}
          className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Replace All
        </button>

        {content && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Clear content in Slot ${activeSlot}?`)) {
                handleContentChange('')
                setStatusMessage(null)
              }
            }}
            className="text-xs text-zinc-500 hover:text-red-600 px-2 py-1 transition-colors"
          >
            Clear Slot
          </button>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`text-xs px-3 py-1.5 rounded-xl border flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor Main Text Area with Synchronized Formatting Marks (Word-Style ¶) */}
      <div className="relative flex-1 min-h-[300px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-inner focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}

        {/* MS Word Formatting Marks Visual Overlay */}
        {showFormattingMarks && (
          <div
            ref={overlayRef}
            aria-hidden="true"
            style={{
              fontFamily: getFontFamilyStyle(),
              fontSize: `${fontSize}px`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              lineHeight: 1.625,
            }}
            className="absolute inset-0 p-4 pointer-events-none whitespace-pre-wrap break-words overflow-y-hidden select-none z-10 font-sans"
          >
            {renderFormattedMarks(content)}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onPaste={handlePasteIntercept}
          onScroll={(e) => {
            if (overlayRef.current) {
              overlayRef.current.scrollTop = e.currentTarget.scrollTop
              overlayRef.current.scrollLeft = e.currentTarget.scrollLeft
            }
          }}
          placeholder={`Paste raw transcript or start typing in Slot ${activeSlot}...`}
          style={{
            fontFamily: getFontFamilyStyle(),
            fontSize: `${fontSize}px`,
            color: color,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            lineHeight: 1.625,
          }}
          className="w-full flex-1 p-4 bg-transparent text-zinc-900 resize-none outline-none leading-relaxed border-0 relative z-10"
        />
      </div>

      {/* Bottom Counter Bar */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2">
        <div className="flex items-center gap-4">
          <span>
            Active Slot: <strong className="text-purple-700">Slot {activeSlot}</strong>
          </span>
          <span>
            Words: <strong className="text-zinc-700">{wordCount}</strong>
          </span>
          <span>
            Characters: <strong className="text-zinc-700">{charCount}</strong>
          </span>
        </div>
        <div className="text-[10px] text-zinc-400">
          User: <span className="font-semibold text-zinc-600">{effectiveUserId}</span> • Role:{' '}
          <span className="font-semibold uppercase text-zinc-600">{effectiveRole}</span>
        </div>
      </div>
    </div>
  )
}


