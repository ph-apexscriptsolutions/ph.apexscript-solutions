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
  Highlighter,
  Undo,
  Redo,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Layers,
  Laptop,
  Globe,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRightLeft,
  Replace,
  Music,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Settings,
  Plus,
  Trash2,
  Volume2,
  Zap,
} from 'lucide-react'
import {
  saveAudioToDB,
  getAudioFromDB,
  deleteAudioFromDB,
  saveAudioPosition,
  getAudioPosition,
  clearAudioPosition,
} from '@/lib/transcript-audio-storage'

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

interface TextShortcut {
  trigger: string
  replacement: string
}

interface HotkeySettings {
  play: string
  pause: string
  rewind: string
  fastForward: string
  copyTimestamp: string
  rewindSeconds: number
  fastSpeed: number
}

interface TranscriptEditorProps {
  role: 'admin' | 'worker'
  userId: string
  allWorkers?: WorkerOption[]
  initialWorkerId?: string
  initialSlot?: number
  onSlotChange?: (slot: number) => void
}

const DEFAULT_HOTKEYS: HotkeySettings = {
  play: 'F4',
  pause: 'F7',
  rewind: 'F2',
  fastForward: 'F3',
  copyTimestamp: 'F9',
  rewindSeconds: 2,
  fastSpeed: 1.5,
}

const DEFAULT_SHORTCUTS: TextShortcut[] = [
  { trigger: 's1:', replacement: 'Speaker 1:' },
  { trigger: 's2:', replacement: 'Speaker 2:' },
  { trigger: 'ia:', replacement: '[inaudible]' },
  { trigger: 'ct:', replacement: '[crosstalk]' },
  { trigger: 'lt:', replacement: '[laughter]' },
  { trigger: 'ap:', replacement: '[applause]' },
]

export default function TranscriptEditor({
  role,
  userId,
  allWorkers = [],
  initialWorkerId,
  initialSlot,
  onSlotChange,
}: TranscriptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const statsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveStatusRef = useRef<'saved' | 'saving' | 'unsaved' | 'idle'>('idle')

  // Hide tools / distraction-free focus mode
  const [hideTools, setHideTools] = useState(false)

  // Target User ID (if admin is inspecting a worker, targetUserId is the selected worker's ID)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    role === 'admin' && initialWorkerId ? initialWorkerId : userId
  )
  const effectiveUserId = role === 'admin' ? selectedWorkerId : userId
  const effectiveRole = role === 'admin' && selectedWorkerId !== userId ? 'worker' : role

  // Slot state: 1 = Save Slot (manual), 2 = Auto-Save
  const [activeSlot, setActiveSlot] = useState<number>(initialSlot === 2 || initialSlot === 5 ? 2 : 1)
  const [slotsMeta, setSlotsMeta] = useState<SlotInfo[]>([])

  // Editor styling & active selection format state
  const [font, setFont] = useState('Calibri')
  const [fontSize, setFontSize] = useState(15)
  const [color, setColor] = useState('#1e293b')
  const [isSelectionBold, setIsSelectionBold] = useState(false)
  const [isSelectionItalic, setIsSelectionItalic] = useState(false)
  const [isSelectionUnderline, setIsSelectionUnderline] = useState(false)

  // Floating mini-toolbar (appears above selected text)
  const [floatToolbar, setFloatToolbar] = useState<{ x: number; y: number } | null>(null)
  const [showFloatHighlightPalette, setShowFloatHighlightPalette] = useState(false)
  const floatToolbarRef = useRef<HTMLDivElement | null>(null)

  // Text Highlighter state (main toolbar palette)
  const [showHighlightPalette, setShowHighlightPalette] = useState(false)

  // Word-Style Find & Replace state
  const [showFindBar, setShowFindBar] = useState(false)
  const [showReplaceInput, setShowReplaceInput] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findMode, setFindMode] = useState<'find' | 'replace'>('find')

  // Loading & status states
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, setLoadingSlots] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle')
  const [autoSaveTime, setAutoSaveTime] = useState<Date | null>(null)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [workerClientType, setWorkerClientType] = useState<'desktop' | 'browser'>('browser')

  // Word, Character, and Double Space count states
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [doubleSpaceCount, setDoubleSpaceCount] = useState(0)

  // ── AUDIO PLAYER (Express Scribe Style) STATE ──
  const [showAudioPlayer, setShowAudioPlayer] = useState(true)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [audioFileName, setAudioFileName] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

  // Refs for audio values used in hotkey callbacks — avoids stale closure and re-registering listeners
  const isPlayingRef = useRef(false)
  const audioSrcRef = useRef<string | null>(null)
  const audioCurrentTimeRef = useRef(0)
  const playbackSpeedRef = useRef(1.0)
  const pendingSeekTimeRef = useRef<number | null>(null)
  const hotkeysRef = useRef<HotkeySettings>(DEFAULT_HOTKEYS)
  const shortcutsRef = useRef<TextShortcut[]>(DEFAULT_SHORTCUTS)

  // Throttle timer ref: display updates at max 4Hz (250ms) instead of every browser frame
  const audioDisplayThrottleRef = useRef<NodeJS.Timeout | null>(null)

  // Protect against accidental tab closure (Ctrl+W, tab close, page refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prompt browser confirmation before closing or reloading
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Restore audio file from IndexedDB and playback timestamp on mount / user change
  useEffect(() => {
    if (!userId) return
    let isMounted = true

    const restorePersistedAudio = async () => {
      try {
        const stored = await getAudioFromDB(userId)
        if (stored && isMounted) {
          const url = URL.createObjectURL(stored.blob)
          audioSrcRef.current = url
          setAudioSrc(url)
          setAudioFileName(stored.name || 'Audio File')

          // Read saved playback position
          const savedTime = getAudioPosition(userId)
          if (savedTime > 0) {
            pendingSeekTimeRef.current = savedTime
            audioCurrentTimeRef.current = savedTime
            setAudioCurrentTime(savedTime)
          }
        }
      } catch (err) {
        console.warn('Could not restore audio from IndexedDB:', err)
      }
    }

    restorePersistedAudio()

    return () => {
      isMounted = false
    }
  }, [userId])

  // ── WORKER PREFERENCES (Hotkeys & Text Expander Shortcuts) ──
  const [hotkeys, setHotkeys] = useState<HotkeySettings>(DEFAULT_HOTKEYS)
  const [shortcuts, setShortcuts] = useState<TextShortcut[]>(DEFAULT_SHORTCUTS)
  const [showHotkeysModal, setShowHotkeysModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [newShortcutTrigger, setNewShortcutTrigger] = useState('')
  const [newShortcutReplacement, setNewShortcutReplacement] = useState('')
  const [isCapturingKey, setIsCapturingKey] = useState<keyof HotkeySettings | null>(null)

  // Keep refs in sync with state (no dependency array churn in hotkey effect)
  useEffect(() => { hotkeysRef.current = hotkeys }, [hotkeys])
  useEffect(() => { shortcutsRef.current = shortcuts }, [shortcuts])

  // Helper to detect if the current session is running inside the Desktop App
  const getMyClientType = useCallback(() => {
    if (typeof window === 'undefined') return 'browser'
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
      ? 'desktop'
      : 'browser'
  }, [])

  // Load Worker Editor Preferences from API
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return
      try {
        const res = await fetch(`/api/worker-editor-preferences?userId=${encodeURIComponent(userId)}`)
        const data = await res.json()
        if (data?.preferences) {
          if (data.preferences.hotkeys) {
            const hk = data.preferences.hotkeys
            setHotkeys({
              ...DEFAULT_HOTKEYS,
              ...hk,
              play: hk.play || hk.playPause || DEFAULT_HOTKEYS.play,
              pause: hk.pause || (hk.playPause === 'F1' ? 'F2' : DEFAULT_HOTKEYS.pause),
            })
          }
          if (Array.isArray(data.preferences.shortcuts)) {
            setShortcuts(data.preferences.shortcuts)
          }
        }
      } catch (err) {
        console.error('Failed to load worker preferences:', err)
      }
    }
    fetchPreferences()
  }, [userId])

  // Save Worker Editor Preferences to Supabase
  const savePreferences = async (newHotkeys = hotkeys, newShortcuts = shortcuts) => {
    if (!userId) return
    try {
      await fetch('/api/worker-editor-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences: {
            hotkeys: newHotkeys,
            shortcuts: newShortcuts,
          },
        }),
      })
    } catch (err) {
      console.error('Failed to save preferences:', err)
    }
  }

  // Calculate matching occurrences for Find & Replace (only when Find Bar is open)
  const findMatchesCount = useMemo(() => {
    if (!showFindBar || !findText || !editorRef.current) return 0
    const text = editorRef.current.innerText || ''
    if (!text) return 0
    try {
      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matches = text.match(new RegExp(escaped, 'gi'))
      return matches ? matches.length : 0
    } catch {
      return 0
    }
  }, [showFindBar, findText, wordCount])

  // Compute text statistics efficiently
  const updateStats = useCallback(() => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ''
    const trimmed = text.trim()
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0)
    setCharCount(text.length)
    const matches = text.match(/[ \u00A0]{2,}/g)
    setDoubleSpaceCount(matches ? matches.length : 0)
  }, [])

  // Sync toolbar active states (Bold/Italic/Underline) + show floating mini-toolbar on selection
  const syncSelectionState = useCallback(() => {
    try {
      setIsSelectionBold(document.queryCommandState('bold'))
      setIsSelectionItalic(document.queryCommandState('italic'))
      setIsSelectionUnderline(document.queryCommandState('underline'))
    } catch {}

    // Show floating toolbar when text is selected inside the editor
    const sel = window.getSelection()
    if (
      sel &&
      !sel.isCollapsed &&
      sel.rangeCount > 0 &&
      editorRef.current?.contains(sel.anchorNode)
    ) {
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = editorRef.current!.getBoundingClientRect()
      // Position toolbar centered above the selection, relative to the editor container's parent
      const x = rect.left - containerRect.left + rect.width / 2
      const y = rect.top - containerRect.top - 8 // 8px above selection
      setFloatToolbar({ x, y })
      setShowFloatHighlightPalette(false)
    } else {
      setFloatToolbar(null)
      setShowFloatHighlightPalette(false)
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
      if (res.ok) {
        if (data.slots) {
          setSlotsMeta(data.slots)
        }
        if (data.clientInfo?.clientType) {
          setWorkerClientType(data.clientInfo.clientType)
        } else if (data.worker?.client_type) {
          setWorkerClientType(data.worker.client_type)
        }
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
      setWordCount(0)
      setCharCount(0)
      setDoubleSpaceCount(0)
      return
    }

    const isHtml = /<[a-z][\s\S]*>/i.test(rawContent)
    if (isHtml) {
      editorRef.current.innerHTML = rawContent
    } else {
      editorRef.current.innerText = rawContent
    }
    const text = editorRef.current.innerText || ''
    const trimmed = text.trim()
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0)
    setCharCount(text.length)
    const matches = text.match(/[ \u00A0]{2,}/g)
    setDoubleSpaceCount(matches ? matches.length : 0)
  }, [])

  // Normalize default paragraph separator for consistent Enter key behavior
  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'div')
    } catch {}
  }, [])

  // Dedicated Auto-Save Function: automatically backs up ongoing text into Auto-Save (Slot 2)
  const triggerAutoSave = useCallback(
    async (htmlContent: string) => {
      // Do NOT auto-save when admin is inspecting a worker
      if (role === 'admin' && selectedWorkerId !== userId) return
      if (!effectiveUserId || !htmlContent.trim()) return

      if (autoSaveStatusRef.current !== 'saving') {
        autoSaveStatusRef.current = 'saving'
        setAutoSaveStatus('saving')
      }

      try {
        localStorage.setItem(`transcript_autosave_slot2_${effectiveRole}_${effectiveUserId}`, htmlContent)
        localStorage.setItem(
          `transcript_autosave_time_slot2_${effectiveRole}_${effectiveUserId}`,
          Date.now().toString()
        )
      } catch {}

      try {
        const res = await fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: effectiveRole,
            userId: effectiveUserId,
            content: htmlContent,
            slot: 2,
            clientType: getMyClientType(),
            actorRole: role,
            actorUserId: userId,
          }),
        })
        const data = await res.json()
        if (res.ok && !data.error) {
          autoSaveStatusRef.current = 'saved'
          setAutoSaveStatus('saved')
          setAutoSaveTime(new Date())
          fetchSlotsList(effectiveUserId, effectiveRole)
        } else {
          autoSaveStatusRef.current = 'idle'
          setAutoSaveStatus('idle')
        }
      } catch (err) {
        console.error('Auto-save error:', err)
        autoSaveStatusRef.current = 'idle'
        setAutoSaveStatus('idle')
      }
    },
    [effectiveUserId, effectiveRole, fetchSlotsList, getMyClientType, role, selectedWorkerId, userId]
  )

  // Load active slot content from cloud storage (with crash recovery for Auto-Save / Slot 2)
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
        } else if (slotNum === 2) {
          try {
            const emergencyDraft =
              localStorage.getItem(`transcript_autosave_slot2_${targetRole}_${targetId}`) ||
              localStorage.getItem(`transcript_autosave_slot5_${targetRole}_${targetId}`)
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
        if (slotNum === 2) {
          try {
            const emergencyDraft =
              localStorage.getItem(`transcript_autosave_slot2_${targetRole}_${targetId}`) ||
              localStorage.getItem(`transcript_autosave_slot5_${targetRole}_${targetId}`)
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

  // Fast zero-lag typing handler with Text Expander (Auto-Replace as you type)
  const handleEditorInput = () => {
    if (autoSaveStatusRef.current !== 'unsaved') {
      autoSaveStatusRef.current = 'unsaved'
      setAutoSaveStatus('unsaved')
    }

    if (statsDebounceTimerRef.current) clearTimeout(statsDebounceTimerRef.current)
    statsDebounceTimerRef.current = setTimeout(() => {
      updateStats()
    }, 600)

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        triggerAutoSave(editorRef.current.innerHTML)
      }
    }, 2000)
  }

  // ── AUTO-REPLACE / TEXT EXPANDER ENGINE (MS Word Style) ──
  const checkTextExpansion = () => {
    const sel = window.getSelection()
    if (!sel || !sel.isCollapsed || !sel.anchorNode) return

    const node = sel.anchorNode
    if (node.nodeType !== Node.TEXT_NODE) return

    const textBeforeCursor = node.textContent?.substring(0, sel.anchorOffset) || ''
    if (!textBeforeCursor) return

    // Find if the end of textBeforeCursor matches any shortcut trigger
    for (const item of shortcuts) {
      if (!item.trigger || !item.replacement) continue
      const trigger = item.trigger

      if (textBeforeCursor.endsWith(trigger)) {
        const startIndex = textBeforeCursor.length - trigger.length
        const range = document.createRange()
        range.setStart(node, startIndex)
        range.setEnd(node, sel.anchorOffset)

        sel.removeAllRanges()
        sel.addRange(range)

        // Replace range with expansion text cleanly
        document.execCommand('insertText', false, item.replacement + ' ')
        handleEditorInput()
        break
      }
    }
  }

  // ── AUDIO PLAYER CONTROLS (Express Scribe Style) ──
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00:00'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ].join(':')
  }

  const handleAudioFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Revoke previous blob URL if needed
    if (audioSrcRef.current && audioSrcRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(audioSrcRef.current)
    }

    const url = URL.createObjectURL(file)
    audioSrcRef.current = url
    setAudioSrc(url)
    setAudioFileName(file.name)
    isPlayingRef.current = false
    setIsPlaying(false)
    audioCurrentTimeRef.current = 0
    setAudioCurrentTime(0)
    pendingSeekTimeRef.current = 0

    // Persist audio blob in IndexedDB and reset saved position
    if (userId) {
      await saveAudioToDB(userId, file, file.name)
      saveAudioPosition(userId, 0)
    }
    setStatusMessage({ type: 'success', text: `Loaded audio: ${file.name}` })
  }, [userId])

  const handleClearAudio = useCallback(async () => {
    if (audioSrcRef.current && audioSrcRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(audioSrcRef.current)
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    audioSrcRef.current = null
    setAudioSrc(null)
    setAudioFileName('')
    isPlayingRef.current = false
    setIsPlaying(false)
    audioCurrentTimeRef.current = 0
    setAudioCurrentTime(0)
    setAudioDuration(0)
    pendingSeekTimeRef.current = null

    if (userId) {
      await deleteAudioFromDB(userId)
      clearAudioPosition(userId)
    }

    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }

    setStatusMessage({ type: 'info', text: 'Audio file removed and cleared from local storage.' })
  }, [userId])

  // Stable play and pause using refs — no stale closures, no listener re-registration
  const playAudio = useCallback(() => {
    if (!audioRef.current || !audioSrcRef.current) return
    if (!isPlayingRef.current) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err))
      isPlayingRef.current = true
      setIsPlaying(true)
    }
  }, [])

  const pauseAudio = useCallback(() => {
    if (!audioRef.current || !audioSrcRef.current) return
    if (isPlayingRef.current) {
      audioRef.current.pause()
      isPlayingRef.current = false
      setIsPlaying(false)
      if (userId) {
        saveAudioPosition(userId, audioRef.current.currentTime)
      }
    }
  }, [userId])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !audioSrcRef.current) return
    if (isPlayingRef.current) {
      pauseAudio()
    } else {
      playAudio()
    }
  }, [playAudio, pauseAudio])

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    isPlayingRef.current = false
    setIsPlaying(false)
    if (userId) {
      saveAudioPosition(userId, audioRef.current.currentTime)
    }
  }, [userId])

  const rewindAudio = useCallback((seconds?: number) => {
    if (!audioRef.current) return
    const rewindSecs = seconds ?? hotkeysRef.current.rewindSeconds ?? 2
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - rewindSecs)
    const newTime = audioRef.current.currentTime
    audioCurrentTimeRef.current = newTime
    setAudioCurrentTime(newTime)
    if (userId) {
      saveAudioPosition(userId, newTime)
    }
  }, [userId])

  const toggleFastSpeed = useCallback(() => {
    if (!audioRef.current) return
    const newSpeed = playbackSpeedRef.current === 1.0 ? (hotkeysRef.current.fastSpeed || 1.5) : 1.0
    audioRef.current.playbackRate = newSpeed
    playbackSpeedRef.current = newSpeed
    setPlaybackSpeed(newSpeed)
  }, [])

  const copyOrInsertTimestamp = useCallback((insertIntoEditor = true) => {
    const ts = `[${formatTime(audioCurrentTimeRef.current)}]`
    if (insertIntoEditor && editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertText', false, `${ts} `)
      // Trigger auto-save debounce without a full state re-render
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        if (editorRef.current) {
          triggerAutoSave(editorRef.current.innerHTML)
        }
      }, 2000)
    } else {
      navigator.clipboard.writeText(ts)
      setStatusMessage({ type: 'info', text: `Copied timestamp ${ts} to clipboard.` })
    }
  }, [])

  // Helper: Find closest block element ancestor inside editor
  const getClosestBlock = (node: Node, root: HTMLElement): HTMLElement => {
    let cur = node.parentElement
    while (cur && cur !== root) {
      const tag = cur.tagName.toLowerCase()
      if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tag)) {
        return cur
      }
      cur = cur.parentElement
    }
    return root
  }

  // Helper: Retrieve all paragraph start positions (first non-whitespace character of each paragraph/block)
  const getParagraphStarts = (root: HTMLElement): Array<{ node: Node; offset: number }> => {
    const starts: Array<{ node: Node; offset: number }> = []
    let lastBlock: HTMLElement | null = null
    let pendingParagraphStart = true

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = (node as Element).tagName.toLowerCase()
            if (tag === 'br') return NodeFilter.FILTER_ACCEPT
            if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tag)) {
              return NodeFilter.FILTER_ACCEPT
            }
            return NodeFilter.FILTER_SKIP
          }
          return NodeFilter.FILTER_ACCEPT
        },
      }
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName.toLowerCase()
        if (tag === 'br') {
          pendingParagraphStart = true
        }
        continue
      }

      const block = getClosestBlock(node, root)
      if (block !== lastBlock) {
        lastBlock = block
        pendingParagraphStart = true
      }

      const text = node.textContent || ''
      if (!text) continue

      let checkFrom = 0
      if (pendingParagraphStart) {
        const m = text.match(/\S/)
        if (m && m.index !== undefined) {
          starts.push({
            node,
            offset: m.index,
          })
          checkFrom = m.index + 1
          pendingParagraphStart = false
        }
      }

      const newlineRegex = /[\r\n]+(\s*\S)/g
      newlineRegex.lastIndex = checkFrom
      let match: RegExpExecArray | null
      while ((match = newlineRegex.exec(text)) !== null) {
        const targetOffset = match.index + match[0].length - 1
        starts.push({
          node,
          offset: targetOffset,
        })
      }
    }

    return starts
  }

  // Helper: Compare two DOM points using Range.compareBoundaryPoints
  const compareDOMPoints = (nodeA: Node, offsetA: number, nodeB: Node, offsetB: number): number => {
    try {
      const rangeA = document.createRange()
      rangeA.setStart(nodeA, offsetA)
      rangeA.collapse(true)

      const rangeB = document.createRange()
      rangeB.setStart(nodeB, offsetB)
      rangeB.collapse(true)

      return rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB)
    } catch {
      return 0
    }
  }

  // Helper: Move caret or extend selection to specified DOM point
  const moveCaretTo = (node: Node, offset: number, extendSelection: boolean) => {
    const sel = window.getSelection()
    if (!sel) return
    try {
      if (extendSelection) {
        sel.extend(node, offset)
      } else {
        const range = document.createRange()
        range.setStart(node, offset)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      const parentEl = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
      parentEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      syncSelectionState()
    } catch {}
  }

  // Paragraph navigation handler for Ctrl+ArrowDown and Ctrl+ArrowUp
  const navigateParagraph = (direction: 'up' | 'down', extendSelection: boolean) => {
    if (!editorRef.current) return false
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return false

    const starts = getParagraphStarts(editorRef.current)
    if (!starts.length) return false

    const focusNode = sel.focusNode || sel.anchorNode
    const focusOffset = sel.focusOffset || sel.anchorOffset
    if (!focusNode) return false

    if (direction === 'down') {
      // Find the first paragraph start strictly after current focus point
      for (let i = 0; i < starts.length; i++) {
        if (compareDOMPoints(focusNode, focusOffset, starts[i].node, starts[i].offset) < 0) {
          moveCaretTo(starts[i].node, starts[i].offset, extendSelection)
          return true
        }
      }
      // If already at or after the last paragraph start, jump to the end of editor
      const last = starts[starts.length - 1].node
      moveCaretTo(last, last.textContent?.length || 0, extendSelection)
      return true
    } else if (direction === 'up') {
      // Find the last paragraph start strictly before current focus point
      let targetIdx = -1
      for (let i = starts.length - 1; i >= 0; i--) {
        if (compareDOMPoints(focusNode, focusOffset, starts[i].node, starts[i].offset) > 0) {
          targetIdx = i
          break
        }
      }
      if (targetIdx !== -1) {
        moveCaretTo(starts[targetIdx].node, starts[targetIdx].offset, extendSelection)
        return true
      } else {
        // Move to the very first paragraph start
        moveCaretTo(starts[0].node, starts[0].offset, extendSelection)
        return true
      }
    }
    return false
  }

  // ── GLOBAL AUDIO & SHORTCUT HOTKEY DISPATCHER ──
  // Registered ONCE on mount with empty deps — reads all live values through refs, never stale
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Intercept accidental tab close (Ctrl+W / Cmd+W)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault()
        setStatusMessage({
          type: 'info',
          text: 'Accidental tab closure (Ctrl+W) was blocked to protect your workspace.',
        })
        return
      }

      if (showHotkeysModal) return

      const keyName = e.key.toUpperCase()
      const hk = hotkeysRef.current

      // 1. Separate Play Hotkey
      if (keyName === hk.play.toUpperCase()) {
        e.preventDefault()
        playAudio()
        return
      }

      // 2. Separate Pause Hotkey
      if (keyName === hk.pause.toUpperCase()) {
        e.preventDefault()
        pauseAudio()
        return
      }

      // 3. Rewind Hotkey
      if (keyName === hk.rewind.toUpperCase()) {
        e.preventDefault()
        rewindAudio(hk.rewindSeconds || 2)
        return
      }

      // 4. Fast Forward / Speed Hotkey
      if (keyName === hk.fastForward.toUpperCase()) {
        e.preventDefault()
        toggleFastSpeed()
        return
      }

      // 5. Timestamp Copy / Insert Hotkey
      if (keyName === hk.copyTimestamp.toUpperCase()) {
        e.preventDefault()
        copyOrInsertTimestamp(true)
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [playAudio, pauseAudio, rewindAudio, toggleFastSpeed, copyOrInsertTimestamp, showHotkeysModal])

  // Handle hotkeys inside contenteditable (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+S, Ctrl+F, Ctrl+H, Ctrl+Z, Ctrl+Y, Space for Text Expander)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Check text expansion trigger on Space, Enter, or Tab
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab' || e.key === ':') {
      setTimeout(() => checkTextExpansion(), 0)
    }

    // Handle CTRL+Arrow keys for precise paragraph & word navigation
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        navigateParagraph('down', e.shiftKey)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        navigateParagraph('up', e.shiftKey)
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Let browser handle default word navigation natively
        return
      }
      if (e.key === 'Home') {
        // Navigate to beginning of document
        e.preventDefault()
        if (editorRef.current) {
          const starts = getParagraphStarts(editorRef.current)
          if (starts.length > 0) {
            moveCaretTo(starts[0].node, starts[0].offset, e.shiftKey)
          } else if (editorRef.current.firstChild) {
            moveCaretTo(editorRef.current.firstChild, 0, e.shiftKey)
          }
        }
        return
      }
      if (e.key === 'End') {
        // Navigate to end of document
        e.preventDefault()
        if (editorRef.current) {
          const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
          let lastTextNode: Node | null = null
          let n: Node | null
          while ((n = walker.nextNode())) {
            lastTextNode = n
          }
          if (lastTextNode) {
            moveCaretTo(lastTextNode, lastTextNode.textContent?.length || 0, e.shiftKey)
          } else if (editorRef.current.lastChild) {
            const last = editorRef.current.lastChild
            moveCaretTo(last, last.textContent?.length || 0, e.shiftKey)
          }
        }
        return
      }

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
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        openFindBar('find')
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        openFindBar('replace')
      } else if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault()
          applyRedo()
        } else {
          e.preventDefault()
          applyUndo()
        }
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        setStatusMessage({
          type: 'info',
          text: 'Accidental tab closure (Ctrl+W) was blocked to protect your workspace.',
        })
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        applyRedo()
      }
    }
  }

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

  const applyUndo = () => {
    document.execCommand('undo', false)
    syncSelectionState()
    handleEditorInput()
  }

  const applyRedo = () => {
    document.execCommand('redo', false)
    syncSelectionState()
    handleEditorInput()
  }

  const applyColor = (selectedColor: string) => {
    setColor(selectedColor)
    document.execCommand('foreColor', false, selectedColor)
    handleEditorInput()
  }

  const applyHighlight = (highlightColor: string) => {
    document.execCommand('hiliteColor', false, highlightColor)
    setShowHighlightPalette(false)
    handleEditorInput()
  }

  const clearFormatting = () => {
    document.execCommand('removeFormat', false)
    syncSelectionState()
    handleEditorInput()
  }

  // Clean / fix all double or multiple consecutive spaces into a single space
  const fixAllDoubleSpaces = useCallback(() => {
    if (!editorRef.current) return
    const currentHtml = editorRef.current.innerHTML
    if (!currentHtml) return

    // 1. Remove double-space-flag wrappers if any exist
    let cleaned = currentHtml.replace(/<span class="double-space-flag"[^>]*>[\s\S]*?<\/span>/gi, ' ')
    // 2. Collapse consecutive spaces, &nbsp;, and mixed spaces
    cleaned = cleaned
      .replace(/(?:&nbsp;| ){2,}/g, ' ')
      .replace(/(&nbsp; )|( &nbsp;)/g, ' ')
      .replace(/\u00A0{2,}/g, ' ')

    editorRef.current.innerHTML = cleaned
    updateStats()
    triggerAutoSave(cleaned)
    setStatusMessage({
      type: 'success',
      text: 'All double spaces have been cleaned! Standard 1-space format restored.',
    })
  }, [updateStats, triggerAutoSave])

  // Visually underline all double spaces with a distinct red wavy underline
  const highlightDoubleSpaces = useCallback(() => {
    if (!editorRef.current) return
    const editor = editorRef.current

    // Remove existing double-space flags first
    let html = editor.innerHTML.replace(/<span class="double-space-flag"[^>]*>([\s\S]*?)<\/span>/gi, '$1')

    const flagWrapper = '<span class="double-space-flag" style="border-bottom: 2px wavy #ef4444; background-color: #fee2e2; border-radius: 2px; padding: 0 2px; margin: 0 1px; color: #b91c1c; font-weight: bold;" title="Double space detected! Should be single space.">&nbsp;&nbsp;</span>'

    // Replace double spaces outside HTML tags
    const parts = html.split(/(<[^>]+>)/g)
    let countFound = 0
    const newParts = parts.map((part) => {
      if (part.startsWith('<')) return part
      const replaced = part.replace(/[ \u00A0]{2,}/g, () => {
        countFound++
        return flagWrapper
      })
      return replaced
    })

    const updatedHtml = newParts.join('')
    editor.innerHTML = updatedHtml
    updateStats()

    if (countFound > 0) {
      setStatusMessage({
        type: 'info',
        text: `Found ${countFound} double space${countFound > 1 ? 's' : ''} (marked with red underline). Click "Fix All" to clean them.`,
      })
      const firstFlag = editor.querySelector('.double-space-flag')
      firstFlag?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Great! No double spaces detected in this transcript.',
      })
    }
  }, [updateStats])

  // Open and focus the Find / Replace bar
  const openFindBar = (mode: 'find' | 'replace' = 'find') => {
    setFindMode(mode)
    setShowFindBar(true)
    setShowReplaceInput(mode === 'replace')
    setTimeout(() => {
      findInputRef.current?.focus()
      findInputRef.current?.select()
    }, 50)
  }

  // Find Next / Previous occurrence (Word-style)
  const findNext = (backwards = false) => {
    if (!findText || !editorRef.current) return

    const editor = editorRef.current
    const sel = window.getSelection()

    if (!sel) return

    // Build text content mapping using TreeWalker
    const textNodes: { node: Text; offset: number; text: string }[] = []
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null)
    let totalOffset = 0
    let currentNode = walker.nextNode()

    while (currentNode) {
      const text = currentNode.textContent || ''
      textNodes.push({ node: currentNode as Text, offset: totalOffset, text })
      totalOffset += text.length
      currentNode = walker.nextNode()
    }

    // Build full text content
    const fullText = textNodes.map(n => n.text).join('')
    const searchText = findText.toLowerCase()
    const lowerContent = fullText.toLowerCase()

    // Get current selection position
    const currentRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : null
    let currentOffset = 0
    if (currentRange && currentRange.startContainer) {
      // Find the text node and offset
      for (const tn of textNodes) {
        if (tn.node === currentRange.startContainer) {
          currentOffset = tn.offset + currentRange.startOffset
          break
        }
      }
    }

    // Find the text
    let nextIndex: number
    if (backwards) {
      // Search backwards from current position
      const beforeCurrent = lowerContent.substring(0, currentOffset)
      const lastMatch = beforeCurrent.lastIndexOf(searchText)
      nextIndex = lastMatch >= 0 ? lastMatch : lowerContent.lastIndexOf(searchText)
    } else {
      // Search forwards from current position
      const afterCurrent = lowerContent.substring(currentOffset + findText.length)
      const nextMatch = afterCurrent.indexOf(searchText)
      nextIndex = nextMatch >= 0 ? currentOffset + findText.length + nextMatch : lowerContent.indexOf(searchText)
    }

    if (nextIndex >= 0) {
      // Find the text nodes for the match
      const startIndex = nextIndex
      const endIndex = nextIndex + findText.length

      let startNode: Text | null = null
      let startNodeOffset = 0
      let endNode: Text | null = null
      let endNodeOffset = 0

      for (const tn of textNodes) {
        const nodeStart = tn.offset
        const nodeEnd = tn.offset + tn.text.length

        if (startNode === null && nodeEnd > startIndex) {
          startNode = tn.node
          startNodeOffset = startIndex - nodeStart
        }

        if (nodeEnd >= endIndex) {
          endNode = tn.node
          endNodeOffset = endIndex - tn.offset
          break
        }
      }

      if (startNode && endNode) {
        const range = document.createRange()
        range.setStart(startNode, startNodeOffset)
        range.setEnd(endNode, endNodeOffset)
        sel.removeAllRanges()
        sel.addRange(range)
        // Scroll into view
        const rect = range.getBoundingClientRect()
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          range.startContainer.parentElement?.scrollIntoView({ block: 'center' })
        }
      }
    } else {
      setStatusMessage({ type: 'info', text: `Reached end of document for "${findText}".` })
    }
  }

  // Replace current active selection
  const replaceCurrentMatch = () => {
    if (!findText) return
    const sel = window.getSelection()
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      document.execCommand('insertText', false, replaceText)
      handleEditorInput()
      findNext(false)
    } else {
      findNext(false)
    }
  }

  // Replace all occurrences throughout transcript
  const performFindReplaceAll = () => {
    if (!findText) {
      setStatusMessage({ type: 'error', text: 'Please enter text to find.' })
      return
    }
    if (!editorRef.current) return

    const currentHtml = editorRef.current.innerHTML
    const currentText = editorRef.current.innerText || ''

    if (!currentText.toLowerCase().includes(findText.toLowerCase())) {
      setStatusMessage({ type: 'info', text: `No occurrences of "${findText}" found.` })
      return
    }

    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
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

  // Key navigation inside find input
  const handleFindInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        findNext(true)
      } else {
        findNext(false)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowFindBar(false)
      editorRef.current?.focus()
    }
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
          clientType: getMyClientType(),
          actorRole: role,
          actorUserId: userId,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatusMessage({ type: 'error', text: `Save failed: ${data.error || 'Unknown error'}` })
      } else {
        setLastSavedTime(new Date())
        setStatusMessage({
          type: 'success',
          text: activeSlot === 2 ? 'Auto-Save slot saved successfully!' : 'Save Slot saved successfully!',
        })
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
    const slotSuffix = activeSlot === 2 ? 'autosave' : 'saveslot'
    a.download = `transcript_${effectiveRole}_${effectiveUserId}_${slotSuffix}.txt`
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

  // Clean paste interceptor (strips Word margin bloat)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (text) {
      document.execCommand('insertText', false, text)
      handleEditorInput()
    }
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

  return (
    <div className="flex flex-col h-full space-y-2.5 relative">
      {/* Hidden Audio Element for Background Playback */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onTimeUpdate={() => {
          if (!audioRef.current) return
          // Always keep the ref up-to-date (zero cost, used by hotkey callbacks)
          audioCurrentTimeRef.current = audioRef.current.currentTime
          // Throttle React state updates & storage persistence to 4Hz (250ms)
          if (!audioDisplayThrottleRef.current) {
            audioDisplayThrottleRef.current = setTimeout(() => {
              audioDisplayThrottleRef.current = null
              setAudioCurrentTime(audioCurrentTimeRef.current)
              if (userId) {
                saveAudioPosition(userId, audioCurrentTimeRef.current)
              }
            }, 250)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration)
            if (pendingSeekTimeRef.current !== null && pendingSeekTimeRef.current > 0) {
              const target = Math.min(pendingSeekTimeRef.current, audioRef.current.duration || pendingSeekTimeRef.current)
              audioRef.current.currentTime = target
              audioCurrentTimeRef.current = target
              setAudioCurrentTime(target)
              pendingSeekTimeRef.current = null
            }
          }
        }}
        onEnded={() => {
          isPlayingRef.current = false
          setIsPlaying(false)
        }}
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleAudioFileSelect}
        className="hidden"
      />


      {/* ── FOCUS / DISTRACTION-FREE HEADER BAR (When tools are hidden) ── */}

      {hideTools ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Show Tools Toggle */}
            <button
              type="button"
              onClick={() => setHideTools(false)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-xs cursor-pointer"
              title="Show all formatting tools, font controls, and find & replace"
            >
              <Eye className="w-3.5 h-3.5 text-purple-200" />
              <span>Show Tools</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            {/* Quick Audio Controls in Focus Bar */}
            {audioSrc && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 h-8 px-2.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={playAudio}
                  className={`p-1 rounded-lg transition-colors ${
                    isPlaying ? 'text-emerald-400 bg-emerald-950/60 font-bold' : 'text-emerald-300 hover:text-white'
                  }`}
                  title={`Play Audio (${hotkeys.play})`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={pauseAudio}
                  className={`p-1 rounded-lg transition-colors ${
                    !isPlaying ? 'text-amber-400 bg-amber-950/60 font-bold' : 'text-amber-300 hover:text-white'
                  }`}
                  title={`Pause Audio (${hotkeys.pause})`}
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => rewindAudio()}
                  className="p-1 text-zinc-300 hover:text-white rounded-lg"
                  title={`Rewind ${hotkeys.rewindSeconds}s (${hotkeys.rewind})`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-zinc-300 font-mono">
                  {formatTime(audioCurrentTime)}
                </span>
                <button
                  type="button"
                  onClick={() => copyOrInsertTimestamp(true)}
                  className="text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded-md font-mono"
                  title={`Insert Timestamp (${hotkeys.copyTimestamp})`}
                >
                  +Time
                </button>
                <button
                  type="button"
                  onClick={handleClearAudio}
                  className="p-1 text-zinc-400 hover:text-rose-300 transition-colors rounded-lg"
                  title="Remove audio file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Slot Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 h-8 px-2.5 rounded-xl text-xs">
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-zinc-400 font-medium">Slot:</span>
              <select
                value={activeSlot}
                onChange={(e) => {
                  const newSlot = parseInt(e.target.value, 10)
                  setActiveSlot(newSlot)
                  onSlotChange?.(newSlot)
                }}
                className="bg-transparent font-bold text-purple-200 outline-none cursor-pointer text-xs"
              >
                {[1, 2].map((s) => {
                  const meta = slotsMeta.find((item) => item.slot === s)
                  const hasData = meta?.hasContent || (s === activeSlot && wordCount > 0)
                  return (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s === 2 ? 'Auto-Save' : 'Save Slot'} {hasData ? '●' : '(Empty)'}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Admin Worker Monitor & Switcher (if admin) */}
            {role === 'admin' && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-indigo-500/40 h-8 px-2.5 rounded-xl text-xs">
                <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">Worker:</span>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value)
                    setActiveSlot(1)
                  }}
                  className="bg-transparent font-bold text-white outline-none cursor-pointer text-xs max-w-[140px] truncate"
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
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
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
                Auto-saving...
              </span>
            ) : autoSaveTime ? (
              <span className="text-[10px] text-emerald-400 hidden md:inline" title="Ongoing work auto-saved">
                ● Auto-saved
              </span>
            ) : null}

            <span className="text-zinc-300 text-[11px] hidden sm:inline font-mono">
              Words: <strong className="text-white">{wordCount}</strong>
            </span>

            {/* Quick Double-Space Fix in Focus Bar */}
            {doubleSpaceCount > 0 && (
              <button
                type="button"
                onClick={fixAllDoubleSpaces}
                className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition-all cursor-pointer"
                title="Click to fix all double spaces into single spaces"
              >
                <span className="underline decoration-wavy decoration-red-400 font-mono">␣␣</span>
                <span>{doubleSpaceCount} Fix</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openFindBar('find')}
              className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Find in text (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Find</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={wordCount === 0}
              className="hidden sm:flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || wordCount === 0}
              className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{activeSlot === 2 ? 'Save Auto-Save' : 'Save Slot'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
          {/* ── ROW 1: ADMIN WORKER LIVE MONITOR (Admin only) ── */}
          {role === 'admin' && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Live Monitor:
                  </span>
                  <strong className="text-xs text-white font-bold">
                    {selectedWorkerObj?.full_name || selectedWorkerId}
                  </strong>
                  {selectedWorkerObj?.last_seen && (() => {
                    const diffMins = (Date.now() - new Date(selectedWorkerObj.last_seen).getTime()) / 60000
                    const isOnline = diffMins < 5
                    return (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isOnline
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Worker Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300 font-medium hidden sm:inline">Inspect Worker:</span>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value)
                    setActiveSlot(1)
                  }}
                  className="rounded-xl border border-indigo-400/40 bg-slate-800 px-3 py-1 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
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
          )}

          {/* ── ROW 2: INTEGRATED EXPRESS SCRIBE AUDIO PLAYER BAR ── */}
          {showAudioPlayer && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              {/* Left Playback Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Audio File Loader Button */}
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  title="Open local audio/video file for transcription (MP3, WAV, M4A, AAC, MP4)"
                >
                  <Music className="w-3.5 h-3.5 text-purple-200" />
                  <span className="max-w-[130px] truncate">
                    {audioFileName ? audioFileName : 'Load Audio File'}
                  </span>
                </button>

                {audioSrc && (
                  <>
                    {/* Play Button */}
                    <button
                      type="button"
                      onClick={playAudio}
                      className={`flex items-center justify-center h-8 px-3 gap-1.5 rounded-xl text-white shadow-xs transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-600 ring-2 ring-emerald-400 font-bold shadow-emerald-500/20'
                          : 'bg-emerald-700 hover:bg-emerald-600'
                      }`}
                      title={`Play Audio (${hotkeys.play})`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] font-mono font-bold uppercase">{hotkeys.play}</span>
                    </button>

                    {/* Pause Button */}
                    <button
                      type="button"
                      onClick={pauseAudio}
                      className={`flex items-center justify-center h-8 px-3 gap-1.5 rounded-xl text-white shadow-xs transition-all cursor-pointer ${
                        !isPlaying
                          ? 'bg-amber-600 ring-2 ring-amber-400 font-bold shadow-amber-500/20'
                          : 'bg-amber-700 hover:bg-amber-600'
                      }`}
                      title={`Pause Audio (${hotkeys.pause})`}
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] font-mono font-bold uppercase">{hotkeys.pause}</span>
                    </button>

                    {/* Stop Button */}
                    <button
                      type="button"
                      onClick={stopAudio}
                      className="flex items-center justify-center h-8 w-8 text-zinc-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
                      title="Stop Audio"
                    >
                      <div className="w-3 h-3 bg-current rounded-xs" />
                    </button>

                    {/* Rewind */}
                    <button
                      type="button"
                      onClick={() => rewindAudio()}
                      className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 border border-slate-700 transition-all cursor-pointer"
                      title={`Rewind ${hotkeys.rewindSeconds}s (${hotkeys.rewind})`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                      <span>{hotkeys.rewindSeconds}s</span>
                    </button>

                    {/* Fast Speed Toggle */}
                    <button
                      type="button"
                      onClick={toggleFastSpeed}
                      className={`flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        playbackSpeed > 1.0
                          ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                          : 'bg-slate-800 text-zinc-200 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={`Fast Forward Speed ${hotkeys.fastSpeed}x (${hotkeys.fastForward})`}
                    >
                      <FastForward className="w-3.5 h-3.5 text-purple-300" />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {/* Clear / Eject Audio */}
                    <button
                      type="button"
                      onClick={handleClearAudio}
                      className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-zinc-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition-all cursor-pointer"
                      title="Remove / Eject audio file from editor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Center Timeline Scrubber */}
              {audioSrc ? (
                <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md mx-2">
                  <span className="text-[11px] font-mono text-purple-300 font-bold shrink-0">
                    {formatTime(audioCurrentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={audioDuration || 100}
                    value={audioCurrentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (audioRef.current) {
                        audioRef.current.currentTime = val
                        audioCurrentTimeRef.current = val
                        setAudioCurrentTime(val)
                        if (userId) {
                          saveAudioPosition(userId, val)
                        }
                      }
                    }}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {formatTime(audioDuration)}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 italic hidden md:block">
                  Load an audio file to transcribe with Express Scribe hotkeys ({hotkeys.play}=Play, {hotkeys.pause}=Pause, {hotkeys.rewind}=Rewind, {hotkeys.copyTimestamp}=Timestamp)
                </div>
              )}

              {/* Right Tools & Config Buttons */}
              <div className="flex items-center gap-1.5">
                {audioSrc && (
                  <button
                    type="button"
                    onClick={() => copyOrInsertTimestamp(true)}
                    className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-400/40 transition-all cursor-pointer shadow-xs"
                    title={`Insert current audio timestamp at cursor in transcript (${hotkeys.copyTimestamp})`}
                  >
                    <Clock className="w-3.5 h-3.5 text-purple-200" />
                    <span>+Time ({hotkeys.copyTimestamp})</span>
                  </button>
                )}

                {/* Hotkeys Configuration Button */}
                <button
                  type="button"
                  onClick={() => setShowHotkeysModal(true)}
                  className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                  title="Configure Audio Player Hotkeys and Rewind Seconds"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Hotkeys</span>
                </button>

                {/* Text Expander / Shortcuts Manager Button */}
                <button
                  type="button"
                  onClick={() => setShowShortcutsModal(true)}
                  className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                  title="Configure Auto-Replace text shortcuts (e.g. s1: -> Speaker 1:)"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
              </div>
            </div>
          )}

          {/* ── ROW 3: SYNCHRONIZED FORMATTING, PROOFING & ACTIONS RIBBON ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50/70">
            {/* Left Controls & Formatting Groups */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Group 1: Draft Slot Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-purple-200/90 h-8 px-2.5 rounded-xl shadow-xs">
                <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">Slot:</span>
                <select
                  value={activeSlot}
                  onChange={(e) => {
                    const nextSlot = parseInt(e.target.value, 10)
                    if (nextSlot !== activeSlot) {
                      setActiveSlot(nextSlot)
                      onSlotChange?.(nextSlot)
                    }
                  }}
                  className="text-xs font-bold text-purple-950 bg-transparent outline-none cursor-pointer pr-1"
                >
                  {[1, 2].map((slotNum) => {
                    const meta = slotsMeta.find((s) => s.slot === slotNum)
                    const hasData = meta?.hasContent || (slotNum === activeSlot && wordCount > 0)
                    const words = slotNum === activeSlot ? wordCount : meta?.wordCount || 0
                    return (
                      <option key={slotNum} value={slotNum} className="text-zinc-900">
                        {slotNum === 2
                          ? `Auto-Save ${hasData ? `(${words}w)` : '(Empty)'}`
                          : `Save Slot ${hasData ? `(${words}w)` : '(Empty)'}`}
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
                />
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Group 2: Undo / Redo */}
              <div className="flex items-center h-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={applyUndo}
                  className="h-full px-2 text-zinc-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={applyRedo}
                  className="h-full px-2 text-zinc-700 hover:bg-purple-50 hover:text-purple-700 transition-colors border-l border-slate-200 cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Group 3: Font Family */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 h-8 px-2.5 rounded-xl shadow-xs">
                <Type className="w-3.5 h-3.5 text-zinc-500" />
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
              <div className="flex items-center gap-1 bg-white border border-slate-200 h-8 px-2 rounded-xl shadow-xs">
                <span className="text-xs text-zinc-500 font-medium">Size</span>
                <input
                  type="number"
                  min={10}
                  max={36}
                  value={fontSize}
                  onChange={(e) => setFontSize(Math.max(10, Math.min(36, parseInt(e.target.value) || 14)))}
                  className="w-8 text-xs font-bold text-zinc-800 text-center bg-transparent outline-none"
                />
              </div>

              {/* Font Color */}
              <div
                className="flex items-center justify-center bg-white border border-slate-200 h-8 w-8 rounded-xl shadow-xs"
                title="Change font color of selected text"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => applyColor(e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
                  title="Apply Color to Selected Text"
                />
              </div>

              {/* Text Highlighter Marker Tool */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHighlightPalette(!showHighlightPalette)}
                  className={`flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white transition-all shadow-xs cursor-pointer ${
                    showHighlightPalette ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'text-zinc-700 hover:bg-amber-50'
                  }`}
                  title="Highlight selected text"
                >
                  <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Highlight</span>
                </button>

                {showHighlightPalette && (
                  <div className="absolute top-full left-0 mt-1 z-30 flex items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-lg animate-fade-in">
                    <button
                      type="button"
                      onClick={() => applyHighlight('#fef08a')}
                      className="w-5 h-5 rounded-full bg-yellow-200 hover:scale-110 border border-yellow-400 shadow-xs transition-transform cursor-pointer"
                      title="Yellow Highlight"
                    />
                    <button
                      type="button"
                      onClick={() => applyHighlight('#bbf7d0')}
                      className="w-5 h-5 rounded-full bg-green-200 hover:scale-110 border border-green-400 shadow-xs transition-transform cursor-pointer"
                      title="Green Highlight"
                    />
                    <button
                      type="button"
                      onClick={() => applyHighlight('#a5f3fc')}
                      className="w-5 h-5 rounded-full bg-cyan-200 hover:scale-110 border border-cyan-400 shadow-xs transition-transform cursor-pointer"
                      title="Cyan Highlight"
                    />
                    <button
                      type="button"
                      onClick={() => applyHighlight('#fbcfe8')}
                      className="w-5 h-5 rounded-full bg-pink-200 hover:scale-110 border border-pink-400 shadow-xs transition-transform cursor-pointer"
                      title="Pink Highlight"
                    />
                    <button
                      type="button"
                      onClick={() => applyHighlight('#fed7aa')}
                      className="w-5 h-5 rounded-full bg-orange-200 hover:scale-110 border border-orange-400 shadow-xs transition-transform cursor-pointer"
                      title="Orange Highlight"
                    />
                    <button
                      type="button"
                      onClick={() => applyHighlight('transparent')}
                      className="text-[10px] text-zinc-500 hover:text-red-600 px-1.5 py-0.5 border border-zinc-200 rounded-md ml-1"
                      title="Clear Highlight"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Group 4: Rich Text Formatting (Bold, Italic, Underline, Clear) */}
              <div className="flex items-center h-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyBold()
                  }}
                  className={`h-full px-2.5 text-xs font-bold transition-colors cursor-pointer ${
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
                  className={`h-full px-2.5 text-xs italic transition-colors border-l border-slate-200 cursor-pointer ${
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
                  className={`h-full px-2.5 text-xs transition-colors border-l border-slate-200 cursor-pointer ${
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
                  className="h-full px-2.5 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-slate-200 cursor-pointer"
                  title="Clear formatting on selection"
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Group 5: Proofreading (Find & Double Space Fixer) */}
              <button
                type="button"
                onClick={() => {
                  if (showFindBar) {
                    setShowFindBar(false)
                    editorRef.current?.focus()
                  } else {
                    openFindBar('find')
                  }
                }}
                className={`flex items-center gap-1.5 h-8 px-2.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  showFindBar
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-zinc-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
                title="Find & Replace text in transcript (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find</span>
                <span className="text-[10px] opacity-70 hidden xl:inline font-mono">Ctrl+F</span>
              </button>

              {/* Double Space Detector, Highlight & Fixer */}
              {doubleSpaceCount > 0 ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 h-8 px-2 rounded-xl shadow-xs animate-fade-in">
                  <button
                    type="button"
                    onClick={highlightDoubleSpaces}
                    className="flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-red-700 transition-colors cursor-pointer"
                    title="Highlight all double spaces in editor with red underline"
                  >
                    <span className="font-mono text-red-600 font-extrabold underline decoration-wavy decoration-red-500">␣␣</span>
                    <span>{doubleSpaceCount} Spaces</span>
                  </button>
                  <button
                    type="button"
                    onClick={fixAllDoubleSpaces}
                    className="h-6 px-2 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                    title="Click to fix all double spaces into single spaces automatically"
                  >
                    Fix All
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={highlightDoubleSpaces}
                  className="hidden xl:flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-zinc-600 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-xs cursor-pointer"
                  title="Check and highlight double spaces in transcript"
                >
                  <span className="font-mono text-purple-600 font-bold underline decoration-wavy decoration-purple-400">␣␣</span>
                  <span>Check Spaces</span>
                </button>
              )}
            </div>

            {/* Right Actions & Save Group */}
            <div className="flex items-center gap-1.5">
              {autoSaveStatus === 'saving' ? (
                <div className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 bg-purple-50 border border-purple-200 rounded-xl shadow-xs text-purple-700 text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Auto-saving...</span>
                </div>
              ) : autoSaveTime ? (
                <div
                  className="hidden sm:flex items-center gap-1 h-8 px-2.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs text-emerald-800 text-[11px]"
                  title="Ongoing work auto-saved"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Auto-saved ({autoSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
              ) : null}

              {/* Focus Mode Button */}
              <button
                type="button"
                onClick={() => setHideTools(true)}
                className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold rounded-xl border border-purple-200/90 bg-purple-50 hover:bg-purple-100 text-purple-800 transition-all shadow-xs cursor-pointer"
                title="Hide all toolbars for a distraction-free maximized typing area"
              >
                <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Focus</span>
              </button>

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={wordCount === 0}
                className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                title="Copy transcript"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Export */}
              <button
                type="button"
                onClick={handleManualDownload}
                disabled={wordCount === 0}
                className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-zinc-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                title="Download .txt"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleManualSave}
                disabled={saving || wordCount === 0}
                className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{activeSlot === 2 ? 'Save Auto-Save' : 'Save Slot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WORD-STYLE COMPACT FIND & REPLACE FLOATING/DOCKED TOOLBAR (Ctrl+F) ── */}
      {showFindBar && (
        <div className="flex flex-col gap-2 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          {/* Main Search Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[200px] flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-purple-500 pointer-events-none" />
              <input
                ref={findInputRef}
                type="text"
                placeholder="Find in transcript…"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={handleFindInputKeyDown}
                className="w-full pl-8 pr-24 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-300 shadow-xs font-medium"
              />
              {findText && (
                <span className="absolute right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 select-none pointer-events-none">
                  {findMatchesCount} {findMatchesCount === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>

            {/* Previous & Next Navigation Buttons */}
            <div className="flex items-center h-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => findNext(true)}
                disabled={!findText}
                className="h-full px-2 text-zinc-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-30 transition-colors cursor-pointer"
                title="Previous Match (Shift + Enter)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => findNext(false)}
                disabled={!findText}
                className="h-full px-2 text-zinc-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-30 transition-colors border-l border-slate-200 cursor-pointer"
                title="Next Match (Enter)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Replace Expansion */}
            <button
              type="button"
              onClick={() => setShowReplaceInput(!showReplaceInput)}
              className={`flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                showReplaceInput
                  ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-xs'
                  : 'bg-white border border-slate-200 text-zinc-700 hover:bg-purple-50 shadow-xs'
              }`}
              title="Toggle Replace with..."
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
              <span>Replace</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowFindBar(false)
                editorRef.current?.focus()
              }}
              className="flex items-center justify-center h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-auto"
              title="Close search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Replace Row */}
          {showReplaceInput && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <div className="relative flex-1 min-w-[200px]">
                <Replace className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      replaceCurrentMatch()
                    }
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-300 shadow-xs font-medium"
                />
              </div>

              <button
                type="button"
                onClick={replaceCurrentMatch}
                disabled={!findText}
                className="h-8 px-3 text-xs font-bold rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                title="Replace currently selected match"
              >
                Replace
              </button>

              <button
                type="button"
                onClick={performFindReplaceAll}
                disabled={!findText}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                title="Replace all matching occurrences in transcript"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace All</span>
              </button>
            </div>
          )}
        </div>
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
      <div className="relative flex-1 min-h-[300px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-inner focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all overflow-visible">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}

        {/* ── FLOATING SELECTION MINI-TOOLBAR ── */}
        {floatToolbar && (
          <div
            ref={floatToolbarRef}
            className="absolute z-50 flex items-center gap-0.5 p-1 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-fade-in pointer-events-auto select-none"
            style={{
              left: floatToolbar.x,
              top: floatToolbar.y,
              transform: 'translate(-50%, -100%)',
              marginTop: '-6px',
            }}
            onMouseDown={(e) => e.preventDefault()} // keep selection alive on click
          >
            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyBold() }}
              className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isSelectionBold ? 'bg-purple-600 text-white' : 'text-zinc-300 hover:bg-slate-700 hover:text-white'}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyItalic() }}
              className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs italic transition-colors cursor-pointer ${isSelectionItalic ? 'bg-purple-600 text-white' : 'text-zinc-300 hover:bg-slate-700 hover:text-white'}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyUnderline() }}
              className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs transition-colors cursor-pointer ${isSelectionUnderline ? 'bg-purple-600 text-white' : 'text-zinc-300 hover:bg-slate-700 hover:text-white'}`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-600 mx-0.5" />

            {/* Highlight Palette Toggle */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowFloatHighlightPalette(v => !v) }}
                className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs transition-colors cursor-pointer ${showFloatHighlightPalette ? 'bg-amber-500 text-white' : 'text-amber-300 hover:bg-slate-700 hover:text-amber-200'}`}
                title="Highlight text"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
              {showFloatHighlightPalette && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {[
                    { color: '#fef08a', cls: 'bg-yellow-200 border-yellow-400', label: 'Yellow' },
                    { color: '#bbf7d0', cls: 'bg-green-200 border-green-400', label: 'Green' },
                    { color: '#a5f3fc', cls: 'bg-cyan-200 border-cyan-400', label: 'Cyan' },
                    { color: '#fbcfe8', cls: 'bg-pink-200 border-pink-400', label: 'Pink' },
                    { color: '#fed7aa', cls: 'bg-orange-200 border-orange-400', label: 'Orange' },
                  ].map(({ color: hc, cls, label }) => (
                    <button
                      key={hc}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyHighlight(hc); setShowFloatHighlightPalette(false) }}
                      className={`w-5 h-5 rounded-full ${cls} border hover:scale-110 shadow-xs transition-transform cursor-pointer`}
                      title={`${label} Highlight`}
                    />
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyHighlight('transparent'); setShowFloatHighlightPalette(false) }}
                    className="text-[10px] text-zinc-500 hover:text-red-600 px-1.5 py-0.5 border border-zinc-200 rounded-md cursor-pointer"
                    title="Remove Highlight"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-slate-600 mx-0.5" />

            {/* Clear Formatting */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); clearFormatting() }}
              className="flex items-center justify-center h-7 w-7 rounded-lg text-xs text-zinc-400 hover:bg-red-900/40 hover:text-red-300 transition-colors cursor-pointer"
              title="Clear formatting"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* ── CSS for Instant Paragraph Spacing Normalization & Double Space Highlighting ── */}
      <style jsx global>{`
        .transcript-rich-editor p,
        .transcript-rich-editor div {
          margin: 0 !important;
          padding: 0 !important;
          line-height: inherit !important;
        }
        .transcript-rich-editor p {
          margin-bottom: 0.5em !important;
        }
        .transcript-rich-editor:empty:before {
          content: 'Paste raw transcript or start typing...';
          color: #9ca3af;
          pointer-events: none;
        }
        .transcript-rich-editor .double-space-flag {
          border-bottom: 2px wavy #ef4444 !important;
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
          border-radius: 2px !important;
          padding: 0 2px !important;
          margin: 0 1px !important;
          font-weight: bold !important;
        }
      `}</style>

      {/* Bottom Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 px-2">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Active: <strong className="text-purple-700">{activeSlot === 2 ? 'Auto-Save' : 'Save Slot'}</strong>
          </span>
          <span>
            Words: <strong className="text-zinc-700">{wordCount}</strong>
          </span>
          <span>
            Characters: <strong className="text-zinc-700">{charCount}</strong>
          </span>
          <div className="flex items-center gap-1">
            <span>Spaces:</span>
            {doubleSpaceCount > 0 ? (
              <button
                type="button"
                onClick={fixAllDoubleSpaces}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 underline decoration-wavy decoration-red-500 transition-colors cursor-pointer"
                title="Click to fix all double spaces into standard 1 space"
              >
                <span>{doubleSpaceCount} double space{doubleSpaceCount > 1 ? 's' : ''} (Click to Fix All)</span>
              </button>
            ) : (
              <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-600" /> 1-space clean
              </span>
            )}
          </div>
        </div>
        <div className="text-[10px] text-zinc-400">
          User: <span className="font-semibold text-zinc-600">{effectiveUserId}</span> • Role:{' '}
          <span className="font-semibold uppercase text-zinc-600">{effectiveRole}</span>
        </div>
      </div>

      {/* ── HOTKEYS CONFIGURATION MODAL (Express Scribe Style) ── */}
      {showHotkeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 max-w-md w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Audio Player Hotkeys</h3>
                  <p className="text-[11px] text-zinc-500">Configure Express Scribe style playback controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHotkeysModal(false)
                  setIsCapturingKey(null)
                }}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Play Audio Key */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-semibold text-zinc-700">Play Key:</span>
                  <p className="text-[10px] text-zinc-400">Starts audio playback</p>
                </div>
                <input
                  type="text"
                  value={hotkeys.play}
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setHotkeys({ ...hotkeys, play: e.key.toUpperCase() })
                  }}
                  className="w-20 text-center font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg py-1 uppercase outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Pause Audio Key */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-semibold text-zinc-700">Pause Key:</span>
                  <p className="text-[10px] text-zinc-400">Pauses audio at current spot</p>
                </div>
                <input
                  type="text"
                  value={hotkeys.pause}
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setHotkeys({ ...hotkeys, pause: e.key.toUpperCase() })
                  }}
                  className="w-20 text-center font-bold text-amber-700 bg-white border border-amber-300 rounded-lg py-1 uppercase outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Rewind */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-700">Rewind Key:</span>
                <input
                  type="text"
                  value={hotkeys.rewind}
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setHotkeys({ ...hotkeys, rewind: e.key.toUpperCase() })
                  }}
                  className="w-20 text-center font-bold text-purple-700 bg-white border border-purple-200 rounded-lg py-1 uppercase outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Rewind Seconds */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-semibold text-zinc-700">Rewind Duration:</span>
                  <p className="text-[10px] text-zinc-400">Choose 1 to 5 seconds</p>
                </div>
                <select
                  value={hotkeys.rewindSeconds}
                  onChange={(e) => setHotkeys({ ...hotkeys, rewindSeconds: parseInt(e.target.value, 10) })}
                  className="px-3 py-1 font-bold text-purple-700 bg-white border border-purple-200 rounded-lg outline-none cursor-pointer"
                >
                  <option value={1}>1 Second</option>
                  <option value={2}>2 Seconds (Default)</option>
                  <option value={3}>3 Seconds</option>
                  <option value={4}>4 Seconds</option>
                  <option value={5}>5 Seconds</option>
                </select>
              </div>

              {/* Fast Forward / Speed Key */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-700">Play Fast Key:</span>
                <input
                  type="text"
                  value={hotkeys.fastForward}
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setHotkeys({ ...hotkeys, fastForward: e.key.toUpperCase() })
                  }}
                  className="w-20 text-center font-bold text-purple-700 bg-white border border-purple-200 rounded-lg py-1 uppercase outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Fast Speed Multiplier */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-700">Fast Speed Rate:</span>
                <select
                  value={hotkeys.fastSpeed}
                  onChange={(e) => setHotkeys({ ...hotkeys, fastSpeed: parseFloat(e.target.value) })}
                  className="px-3 py-1 font-bold text-purple-700 bg-white border border-purple-200 rounded-lg outline-none cursor-pointer"
                >
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x (Default)</option>
                  <option value={1.75}>1.75x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>

              {/* Copy / Insert Timestamp Key */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-semibold text-zinc-700">Timestamp Key:</span>
                  <p className="text-[10px] text-zinc-400">Inserts [00:00:00] into transcript</p>
                </div>
                <input
                  type="text"
                  value={hotkeys.copyTimestamp}
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setHotkeys({ ...hotkeys, copyTimestamp: e.key.toUpperCase() })
                  }}
                  className="w-20 text-center font-bold text-purple-700 bg-white border border-purple-200 rounded-lg py-1 uppercase outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setHotkeys(DEFAULT_HOTKEYS)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  savePreferences(hotkeys, shortcuts)
                  setShowHotkeysModal(false)
                  setStatusMessage({ type: 'success', text: 'Audio hotkeys saved to your cloud profile.' })
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEXT EXPANDER / SHORTCUTS MANAGER MODAL (MS Word AutoCorrect Style) ── */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 max-w-lg w-full flex flex-col space-y-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Auto-Replace Text Shortcuts</h3>
                  <p className="text-[11px] text-zinc-500">Expands words automatically as you type (like MS Word AutoCorrect)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Shortcut Form */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex-shrink-0">
              <div className="flex-1 min-w-[100px]">
                <label className="text-[10px] font-bold text-amber-900 block mb-0.5">When you type:</label>
                <input
                  type="text"
                  placeholder="e.g. s1: or ct:"
                  value={newShortcutTrigger}
                  onChange={(e) => setNewShortcutTrigger(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-white font-medium outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex-[2] min-w-[150px]">
                <label className="text-[10px] font-bold text-amber-900 block mb-0.5">Replace with:</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Doe: or [crosstalk]"
                  value={newShortcutReplacement}
                  onChange={(e) => setNewShortcutReplacement(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-white font-medium outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newShortcutTrigger.trim() || !newShortcutReplacement.trim()) return
                  const updated = [
                    ...shortcuts.filter((s) => s.trigger !== newShortcutTrigger.trim()),
                    { trigger: newShortcutTrigger.trim(), replacement: newShortcutReplacement.trim() },
                  ]
                  setShortcuts(updated)
                  setNewShortcutTrigger('')
                  setNewShortcutReplacement('')
                }}
                className="mt-3.5 flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* List of Active Shortcuts */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Active Shortcuts ({shortcuts.length}):
              </span>
              {shortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {item.trigger}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <span className="font-semibold text-zinc-800">{item.replacement}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShortcuts(shortcuts.filter((_, i) => i !== idx))
                    }}
                    className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                    title="Delete shortcut"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShortcuts(DEFAULT_SHORTCUTS)}
                className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Reset Default Shortcuts
              </button>
              <button
                type="button"
                onClick={() => {
                  savePreferences(hotkeys, shortcuts)
                  setShowShortcutsModal(false)
                  setStatusMessage({ type: 'success', text: 'Text shortcuts saved to your cloud profile.' })
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
              >
                Save All Shortcuts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
