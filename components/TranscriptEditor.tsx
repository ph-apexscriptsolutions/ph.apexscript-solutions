'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Underline,
  RemoveFormatting,
  Palette,
  Pilcrow,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react'

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
  const editorRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const statsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Formatting marks display mode (Microsoft Word style Show/Hide ¶)
  const [showFormattingMarks, setShowFormattingMarks] = useState(false)
  const [overlayHtml, setOverlayHtml] = useState('')

  // Generate lightweight synchronized Pilcrow and space markers
  const updateOverlay = useCallback((customText?: string) => {
    if (!editorRef.current) return
    const text = typeof customText === 'string' ? customText : editorRef.current.innerText || ''
    if (!text) {
      setOverlayHtml('')
      return
    }

    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n')
    let html = ''
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l]
      let lineHtml = ''
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === ' ' || char === '\u00A0') {
          lineHtml += '<span class="relative inline text-transparent">' + char + '<span class="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold select-none pointer-events-none text-[8px] leading-none">·</span></span>'
        } else if (char === '\t') {
          lineHtml += '<span class="relative inline text-transparent">&#9;<span class="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold select-none pointer-events-none text-xs">→</span></span>'
        } else if (char === '<') {
          lineHtml += '&lt;'
        } else if (char === '>') {
          lineHtml += '&gt;'
        } else if (char === '&') {
          lineHtml += '&amp;'
        } else {
          lineHtml += char
        }
      }
      const isLast = l === lines.length - 1
      html += lineHtml + '<span class="relative inline text-transparent"><span class="absolute left-0 text-purple-600 font-bold select-none pointer-events-none pl-0.5">¶</span></span>' + (isLast ? '' : '\n')
    }
    setOverlayHtml(html)
  }, [])

  // Sync overlay whenever formatting marks are toggled
  useEffect(() => {
    if (showFormattingMarks) {
      updateOverlay()
    } else {
      setOverlayHtml('')
    }
  }, [showFormattingMarks, updateOverlay])

  // Hide tools / distraction-free focus mode
  const [hideTools, setHideTools] = useState(false)

  // Target User ID (if admin is inspecting a worker, targetUserId is the selected worker's ID)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    role === 'admin' && initialWorkerId ? initialWorkerId : userId
  )
  const effectiveUserId = role === 'admin' ? selectedWorkerId : userId
  const effectiveRole = role === 'admin' && selectedWorkerId !== userId ? 'worker' : role

  // Multi-slot state (1 to 5) - Slot 5 is dedicated for automated live backup / Auto-Save
  const [activeSlot, setActiveSlot] = useState<number>(1)
  const [slotsMeta, setSlotsMeta] = useState<SlotInfo[]>([])

  // Editor styling & active selection format state
  const [font, setFont] = useState('Calibri')
  const [fontSize, setFontSize] = useState(15)
  const [color, setColor] = useState('#1e293b')
  const [isSelectionBold, setIsSelectionBold] = useState(false)
  const [isSelectionItalic, setIsSelectionItalic] = useState(false)
  const [isSelectionUnderline, setIsSelectionUnderline] = useState(false)

  // Find and replace state
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  // Loading & status states
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, setLoadingSlots] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle')
  const [autoSaveTime, setAutoSaveTime] = useState<Date | null>(null)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Word & Character count states (throttled for zero input lag)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  // Compute text statistics efficiently without blocking typing
  const updateStats = useCallback(() => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ''
    const trimmed = text.trim()
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0)
    setCharCount(text.length)
  }, [])

  // Sync toolbar active states (Bold/Italic/Underline) with current cursor selection
  const syncSelectionState = useCallback(() => {
    try {
      setIsSelectionBold(document.queryCommandState('bold'))
      setIsSelectionItalic(document.queryCommandState('italic'))
      setIsSelectionUnderline(document.queryCommandState('underline'))
    } catch {
      // Ignore if document query fails
    }
  }, [])

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

  // Helper to set editor HTML safely with exact original line spacing
  const setEditorContent = useCallback((rawContent: string) => {
    if (!editorRef.current) return
    if (!rawContent) {
      editorRef.current.innerHTML = ''
      updateStats()
      return
    }

    // Check if rawContent is already formatted HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(rawContent)
    if (isHtml) {
      editorRef.current.innerHTML = rawContent
    } else {
      // Assigning plain text with pre-wrap preserves exact line spacing identical to textarea
      editorRef.current.innerText = rawContent
    }
    updateStats()
    if (showFormattingMarks) {
      updateOverlay(rawContent)
    }
  }, [updateStats, showFormattingMarks, updateOverlay])

  // Normalize default paragraph separator for consistent Enter key behavior
  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'div')
    } catch {}
  }, [])

  // Dedicated Auto-Save Function: automatically backs up ongoing text into Slot 5
  const triggerAutoSaveToSlot5 = useCallback(
    async (htmlContent: string) => {
      if (!effectiveUserId || !htmlContent.trim()) return
      setAutoSaveStatus('saving')

      // 1. Instant local emergency backup for power cut protection
      try {
        localStorage.setItem(`transcript_autosave_slot5_${effectiveRole}_${effectiveUserId}`, htmlContent)
        localStorage.setItem(
          `transcript_autosave_time_slot5_${effectiveRole}_${effectiveUserId}`,
          Date.now().toString()
        )
      } catch {}

      // 2. Cloud Slot 5 auto-save
      try {
        const res = await fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: effectiveRole,
            userId: effectiveUserId,
            content: htmlContent,
            slot: 5,
          }),
        })
        const data = await res.json()
        if (res.ok && !data.error) {
          setAutoSaveStatus('saved')
          setAutoSaveTime(new Date())
          fetchSlotsList(effectiveUserId, effectiveRole)
        } else {
          setAutoSaveStatus('idle')
        }
      } catch (err) {
        console.error('Auto-save to slot 5 error:', err)
        setAutoSaveStatus('idle')
      }
    },
    [effectiveUserId, effectiveRole, fetchSlotsList]
  )

  // Load active slot content from cloud storage (with crash recovery for Slot 5)
  const loadSlotContent = useCallback(
    async (targetId: string, targetRole: string, slotNum: number) => {
      if (!targetId) return
      setLoading(true)

      try {
        const res = await fetch(
          `/api/transcripts?role=${encodeURIComponent(targetRole)}&userId=${encodeURIComponent(
            targetId
          )}&slot=${slotNum}`
        )
        const data = await res.json()

        if (res.ok && data.content) {
          setEditorContent(data.content)
        } else if (slotNum === 5) {
          // Emergency power interruption recovery for Slot 5
          try {
            const emergencyDraft = localStorage.getItem(`transcript_autosave_slot5_${targetRole}_${targetId}`)
            if (emergencyDraft && emergencyDraft.trim()) {
              setEditorContent(emergencyDraft)
              setStatusMessage({
                type: 'info',
                text: 'Recovered ongoing auto-saved draft from local emergency backup.',
              })
            } else {
              setEditorContent('')
            }
          } catch {
            setEditorContent('')
          }
        } else {
          setEditorContent('')
        }
      } catch (err) {
        console.error('Failed to load slot content', err)
        if (slotNum === 5) {
          try {
            const emergencyDraft = localStorage.getItem(`transcript_autosave_slot5_${targetRole}_${targetId}`)
            if (emergencyDraft && emergencyDraft.trim()) {
              setEditorContent(emergencyDraft)
            } else {
              setEditorContent('')
            }
          } catch {
            setEditorContent('')
          }
        } else {
          setEditorContent('')
        }
      } finally {
        setLoading(false)
      }
    },
    [setEditorContent]
  )

  // Load when worker or slot changes
  useEffect(() => {
    if (effectiveUserId) {
      fetchSlotsList(effectiveUserId, effectiveRole)
      loadSlotContent(effectiveUserId, effectiveRole, activeSlot)
    }
  }, [effectiveUserId, effectiveRole, activeSlot, fetchSlotsList, loadSlotContent])

  // Fast typing handler: Native DOM updates with debounced word count and background autosave
  const handleEditorInput = () => {
    setAutoSaveStatus('unsaved')

    // Update formatting marks overlay in requestAnimationFrame if active
    if (showFormattingMarks) {
      requestAnimationFrame(() => updateOverlay())
    }

    // Debounce statistics (word count & char count) off the critical typing path
    if (statsDebounceTimerRef.current) clearTimeout(statsDebounceTimerRef.current)
    statsDebounceTimerRef.current = setTimeout(() => {
      updateStats()
    }, 150)

    // Debounce Slot 5 auto-save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        triggerAutoSaveToSlot5(editorRef.current.innerHTML)
      }
    }, 2000)
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      if (statsDebounceTimerRef.current) clearTimeout(statsDebounceTimerRef.current)
    }
  }, [])

  // ── SELECTION-SPECIFIC RICH FORMATTING HANDLERS ──

  const applyBold = () => {
    document.execCommand('bold', false)
    syncSelectionState()
    handleEditorInput()
  }

  const applyItalic = () => {
    document.execCommand('italic', false)
    syncSelectionState()
    handleEditorInput()
  }

  const applyUnderline = () => {
    document.execCommand('underline', false)
    syncSelectionState()
    handleEditorInput()
  }

  const applyColor = (selectedColor: string) => {
    setColor(selectedColor)
    document.execCommand('foreColor', false, selectedColor)
    handleEditorInput()
  }

  const clearFormatting = () => {
    document.execCommand('removeFormat', false)
    syncSelectionState()
    handleEditorInput()
  }

  // Handle hotkeys (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+S)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        applyBold()
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        applyItalic()
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault()
        applyUnderline()
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        handleManualSave()
      }
    }
  }

  // Find and replace inside contenteditable HTML
  const performFindReplace = () => {
    if (!findText) {
      setStatusMessage({ type: 'error', text: 'Please enter text to find.' })
      return
    }
    if (!editorRef.current) return

    const currentHtml = editorRef.current.innerHTML
    const currentText = editorRef.current.innerText || ''

    if (!currentText.includes(findText)) {
      setStatusMessage({ type: 'info', text: `No occurrences of "${findText}" found.` })
      return
    }

    // Escape regex characters
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    const matches = (currentHtml.match(regex) || []).length

    const updated = currentHtml.replace(regex, replaceText)
    editorRef.current.innerHTML = updated
    updateStats()
    handleEditorInput()
    setStatusMessage({
      type: 'success',
      text: `Replaced ${matches} occurrence${matches > 1 ? 's' : ''} of "${findText}".`,
    })
  }

  // Manual save to active slot in Supabase
  const handleManualSave = async () => {
    if (!editorRef.current) return
    const htmlContent = editorRef.current.innerHTML
    const textContent = editorRef.current.innerText || ''

    if (!textContent.trim()) {
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
          content: htmlContent,
          slot: activeSlot,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatusMessage({ type: 'error', text: `Save failed: ${data.error || 'Unknown error'}` })
      } else {
        setLastSavedTime(new Date())
        setStatusMessage({ type: 'success', text: `Slot ${activeSlot} saved successfully!` })
        fetchSlotsList(effectiveUserId, effectiveRole)
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Unexpected error: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  // Manual export as clean plain-text .txt file
  const handleManualDownload = () => {
    if (!editorRef.current) return
    const plainText = editorRef.current.innerText || ''
    if (!plainText.trim()) return

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${effectiveRole}_${effectiveUserId}_slot${activeSlot}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy with rich HTML clipboard support
  const handleCopy = async () => {
    if (!editorRef.current) return
    const plainText = editorRef.current.innerText || ''
    const htmlContent = editorRef.current.innerHTML

    if (!plainText.trim()) return

    try {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' })
      const blobText = new Blob([plainText], { type: 'text/plain' })
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      })
      await navigator.clipboard.write([item])
    } catch {
      await navigator.clipboard.writeText(plainText)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getFontFamilyStyle = useCallback(() => {
    switch (font) {
      case 'Calibri':
        return 'Calibri, "Segoe UI", sans-serif'
      case 'Times New Roman':
        return '"Times New Roman", Times, Georgia, serif'
      case 'Bahnschrift':
        return 'Bahnschrift, "Segoe UI", sans-serif'
      case 'Cambria':
        return 'Cambria, Georgia, serif'
      default:
        return 'Calibri, "Segoe UI", sans-serif'
    }
  }, [font])

  const exactLineHeight = useMemo(() => Math.round(fontSize * 1.6), [fontSize])

  // Selected worker details for Admin
  const selectedWorkerObj = allWorkers.find((w) => w.id === selectedWorkerId)

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (text) {
      document.execCommand('insertText', false, text)
      handleEditorInput()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* ── FOCUS / DISTRACTION-FREE HEADER BAR (When tools are hidden) ── */}
      {hideTools ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-500/30">
          <div className="flex flex-wrap items-center gap-2">
            {/* Show Tools Toggle */}
            <button
              type="button"
              onClick={() => setHideTools(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-xs cursor-pointer"
              title="Show all formatting tools, font controls, and find & replace"
            >
              <Eye className="w-3.5 h-3.5 text-purple-200" />
              <span>Show Tools</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            {/* Quick Slot Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl text-xs">
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-zinc-400 font-medium">Slot:</span>
              <select
                value={activeSlot}
                onChange={(e) => setActiveSlot(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-purple-200 outline-none cursor-pointer text-xs"
              >
                {[1, 2, 3, 4, 5].map((s) => {
                  const meta = slotsMeta.find((item) => item.slot === s)
                  const hasData = meta?.hasContent || (s === activeSlot && wordCount > 0)
                  return (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s === 5 ? 'Slot 5 (Auto-Save)' : `Slot ${s}`} {hasData ? '●' : '(Empty)'}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Admin Worker Monitor & Switcher (if admin) */}
            {role === 'admin' && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-xs">
                <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">Worker:</span>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value)
                    setActiveSlot(1)
                  }}
                  className="bg-transparent font-bold text-white outline-none cursor-pointer text-xs max-w-[150px] truncate"
                >
                  <option value={userId} className="bg-slate-900 text-white">
                    My Admin Transcripts
                  </option>
                  {allWorkers.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                      {w.full_name || w.id}
                    </option>
                  ))}
                </select>
                {selectedWorkerObj?.last_seen && (() => {
                  const diffMins = (Date.now() - new Date(selectedWorkerObj.last_seen).getTime()) / 60000
                  const isOnline = diffMins < 5
                  return (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700 text-zinc-400'
                      }`}
                      title={isOnline ? 'Worker is Online & Active' : `Last active ${Math.floor(diffMins)}m ago`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                        }`}
                      />
                      <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Right Focus Mode Quick Actions */}
          <div className="flex items-center gap-2">
            {autoSaveStatus === 'saving' ? (
              <span className="text-[10px] text-purple-300 animate-pulse hidden md:inline">
                Auto-saving to Slot 5...
              </span>
            ) : autoSaveTime ? (
              <span className="text-[10px] text-emerald-400 hidden md:inline" title="Ongoing work auto-saved to Slot 5">
                ● Auto-saved ({autoSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : null}

            <span className="text-zinc-300 text-[11px] hidden sm:inline">
              Words: <strong className="text-white">{wordCount}</strong>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              disabled={wordCount === 0}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualDownload}
              disabled={wordCount === 0}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="Download .txt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || wordCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Slot {activeSlot}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
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
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        Worker Live Monitor
                      </span>
                      {selectedWorkerObj?.last_seen && (() => {
                        const diffMins = (Date.now() - new Date(selectedWorkerObj.last_seen).getTime()) / 60000
                        const isOnline = diffMins < 5
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isOnline
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                              }`}
                            />
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-xs text-zinc-300">
                      Inspecting live draft slots of:{' '}
                      <strong className="text-white font-bold">
                        {selectedWorkerObj?.full_name || selectedWorkerId}
                      </strong>
                    </p>
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

          {/* ── TOP TOOLBAR WITH SELECTION FORMATTING ── */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-2xl">
            {/* Controls & Formatting */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Draft Slot Selector */}
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
                    const hasData = meta?.hasContent || (slotNum === activeSlot && wordCount > 0)
                    const words = slotNum === activeSlot ? wordCount : meta?.wordCount || 0
                    return (
                      <option key={slotNum} value={slotNum} className="text-zinc-900">
                        {slotNum === 5
                          ? `Slot 5 (Auto-Save) ${hasData ? `(${words} words)` : '(Empty)'}`
                          : `Slot ${slotNum} ${hasData ? `(${words} words)` : '(Empty)'}`}
                      </option>
                    )
                  })}
                </select>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    slotsMeta.find((s) => s.slot === activeSlot)?.hasContent || wordCount > 0
                      ? 'bg-emerald-500 ring-2 ring-emerald-100'
                      : 'bg-zinc-300'
                  }`}
                  title={
                    slotsMeta.find((s) => s.slot === activeSlot)?.hasContent || wordCount > 0
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

              {/* Selection Text Color Picker */}
              <div
                className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-xs"
                title="Change color of selected/highlighted text"
              >
                <Palette className="w-4 h-4 text-purple-600" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => applyColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                  title="Apply Color to Selected Text"
                />
              </div>

              {/* Selection Rich Formatting Buttons (Bold, Italic, Underline, Clear) */}
              <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault() // prevent losing editor text selection
                    applyBold()
                  }}
                  className={`p-2 text-xs font-bold transition-colors cursor-pointer ${
                    isSelectionBold ? 'bg-purple-600 text-white' : 'text-zinc-700 hover:bg-purple-50'
                  }`}
                  title="Bold Highlighted Text (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyItalic()
                  }}
                  className={`p-2 text-xs italic transition-colors border-l border-zinc-200 cursor-pointer ${
                    isSelectionItalic ? 'bg-purple-600 text-white' : 'text-zinc-700 hover:bg-purple-50'
                  }`}
                  title="Italicize Highlighted Text (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyUnderline()
                  }}
                  className={`p-2 text-xs transition-colors border-l border-zinc-200 cursor-pointer ${
                    isSelectionUnderline ? 'bg-purple-600 text-white' : 'text-zinc-700 hover:bg-purple-50'
                  }`}
                  title="Underline Highlighted Text (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    clearFormatting()
                  }}
                  className="p-2 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-zinc-200 cursor-pointer"
                  title="Clear formatting on selection"
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Microsoft Word Style Show/Hide ¶ Button */}
              <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowFormattingMarks(!showFormattingMarks)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    showFormattingMarks
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-zinc-700 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                  title="Show/Hide paragraph marks (¶) like Microsoft Word"
                >
                  <Pilcrow className="w-3.5 h-3.5" />
                  <span>{showFormattingMarks ? 'Hide ¶' : 'Show ¶'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-xl shadow-xs text-purple-700 text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Auto-saving Slot 5...</span>
                </div>
              ) : autoSaveTime ? (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs text-emerald-800 text-[11px]"
                  title="Ongoing work auto-saved in Slot 5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Slot 5 Auto-saved (
                    {autoSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
              ) : null}

              {lastSavedTime && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-zinc-200/80 rounded-xl shadow-xs text-zinc-600 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Manual Saved at{' '}
                    {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Hide Tools / Focus Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setHideTools(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-purple-200/90 bg-purple-50 hover:bg-purple-100 text-purple-800 transition-all shadow-xs cursor-pointer"
                title="Hide all toolbars for a distraction-free maximized typing area"
              >
                <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Hide Tools</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={wordCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={handleManualDownload}
                disabled={wordCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                title="Download .txt"
              >
                <Download className="w-3.5 h-3.5" />
                Export .txt
              </button>

              <button
                type="button"
                onClick={handleManualSave}
                disabled={saving || wordCount === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Slot {activeSlot}</span>
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
                  placeholder="Find text..."
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
              className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace All
            </button>

            {wordCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Clear content in Slot ${activeSlot}?`)) {
                    if (editorRef.current) {
                      editorRef.current.innerHTML = ''
                      updateStats()
                      handleEditorInput()
                      setStatusMessage(null)
                    }
                  }
                }}
                className="text-xs text-zinc-500 hover:text-red-600 px-2 py-1 transition-colors cursor-pointer"
              >
                Clear Slot
              </button>
            )}
          </div>
        </>
      )}

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
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── HIGH-PERFORMANCE WYSIWYG RICH TEXT EDITOR ── */}
      <div className="relative flex-1 min-h-[300px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-inner focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}

        {/* Synchronized Formatting Marks Overlay (¶ and space dots) */}
        {showFormattingMarks && (
          <div
            ref={overlayRef}
            aria-hidden="true"
            style={{
              fontFamily: getFontFamilyStyle(),
              fontSize: `${fontSize}px`,
              lineHeight: `${exactLineHeight}px`,
              padding: '16px',
              color: 'transparent',
              boxSizing: 'border-box',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              tabSize: 4,
            }}
            className="absolute inset-0 pointer-events-none select-none z-0 overflow-y-scroll overflow-x-hidden"
            dangerouslySetInnerHTML={{ __html: overlayHtml }}
          />
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={syncSelectionState}
          onMouseUp={syncSelectionState}
          onSelect={syncSelectionState}
          onScroll={(e) => {
            if (overlayRef.current) {
              overlayRef.current.scrollTop = e.currentTarget.scrollTop
              overlayRef.current.scrollLeft = e.currentTarget.scrollLeft
            }
          }}
          data-show-marks={showFormattingMarks ? 'true' : 'false'}
          style={{
            fontFamily: getFontFamilyStyle(),
            fontSize: `${fontSize}px`,
            lineHeight: `${exactLineHeight}px`,
            padding: '16px',
            minHeight: '100%',
            outline: 'none',
            color: '#1e293b',
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          className="transcript-rich-editor w-full flex-1 bg-transparent overflow-y-auto overflow-x-hidden relative z-10"
        />
      </div>

      {/* ── CSS for Instant Formatting Marks & Paragraph Spacing Normalization ── */}
      <style jsx global>{`
        .transcript-rich-editor p,
        .transcript-rich-editor div {
          margin: 0 !important;
          padding: 0 !important;
          line-height: inherit !important;
        }
        .transcript-rich-editor[data-show-marks='true'] p::after,
        .transcript-rich-editor[data-show-marks='true'] div::after {
          content: ' ¶';
          color: #a1a1aa;
          font-weight: bold;
          pointer-events: none;
          user-select: none;
          font-size: 0.85em;
        }
        .transcript-rich-editor:empty:before {
          content: 'Paste raw transcript or start typing...';
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>

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
