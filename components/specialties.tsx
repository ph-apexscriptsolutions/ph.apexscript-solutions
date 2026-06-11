import { Scale, Landmark, GraduationCap, Phone, TrendingUp, Mic } from "lucide-react"

const specialties = [
  {
    icon: Scale,
    title: "Legal",
    description: "Depositions, court proceedings, and case files transcribed to legal standards.",
  },
  {
    icon: Landmark,
    title: "Senate Hearings",
    description: "Accurate records of hearings, testimony, and official government sessions.",
  },
  {
    icon: GraduationCap,
    title: "Academics",
    description: "Lectures, interviews, and research recordings formatted for study and citation.",
  },
  {
    icon: Phone,
    title: "Conference Calls",
    description: "Multi-speaker calls captured clearly with speaker labels and timestamps.",
  },
  {
    icon: TrendingUp,
    title: "Earnings Calls",
    description: "Financial calls transcribed quickly with precision on figures and terminology.",
  },
  {
    icon: Mic,
    title: "Podcast",
    description: "Episodes transcribed with speaker labels, ready for show notes and captions.",
  },
] as const

export function Specialties() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What we transcribe
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Focused expertise across six high-stakes transcription categories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((s) => (
            <div
              key={s.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-card-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
