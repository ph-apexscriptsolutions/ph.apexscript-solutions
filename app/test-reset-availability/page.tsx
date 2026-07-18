'use client'

import { useState } from 'react'

export default function TestResetAvailability() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testReset = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/reset-availability', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(JSON.stringify(data, null, 2))
      } else {
        setError(JSON.stringify(data, null, 2))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Test Reset Availability</h1>
        <p className="text-gray-600 mb-4">
          This will reset all workers' weekly availability and send reminder emails.
        </p>

        <button
          onClick={testReset}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Reset'}
        </button>

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-green-600 mb-2">Success:</h2>
            <pre className="bg-green-50 p-3 rounded-md text-sm overflow-auto">
              {result}
            </pre>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error:</h2>
            <pre className="bg-red-50 p-3 rounded-md text-sm overflow-auto">
              {error}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
