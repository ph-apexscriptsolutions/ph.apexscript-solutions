import { FAQ } from "@/components/faq"
import { SiteHeader } from "@/components/site-header"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Ipinapakita ang header para makapag-login pa rin sila kahit nasa FAQ page */}
      <SiteHeader />
      
      <div className="py-12">
        <FAQ />
      </div>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 ApexScript Transcription Services. All rights reserved.
      </footer>
    </main>
  )
}