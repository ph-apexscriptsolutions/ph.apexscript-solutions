"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import TranscriptEditor from '@/components/TranscriptEditor'
import {
  ArrowLeft,
  FileEdit,
  Maximize2,
  Minimize2,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react'

export default function FullscreenTranscriptEditorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [allWorkers, setAllWorkers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authUser) {
          setAuthError(true)
          setIsLoading(false)
          return
        }

        setUser(authUser)

        const { data: workerProfile } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (workerProfile) {
          setProfile(workerProfile)
          if (workerProfile.role === 'admin') {
            const { data: workers } = await supabase
              .from('worker_profiles')
              .select('id, full_name, role, department, last_seen')
              .order('full_name', { ascending: true })
            if (workers) setAllWorkers(workers)
          }
        }
      } catch (err) {
        console.error('Initialization error:', err)
        setAuthError(true)
      } finally {
        setIsLoading(false)
      }
    }
    init()

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed', err)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed', err)
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm font-medium text-zinc-400">Loading Fullscreen Transcript Workspace...</p>
      </div>
    )
  }

  if (authError || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 px-6 text-center">
        <div className="text-5xl mb-2">🔒</div>
        <h2 className="text-lg font-bold text-white">Not Logged In</h2>
        <p className="text-sm text-zinc-400 max-w-xs">
          You need to be logged in to use the Transcript Editor workspace. Please return to the dashboard.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'
  const userId = user?.id || profile?.id || ''

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col text-slate-100 overflow-hidden font-sans">
      {/* ── Standalone Top Navigation Bar ── */}
      <header className="h-14 px-4 bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/20 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xs">
              <FileEdit className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                ApexScript Transcript Editor
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold uppercase">
                  Full Workspace
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-zinc-300">
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <User className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-semibold text-white">
              {profile?.full_name || user?.email || 'User'}
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              ({isAdmin ? 'Admin' : 'Worker'})
            </span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm shadow-purple-500/20"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <main className="flex-1 p-3 sm:p-4 min-h-0 flex flex-col bg-white overflow-hidden text-zinc-900 rounded-t-2xl sm:rounded-t-3xl shadow-2xl mx-1 sm:mx-2 mt-1">
        <TranscriptEditor
          role={isAdmin ? 'admin' : 'worker'}
          userId={userId}
          allWorkers={allWorkers}
          initialWorkerId={userId}
        />
      </main>
    </div>
  )
}
