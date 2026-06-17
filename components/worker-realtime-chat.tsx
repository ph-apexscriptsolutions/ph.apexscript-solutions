"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MessageCircle, X } from 'lucide-react'

type Msg = { id?: string; sender: string; senderType: 'worker' | 'admin'; content: string; ts: number; messageId?: string }

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'Admin':
      return 'bg-cyan-100 text-cyan-800'
    case 'Project Manager':
      return 'bg-purple-100 text-purple-800'
    case 'Human Resource':
      return 'bg-orange-100 text-orange-800'
    case 'Project Manager/Human Resource':
      return 'bg-pink-100 text-pink-800'
    case 'Moderator':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-zinc-100 text-zinc-700'
  }
}

function parseSenderRole(sender: string): { name: string; role: string } {
  const parts = sender.split(' - ')
  if (parts.length === 2) {
    return { name: parts[1], role: parts[0] }
  }
  return { name: sender, role: '' }
}

export default function WorkerRealtimeChat({ workerId, initialName }: { workerId: string; initialName?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [name, setName] = useState(initialName || 'You')
  const [unread, setUnread] = useState(0)
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set())
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const [hasShownAutoMessage, setHasShownAutoMessage] = useState(false)
  const channelRef = useRef<any | null>(null)
  const presenceChannelRef = useRef<any | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null)

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
      const messageId = eventPayload.messageId || `${Date.now()}-${Math.random()}`
      const senderType = eventPayload.senderType || 'admin'

      // Clear the auto message timer if an admin responds
      if (senderType === 'admin' && autoMessageTimerRef.current) {
        clearTimeout(autoMessageTimerRef.current)
        autoMessageTimerRef.current = null
      }

      // Prevent duplicate messages
      setProcessedMessageIds((prev) => {
        if (prev.has(messageId)) return prev
        const newSet = new Set(prev)
        newSet.add(messageId)
        return newSet
      })

      const msg: Msg = {
        sender: eventPayload.sender || 'admin',
        senderType,
        content: eventPayload.content ?? eventPayload.message ?? eventPayload.text ?? '',
        ts: Date.now(),
        messageId,
      }
      setMessages((p) => {
        // Check if message with same ID already exists
        if (p.some(m => m.messageId === messageId)) return p
        return [...p, msg]
      })
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
      if (autoMessageTimerRef.current) {
        clearTimeout(autoMessageTimerRef.current)
        autoMessageTimerRef.current = null
      }
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
    const messageId = `${Date.now()}-${Math.random()}`
    const msg: Msg = { sender: name || 'Worker', senderType: 'worker', content: trimmed, ts: Date.now(), messageId }
    const payload = { ...msg, message: trimmed, text: trimmed, messageId }
    setText('')
    
    // Add message locally immediately so worker sees their own message
    setProcessedMessageIds((prev) => new Set([...prev, messageId]))
    setMessages((p) => [...p, msg])
    
    // Start 10-second timer for first message if auto message hasn't been shown yet
    if (isFirstMessage && !hasShownAutoMessage) {
      setIsFirstMessage(false)
      autoMessageTimerRef.current = setTimeout(() => {
        const autoMessageId = `auto-${Date.now()}`
        const autoMessage: Msg = {
          sender: 'System',
          senderType: 'admin',
          content: 'Our agents are currently unavailable to respond at this time. Please send us your message, and we will relay it to the appropriate agent. We appreciate your patience and will ensure your concern is addressed as soon as possible.',
          ts: Date.now(),
          messageId: autoMessageId,
        }
        setProcessedMessageIds((prev) => new Set([...prev, autoMessageId]))
        setMessages((p) => [...p, autoMessage])
        setHasShownAutoMessage(true)
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }, 10000) // 10 seconds
    }
    
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
              <div className="text-sm font-semibold">Chat</div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-3 text-sm" style={{ height: '320px' }}>
              {messages.length === 0 ? (
                <div className="text-center text-zinc-400">No messages yet. Say hello 👋</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.senderType === 'worker' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 text-sm ${m.senderType === 'worker' ? 'bg-cyan-600 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                      <div className="font-semibold text-xs mb-1 flex items-center gap-2">
                        {m.senderType === 'admin' ? (
                          (() => {
                            const { name, role } = parseSenderRole(m.sender)
                            return (
                              <>
                                {role && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeClass(role)}`}>{role}</span>}
                                <span>{name}</span>
                              </>
                            )
                          })()
                        ) : (
                          m.sender
                        )}
                      </div>
                      {m.content}
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
