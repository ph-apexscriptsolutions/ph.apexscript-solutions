"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { X } from 'lucide-react'

type Msg = { id: string; sender: string; content: string; created_at: string }

export default function ChatPopup({ open, onClose, workerId, workerName }: { open: boolean; onClose: () => void; workerId?: string | null; workerName?: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  // Debug: log mounting/open state
  useEffect(() => {
    try {
      console.log('[CHAT POPUP] open=', open, 'workerId=', workerId, 'messages.length=', messages.length)
    } catch (e) {
      // ignore
    }
  }, [open, workerId, messages.length])

  useEffect(() => {
    if (!open || !workerId) return
    let mounted = true

    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from('admin_worker_messages')
          .select('*')
          .eq('worker_id', workerId)
          .order('created_at', { ascending: true })

        if (!mounted) return
        setMessages((data || []) as Msg[])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      } catch (err) {
        console.error('Failed fetching chat history', err)
      }
    }

    fetchHistory()

    const channel = supabase
      .channel(`chat:${workerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_worker_messages', filter: `worker_id=eq.${workerId}` },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [open, workerId])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || !workerId) return
    setText('')
    try {
      await supabase.from('admin_worker_messages').insert({ worker_id: workerId, sender: 'admin', content: trimmed })
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-70 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">Chat with {workerName || 'Worker'}</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-80 overflow-y-auto p-4 space-y-3 text-sm" style={{ height: '320px' }}>
          {messages.length === 0 ? (
            <div className="text-center text-zinc-400">No messages yet. Say hello 👋</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 text-sm ${m.sender === 'admin' ? 'bg-cyan-600 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                  {m.content}
                  <div className="text-xs text-zinc-400 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none" placeholder="Type a message..." />
          <button onClick={sendMessage} className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Send</button>
        </div>
      </div>
    </div>
  )
}
