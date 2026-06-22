import { FAQ } from "@/components/faq"
import { SiteHeader } from "@/components/site-header"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Ipinapakita ang header para makapag-login pa rin sila kahit nasa FAQ page */}
      <SiteHeader />
      
      <div className="py-12">
        <FAQ />
      </div>

      <footer className="border-t border-zinc-200/60 bg-white py-8 text-center text-sm text-zinc-600">
        © 2026 ApexScript Transcription Services. All rights reserved.
      </footer>
    </main>
  )
}