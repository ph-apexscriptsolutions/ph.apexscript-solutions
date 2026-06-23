"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, X } from "lucide-react"

export function ClientPortalDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Password check logic
    if (btoa(password) === "Y2xpZW50cG9ydGFsLmFwZXhANjMx") {
      setError(false)
      setOpen(false)
      window.location.href = "/portal"
    } else {
      setError(true)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        Client Portal
      </button>

      {open && (
        <div className="fixed inset-0 min-h-screen w-screen z-50 flex items-center justify-center p-4 left-0 top-0">
          <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-md cursor-pointer" />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border-2 border-blue-200/60 bg-gradient-to-br from-white/95 via-blue-50/95 to-white/95 backdrop-blur-2xl p-10 shadow-2xl shadow-blue-500/20 m-auto text-left">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400 text-white shadow-xl shadow-blue-400/30">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">Client Portal Access</h2>
            <p className="mt-2 text-sm text-zinc-600">Enter your password to continue.</p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <input 
                ref={inputRef} 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="h-14 w-full rounded-xl border-2 border-blue-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all placeholder:text-zinc-400" 
                placeholder="Enter password" 
              />
              {error && <p className="text-sm text-red-600 font-semibold">Incorrect password.</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 h-14 font-semibold shadow-xl shadow-blue-500/30 cursor-pointer">Continue</Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}