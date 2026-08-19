"use client"
import { useState, useEffect } from "react"
import { Download, Monitor, CheckCircle2, RefreshCw, ArrowLeft, Laptop, Shield, Zap, Bell } from "lucide-react"
import Link from "next/link"

const FALLBACK_DOWNLOAD_URL =
  "https://github.com/ph-apexscriptsolutions/ph.apexscript-solutions/releases/download/v1.0.0/ApexScript-Setup-1.0.0.exe"
const GITHUB_API_URL =
  "https://api.github.com/repos/ph-apexscriptsolutions/ph.apexscript-solutions/releases/latest"

export default function DownloadPage() {
  const [version, setVersion] = useState<string | null>("v1.0.0")
  const [releaseDate, setReleaseDate] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string>(FALLBACK_DOWNLOAD_URL)
  const [loadingVersion, setLoadingVersion] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(GITHUB_API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (data.tag_name) setVersion(data.tag_name)
        if (data.published_at) {
          setReleaseDate(
            new Date(data.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          )
        }
        const exeAsset = data.assets?.find((a: any) =>
          a.name?.toLowerCase().endsWith(".exe")
        )
        if (exeAsset?.browser_download_url) {
          setDownloadUrl(exeAsset.browser_download_url)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVersion(false))
  }, [])

  const handleDownload = () => {
    setDownloading(true)
    window.location.href = downloadUrl
    setTimeout(() => setDownloading(false), 4000)
  }

  const features = [
    { icon: Monitor, text: "Standalone window — no browser tabs, no address bar", color: "text-purple-400" },
    { icon: Zap, text: "Fast startup — launches directly from desktop or taskbar", color: "text-yellow-400" },
    { icon: Bell, text: "Silent auto-updates — always stays up to date automatically", color: "text-emerald-400" },
    { icon: Shield, text: "Same secure login, same transcripts, same features", color: "text-blue-400" },
    { icon: Laptop, text: "Admin monitoring works in real time — exactly the same", color: "text-pink-400" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="text-white font-bold text-sm">ApexScript</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600/30 to-indigo-700/20 border border-purple-500/30 shadow-2xl shadow-purple-900/40">
                <Laptop className="w-12 h-12 text-purple-300" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">ApexScript Desktop App</h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
              The full transcription workspace as a native Windows application. Install once, stay updated automatically.
            </p>
            {loadingVersion ? (
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking latest version...
              </div>
            ) : version ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Latest: <span className="text-purple-400 font-mono font-bold">{version}</span>
                {releaseDate && <span>· {releaseDate}</span>}
              </div>
            ) : null}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-70 text-white font-bold text-base transition-all shadow-xl shadow-purple-700/30 cursor-pointer disabled:cursor-wait"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Starting Download...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download for Windows (.exe)
              </>
            )}
          </button>

          {/* Features */}
          <div className="space-y-2">
            {features.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-zinc-300 py-1">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Install Steps */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">How to Install</p>
            {[
              "Click the Download button above",
              "Open ApexScript-Setup.exe from your Downloads folder",
              "The app installs automatically and opens right away",
              "A desktop shortcut and taskbar icon are created for you",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600/40 border border-purple-500/40 text-[10px] font-bold text-purple-300">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="flex items-center justify-center gap-6 text-[11px] text-zinc-600">
            <span>Windows 10 / 11</span>
            <span>·</span>
            <span>~100 MB disk space</span>
            <span>·</span>
            <span>Internet required</span>
          </div>
        </div>
      </main>
    </div>
  )
}
