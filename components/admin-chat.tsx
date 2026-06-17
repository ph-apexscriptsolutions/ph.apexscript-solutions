"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MessageSquare, Trash, Users, MoreVertical } from 'lucide-react'

type Msg = { sender: string; senderType: 'worker' | 'admin'; content: string; ts: number; messageId?: string }
type WorkerProfile = { id: string; full_name?: string; role?: string }
type AdminRole = 'Admin' | 'Project Manager' | 'Human Resource' | 'Project Manager/Human Resource' | 'Moderator'

export default function AdminChat({
  workerProfiles,
}: {
  workerProfiles: WorkerProfile[]
}) {
  const [adminName, setAdminName] = useState('Admin')
  const [adminRole, setAdminRole] = useState<AdminRole>('Admin')
  const [activeWorker, setActiveWorker] = useState<string | null>(null)
  const [messagesMap, setMessagesMap] = useState<Record<string, Msg[]>>({})
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [onlineMap, setOnlineMap] = useState<Record<string, { status: 'online' | 'offline'; name?: string; ts: number }>>({})
  const [collapsed, setCollapsed] = useState(false)
  const [workersList, setWorkersList] = useState<WorkerProfile[]>(workerProfiles)
  const subsRef = useRef<Record<string, any>>({})
  const endRef = useRef<HTMLDivElement | null>(null)
  const processedMessageIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Sort workers by role hierarchy: Admin > Project Manager & Human Resource > Moderator > Workers
    const roleOrder: { [key: string]: number } = {
      'admin': 1,
      'project_manager': 2,
      'human_resource': 2,
      'project_manager_human_resource': 2,
      'moderator': 3,
      'worker': 4,
      'Admin': 1,
      'Project Manager': 2,
      'Human Resource': 2,
      'Project Manager/Human Resource': 2,
      'Moderator': 3,
      'Worker': 4,
    }
    
    const sortedWorkers = [...workerProfiles].sort((a, b) => {
      const roleA = roleOrder[a.role || 'worker'] || 4
      const roleB = roleOrder[b.role || 'worker'] || 4
      if (roleA !== roleB) return roleA - roleB
      return (a.full_name || a.id).localeCompare(b.full_name || b.id)
    })
    
    setWorkersList(sortedWorkers)
    // Subscribe to all workers when worker profiles change
    workerProfiles.forEach((worker) => {
      if (!subsRef.current[worker.id]) {
        subscribeWorker(worker.id)
      }
    })
  }, [workerProfiles])

  // Cleanup subscriptions when workers are removed
  useEffect(() => {
    const currentWorkerIds = new Set(workerProfiles.map(w => w.id))
    Object.keys(subsRef.current).forEach(workerId => {
      if (!currentWorkerIds.has(workerId)) {
        try {
          supabase.removeChannel(subsRef.current[workerId])
        } catch (e) {}
        delete subsRef.current[workerId]
      }
    })
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

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (err) {
      console.error('Failed to play notification sound:', err)
    }
  }

  const subscribeWorker = (workerId: string) => {
    const channelName = `chat:worker:${workerId}`
    const channel = supabase.channel(channelName)

    channel.on('broadcast', { event: 'message' }, (payload: any) => {
      const eventPayload = normalizePayload(payload)
      const messageId = eventPayload.messageId || `${Date.now()}-${Math.random()}`
      const senderType = eventPayload.senderType || 'worker'
      
      // Prevent duplicate messages
      if (processedMessageIdsRef.current.has(messageId)) return
      processedMessageIdsRef.current.add(messageId)
      
      // Play notification sound if message is from worker
      if (senderType === 'worker') {
        playNotificationSound()
      }
      
      const msg: Msg = {
        sender: eventPayload.sender || 'worker',
        senderType,
        content: eventPayload.content ?? eventPayload.message ?? eventPayload.text ?? '',
        ts: Date.now(),
        messageId,
      }
      setMessagesMap((m) => {
        const existingMessages = m[workerId] || []
        // Check if message with same ID already exists
        if (existingMessages.some(m => m.messageId === messageId)) return m
        return { ...m, [workerId]: [...existingMessages, msg] }
      })
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
    const messageId = `${Date.now()}-${Math.random()}`
    const msg: Msg = { sender: `${adminRole} - ${adminName || 'Admin'}`, senderType: 'admin', content: trimmed, ts: Date.now(), messageId }
    setMessagesMap((m) => ({ ...m, [workerId]: [...(m[workerId] || []), msg] }))
    const payload = { ...msg, message: trimmed, text: trimmed, messageId }
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
            <>
              {/* Admins */}
              {workersList.filter(w => w.role === 'admin' || w.role === 'Admin').length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-semibold text-zinc-600 mb-1 px-2">Admins</div>
                  {workersList.filter(w => w.role === 'admin' || w.role === 'Admin').map((worker) => (
                    <button key={worker.id} onClick={() => openWorker(worker.id)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs leading-tight hover:bg-zinc-50">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <div className="truncate">{worker.full_name || worker.id}</div>
                          <div className="text-[10px] text-zinc-500">Admin</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadMap[worker.id] ? <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{unreadMap[worker.id]}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Project Manager & Human Resource */}
              {workersList.filter(w => ['project_manager', 'human_resource', 'project_manager_human_resource', 'Project Manager', 'Human Resource', 'Project Manager/Human Resource'].includes(w.role || '')).length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-semibold text-zinc-600 mb-1 px-2">Project Manager & Human Resource</div>
                  {workersList.filter(w => ['project_manager', 'human_resource', 'project_manager_human_resource', 'Project Manager', 'Human Resource', 'Project Manager/Human Resource'].includes(w.role || '')).map((worker) => (
                    <button key={worker.id} onClick={() => openWorker(worker.id)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs leading-tight hover:bg-zinc-50">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <div className="truncate">{worker.full_name || worker.id}</div>
                          <div className="text-[10px] text-zinc-500">{worker.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadMap[worker.id] ? <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{unreadMap[worker.id]}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Moderators */}
              {workersList.filter(w => w.role === 'moderator' || w.role === 'Moderator').length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-semibold text-zinc-600 mb-1 px-2">Moderators</div>
                  {workersList.filter(w => w.role === 'moderator' || w.role === 'Moderator').map((worker) => (
                    <button key={worker.id} onClick={() => openWorker(worker.id)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs leading-tight hover:bg-zinc-50">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <div className="truncate">{worker.full_name || worker.id}</div>
                          <div className="text-[10px] text-zinc-500">Moderator</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadMap[worker.id] ? <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{unreadMap[worker.id]}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Workers */}
              {workersList.filter(w => w.role === 'worker' || w.role === 'Worker' || !w.role).length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-semibold text-zinc-600 mb-1 px-2">Workers</div>
                  {workersList.filter(w => w.role === 'worker' || w.role === 'Worker' || !w.role).map((worker) => (
                    <button key={worker.id} onClick={() => openWorker(worker.id)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs leading-tight hover:bg-zinc-50">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <div className="truncate">{worker.full_name || worker.id}</div>
                          <div className="text-[10px] text-zinc-500">Worker</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadMap[worker.id] ? <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{unreadMap[worker.id]}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
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
          <div className="flex items-center gap-1">
            <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="rounded border px-2 py-1 text-xs" placeholder="Name" />
            <select
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as AdminRole)}
              className="rounded border px-2 py-1 text-xs bg-white"
            >
              <option value="Admin">Admin</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Human Resource">Human Resource</option>
              <option value="Project Manager/Human Resource">Project Manager/Human Resource</option>
              <option value="Moderator">Moderator</option>
            </select>
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
