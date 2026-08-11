'use client'

import React, { useState } from 'react'
import { X, AlertTriangle, FileEdit, Loader2 } from 'lucide-react'

const REVISION_REASONS = [
  { value: 'incomplete_transcript', label: 'Incomplete Transcript' },
  { value: 'incorrect_format', label: 'Incorrect Format' },
  { value: 'transcript_inconsistencies', label: 'Transcript Inconsistencies' },
  { value: 'other', label: 'Other (specify below)' },
]

interface RevisionRequestModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: { id: number; filename: string; worker_id: string } | null
  onSubmit: (assignmentId: number, reason: string, note: string) => Promise<void>
}

export default function RevisionRequestModal({ isOpen, onClose, assignment, onSubmit }: RevisionRequestModalProps) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !assignment) return null

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for the revision.')
      return
    }
    if (reason === 'other' && !note.trim()) {
      setError('Please describe the issue in the notes field.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(assignment.id, reason, note)
      setReason('')
      setNote('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to request revision')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setNote('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl shadow-2xl shadow-amber-500/20 w-full max-w-md p-5 relative border border-amber-200 animate-in fade-in zoom-in-95">
        <button onClick={handleClose} className="absolute right-3 top-3 text-amber-400 hover:text-amber-700 transition-colors">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">Request Revision</h3>
            <p className="text-[10px] text-amber-600">Send this assignment back for correction</p>
          </div>
        </div>

        {/* File info */}
        <div className="bg-amber-100/60 border border-amber-200/80 rounded-xl p-3 mb-4">
          <p className="text-[11px] font-medium text-amber-700">Assignment File:</p>
          <p className="text-sm font-bold text-amber-900 mt-0.5">{assignment.filename}</p>
        </div>

        {/* Reason selector */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-amber-800 mb-1.5">Reason for Revision *</label>
          <div className="space-y-1.5">
            {REVISION_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all ${
                  reason === r.value
                    ? 'border-amber-500 bg-amber-100/80 shadow-sm'
                    : 'border-amber-200/60 bg-white hover:bg-amber-50/50 hover:border-amber-300'
                }`}
              >
                <input
                  type="radio"
                  name="revision-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => { setReason(e.target.value); setError(null) }}
                  className="accent-amber-600"
                />
                <span className={`text-xs font-medium ${reason === r.value ? 'text-amber-900' : 'text-zinc-600'}`}>{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note textarea */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-amber-800 mb-1.5">
            Additional Notes {reason === 'other' ? '*' : '(optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setError(null) }}
            placeholder="Describe the specific issue that needs to be fixed..."
            rows={3}
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-zinc-800 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <p className="text-[11px] text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-amber-200 bg-white px-4 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Sending...</>
            ) : (
              <><FileEdit className="h-3 w-3" /> Request Revision</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
