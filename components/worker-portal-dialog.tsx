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
          <div className="relative z-10 w-full max-w-sm rounded-3xl border-2 border-cyan-200/60 bg-gradient-to-br from-white/95 via-cyan-50/95 to-white/95 backdrop-blur-2xl p-10 shadow-2xl shadow-cyan-500/20 text-left">
            <button 
              type="button" 
              onClick={() => { setOpen(false); setError(""); }} 
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-sky-400 text-white shadow-xl shadow-cyan-400/30">
              <Lock className="h-8 w-8" />
            </div>
            
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">Worker Portal Login</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Please enter your assigned credentials.
            </p>
            
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 transition-all placeholder:text-zinc-400" 
                  placeholder="e.g., juan@apexscript.com" 
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Password</label>
                <input 
                  ref={inputRef} 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 transition-all placeholder:text-zinc-400" 
                  placeholder="Enter your password" 
                  required
                  autoComplete="current-password"
                />
              </div>
              
              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
              
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-sky-500 text-white hover:from-cyan-600 hover:via-cyan-700 hover:to-sky-600 h-14 font-semibold shadow-xl shadow-cyan-500/30 cursor-pointer mt-2 disabled:opacity-50">
                {isLoading ? "Verifying..." : "Log In"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}