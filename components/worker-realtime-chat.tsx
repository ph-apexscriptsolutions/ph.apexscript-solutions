"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MessageCircle, X } from 'lucide-react'

type Msg = { id?: string; sender: string; senderType: 'worker' | 'admin'; content: string; ts: number }

export default function WorkerRealtimeChat({ workerId, initialName }: { workerId: string; initialName?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [name, setName] = useState(initialName || 'You')
  const [unread, setUnread] = useState(0)
  const channelRef = useRef<any | null>(null)
  const presenceChannelRef = useRef<any | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const normalizePayload = (payload: any) => {
    let result = payload
    while (result && result.payload && typeof result.payload === 'object') {
      result = result.payload
    }
    return result || {}
  }

  useEffect(() => {
    if (!workerId) return
    const channelName = `chat:worker:${workerId}`
    const channel = supabase.channel(channelName)

    channel.on('broadcast', { event: 'message' }, (payload: any) => {
      const eventPayload = normalizePayload(payload)
      const msg: Msg = {
        sender: eventPayload.sender || 'admin',
        senderType: eventPayload.senderType || 'admin',
        content: eventPayload.content ?? eventPayload.message ?? eventPayload.text ?? '',
        ts: Date.now(),
      }
      setMessages((p) => [...p, msg])
      if (!open) setUnread((u) => u + 1)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    // handle clear requests from admin
    channel.on('broadcast', { event: 'clear' }, (_payload: any) => {
      setMessages([])
    })

    channel.subscribe((status: any) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_JOINED') {
        channelRef.current = channel
      }
    })

    const presenceChannel = supabase.channel('presence', {
      config: { presence: { key: `worker-${workerId}` } },
    })

    presenceChannel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_JOINED') {
        presenceChannelRef.current = presenceChannel
        try {
          await presenceChannel.track({ workerId, name, status: 'online' })
        } catch (e) {
          console.warn('Presence track error', e)
        }
      }
    })
    return () => {
      try {
        presenceChannelRef.current?.untrack().catch(() => {})
      } catch (e) {}
      try { supabase.removeChannel(channel) } catch (e) {}
      try { supabase.removeChannel(presenceChannel) } catch (e) {}
      channelRef.current = null
      presenceChannelRef.current = null
    }
  }, [workerId])

  // update presence state when name changes
  useEffect(() => {
    if (!workerId) return
    presenceChannelRef.current?.track({ workerId, name, status: 'online' }).catch(() => {})
  }, [name, workerId])

  // stop tracking on page unload
  useEffect(() => {
    const onUnload = () => {
      try { presenceChannelRef.current?.untrack().catch(() => {}) } catch (e) {}
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [workerId, name])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const payload = { sender: name || 'Worker', senderType: 'worker', content: trimmed, message: trimmed, text: trimmed }
    setMessages((p) => [...p, { ...payload, ts: Date.now() }])
    setText('')
    try {
      const channelName = `chat:worker:${workerId}`
      await supabase.channel(channelName).send({ type: 'broadcast', event: 'message', payload })
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) {
      console.error('Failed to send chat broadcast', err)
    }
  }

  return (
    <>
      {/* Floating icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setOpen(true)} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg focus:outline-none">
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">{unread}</span>}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative z-70 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">Chat</div>
                <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-zinc-200 px-2 py-1 text-sm" />
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-3 text-sm" style={{ height: '320px' }}>
              {messages.length === 0 ? (
                <div className="text-center text-zinc-400">No messages yet. Say hello 👋</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.senderType === 'worker' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 text-sm ${m.senderType === 'worker' ? 'bg-cyan-600 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                      <div className="font-semibold text-xs mb-1">{m.sender}</div>
                      {m.content}
                      <div className="text-xs text-zinc-400 mt-1 text-right">{new Date(m.ts).toLocaleTimeString()}</div>
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
      )}
    </>
  )
}
