"use client"

import { useState, useEffect, useRef } from "react"
import { Briefcase, Users, Lock, X, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- PASSWORDS & LINKS (Kapareho ng sa Header mo) ---
const WORKER_REDIRECT_URL = "https://apexscriptsolutions-phtranscriber.base44.app"

// ========================================================
// 1. CLIENT PORTAL MODAL COMPONENT
// ========================================================
function ClientPortalModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword("")
      setError(false)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (btoa(password) === "Y2xpZW50cG9ydGFsLmFwZXhANjMx") {
      setError(false)
      setOpen(false)
      window.location.href = "/portal"
    } else {
      setError(true)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 min-h-screen w-screen z-[100] flex items-center justify-center p-4 left-0 top-0">
      <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-md cursor-pointer" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/20 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl p-8 shadow-2xl m-auto text-left">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900 transition-colors"><X className="h-5 w-5" /></button>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40"><Lock className="h-7 w-7" /></div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">Client Portal Access</h2>
        <p className="mt-2 text-sm text-zinc-600">Enter your password to continue to the client portal.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input ref={inputRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all" placeholder="Enter password" />
          {error && <p className="text-sm text-red-600 font-semibold">Incorrect password.</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 h-12 font-semibold shadow-xl shadow-blue-500/30">Continue</Button>
        </form>
      </div>
    </div>
  )
}

// ========================================================
// 2. WORKER PORTAL MODAL COMPONENT
// ========================================================
function WorkerPortalModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword("")
      setError(false)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (btoa(password) === "d29ya2Vyc0AqNDEuLg==") {
      setError(false)
      setOpen(false)
      window.open(WORKER_REDIRECT_URL, "_blank", "noopener,noreferrer")
    } else {
      setError(true)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 min-h-screen w-screen z-[100] flex items-center justify-center p-4 left-0 top-0">
      <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-md cursor-pointer" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/20 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl p-8 shadow-2xl m-auto text-left">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900 transition-colors"><X className="h-5 w-5" /></button>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-sky-600 text-white shadow-xl shadow-cyan-500/40"><Lock className="h-7 w-7" /></div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">Worker Portal Access</h2>
        <p className="mt-2 text-sm text-zinc-600">Enter your password to continue to the worker portal.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input ref={inputRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all" placeholder="Enter password" />
          {error && <p className="text-sm text-red-600 font-semibold">Incorrect password.</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-sky-600 text-white hover:from-cyan-600 hover:via-cyan-700 hover:to-sky-700 h-12 font-semibold shadow-xl shadow-cyan-500/30">Continue</Button>
        </form>
      </div>
    </div>
  )
}

// ========================================================
// 3. MAIN AUDIENCE SPLIT SECTION
// ========================================================
export function AudienceSplit() {
  const [clientOpen, setClientOpen] = useState(false)
  const [workerOpen, setWorkerOpen] = useState(false)

  return (
    <section className="border-t border-zinc-200/60 bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            One platform, two ways in
          </h2>
          <p className="mt-4 text-pretty text-zinc-600 text-lg">
            Whether you need files transcribed or you transcribe them,
            ApexScript Transcription Services has a home for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* CARD 1: FOR CLIENTS */}
          <div className="group flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-2xl font-bold text-zinc-900">For Clients</h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Upload audio or video, set your turnaround, and get clean, formatted transcripts delivered to your dashboard.
            </p>
            <ul className="mt-6 flex flex-col gap-3 flex-grow">
              {["Secure file uploads", "Custom formatting & templates", "Track every order in real time"].map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600"><CheckCircle className="h-3 w-3" aria-hidden="true" /></span>
                  {p}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setClientOpen(true)}
              variant="outline"
              className="mt-8 w-full sm:w-auto sm:self-start h-12 px-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold"
            >
              Open Client Portal
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Button>
          </div>

          {/* CARD 2: FOR TRANSCRIBERS */}
          <div className="group flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-2xl font-bold text-zinc-900">For Transcribers</h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Pick up work that fits your schedule, build your reputation, and get paid reliably for every completed file.
            </p>
            <ul className="mt-6 flex flex-col gap-3 flex-grow">
              {["Flexible, remote work", "Transparent per-file pay", "Tools that speed up your workflow"].map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-600"><CheckCircle className="h-3 w-3" aria-hidden="true" /></span>
                  {p}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setWorkerOpen(true)}
              variant="outline"
              className="mt-8 w-full sm:w-auto sm:self-start h-12 px-6 border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-semibold"
            >
              Open Worker Portal
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Button>
          </div>

        </div>
      </div>

      {/* Pop-up Modals Layer */}
      <ClientPortalModal open={clientOpen} setOpen={setClientOpen} />
      <WorkerPortalModal open={workerOpen} setOpen={setWorkerOpen} />
    </section>
  )
}