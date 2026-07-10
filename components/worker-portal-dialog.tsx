"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, X } from "lucide-react"
import { supabase } from "@/utils/supabase/client"

export function WorkerPortalDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // 1. Securely check credentials with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })

    // 2. Handle errors
    if (authError || !data.user) {
      console.error("SUPABASE ERROR:", authError)
      setError(authError ? authError.message : "Invalid email or password.")
      setIsLoading(false)
      return
    }

    // 3. Success! Redirect to the INTERNAL dashboard page we created
    const profileUrl = "/dashboard" // <-- DITO NA PALITAN: Internal route na
    
    console.log("✅ LOGIN SUCCESSFUL! Redirecting to:", profileUrl)
    
    setOpen(false)
    setEmail("")
    setPassword("")
    setIsLoading(false)
    
    // Gamitin ang window.location.href para mag-reload ng page at ma-fetch ang bagong auth state
    window.location.href = profileUrl
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setError(""); }} className={triggerClassName}>
        Worker Portal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => { setOpen(false); setError(""); }} className="absolute inset-0 bg-black/50 backdrop-blur-md cursor-pointer" />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl border-2 border-cyan-200/60 bg-gradient-to-br from-white/95 via-cyan-50/95 to-white/95 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-500/20 text-left">
            <button 
              type="button" 
              onClick={() => { setOpen(false); setError(""); }} 
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-sky-400 text-white shadow-lg shadow-cyan-400/30">
              <Lock className="h-6 w-6" />
            </div>
            
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">Worker Portal Login</h2>
            <p className="mt-1.5 text-sm text-zinc-600">
              Please enter your assigned credentials.
            </p>
            
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-cyan-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 transition-all placeholder:text-zinc-400" 
                  placeholder="e.g., juan@apexscript.com" 
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-700">Password</label>
                <input 
                  ref={inputRef} 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-cyan-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 transition-all placeholder:text-zinc-400" 
                  placeholder="Enter your password" 
                  required
                  autoComplete="current-password"
                />
              </div>
              
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
              
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-600 via-cyan-700 to-sky-600 text-white hover:from-cyan-700 hover:via-cyan-800 hover:to-sky-700 h-11 font-semibold shadow-lg shadow-cyan-600/30 cursor-pointer mt-1 disabled:opacity-50">
                {isLoading ? "Verifying..." : "Log In"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}