"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, AudioLines } from "lucide-react"

// Import mo lang kung nasaan ang file na ito
import { ClientPortalDialog } from "./client-portal-dialog"
import { WorkerPortalDialog } from "./worker-portal-dialog"

const APPLY_EXTERNAL_URL = "https://form.jotform.com/261539295585067" 

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-zinc-50 md:hover:bg-transparent text-left w-full md:w-auto block md:inline-block cursor-pointer"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ApexScript Transcription Services
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          
          <ClientPortalDialog triggerClassName={navLinkClass} />
          <WorkerPortalDialog triggerClassName={navLinkClass} />
          
          <Link href="/faq" className={navLinkClass}>
            FAQ
          </Link>
          
          <a 
            href="/apply" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Join our Team
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden cursor-pointer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Open */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            <Link href="/" className={navLinkClass} onClick={() => setOpen(false)}>
              Home
            </Link>

            <ClientPortalDialog triggerClassName={navLinkClass} />
            <WorkerPortalDialog triggerClassName={navLinkClass} />
            
            <Link href="/faq" className={navLinkClass} onClick={() => setOpen(false)}>
              FAQ
            </Link>
            
            <a 
              href="/apply" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Join our Team
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}