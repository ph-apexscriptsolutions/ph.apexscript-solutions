'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, Mail, Send, Users, X, XCircle, RefreshCw } from 'lucide-react'

interface WorkerProfile {
  id: string
  full_name?: string
  email?: string
  role?: string
}

interface AdminPriorityAnnouncementModalProps {
  adminId: string
  adminName: string
  workers: WorkerProfile[]
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export default function AdminPriorityAnnouncementModal({
  adminId,
  adminName,
  workers = [],
  isOpen,
  onClose,
  onCreated,
}: AdminPriorityAnnouncementModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  
  // Form fields
  const [senderName, setSenderName] = useState(adminName || 'Admin')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([])
  const [expirationMinutes, setExpirationMinutes] = useState<number | null>(null)
  const [firstComeFirstServed, setFirstComeFirstServed] = useState(false)
  const [sendEmailAlert, setSendEmailAlert] = useState(true)

  useEffect(() => {
    if (adminName && adminName !== 'Anonymous') {
      setSenderName(adminName)
    }
  }, [adminName])

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // History state
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Filter only worker roles (exclude admins if needed, or include all workers)
  const eligibleWorkers = workers.filter((w) => w.role !== 'admin' || true)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/priority-announcements?role=admin')
      const data = await res.json()
      if (res.ok) {
        setAnnouncements(data.announcements || [])
      }
    } catch (e) {
      console.error('Fetch history error:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory()
    }
  }, [isOpen, activeTab])

  const toggleWorkerSelection = (id: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    )
  }

  const handleSelectAllWorkers = () => {
    if (selectedWorkerIds.length === eligibleWorkers.length) {
      setSelectedWorkerIds([])
    } else {
      setSelectedWorkerIds(eligibleWorkers.map((w) => w.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('Please enter an announcement title.')
      return
    }

    if (targetType === 'specific' && selectedWorkerIds.length === 0) {
      setErrorMessage('Please select at least one worker to target.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/priority-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          adminName: senderName.trim() || 'Admin',
          title: title.trim(),
          description: description.trim(),
          targetType,
          targetWorkerIds: targetType === 'specific' ? selectedWorkerIds : [],
          firstComeFirstServed,
          expirationMinutes,
          sendEmailAlert,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to send priority announcement')
        return
      }

      setSuccessMessage('Priority Announcement Broadcasted Live Successfully!')
      setTitle('')
      setDescription('')
      setSelectedWorkerIds([])
      setTargetType('all')

      if (onCreated) onCreated()

      setTimeout(() => {
        setSuccessMessage(null)
        setActiveTab('history')
        fetchHistory()
      }, 1200)
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error sending announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(`/api/priority-announcements?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchHistory()
      }
    } catch (e) {
      console.error('Close announcement error:', e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl sm:max-w-4xl overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 px-6 sm:px-8 py-4 sm:py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 fill-white text-red-600" />
            <h2 className="font-bold text-base sm:text-lg tracking-wide">
              Live Priority & Rush Assignment Dispatch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 sm:px-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3.5 px-5 text-xs sm:text-sm font-bold transition-all border-b-2 ${
              activeTab === 'create'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            📢 Broadcast New Rush Task
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-5 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <span>📊 Live Responses & Active Log</span>
            {announcements.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs px-2.5 py-0.5 font-bold">
                {announcements.length}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                  {(errorMessage.includes('priority_announcements') || errorMessage.includes('schema cache') || errorMessage.includes('does not exist')) && (
                    <div className="pt-2 border-t border-red-200 dark:border-red-800/60 space-y-2">
                      <p className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                        To enable this feature, copy and run the SQL query below in your <strong>Supabase SQL Editor</strong>:
                      </p>
                      <pre className="p-3 bg-zinc-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto select-all">
{`CREATE TABLE IF NOT EXISTS public.priority_announcements (
  id serial PRIMARY KEY,
  admin_id text,
  admin_name text DEFAULT 'Admin',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_type text NOT NULL DEFAULT 'all',
  target_worker_ids jsonb DEFAULT '[]'::jsonb,
  first_come_first_served boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  claimed_by_worker_id text,
  claimed_by_worker_name text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.priority_announcement_responses (
  id serial PRIMARY KEY,
  announcement_id integer REFERENCES public.priority_announcements(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  worker_name text NOT NULL DEFAULT '',
  worker_email text DEFAULT '',
  response text NOT NULL,
  note text DEFAULT '',
  responded_at timestamptz NOT NULL DEFAULT now()
);`}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Announced By */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Announced By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Maria, Team Lead, Admin..."
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <p className="text-[11px] text-zinc-400 mt-1">Workers will see this name on the popup (e.g. "Announced by Maria")</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Task / Announcement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. URGENT: 50 Records Proofreading Needed by 4 PM!"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Rush Details / Instructions
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide deadline, payment bonus, file links, or priority instructions..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Target Selection Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      targetType === 'all'
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-300 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Users className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-xs font-bold">All Workers ({eligibleWorkers.length})</div>
                      <div className="text-[11px] opacity-75">Broadcast to entire workforce</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      targetType === 'specific'
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-300 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Users className="h-5 w-5 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold">Specific Worker(s)</div>
                      <div className="text-[11px] opacity-75">Select 1, 3, or handpicked workers</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific Worker Checkbox Grid */}
              {targetType === 'specific' && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                    <span>Select Workers ({selectedWorkerIds.length} selected):</span>
                    <button
                      type="button"
                      onClick={handleSelectAllWorkers}
                      className="text-red-600 text-xs font-semibold hover:underline"
                    >
                      {selectedWorkerIds.length === eligibleWorkers.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {eligibleWorkers.map((w) => {
                      const isSelected = selectedWorkerIds.includes(w.id)
                      return (
                        <label
                          key={w.id}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                            isSelected
                              ? 'bg-red-100/70 dark:bg-red-950/60 border-red-300 dark:border-red-800 font-semibold text-red-900 dark:text-red-200'
                              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleWorkerSelection(w.id)}
                            className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                          />
                          <span className="truncate">{w.full_name || w.email || w.id}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Advanced Options Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Expiration timer */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Auto-Expiration Timer
                  </label>
                  <select
                    value={expirationMinutes === null ? '' : expirationMinutes}
                    onChange={(e) => setExpirationMinutes(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">No Expiration (Stay Active)</option>
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>

                {/* Email Alert Toggle */}
                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100">
                    <input
                      type="checkbox"
                      checked={sendEmailAlert}
                      onChange={(e) => setSendEmailAlert(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <Mail className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Send Email Notification</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-amber-500 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Broadcasting Live...' : 'Broadcast Priority Announcement Now'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* History & Response Log Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Active Priority Broadcasts ({announcements.length})
                </h3>
                <button
                  onClick={fetchHistory}
                  className="text-xs flex items-center space-x-1 text-red-600 font-semibold hover:underline"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No active priority announcements found. Click "Broadcast New Rush Task" to send one!
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => {
                    const responses = ann.responses || []
                    const accepts = responses.filter((r: any) => r.response === 'accepted')
                    const declines = responses.filter((r: any) => r.response === 'declined')

                    return (
                      <div
                        key={ann.id}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 space-y-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {ann.title}
                            </h4>
                            <p className="text-xs text-zinc-500">
                              By: <strong>{ann.admin_name || 'Admin'}</strong> • Target: {ann.target_type === 'all' ? 'All Workers' : `${ann.target_worker_ids?.length || 0} Workers`} • {new Date(ann.created_at).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeactivate(ann.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            End / Close
                          </button>
                        </div>

                        {ann.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            {ann.description}
                          </p>
                        )}

                        {/* Responses Tracker pill bar */}
                        <div className="flex items-center space-x-4 text-xs font-semibold pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accepted ({accepts.length})
                          </span>

                          <span className="flex items-center text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4 mr-1" />
                            Declined ({declines.length})
                          </span>
                        </div>

                        {/* Detailed Response Table/List */}
                        {responses.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            {responses.map((r: any) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                              >
                                <div className="flex items-center space-x-2">
                                  {r.response === 'accepted' ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                  )}
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                    {r.worker_name || r.worker_id}
                                  </span>
                                  {r.note && (
                                    <span className="text-zinc-500 italic">"{r.note}"</span>
                                  )}
                                </div>

                                <span className="text-[10px] text-zinc-400">
                                  {new Date(r.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
