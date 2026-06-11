import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Specialties } from "@/components/specialties"
import { AudienceSplit } from "@/components/audience-split"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Specialties />
        <AudienceSplit />
      </main>
      <SiteFooter />
    </div>
  )
}