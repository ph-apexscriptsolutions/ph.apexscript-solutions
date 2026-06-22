'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Join Our Team</h1>
          <p className="text-red-600 font-semibold mb-2">High demand for Transcriptionist position</p>
          <p className="text-slate-600">Fill out the form below to apply for a position at ApexScript Transcription Services</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700 mb-2">
                Position Applying For *
              </label>
              <select
                id="jobTitle"
                name="jobTitle"
                required
                value={formData.jobTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
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

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-2">
                Years of Experience *
              </label>
              <input
                type="text"
                id="experience"
                name="experience"
                required
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder="e.g., 2 years, 5+ years"
              />
            </div>

            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-slate-700 mb-2">
                Cover Letter / Additional Information *
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                required
                rows={6}
                value={formData.coverLetter}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition resize-none"
                placeholder="Tell us about yourself, your experience, and why you'd like to join our team..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                {modalType === 'success' ? (
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              <h3 className={`text-xl font-semibold text-center mb-2 ${modalType === 'success' ? 'text-slate-900' : 'text-red-900'}`}>
                {modalType === 'success' ? 'Application Submitted!' : 'Error'}
              </h3>
              <p className="text-slate-600 text-center mb-6">{modalMessage}</p>
              <button
                onClick={closeModal}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all"
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
