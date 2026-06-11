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
          <div onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm cursor-pointer" />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl m-auto text-left">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900">
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">Client Portal Access</h2>
            <p className="mt-1 text-sm text-zinc-500">Enter your password to continue.</p>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <input 
                ref={inputRef} 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" 
                placeholder="Enter password" 
              />
              {error && <p className="text-sm text-red-600 font-medium">Incorrect password.</p>}
              <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer">Continue</Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}