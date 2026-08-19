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
  Laptop,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  Monitor,
} from 'lucide-react'

export default function FullscreenTranscriptEditorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [allWorkers, setAllWorkers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isElectronApp, setIsElectronApp] = useState(false)

  useEffect(() => {
    // Detect if running inside the native Electron desktop app
    if (typeof window !== 'undefined' && (window as any).electronBridge?.isElectronApp) {
      setIsElectronApp(true)
      setIsAppInstalled(true) // Already installed — hide PWA install button
    }

    // Register Service Worker for PWA 1-click install support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration error:', err)
      })
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true)
      setDeferredInstallPrompt(null)
      setShowInstallModal(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if running in standalone mode (already installed desktop app)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsAppInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const downloadDesktopShortcut = () => {
    const targetUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard/transcript-editor`
        : 'https://ph-apexscriptsolutions.vercel.app/dashboard/transcript-editor'
    const shortcutContent = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\n`
    const blob = new Blob([shortcutContent], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ApexScript-Desktop-Workspace.url'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt()
      const { outcome } = await deferredInstallPrompt.userChoice
      if (outcome === 'accepted') {
        setIsAppInstalled(true)
        setShowInstallModal(false)
      }
      setDeferredInstallPrompt(null)
    } else {
      // Auto-trigger direct download of the desktop launcher shortcut
      downloadDesktopShortcut()
      setShowInstallModal(true)
    }
  }

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

  // Update last_seen timestamp periodically ONLY for logged-in workers (never for admins inspecting workers)
  useEffect(() => {
    if (!profile?.id || profile?.role === 'admin') return

    const updateLastSeen = async () => {
      try {
        await fetch('/api/update-last-seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId: profile.id }),
        })
      } catch (e) {
        console.error('Failed to update last_seen:', e)
      }
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60000)

    return () => clearInterval(interval)
  }, [profile?.id, profile?.role])

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

          {/* Desktop App Indicator / Install Button */}
          {isElectronApp ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop App ✓</span>
            </div>
          ) : !isAppInstalled ? (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
              title="Install ApexScript Workspace as a Desktop App"
            >
              <Laptop className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">Install Desktop App</span>
              <span className="sm:hidden">Install</span>
            </button>
          ) : null}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm shadow-purple-500/20 cursor-pointer"
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

      {/* ── DESKTOP APP INSTALLATION & LAUNCHER MODAL ── */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 max-w-md w-full flex flex-col space-y-4 text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ApexScript Desktop App</h3>
                  <p className="text-[11px] text-zinc-400">Desktop Launcher & Direct Access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auto Download Success Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Desktop Shortcut Downloaded!</p>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                  Your browser has downloaded <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200 text-[10px] font-mono">ApexScript-Desktop-Workspace.url</code>.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  1
                </span>
                <p className="leading-snug">
                  <strong>Double-click</strong> the downloaded shortcut in your Downloads folder to launch the workspace anytime.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  2
                </span>
                <p className="leading-snug">
                  Drag the shortcut file directly onto your <strong>Windows Desktop</strong> for instant 1-click opening.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  3
                </span>
                <p className="leading-snug">
                  <strong>Chrome / Edge Native App:</strong> Click the <span className="text-purple-300 font-semibold">Install App icon (🖥️)</span> in the right side of your browser URL address bar to install as a standalone window!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={downloadDesktopShortcut}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-zinc-200 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Again</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="flex-1 flex items-center justify-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
