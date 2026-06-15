"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MessageSquare, Trash, Users, MoreVertical, Circle } from 'lucide-react'

type Msg = { sender: string; senderType: 'worker' | 'admin'; content: string; ts: number }
type WorkerProfile = { id: string; full_name?: string; role?: string; status?: 'online' | 'away' | 'offline' }
type StatusType = 'online' | 'away' | 'offline'

function getWorkerStatusDotClass(status?: StatusType) {
  if (status === 'online') return 'bg-green-500'
  if (status === 'away') return 'bg-yellow-500'
  return 'bg-zinc-400'
}

export default function AdminChat({
  workerProfiles,
  onWorkerStatusChange,
}: {
  workerProfiles: WorkerProfile[]
  onWorkerStatusChange?: (workerId: string, status: StatusType) => void
}) {
  const [adminName, setAdminName] = useState('Admin')
  const [activeWorker, setActiveWorker] = useState<string | null>(null)
  const [messagesMap, setMessagesMap] = useState<Record<string, Msg[]>>({})
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [onlineMap, setOnlineMap] = useState<Record<string, { status: 'online' | 'offline'; name?: string; ts: number }>>({})
  const [collapsed, setCollapsed] = useState(false)
  const [showStatusPopup, setShowStatusPopup] = useState(false)
  const [statusPopupPosition, setStatusPopupPosition] = useState({ x: 0, y: 0 })
  const [workersList, setWorkersList] = useState<WorkerProfile[]>(workerProfiles)
  const subsRef = useRef<Record<string, any>>({})
  const endRef = useRef<HTMLDivElement | null>(null)
  const statusButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setWorkersList(workerProfiles)
  }, [workerProfiles])

  useEffect(() => {
    return () => {
      // cleanup all channels
      Object.values(subsRef.current).forEach((ch) => { try { supabase.removeChannel(ch) } catch (e) {} })
      subsRef.current = {}
    }
  }, [])

  const parsePresenceState = (state: any) => {
    const parsed: Record<string, { status: 'online' | 'offline'; name?: string; ts: number }> = {}
    if (!state) return parsed
    Object.entries(state).forEach(([key, presences]) => {
      if (!Array.isArray(presences) || presences.length === 0) return
      const workerId = key.replace(/^worker-/, '')
      const lastPresence = presences[presences.length - 1]
      parsed[workerId] = { status: 'online', name: lastPresence?.name, ts: Date.now() }
    })
    return parsed
  }

  useEffect(() => {
    const presenceChannel = supabase.channel('presence')
    const syncState = () => {
      const state = presenceChannel.presenceState()
      setOnlineMap((prev) => {
        const parsed = parsePresenceState(state)
        return { ...prev, ...parsed }
      })
    }

    presenceChannel.on('presence', { event: 'sync' }, () => {
      syncState()
    })
    presenceChannel.on('presence', { event: 'join' }, () => {
      syncState()
    })
    presenceChannel.on('presence', { event: 'leave' }, () => {
      syncState()
    })

    presenceChannel.subscribe((status: any) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_JOINED') {
        syncState()
      }
    })

    return () => { try { supabase.removeChannel(presenceChannel) } catch (e) {} }
  }, [])

  const normalizePayload = (payload: any) => {
    let result = payload
    while (result && result.payload && typeof result.payload === 'object') {
      result = result.payload
    }
    return result || {}
  }

  const subscribeWorker = (workerId: string) => {
    const channelName = `chat:worker:${workerId}`
    const channel = supabase.channel(channelName)

    channel.on('broadcast', { event: 'message' }, (payload: any) => {
      const eventPayload = normalizePayload(payload)
      const msg: Msg = {
        sender: eventPayload.sender || 'worker',
        senderType: eventPayload.senderType || 'worker',
        content: eventPayload.content ?? eventPayload.message ?? eventPayload.text ?? '',
        ts: Date.now(),
      }
      setMessagesMap((m) => ({ ...m, [workerId]: [...(m[workerId] || []), msg] }))
      if (activeWorker !== workerId) setUnreadMap((u) => ({ ...u, [workerId]: (u[workerId] || 0) + 1 }))
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    channel.on('broadcast', { event: 'clear' }, () => {
      setMessagesMap((m) => ({ ...m, [workerId]: [] }))
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        subsRef.current[workerId] = channel
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Admin chat subscribe error', status)
      }
    })
  }

  const selectedWorker = workersList.find((w) => w.id === activeWorker)

  const openWorker = (workerId: string) => {
    setActiveWorker(workerId)
    setUnreadMap((u) => ({ ...u, [workerId]: 0 }))
    if (!subsRef.current[workerId]) {
      subscribeWorker(workerId)
    }
  }

  const sendMessage = async (workerId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const msg: Msg = { sender: adminName || 'Admin', senderType: 'admin', content: trimmed, ts: Date.now() }
    setMessagesMap((m) => ({ ...m, [workerId]: [...(m[workerId] || []), msg] }))
    const payload = { ...msg, message: trimmed, text: trimmed }
    try {
      await supabase.channel(`chat:worker:${workerId}`).send({ type: 'broadcast', event: 'message', payload })
    } catch (err) {
      console.error('Admin send failed', err)
    }
  }

  const clearChat = async (workerId: string) => {
    setMessagesMap((m) => ({ ...m, [workerId]: [] }))
    try {
      await supabase.channel(`chat:worker:${workerId}`).send({ type: 'broadcast', event: 'clear', payload: {} })
    } catch (err) {
      console.error('Failed to broadcast clear', err)
    }
  }

  const updateWorkerStatus = async (workerId: string, newStatus: StatusType) => {
    try {
      const { error } = await supabase
        .from('worker_profiles')
        .update({ status: newStatus })
        .eq('id', workerId)
      
      if (!error) {
        setWorkersList((prev) =>
          prev.map((w) => (w.id === workerId ? { ...w, status: newStatus } : w))
        )
        onWorkerStatusChange?.(workerId, newStatus)
      } else {
        console.error('Failed to update worker status:', error)
      }
    } catch (err) {
      console.error('Error updating worker status', err)
    }
    setShowStatusPopup(false)
  }

  const handleStatusButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = statusButtonRef.current?.getBoundingClientRect()
    if (rect) {
      setStatusPopupPosition({ x: rect.right - 120, y: rect.bottom + 8 })
    }
    setShowStatusPopup(!showStatusPopup)
  }

  return (
    <div className="flex gap-2">
      <div className={`rounded border p-2 bg-white shadow-sm ${collapsed ? 'w-56' : 'w-64'}`}>
        <div className="flex items-center gap-1 mb-2">
          <Users className="h-4 w-4 text-zinc-600" />
          <div className="text-xs font-semibold">Chats</div>
          <button onClick={() => setCollapsed((prev) => !prev)} className="ml-auto rounded-full border border-zinc-200 bg-white p-1 text-zinc-500 hover:bg-zinc-50">
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <div className="space-y-1 max-h-[340px] overflow-y-auto">
          {workersList.length === 0 ? (
            <div className="text-xs text-zinc-500">No workers available to chat.</div>
          ) : (
            workersList.map((worker) => (
              <button key={worker.id} onClick={() => openWorker(worker.id)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs leading-tight hover:bg-zinc-50">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${getWorkerStatusDotClass(worker.status)}`} />
                  <div className="truncate">{worker.full_name || worker.id}</div>
                </div>
                <div className="flex items-center gap-1">
                  {unreadMap[worker.id] ? <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{unreadMap[worker.id]}</span> : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 max-w-[28rem] rounded border bg-white p-2 shadow-sm transition-all ${collapsed ? 'hidden' : 'block'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-zinc-600" />
            <div>
              <div className="text-xs font-semibold">Admin Chat</div>
              {selectedWorker ? (
                <div className="text-[10px] text-zinc-500">Chatting with {selectedWorker.full_name || selectedWorker.id}</div>
              ) : (
                <div className="text-[10px] text-zinc-500">Select a worker to chat</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 relative">
            <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="rounded border px-2 py-1 text-xs" />
            {activeWorker && (
              <>
                <button 
                  ref={statusButtonRef}
                  onClick={handleStatusButtonClick} 
                  className="rounded bg-slate-600 px-2 py-1 text-[10px] text-white inline-flex items-center gap-1 hover:bg-slate-700"
                  title="Change worker status"
                >
                  <Circle className="h-3 w-3 fill-current" /> Status
                </button>
                {showStatusPopup && (
                  <StatusPopup 
                    selectedWorker={selectedWorker} 
                    onStatusChange={updateWorkerStatus}
                    onClose={() => setShowStatusPopup(false)}
                    position={statusPopupPosition}
                  />
                )}
              </>
            )}
            {activeWorker && <button onClick={() => clearChat(activeWorker)} className="rounded bg-red-600 px-2 py-1 text-[10px] text-white inline-flex items-center gap-1 hover:bg-red-700"><Trash className="h-3.5 w-3.5" /> Clear</button>}
          </div>
        </div>

        {activeWorker ? (
          <div className="h-[430px]">
            <div className="mb-1 text-xs font-semibold">Chat with {selectedWorker?.full_name || activeWorker}</div>
            <div className="h-[260px] overflow-y-auto p-2 space-y-2 border rounded">
              {(messagesMap[activeWorker] || []).map((m, i) => (
                <div key={i} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-2 py-1 text-xs ${m.senderType === 'admin' ? 'bg-cyan-600 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                    <div className="font-semibold text-[10px] mb-0.5">{m.sender}</div>
                    <div className="leading-snug">{m.content}</div>
                    <div className="text-[9px] text-zinc-400 mt-1 text-right">{new Date(m.ts).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <AdminComposer key={activeWorker} workerId={activeWorker} sendMessage={sendMessage} />
          </div>
        ) : (
          <div className="text-zinc-400">Select a worker chat from the left to start.</div>
        )}
      </div>
    </div>
  )
}

function AdminComposer({ workerId, sendMessage }: { workerId: string; sendMessage: (w: string, t: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="mt-2 flex items-center gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { sendMessage(workerId, text); setText('') } }} className="flex-1 rounded border px-2 py-1.5 text-xs" placeholder="Type a message..." />
      <button onClick={() => { sendMessage(workerId, text); setText('') }} className="rounded bg-cyan-600 px-3 py-1.5 text-xs text-white">Send</button>
    </div>
  )
}

interface StatusPopupProps {
  selectedWorker: WorkerProfile | undefined
  onStatusChange: (workerId: string, status: StatusType) => void
  onClose: () => void
  position: { x: number; y: number }
}

function StatusPopup({ selectedWorker, onStatusChange, onClose, position }: StatusPopupProps) {
  const statusOptions: { label: string; value: StatusType; color: string }[] = [
    { label: 'Online', value: 'online', color: 'bg-green-500' },
    { label: 'Away', value: 'away', color: 'bg-yellow-500' },
    { label: 'Offline', value: 'offline', color: 'bg-zinc-400' },
  ]

  if (!selectedWorker) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="fixed bg-white border rounded-lg shadow-lg w-48 z-50"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b bg-slate-50">
          <div className="text-xs font-semibold text-zinc-700">
            {selectedWorker.full_name || selectedWorker.id}
          </div>
          <div className="text-[10px] text-zinc-500">Change status</div>
        </div>
        <div className="p-2 space-y-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onStatusChange(selectedWorker.id, option.value)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left hover:bg-zinc-100 transition-colors ${
                selectedWorker.status === option.value ? 'bg-zinc-100 font-semibold' : ''
              }`}
            >
              <Circle className={`h-2.5 w-2.5 fill-current ${option.color} text-${option.color.split('-')[1]}-500`} />
              <span>{option.label}</span>
              {selectedWorker.status === option.value && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
