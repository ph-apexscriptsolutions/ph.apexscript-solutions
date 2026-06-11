"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle, User, Briefcase } from "lucide-react"

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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white mb-4">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Detailed information about our transcription services for clients and career opportunities for transcribers.
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* COLUMN 1: FOR CLIENTS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-2">
            <User className="h-5 w-5 text-zinc-500" />
            <h3 className="text-xl font-bold text-zinc-900">For Clients</h3>
          </div>
          
          <div className="space-y-3">
            {clientFaqs.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 bg-white overflow-hidden transition-all">
                <button
                  onClick={() => setOpenClient(openClient === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  <span className="text-[15px]">{item.question}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${openClient === index ? "rotate-180" : ""}`} />
                </button>
                {openClient === index && (
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 text-[14.5px] leading-relaxed text-zinc-600">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: FOR TRANSCRIBERS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-2">
            <Briefcase className="h-5 w-5 text-zinc-500" />
            <h3 className="text-xl font-bold text-zinc-900">For Transcribers</h3>
          </div>

          <div className="space-y-3">
            {transcriberFaqs.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 bg-white overflow-hidden transition-all">
                <button
                  onClick={() => setOpenWorker(openWorker === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  <span className="text-[15px]">{item.question}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${openWorker === index ? "rotate-180" : ""}`} />
                </button>
                {openWorker === index && (
                  <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 text-[14px] leading-relaxed text-zinc-600">
                    {item.type === "payout" ? (
                      <div className="space-y-4">
                        <p><strong>Compensation Basis:</strong> Remuneration is calculated based on the file size of the processed output (e.g., .txt or ASCII-encoded files). We strictly measure the file size in kilobytes (KB).</p>
                        <p><strong>Base Rate:</strong> New transcribers are compensated at a rate of 700 PHP per 60KB of processed text. Compensation rates are subject to increase based on the transcriber's demonstrated performance, specifically focusing on consistency, quality, and accuracy metrics over time.</p>
                        <div className="border-t pt-4">
                          <p><strong>Payout Schedule:</strong> Payouts are processed twice a month, on the 1st and 15th. If a payday falls on a weekend or public holiday, the release is moved to the next business day.</p>
                          <p className="font-bold text-zinc-900 mt-2">Cut-off Periods:</p>
                          <p>* Production from the 1st to the 14th: Paid on the <strong>1st of the following month</strong>.</p>
                          <p>* Production from the 15th to the 31st: Paid on the <strong>15th of the following month</strong>.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p>To join our team as a transcriber, candidates must meet the following qualifications:</p>
                        <ul className="list-disc pl-5 space-y-3">
                          <li><strong>Transcription Speed & Efficiency:</strong> Fast typist (capable of transcribing 1-hour audio in 3-4 hours).</li>
                          <li><strong>Language Proficiency:</strong> Excellent listening skills with strong command of English grammar.</li>
                          <li><strong>Technical Adherence:</strong> Strict compliance with file formatting and submission guidelines.</li>
                          <li><strong>Availability:</strong> Must be available from 9:00 AM ET onwards.</li>
                          <li><strong>Commitment:</strong> High level of reliability in meeting deadlines.</li>
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