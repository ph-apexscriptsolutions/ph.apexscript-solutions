"use client"

import { useState, useEffect, useRef } from "react"
import { Briefcase, Users, Lock, X, ArrowRight } from "lucide-react"
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
      <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm cursor-pointer" />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl m-auto text-left">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-4 w-4" /></button>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900"><Lock className="h-5 w-5" /></div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">Client Portal Access</h2>
        <p className="mt-1 text-sm text-zinc-500">Enter your password to continue to the client portal.</p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input ref={inputRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" placeholder="Enter password" />
          {error && <p className="text-sm text-red-600 font-medium">Incorrect password.</p>}
          <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800">Continue</Button>
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
      <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm cursor-pointer" />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl m-auto text-left">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-4 w-4" /></button>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900"><Lock className="h-5 w-5" /></div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">Worker Portal Access</h2>
        <p className="mt-1 text-sm text-zinc-500">Enter your password to continue to the worker portal.</p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input ref={inputRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" placeholder="Enter password" />
          {error && <p className="text-sm text-red-600 font-medium">Incorrect password.</p>}
          <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800">Continue</Button>
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
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One platform, two ways in
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Whether you need files transcribed or you transcribe them,
            ApexScript Transcription Services has a home for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* CARD 1: FOR CLIENTS */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Briefcase className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-card-foreground">For Clients</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Upload audio or video, set your turnaround, and get clean, formatted transcripts delivered to your dashboard.
            </p>
            <ul className="mt-5 flex flex-col gap-2 flex-grow">
              {["Secure file uploads", "Custom formatting & templates", "Track every order in real time"].map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-card-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setClientOpen(true)}
              variant="outline"
              className="mt-7 w-full sm:w-auto sm:self-start"
            >
              Open Client Portal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* CARD 2: FOR TRANSCRIBERS */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-card-foreground">For Transcribers</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pick up work that fits your schedule, build your reputation, and get paid reliably for every completed file.
            </p>
            <ul className="mt-5 flex flex-col gap-2 flex-grow">
              {["Flexible, remote work", "Transparent per-file pay", "Tools that speed up your workflow"].map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-card-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setWorkerOpen(true)}
              variant="outline"
              className="mt-7 w-full sm:w-auto sm:self-start"
            >
              Open Worker Portal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
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