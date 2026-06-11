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
          <div onClick={() => { setOpen(false); setError(""); }} className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl text-left">
            <button 
              type="button" 
              onClick={() => { setOpen(false); setError(""); }} 
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Lock className="h-5 w-5" />
            </div>
            
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">Worker Portal Login</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Please enter your assigned credentials.
            </p>
            
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" 
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
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" 
                  placeholder="Enter your password" 
                  required
                  autoComplete="current-password"
                />
              </div>
              
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              
              <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer mt-2 disabled:opacity-50">
                {isLoading ? "Verifying..." : "Log In"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}