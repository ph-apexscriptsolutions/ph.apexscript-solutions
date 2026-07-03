"use client"

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MessageSquare, Trash, Users, MoreVertical, X, MessageCircle } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)

  const activeWorkerRef = useRef<string | null>(null)
  const isOpenRef = useRef(false)

  useEffect(() => {
    activeWorkerRef.current = activeWorker
  }, [activeWorker])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

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
      if (!isOpenRef.current || activeWorkerRef.current !== workerId) {
        setUnreadMap((u) => ({ ...u, [workerId]: (u[workerId] || 0) + 1 }))
      }
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

  const totalUnread = Object.values(unreadMap).reduce((sum, count) => sum + count, 0)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'W'
  }

  const renderWorkerButton = (worker: WorkerProfile, roleName: string) => {
    const isSelected = activeWorker === worker.id
    const unread = unreadMap[worker.id] || 0
    const online = onlineMap[worker.id]?.status === 'online'
    const name = worker.full_name || worker.id

    if (collapsed) {
      return (
        <button
          key={worker.id}
          onClick={() => openWorker(worker.id)}
          title={`${name} (${roleName})`}
          className={`relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all ${isSelected ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'hover:bg-zinc-100 text-zinc-600'}`}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-700 uppercase">
            {getInitials(name)}
            {online && <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />}
          </div>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unread}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        key={worker.id}
        onClick={() => openWorker(worker.id)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${isSelected ? 'bg-cyan-50/80 text-cyan-900 border border-cyan-100 shadow-sm' : 'hover:bg-zinc-100 text-zinc-700'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-700 uppercase flex-shrink-0">
            {getInitials(name)}
            {online && <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate text-zinc-800">{name}</span>
            <span className="text-[10px] text-zinc-500">{roleName}</span>
          </div>
        </div>
        {unread > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm flex-shrink-0">
            {unread}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
            } else {
              setIsOpen(true)
              if (activeWorker) {
                setUnreadMap((u) => ({ ...u, [activeWorker]: 0 }))
              }
            }
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 text-white shadow-xl shadow-cyan-500/40 hover:from-cyan-700 hover:to-sky-700 hover:shadow-cyan-500/50 hover:scale-105 transition-all focus:outline-none"
        >
          {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-md animate-pulse">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Popout */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[720px] max-w-[calc(100vw-3rem)] h-[550px] bg-white rounded-3xl border border-zinc-200/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">Admin Support Center</div>
                <div className="text-xs text-zinc-500">Realtime chat with workers</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200/60">
                <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-cyan-500/30 w-24" placeholder="Your Name" />
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as AdminRole)}
                  className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-medium bg-white focus:ring-1 focus:ring-cyan-500/30"
                >
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">PM</option>
                  <option value="Human Resource">HR</option>
                  <option value="Project Manager/Human Resource">PM/HR</option>
                  <option value="Moderator">Mod</option>
                </select>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body: Split View */}
          <div className="flex flex-1 min-h-0 divide-x divide-zinc-100">
            {/* Left Column: Workers list */}
            <div className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col bg-zinc-50/50 flex-shrink-0 transition-all duration-200`}>
              <div className="p-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
                {!collapsed && <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Active Chats</span>}
                <button onClick={() => setCollapsed((prev) => !prev)} className="rounded-xl border border-zinc-200/80 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 shadow-sm ml-auto">
                  {collapsed ? '▶' : '◀'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {workersList.length === 0 ? (
                  <div className="text-xs text-zinc-500 p-2">No workers available.</div>
                ) : (
                  <>
                    {/* Admins */}
                    {workersList.filter(w => w.role === 'admin' || w.role === 'Admin').length > 0 && (
                      <div className="mb-2">
                        {!collapsed && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-2">Admins</div>}
                        {workersList.filter(w => w.role === 'admin' || w.role === 'Admin').map((worker) => renderWorkerButton(worker, 'Admin'))}
                      </div>
                    )}

                    {/* Project Manager & Human Resource */}
                    {workersList.filter(w => ['project_manager', 'human_resource', 'project_manager_human_resource', 'Project Manager', 'Human Resource', 'Project Manager/Human Resource'].includes(w.role || '')).length > 0 && (
                      <div className="mb-2">
                        {!collapsed && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-2">Staff</div>}
                        {workersList.filter(w => ['project_manager', 'human_resource', 'project_manager_human_resource', 'Project Manager', 'Human Resource', 'Project Manager/Human Resource'].includes(w.role || '')).map((worker) => renderWorkerButton(worker, worker.role || 'Staff'))}
                      </div>
                    )}

                    {/* Moderators */}
                    {workersList.filter(w => w.role === 'moderator' || w.role === 'Moderator').length > 0 && (
                      <div className="mb-2">
                        {!collapsed && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-2">Moderators</div>}
                        {workersList.filter(w => w.role === 'moderator' || w.role === 'Moderator').map((worker) => renderWorkerButton(worker, 'Moderator'))}
                      </div>
                    )}

                    {/* Workers */}
                    {workersList.filter(w => w.role === 'worker' || w.role === 'Worker' || !w.role).length > 0 && (
                      <div className="mb-2">
                        {!collapsed && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-2">Workers</div>}
                        {workersList.filter(w => w.role === 'worker' || w.role === 'Worker' || !w.role).map((worker) => renderWorkerButton(worker, 'Worker'))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Chat Box */}
            <div className="flex-1 flex flex-col bg-white">
              {activeWorker ? (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-zinc-50/30">
                    <div>
                      <div className="text-xs font-bold text-zinc-900">Chatting with {selectedWorker?.full_name || activeWorker}</div>
                      <div className="text-[10px] text-zinc-500">Worker ID: {activeWorker}</div>
                    </div>
                    <button onClick={() => clearChat(activeWorker)} className="rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all flex items-center gap-1.5">
                      <Trash className="h-3.5 w-3.5" /> Clear Chat
                    </button>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {(messagesMap[activeWorker] || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                        <MessageSquare className="h-8 w-8 text-zinc-300 mb-2" />
                        <div className="text-xs font-medium">No messages yet. Start the conversation!</div>
                      </div>
                    ) : (
                      (messagesMap[activeWorker] || []).map((m, i) => (
                        <div key={i} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${m.senderType === 'admin' ? 'bg-gradient-to-br from-cyan-600 to-sky-600 text-white rounded-br-md' : 'bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-bl-md'}`}>
                            <div className="font-semibold text-[10px] opacity-90 mb-0.5">{m.sender}</div>
                            <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Composer */}
                  <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex-shrink-0">
                    <AdminComposer key={activeWorker} workerId={activeWorker} sendMessage={sendMessage} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-zinc-400">
                  <div className="h-16 w-16 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
                    <MessageSquare className="h-8 w-8 text-cyan-600/60" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-800">No Chat Selected</div>
                  <div className="text-xs text-zinc-500 mt-1 max-w-[200px]">Select a worker from the sidebar to view messages and start chatting.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
