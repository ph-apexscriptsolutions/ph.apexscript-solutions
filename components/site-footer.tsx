import Link from "next/link"
import { AudioLines } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span>ApexScript Solutions</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ApexScript Solutions. All right right reserved.
        </p>
      </div>
    </footer>
  )
}
