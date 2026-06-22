import { ShieldCheck, Clock, Lock, Headphones, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-cyan-300 mb-8">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            99%+ accuracy, human-reviewed
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            Precision-Driven Transcription for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400">Professional Excellence</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-cyan-100 sm:text-xl">
            ApexScript Transcription Services delivers precise, professionally formatted
            transcripts from your audio and video. We specialize in legal
            proceedings, senate hearings, academic research, conference calls,
            earnings calls, and podcasts.
          </p>

          {/* Stats */}
          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: Clock, label: "Turnaround", value: "12 hrs" },
              { icon: ShieldCheck, label: "Accuracy", value: "99%" },
              { icon: Lock, label: "Confidential", value: "E2E Encryption" },
              { icon: Headphones, label: "Support", value: "24/7" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center hover:bg-white/10 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg shadow-cyan-500/30">
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <dd className="mt-4 text-2xl font-bold text-white">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-sm font-medium text-cyan-200">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}