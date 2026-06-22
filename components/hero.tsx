import { ShieldCheck, Clock, Lock, Headphones } from "lucide-react"

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          99%+ accuracy, human-reviewed
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Precision-Driven Transcription for Professional Excellence.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          ApexScript Transcription Services delivers precise, professionally formatted
          transcripts from your audio and video. We specialize in legal
          proceedings, senate hearings, academic research, conference calls,
          earnings calls, and podcasts.
        </p>

        {/* --- DITO NATIN GINAWANG CENTERED AT IN-UPDATE ANG LABELS --- */}
        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Clock, label: "Turnaround", value: "12 hrs" },
            { icon: ShieldCheck, label: "Accuracy", value: "99%" },
            { icon: Lock, label: "Confidential", value: "E2E Encryption" },
            { icon: Headphones, label: "Support", value: "24/7" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center"
            >
              <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <dd className="mt-3 text-lg font-semibold text-card-foreground">
                {stat.value}
              </dd>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}