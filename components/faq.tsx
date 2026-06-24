"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle, User, Briefcase, CheckCircle } from "lucide-react"

// Data para sa Clients
const clientFaqs = [
  {
    question: "What is the average turnaround time?",
    answer: "Our standard turnaround time is within 12 to 24 hours depending on the file length and audio quality. For urgent legal or corporate requirements, we also offer rush services."
  },
  {
    question: "How do you ensure accuracy?",
    answer: "Every single audio or video file is processed through a strict multi-layer review system. An expert human transcriber handles the initial text, which is then thoroughly proofread and verified by an editor to guarantee 99%+ accuracy."
  },
  {
    question: "Are my audio files confidential?",
    answer: "Absolutely. We strictly enforce non-disclosure policies. All files uploaded to our secure network are encrypted, and only authorized transcribers assigned to your project can access them."
  }
]

// Data para sa Transcribers
const transcriberFaqs = [
  {
    question: "How do I get paid as a transcriber?",
    type: "payout"
  },
  {
    question: "What are the qualifications to apply?",
    type: "qualifications"
  }
]

export function FAQ() {
  const [openClient, setOpenClient] = useState<number | null>(null)
  const [openWorker, setOpenWorker] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/30 mb-6">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-zinc-600 text-lg max-w-2xl mx-auto">
          Detailed information about our transcription services for clients and career opportunities for transcribers.
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* COLUMN 1: FOR CLIENTS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">For Clients</h3>
          </div>
          
          <div className="space-y-4">
            {clientFaqs.map((item, index) => (
              <div key={index} className="rounded-xl border border-zinc-200/60 bg-white overflow-hidden transition-all shadow-sm hover:shadow-md">
                <button
                  onClick={() => setOpenClient(openClient === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-base">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${openClient === index ? "rotate-180" : ""}`} />
                </button>
                {openClient === index && (
                  <div className="p-5 border-t border-zinc-200/60 bg-zinc-50/80 text-base leading-relaxed text-zinc-700">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: FOR TRANSCRIBERS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">For Transcribers</h3>
          </div>

          <div className="space-y-4">
            {transcriberFaqs.map((item, index) => (
              <div key={index} className="rounded-xl border border-zinc-200/60 bg-white overflow-hidden transition-all shadow-sm hover:shadow-md">
                <button
                  onClick={() => setOpenWorker(openWorker === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-base">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${openWorker === index ? "rotate-180" : ""}`} />
                </button>
                {openWorker === index && (
                  <div className="p-5 border-t border-zinc-200/60 bg-zinc-50/80 text-base leading-relaxed text-zinc-700">
                    {item.type === "payout" ? (
                      <div className="space-y-4">
                        <p><strong className="text-zinc-900">Compensation Basis:</strong> Remuneration is calculated based on the file size of the processed output (e.g., .txt or ASCII-encoded files). We strictly measure the file size in kilobytes (KB).</p>
                        <p><strong className="text-zinc-900">Base Rate:</strong></p>
                        <p className="ml-4">Philippines-based transcribers: 700 PHP per 60KB of processed text.</p>
                        <p className="ml-4">International transcribers (outside the Philippines): USD 15 per 60KB of processed text</p>
                        <p className="mt-3"><strong className="text-zinc-900">Performance-Based Increases:</strong> Compensation rates may increase over time based on the transcriber's performance, including consistency, quality, accuracy, and overall reliability.</p>
                        <div className="border-t border-zinc-200 pt-4">
                          <p><strong className="text-zinc-900">Payout Schedule:</strong> Payouts are processed twice a month, on the 1st and 15th. If a payday falls on a weekend or public holiday, the release is moved to the next business day.</p>
                          <p className="font-bold text-zinc-900 mt-2">Cut-off Periods:</p>
                          <p className="flex items-start gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 flex-shrink-0 mt-0.5"><CheckCircle className="h-3 w-3" /></span><span>Production from the 1st to the 14th: Paid on the <strong>1st of the following month</strong>.</span></p>
                          <p className="flex items-start gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 flex-shrink-0 mt-0.5"><CheckCircle className="h-3 w-3" /></span><span>Production from the 15th to the 31st: Paid on the <strong>15th of the following month</strong>.</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p>To join our team as a transcriber, candidates must meet the following qualifications:</p>
                        <ul className="space-y-3">
                          {[
                            "Fast typist (capable of transcribing 1-hour audio in 3-4 hours)",
                            "Excellent listening skills with strong command of English grammar",
                            "Strict compliance with file formatting and submission guidelines",
                            "Must be available from 9:00 AM ET onwards",
                            "High level of reliability in meeting deadlines"
                          ].map((qual, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 flex-shrink-0 mt-0.5"><CheckCircle className="h-3 w-3" /></span>
                              <span className="text-zinc-700">{qual}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}