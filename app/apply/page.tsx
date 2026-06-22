'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, AlertCircle, Briefcase, Mail, Phone, FileText, User, Send } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    experience: '',
    coverLetter: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalMessage, setModalMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setModalType('success')
        setModalMessage('Application submitted successfully! We will review your application and get back to you soon.')
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          jobTitle: '',
          experience: '',
          coverLetter: '',
        })
      } else {
        setModalType('error')
        setModalMessage(data.error || 'Failed to submit application. Please try again.')
      }
      setShowModal(true)
    } catch (err) {
      setModalType('error')
      setModalMessage('An error occurred. Please try again.')
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    if (modalType === 'success') {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-2xl shadow-cyan-500/50 mb-6">
              <Briefcase className="h-8 w-8" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Join Our Team</h1>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-red-500/30 mb-4">
              <span className="animate-pulse">🔥</span>
              <span>High demand for Transcriptionist position</span>
            </div>
            <p className="text-cyan-100 text-lg max-w-xl mx-auto">Fill out the form below to apply for a position at ApexScript Transcription Services and start your journey with us.</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-sky-500 p-6">
              <h2 className="text-2xl font-bold text-white">Application Form</h2>
              <p className="text-cyan-100 text-sm">Complete all fields marked with *</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <User className="h-4 w-4 text-cyan-600" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Mail className="h-4 w-4 text-cyan-600" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Phone className="h-4 w-4 text-cyan-600" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="jobTitle" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Briefcase className="h-4 w-4 text-cyan-600" />
                      Position Applying For *
                    </label>
                    <select
                      id="jobTitle"
                      name="jobTitle"
                      required
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                    >
                      <option value="">Select a position</option>
                      <option value="Assistant Human Resources">Assistant Human Resources</option>
                      <option value="Assistant Project Manager">Assistant Project Manager</option>
                      <option value="Billing and Invoice Clerk">Billing and Invoice Clerk</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Senior Editor">Senior Editor</option>
                      <option value="Transcriber">Transcriber</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="experience" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    Years of Experience *
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="e.g., 2 years, 5+ years"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="coverLetter" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    Cover Letter / Additional Information *
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    required
                    rows={6}
                    value={formData.coverLetter}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all resize-none bg-slate-50 focus:bg-white"
                    placeholder="Tell us about yourself, your experience, and why you'd like to join our team..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-sky-600 text-white font-bold py-4 px-6 rounded-xl hover:from-cyan-600 hover:via-cyan-700 hover:to-sky-700 transition-all shadow-xl shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-cyan-200 hover:text-white transition font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-cyan-500 to-sky-500 p-6">
              <div className="flex items-center justify-center">
                {modalType === 'success' ? (
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="p-8">
              <h3 className={`text-2xl font-bold text-center mb-3 ${modalType === 'success' ? 'text-slate-900' : 'text-red-900'}`}>
                {modalType === 'success' ? 'Application Submitted!' : 'Error'}
              </h3>
              <p className="text-slate-600 text-center mb-8 leading-relaxed">{modalMessage}</p>
              <button
                onClick={closeModal}
                className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-bold py-4 px-6 rounded-xl hover:from-cyan-600 hover:to-sky-700 transition-all shadow-lg shadow-cyan-500/30"
              >
                {modalType === 'success' ? 'Close' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
