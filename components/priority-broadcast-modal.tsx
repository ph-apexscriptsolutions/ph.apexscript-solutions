'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, BellRing, CheckCircle, Clock, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { playPriorityAlertSound, isAudioMuted, setAudioMuted } from '@/utils/audio'

interface PriorityAnnouncement {
  id: number
  admin_id?: string
  admin_name?: string
  title: string
  description: string
  target_type: string
  target_worker_ids?: string[]
  first_come_first_served: boolean
  status: string
  claimed_by_worker_id?: string
  claimed_by_worker_name?: string
  expires_at?: string
  created_at: string
  responses?: any[]
}

interface PriorityBroadcastModalProps {
  announcement: PriorityAnnouncement | null
  workerId: string
  workerName: string
  workerEmail: string
  onClose: () => void
  onResponseSubmitted?: (announcementId: number, response: 'accepted' | 'declined') => void
}

export default function PriorityBroadcastModal({
  announcement,
  workerId,
  workerName,
  workerEmail,
  onClose,
  onResponseSubmitted,
}: PriorityBroadcastModalProps) {
  const [muted, setMuted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userResponse, setUserResponse] = useState<'accepted' | 'declined' | null>(null)
  const [note, setNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [pendingAction, setPendingAction] = useState<'accepted' | 'declined' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    setMuted(isAudioMuted())
  }, [])

  // Play alert audio sound when announcement opens
  useEffect(() => {
    if (announcement) {
      playPriorityAlertSound()
    }
  }, [announcement?.id])

  // Check existing response
  useEffect(() => {
    if (announcement?.responses && workerId) {
      const existing = announcement.responses.find((r: any) => r.worker_id === workerId)
      if (existing) {
        setUserResponse(existing.response)
      } else {
        setUserResponse(null)
      }
    }
  }, [announcement, workerId])

  // Countdown timer calculation
  useEffect(() => {
    if (!announcement?.expires_at) {
      setTimeLeft(null)
      return
    }

    const updateTimer = () => {
      const diff = new Date(announcement.expires_at!).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('EXPIRED')
      } else {
        const mins = Math.floor(diff / (1000 * 60))
        const secs = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [announcement?.expires_at])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setAudioMuted(next)
    if (!next) {
      playPriorityAlertSound()
    }
  }

  const handleRespond = async (action: 'accepted' | 'declined') => {
    if (!announcement) return
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/priority-announcements/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          workerId,
          workerName,
          workerEmail,
          response: action,
          note,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit response')
        return
      }

      setUserResponse(action)
      if (onResponseSubmitted) {
        onResponseSubmitted(announcement.id, action)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting response')
    } finally {
      setSubmitting(false)
    }
  }

  if (!announcement) return null

  const isClaimedByOther =
    announcement.first_come_first_served &&
    announcement.status === 'claimed' &&
    announcement.claimed_by_worker_id !== workerId

  const canDismiss = userResponse || isClaimedByOther || timeLeft === 'EXPIRED'

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (canDismiss) {
        onClose()
      } else {
        setIsShaking(true)
        setErrorMessage('⚠️ Action Required: Please choose to Accept or Decline this priority assignment.')
        setTimeout(() => setIsShaking(false), 500)
      }
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <style>{`
        @keyframes priorityShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-priority-shake {
          animation: priorityShake 0.4s ease-in-out;
        }
      `}</style>
      <div className={`relative w-full max-w-lg overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/40 transform transition-all scale-100 ${
        isShaking ? 'animate-priority-shake ring-4 ring-red-500 border-red-500' : ''
      }`}>
        
        {/* Urgent Header Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center space-x-1.5 font-bold tracking-wide text-sm uppercase">
              <Zap className="h-4 w-4 fill-white" />
              <span>Priority Rush Assignment</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={muted ? 'Unmute alert sound' : 'Mute alert sound'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-red-200" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {canDismiss && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Expiration & Info Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-600" />
              Urgent Broadcast
            </span>

            {timeLeft && (
              <span className={`inline-flex items-center text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                timeLeft === 'EXPIRED' ? 'bg-zinc-200 text-zinc-700' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                <Clock className="h-3.5 w-3.5 mr-1" />
                {timeLeft === 'EXPIRED' ? 'Expired' : `Time Remaining: ${timeLeft}`}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {announcement.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                <span>Announced by <strong>{announcement.admin_name && announcement.admin_name !== 'Anonymous' ? announcement.admin_name : 'Admin'}</strong></span>
              </span>
              <span className="text-[11px] text-zinc-400">
                {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {announcement.description || 'No detailed instructions provided. Please confirm if you can take this rush assignment.'}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Claimed by another worker warning */}
          {isClaimedByOther && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold">Assignment Already Claimed</p>
                <p className="text-xs text-amber-700">This priority assignment was claimed by {announcement.claimed_by_worker_name || 'another worker'}. Thank you for checking!</p>
              </div>
            </div>
          )}

          {/* Already Responded Notice */}
          {userResponse && !isClaimedByOther && (
            <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
              userResponse === 'accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`h-5 w-5 ${userResponse === 'accepted' ? 'text-emerald-600' : 'text-zinc-500'}`} />
                <div>
                  <p className="font-bold">
                    {userResponse === 'accepted' ? 'You Accepted This Assignment!' : 'You Declined This Assignment'}
                  </p>
                  <p className="text-xs opacity-80">Admin has been notified via email and live dashboard.</p>
                </div>
              </div>
              <button
                onClick={() => setUserResponse(null)}
                className="text-xs underline font-medium hover:opacity-80"
              >
                Change Answer
              </button>
            </div>
          )}

          {/* Optional Note field toggle */}
          {(!userResponse || showNoteInput) && !isClaimedByOther && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Optional Note to Admin:
                </label>
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Ready to start right now, will finish in 1 hour..."
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          {!userResponse && !isClaimedByOther && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRespond('declined')}
                disabled={submitting || timeLeft === 'EXPIRED'}
                className="w-full py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Can\'t Take It (Decline)'}
              </button>

              <button
                type="button"
                onClick={() => handleRespond('accepted')}
                disabled={submitting || timeLeft === 'EXPIRED'}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Take Assignment (Accept)'}</span>
              </button>
            </div>
          )}

          {/* Close button if user already responded or claimed */}
          {(userResponse || isClaimedByOther) && (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Done / Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
