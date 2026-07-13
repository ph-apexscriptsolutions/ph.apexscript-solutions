"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/utils/supabase/client"
import { X, Plus, Edit, Trash2, Check, Loader2, Search, Upload } from "lucide-react"

interface CustomDictionaryTerm {
  id: number
  term: string
  category: string
  department: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export default function TechnicalDictionaryPage() {
  const [terms, setTerms] = useState<CustomDictionaryTerm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<CustomDictionaryTerm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isToggling, setIsToggling] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    term: "",
    category: "financial",
    department: "all",
    enabled: true
  })

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('custom_dictionary')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log('Custom dictionary table not yet created')
          setTerms([])
        } else {
          console.error('Error loading terms:', error.message || error)
          setTerms([])
        }
      } else {
        setTerms(data || [])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error loading terms:', errorMessage)
      setTerms([])
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.term || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    
    try {
      if (editingTerm) {
        const { error } = await supabase
          .from('custom_dictionary')
          .update({
            term: formData.term,
            category: formData.category,
            department: formData.department,
            enabled: formData.enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTerm.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('custom_dictionary')
          .insert({
            term: formData.term,
            category: formData.category,
            department: formData.department,
            enabled: formData.enabled
          })
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            alert('The custom dictionary table has not been created yet. Please run the database migration first.')
            setIsSaving(false)
            return
          }
          throw error
        }
      }
      
      await loadTerms()
      setIsModalOpen(false)
      setEditingTerm(null)
      setFormData({ term: "", category: "financial", department: "all", enabled: true })
    } catch (error: any) {
      console.error('Error saving term:', error)
      alert(`Error saving term: ${error.message || 'Unknown error'}`)
    }
    
    setIsSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this term?')) return
    
    setIsDeleting(id)
    
    try {
      const { error } = await supabase
        .from('custom_dictionary')
        .delete()
        .eq('id', id)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          alert('The custom dictionary table has not been created yet. Please run the database migration first.')
          setIsDeleting(null)
          return
        }
        throw error
      }
      
      await loadTerms()
    } catch (error: any) {
      console.error('Error deleting term:', error)
      alert(`Error deleting term: ${error.message || 'Unknown error'}`)
    }
    
    setIsDeleting(null)
  }

  const handleToggle = async (term: CustomDictionaryTerm) => {
    setIsToggling(term.id)
    
    try {
      const { error } = await supabase
        .from('custom_dictionary')
        .update({ enabled: !term.enabled, updated_at: new Date().toISOString() })
        .eq('id', term.id)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          alert('The custom dictionary table has not been created yet. Please run the database migration first.')
          setIsToggling(null)
          return
        }
        throw error
      }
      
      await loadTerms()
    } catch (error: any) {
      console.error('Error toggling term:', error)
      alert(`Error toggling term: ${error.message || 'Unknown error'}`)
    }
    
    setIsToggling(null)
  }

  const openEditModal = (term: CustomDictionaryTerm) => {
    setEditingTerm(term)
    setFormData({
      term: term.term,
      category: term.category,
      department: term.department,
      enabled: term.enabled
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingTerm(null)
    setFormData({ term: "", category: "financial", department: "all", enabled: true })
    setIsModalOpen(true)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      const text = await file.text()
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

      // Process each line as a term
      for (const line of lines) {
        // Skip comment lines (starting with #)
        if (line.startsWith('#')) continue

        // Parse line: format can be "term" or "term,category" or "term,category,department"
        const parts = line.split(',').map(p => p.trim())
        const term = parts[0]
        const category = parts[1] || 'financial'
        const department = parts[2] || 'all'

        if (!term) continue

        try {
          const { error } = await supabase
            .from('custom_dictionary')
            .insert({
              term,
              category,
              department,
              enabled: true
            })

          if (error) {
            // Skip duplicate errors
            if (error.code === '23505') {
              console.log(`Term "${term}" already exists, skipping`)
            } else {
              console.error(`Error inserting term "${term}":`, error)
              errorCount++
            }
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error processing term "${term}":`, err)
          errorCount++
        }
      }

      await loadTerms()
      alert(`Upload complete: ${successCount} terms added, ${errorCount} errors`)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please check the file format.')
    }

    setIsUploading(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const filteredTerms = terms.filter(term =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Technical Dictionary</h1>
          <p className="text-sm text-zinc-600 mt-1">Manage technical, financial, medical, and legal terms for transcript validation. Use Bulk Upload to import terms from a .txt or .csv file (one term per line, optional format: term,category,department)</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-500/30"
            >
              <Plus className="h-4 w-4" />
              Add New Term
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </>
              )}
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-64"
              placeholder="Search terms..."
            />
          </div>
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? (
                <p className="text-sm">No terms found matching "{searchQuery}"</p>
              ) : (
                <p className="text-sm">No terms found in the dictionary. Add your first term to get started.</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Term</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Enabled</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 font-mono">{term.term}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 capitalize">{term.category}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 capitalize">{term.department === 'all' ? 'All Departments' : term.department}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(term)}
                        disabled={isToggling === term.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          term.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        } ${isToggling === term.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isToggling === term.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        {term.enabled ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(term)}
                          className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(term.id)}
                          disabled={isDeleting === term.id}
                          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {isDeleting === term.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingTerm ? 'Edit Term' : 'Add New Term'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTerm(null)
                  setFormData({ term: "", category: "financial", department: "all", enabled: true })
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Term *</label>
                <input
                  type="text"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  placeholder="e.g., EBITDA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="financial">Financial</option>
                  <option value="medical">Medical</option>
                  <option value="legal">Legal</option>
                  <option value="mining">Mining</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  <option value="conference">Conference / Earnings Call</option>
                  <option value="senate">Senate Hearing / Political</option>
                  <option value="academics">Academics</option>
                  <option value="broadcast">Broadcast</option>
                  <option value="podcast">Podcast</option>
                  <option value="medical">Medical</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-rose-600 border-zinc-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="enabled" className="text-sm text-zinc-700">Enabled</label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTerm(null)
                  setFormData({ term: "", category: "financial", department: "all", enabled: true })
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-rose-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/30"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  editingTerm ? 'Update Term' : 'Add Term'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
