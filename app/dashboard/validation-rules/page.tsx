"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { X, Plus, Edit, Trash2, Check, Loader2 } from "lucide-react"

interface ValidationRule {
  id: number
  rule_name: string
  department: string
  category: string
  find: string
  replace: string
  enabled: boolean
  is_regex: boolean
  created_at: string
  updated_at: string
}

export default function ValidationRulesPage() {
  const [rules, setRules] = useState<ValidationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isToggling, setIsToggling] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    rule_name: "",
    department: "all",
    category: "",
    find: "",
    replace: "",
    enabled: true,
    is_regex: false
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('transcript_validation_rules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log('Validation rules table not yet created')
          setRules([])
        } else {
          console.error('Error loading rules:', error)
          setRules([])
        }
      } else {
        setRules(data || [])
      }
    } catch (error) {
      console.error('Error loading rules:', error)
      setRules([])
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.rule_name || !formData.category || !formData.find || !formData.replace) {
      alert('Please fill in all fields')
      return
    }

    setIsSaving(true)
    
    try {
      if (editingRule) {
        const { error } = await supabase
          .from('transcript_validation_rules')
          .update({
            rule_name: formData.rule_name,
            department: formData.department,
            category: formData.category,
            find: formData.find,
            replace: formData.replace,
            enabled: formData.enabled,
            is_regex: formData.is_regex,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRule.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transcript_validation_rules')
          .insert({
            rule_name: formData.rule_name,
            department: formData.department,
            category: formData.category,
            find: formData.find,
            replace: formData.replace,
            enabled: formData.enabled,
            is_regex: formData.is_regex
          })
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            alert('The validation rules table has not been created yet. Please run the database migration first.')
            setIsSaving(false)
            return
          }
          throw error
        }
      }
      
      await loadRules()
      setIsModalOpen(false)
      setEditingRule(null)
      setFormData({ rule_name: "", department: "all", category: "", find: "", replace: "", enabled: true, is_regex: false })
    } catch (error: any) {
      console.error('Error saving rule:', error)
      alert(`Error saving rule: ${error.message || 'Unknown error'}`)
    }
    
    setIsSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    if (!id) {
      alert('Error: Rule ID is missing')
      return
    }
    
    setIsDeleting(id)
    
    try {
      const { error } = await supabase
        .from('transcript_validation_rules')
        .delete()
        .eq('id', id)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          alert('The validation rules table has not been created yet. Please run the database migration first.')
          setIsDeleting(null)
          return
        }
        throw error
      }
      
      await loadRules()
    } catch (error: any) {
      console.error('Error deleting rule:', error)
      alert(`Error deleting rule: ${error.message || 'Unknown error'}`)
    }
    
    setIsDeleting(null)
  }

  const handleToggle = async (rule: ValidationRule) => {
    setIsToggling(rule.id)
    
    try {
      const { error } = await supabase
        .from('transcript_validation_rules')
        .update({ enabled: !rule.enabled, updated_at: new Date().toISOString() })
        .eq('id', rule.id)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          alert('The validation rules table has not been created yet. Please run the database migration first.')
          setIsToggling(null)
          return
        }
        throw error
      }
      
      await loadRules()
    } catch (error: any) {
      console.error('Error toggling rule:', error)
      alert(`Error toggling rule: ${error.message || 'Unknown error'}`)
    }
    
    setIsToggling(null)
  }

  const openEditModal = (rule: ValidationRule) => {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      department: rule.department,
      category: rule.category,
      find: rule.find,
      replace: rule.replace,
      enabled: rule.enabled,
      is_regex: rule.is_regex || false
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingRule(null)
    setFormData({ rule_name: "", department: "all", category: "", find: "", replace: "", enabled: true, is_regex: false })
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Transcript Validation Rules</h1>
          <p className="text-sm text-zinc-600 mt-1">Manage validation rules for transcript checking</p>
        </div>

        {/* Add Rule Button */}
        <div className="mb-6">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-500/30"
          >
            <Plus className="h-4 w-4" />
            Add New Rule
          </button>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-sm">No validation rules found. Create your first rule to get started.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Rule Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Find</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Replace</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Enabled</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">{rule.rule_name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{rule.category}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 font-mono bg-zinc-100 rounded px-2 py-1 inline-block">{rule.find}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 font-mono bg-zinc-100 rounded px-2 py-1 inline-block">{rule.replace}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(rule)}
                        disabled={isToggling === rule.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          rule.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        } ${isToggling === rule.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isToggling === rule.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        {rule.enabled ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          disabled={isDeleting === rule.id}
                          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {isDeleting === rule.id ? (
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
                {editingRule ? 'Edit Validation Rule' : 'Add New Validation Rule'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingRule(null)
                  setFormData({ rule_name: "", department: "all", category: "", find: "", replace: "", enabled: true, is_regex: false })
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Rule Name</label>
                <input
                  type="text"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="e.g., Expand contractions"
                />
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="style">Style</option>
                  <option value="formatting">Formatting</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Find</label>
                <input
                  type="text"
                  value={formData.find}
                  onChange={(e) => setFormData({ ...formData, find: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  placeholder="e.g., gonna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Replace</label>
                <input
                  type="text"
                  value={formData.replace}
                  onChange={(e) => setFormData({ ...formData, replace: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  placeholder="e.g., going to"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_regex"
                  checked={formData.is_regex}
                  onChange={(e) => setFormData({ ...formData, is_regex: e.target.checked })}
                  className="h-4 w-4 text-rose-600 border-zinc-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="is_regex" className="text-sm text-zinc-700">Use Regex Pattern</label>
              </div>

              {formData.is_regex && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Regex Mode:</strong> Use regex patterns to match dynamic content. 
                    Example: <code className="bg-blue-100 px-1 rounded">(\w+)\s*--\s*\1</code> will match "word -- word" for any word.
                    Use <code className="bg-blue-100 px-1 rounded">$1</code> in replace to reference captured groups.
                  </p>
                </div>
              )}

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
                  setEditingRule(null)
                  setFormData({ rule_name: "", department: "all", category: "", find: "", replace: "", enabled: true, is_regex: false })
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
                  editingRule ? 'Update Rule' : 'Create Rule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
