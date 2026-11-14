"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, BookOpen, Sparkles, Loader2, CheckCircle2 } from "lucide-react"

interface Guideline {
  id: number
  category: string
  department: string
  title: string
  rule_content: string
  examples: string | null
  created_at: string
}

export default function AIStyleGuidelinesAdminModal({
  isOpen,
  onClose,
  adminUser,
}: {
  isOpen: boolean
  onClose: () => void
  adminUser?: any
}) {
  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all")

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Speaker Labels")
  const [department, setDepartment] = useState("all")
  const [ruleContent, setRuleContent] = useState("")
  const [examples, setExamples] = useState("")

  const loadGuidelines = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-style-guidelines')
      const data = await res.json()
      if (res.ok && data.guidelines) {
        setGuidelines(data.guidelines)
      }
    } catch (err) {
      console.error('Failed to load AI guidelines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadGuidelines()
    }
  }, [isOpen])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !ruleContent.trim()) {
      alert("Please enter a title and the rule description.")
      return
    }

    setIsAdding(true)
    try {
      const res = await fetch('/api/ai-style-guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          department,
          rule_content: ruleContent,
          examples,
          created_by: adminUser?.email || adminUser?.full_name || 'Admin',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setTitle("")
        setRuleContent("")
        setExamples("")
        loadGuidelines()
      } else {
        alert(data.error || "Failed to add guideline.")
      }
    } catch (err: any) {
      alert(err.message || "Failed to add guideline.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this guideline from the AI knowledge base?")) return
    setIsDeleting(id)
    try {
      const res = await fetch(`/api/ai-style-guidelines?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setGuidelines((prev) => prev.filter((g) => g.id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(null)
    }
  }

  if (!isOpen) return null

  const filteredGuidelines = selectedDeptFilter === 'all'
    ? guidelines
    : guidelines.filter((g) => g.department === selectedDeptFilter || g.department === 'all')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-cyan-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight flex items-center gap-2">
                <span>AI Style Guides & Rules Manager</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Admin</span>
              </h3>
              <p className="text-[11px] text-cyan-100">
                Any rules or guidelines you add here are automatically learned by the worker AI Format Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50">
          {/* Left Column: Add New Guideline Form */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-fit space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 border-slate-100">
              <Plus className="h-4 w-4 text-cyan-600" />
              <span>Add New AI Style Rule</span>
            </h4>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Overlapping Speech & Crosstalk"
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-2 outline-none focus:border-cyan-500 bg-white font-medium text-slate-800"
                  >
                    <option value="all">All Departments</option>
                    <option value="conference">Conference / Earnings</option>
                    <option value="senate">Senate / Government</option>
                    <option value="broadcast">Broadcast / TV / Radio</option>
                    <option value="podcast">Podcast</option>
                    <option value="academics">Academics</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-2 outline-none focus:border-cyan-500 bg-white font-medium text-slate-800"
                  >
                    <option value="Speaker Labels">Speaker Labels</option>
                    <option value="Timestamps">Timestamps</option>
                    <option value="Numbers & Currency">Numbers & Currency</option>
                    <option value="Punctuation">Punctuation</option>
                    <option value="Filler Words">Filler Words</option>
                    <option value="Department Guide">Department Guide</option>
                    <option value="General">General Rule</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Rule Description & Explanation
                </label>
                <textarea
                  required
                  rows={3}
                  value={ruleContent}
                  onChange={(e) => setRuleContent(e.target.value)}
                  placeholder="Explain exactly what workers must do according to company standard..."
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Examples (Optional but Recommended)
                </label>
                <textarea
                  rows={2}
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  placeholder="Correct: JOHN DOE: Hello.\nIncorrect: John Doe - Hello."
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white resize-none font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-semibold text-xs py-2.5 shadow-sm transition disabled:opacity-50"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving to AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Save to AI Knowledge Base</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Guidelines List */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-cyan-600" />
                <span>Active AI Guidelines ({filteredGuidelines.length})</span>
              </h4>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2 py-1 outline-none bg-white text-slate-700 font-medium"
              >
                <option value="all">Show All Departments</option>
                <option value="conference">Conference</option>
                <option value="senate">Senate</option>
                <option value="broadcast">Broadcast</option>
                <option value="podcast">Podcast</option>
                <option value="academics">Academics</option>
                <option value="medical">Medical</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
                <span className="text-xs font-medium">Loading rules...</span>
              </div>
            ) : filteredGuidelines.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40 text-cyan-600" />
                <p className="text-xs font-medium text-slate-600">No custom guidelines found yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use the form on the left to add your first rule!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredGuidelines.map((g) => (
                  <div
                    key={g.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-cyan-300 transition-all relative group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">{g.title}</span>
                        <span className="text-[9px] font-semibold bg-cyan-50 border border-cyan-200 text-cyan-700 px-1.5 py-0.2 rounded uppercase">
                          {g.department}
                        </span>
                        <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {g.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id)}
                        disabled={isDeleting === g.id}
                        className="text-slate-300 hover:text-red-600 transition p-1 cursor-pointer shrink-0"
                        title="Delete Rule"
                      >
                        {isDeleting === g.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{g.rule_content}</p>

                    {g.examples && (
                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-700 whitespace-pre-wrap">
                        {g.examples}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>AI Format Assistant reads all rules in real-time</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
