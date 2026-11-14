"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Bot, User, Minimize2, Maximize2, Loader2, HelpCircle } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  "How to format an inaudible tag?",
  "Senate speaker labels rules",
  "How should numbers be written?",
  "False start & interruption format",
]

export default function FormatAssistantModal({ department }: { department?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your ApexScript AI Format Assistant. Ask me any formatting, timestamp, or style guide questions anytime so you don't have to wait for an editor!",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState(department || "conference")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (department) {
      setSelectedDept(department)
    }
  }, [department])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    if (!textToSend) setInput("")
    setLoading(true)

    try {
      const res = await fetch('/api/format-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          department: selectedDept,
          chatHistory: newMessages.slice(-8),
        }),
      })

      const data = await res.json()
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || "Sorry, I couldn't reach the AI assistant. Please make sure the GEMINI_API_KEY is configured.",
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Network error. Please try again in a few moments.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-3 text-white shadow-xl shadow-cyan-600/30 hover:scale-105 hover:from-cyan-500 hover:to-sky-500 transition-all duration-200 cursor-pointer group"
          title="Ask AI Format Assistant"
        >
          <Sparkles className="h-5 w-5 animate-pulse text-cyan-200" />
          <span className="text-sm font-semibold tracking-wide">Format AI</span>
          <span className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">Free</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-cyan-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-sky-700 p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-inner">
                <Bot className="h-5 w-5 text-cyan-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold leading-none">Format AI Assistant</h4>
                  <span className="text-[9px] bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 px-1.5 py-0.2 rounded font-medium">Online</span>
                </div>
                <p className="text-[10px] text-cyan-100/90 mt-0.5">Instant answers for transcription & rules</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-cyan-100 hover:bg-white/10 hover:text-white transition"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Department Selector */}
          <div className="bg-cyan-50/70 border-b border-cyan-100 px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-zinc-600 text-[11px] font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-cyan-300 rounded px-2 py-0.5 text-xs text-zinc-800 outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
            >
              <option value="conference">Conference / Earnings</option>
              <option value="senate">Senate / Government</option>
              <option value="broadcast">Broadcast / TV / Radio</option>
              <option value="podcast">Podcast / Audio</option>
              <option value="academics">Academics</option>
              <option value="medical">Medical</option>
              <option value="general">General Standards</option>
            </select>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-slate-50/60 to-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-none shadow-xs'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl bg-white text-zinc-600 border border-zinc-200 px-3 py-2 text-xs flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600" />
                  <span>Checking rules & formatting...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-1">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-[10px] bg-white border border-cyan-200 text-cyan-900 px-2 py-0.5 rounded-full hover:bg-cyan-50 hover:border-cyan-300 transition text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div className="p-2.5 bg-white border-t border-zinc-200 flex items-center gap-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask formatting question or paste text..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 max-h-24 overflow-y-auto"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 transition shadow-xs shrink-0"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
