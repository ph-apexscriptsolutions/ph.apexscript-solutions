import { Scale, Landmark, GraduationCap, Phone, TrendingUp, Mic } from "lucide-react"

const specialties = [
  {
    icon: Scale,
    title: "Legal",
    description: "Depositions, court proceedings, and case files transcribed to legal standards.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Landmark,
    title: "Senate Hearings",
    description: "Accurate records of hearings, testimony, and official government sessions.",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: GraduationCap,
    title: "Academics",
    description: "Lectures, interviews, and research recordings formatted for study and citation.",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    icon: Phone,
    title: "Conference Calls",
    description: "Multi-speaker calls captured clearly with speaker labels and timestamps.",
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-100",
  },
  {
    icon: TrendingUp,
    title: "Earnings Calls",
    description: "Financial calls transcribed quickly with precision on figures and terminology.",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    icon: Mic,
    title: "Podcast",
    description: "Episodes transcribed with speaker labels, ready for show notes and captions.",
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-100",
  },
] as const

export function Specialties() {
  return (
    <section className="border-t border-zinc-200/60 bg-gradient-to-b from-white to-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            What we transcribe
          </h2>
          <p className="mt-4 text-pretty text-zinc-600 text-lg">
            Focused expertise across six high-stakes transcription categories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((s) => (
            <div
              key={s.title}
              className="group flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-lg shadow-${s.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-zinc-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
