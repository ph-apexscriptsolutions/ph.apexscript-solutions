'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, Save, Download, Copy, Check, Search, RefreshCw, Type, Bold, Italic, Palette, Pilcrow } from 'lucide-react'

export default function TranscriptEditor({ role, userId }: { role: 'admin' | 'worker'; userId: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [replaceCount, setReplaceCount] = useState<number | null>(null)

  // Load previously saved transcript on mount
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/transcripts?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(userId)}`)
        const data = await res.json()
        if (res.ok && data.content) {
          setContent(data.content)
          setStatusMessage({ type: 'info', text: 'Loaded previously saved transcript from cloud.' })
        }
      } catch (err: any) {
        console.error('Failed to load saved transcript', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [role, userId])

  const handlePasteIntercept = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (content.trim()) {
      const confirmPaste = window.confirm(
        'A transcript is already present in the editor. Pasting will replace the current content. Continue?'
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
    const regex = new RegExp(escaped, 'g') // Case-sensitive as required
    const matches = (content.match(regex) || []).length
    if (matches === 0) {
      setStatusMessage({ type: 'info', text: `No occurrences of "${findText}" found (case-sensitive).` })
      setReplaceCount(0)
      return
    }
    const updated = content.replace(regex, replaceText)
    setContent(updated)
    setReplaceCount(matches)
    setStatusMessage({ type: 'success', text: `Replaced ${matches} occurrence${matches > 1 ? 's' : ''} of "${findText}".` })
  }

  const handleSave = async () => {
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: 'Transcript is empty. Nothing to save.' })
      return
    }
    if (!userId) {
      setStatusMessage({ type: 'error', text: 'User ID not found. Please ensure you are logged in.' })
      return
    }

    setSaving(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId, content }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatusMessage({ type: 'error', text: `Save failed: ${data.error || 'Unknown error'}` })
      } else {
        setStatusMessage({ type: 'success', text: 'Transcript saved to cloud successfully!' })

        // Auto-download for workers
        if (role === 'worker') {
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `transcript_${userId}.txt`
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
    a.download = `transcript_${role}_${userId || 'export'}.txt`
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

  const insertPilcrow = () => {
    if (!textareaRef.current) {
      setContent((prev) => prev + '¶')
      return
    }
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    const updated = before + '¶' + after
    setContent(updated)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 1)
    }, 0)
  }

  const toggleParagraphPilcrows = () => {
    if (!content.trim()) return
    if (content.includes('¶')) {
      // Remove pilcrows
      setContent(content.replace(/¶/g, ''))
      setStatusMessage({ type: 'info', text: 'Removed all pilcrow (¶) markers.' })
    } else {
      // Add pilcrow to end of each non-empty line
      const lines = content.split('\n')
      const withPilcrow = lines.map((line) => (line.trim() ? line + ' ¶' : line)).join('\n')
      setContent(withPilcrow)
      setStatusMessage({ type: 'success', text: 'Added pilcrow (¶) to paragraph ends.' })
    }
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

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 p-3 rounded-2xl">
        {/* Font & Style Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-sm">
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
          <div className="flex items-center gap-1 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-sm">
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
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1.5 rounded-xl shadow-sm">
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
          <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
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

          {/* Pilcrow (¶) Tools */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={insertPilcrow}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              title="Insert Pilcrow (¶) symbol at cursor"
            >
              <Pilcrow className="w-3.5 h-3.5 text-purple-600" />
              <span>¶</span>
            </button>
            <button
              type="button"
              onClick={toggleParagraphPilcrows}
              className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors border-l border-zinc-200 ${
                content.includes('¶')
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
              title="Toggle paragraph marks (¶)"
            >
              {content.includes('¶') ? 'Clear ¶' : 'Mark ¶'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            type="button"
            onClick={handleManualDownload}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-40 transition-all shadow-sm"
            title="Download .txt"
          >
            <Download className="w-3.5 h-3.5" />
            Export .txt
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Transcript'}
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-purple-50/60 border border-purple-200/60 p-2.5 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="Find (case-sensitive)..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/30"
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-400/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={performFindReplace}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Replace All
        </button>

        {content && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all transcript content from the editor?')) {
                setContent('')
                setStatusMessage(null)
              }
            }}
            className="text-xs text-zinc-500 hover:text-red-600 px-2 py-1 transition-colors"
          >
            Clear Text
          </button>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`text-xs px-3 py-2 rounded-xl border flex items-center justify-between ${
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

      {/* Editor Main Text Area */}
      <div className="relative flex-1 min-h-[340px] flex flex-col">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePasteIntercept}
          placeholder="Paste your raw transcript here or start typing..."
          style={{
            fontFamily: getFontFamilyStyle(),
            fontSize: `${fontSize}px`,
            color: color,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
          }}
          className="w-full flex-1 p-4 rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-inner resize-none outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all leading-relaxed"
        />
      </div>

      {/* Bottom Counter Bar */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2">
        <div className="flex items-center gap-4">
          <span>
            Words: <strong className="text-zinc-700">{wordCount}</strong>
          </span>
          <span>
            Characters: <strong className="text-zinc-700">{charCount}</strong>
          </span>
          {role === 'worker' && (
            <span className="text-purple-600 font-medium">
              Saving auto-downloads a .txt copy to your device
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-400">
          Role: <span className="font-semibold uppercase text-zinc-600">{role}</span>
        </div>
      </div>
    </div>
  )
}

