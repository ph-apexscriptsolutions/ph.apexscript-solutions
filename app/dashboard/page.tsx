"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase/client"
import { FileText, HardDrive, LogOut, Calendar, X, Pencil, Save, User, ArrowLeft, Upload, UserPlus, CreditCard, Trash2, Check, Bell } from "lucide-react"
import AdminChat from '@/components/admin-chat'
import WorkerRealtimeChat from '@/components/worker-realtime-chat'
import { FlagIcon } from "@/components/flag-icon"

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/50 backdrop-blur-sm shadow-xl shadow-zinc-200/60 hover:shadow-2xl hover:shadow-zinc-200/80 transition-all duration-300 ${className}`}>{children}</div>
const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 border-b border-zinc-100/80 ${className}`}>{children}</div>
const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => <h3 className={`font-bold text-lg leading-none tracking-tight text-zinc-900 ${className}`}>{children}</h3>
const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`p-6 pt-4 ${className}`}>{children}</div>

const formatKB = (sizeStr: string | null) => {
  if (!sizeStr) return "0.0 KB"
  const match = sizeStr.toString().match(/([\d.]+)/)
  return match ? `${parseFloat(match[1]).toFixed(1)} KB` : sizeStr
}

const calculateTotalKB = (records: any[]) => {
  let total = 0
  records.forEach((r: any) => {
    const match = (r.byte_size || "0").toString().match(/([\d.]+)/)
    if (match) total += parseFloat(match[1])
  })
  return `${total.toFixed(1)} KB`
}

const getDisplayFileName = (fileName: string) => {
  return fileName.replace(/\.txt$/i, '')
}

const getCurrencyConfig = (location?: string) => {
  switch (location) {
    case 'United States':
      return { locale: 'en-US', currency: 'USD' }
    case 'Canada':
      return { locale: 'en-CA', currency: 'CAD' }
    case 'Philippines':
      return { locale: 'en-PH', currency: 'PHP' }
    case 'India':
      return { locale: 'en-IN', currency: 'INR' }
    case 'United Kingdom':
      return { locale: 'en-GB', currency: 'GBP' }
    case 'Australia':
      return { locale: 'en-AU', currency: 'AUD' }
    default:
      return { locale: 'en-US', currency: 'USD' }
  }
}

const formatCurrency = (amount: number, location?: string) => {
  const config = getCurrencyConfig(location)
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDateDMY = (dateInput: string | null | undefined) => {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return dateInput
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const normalizeFileName = (fileName: string) => {
  return fileName.trim().toLowerCase().replace(/\.txt$/i, '')
}

const hasDuplicateFileName = (fileName: string, records: any[]) => {
  const normalized = normalizeFileName(fileName)
  return records.some((r: any) => normalizeFileName(r.file_name || '') === normalized)
}


const formatDate = (date?: string | Date) => {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString()
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-cyan-100 text-cyan-800',
  moderator: 'bg-amber-100 text-amber-800',
  project_manager: 'bg-purple-100 text-purple-800',
  human_resource: 'bg-orange-100 text-orange-800',
  project_manager_human_resource: 'bg-teal-100 text-teal-800',
  worker: 'bg-zinc-100 text-zinc-700',
  default: 'bg-zinc-100 text-zinc-700',
}

const formatRoleLabel = (role: string) => {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

const COUNTRY_FLAGS: { [key: string]: string } = {
  'Australia': '🇦🇺',
  'Canada': '🇨🇦',
  'India': '🇮🇳',
  'Philippines': '🇵🇭',
  'United Kingdom': '🇬🇧',
  'United States': '🇺🇸',
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [allWorkers, setAllWorkers] = useState<any[]>([])
  const [activeWorker, setActiveWorker] = useState<any | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [filterApplied, setFilterApplied] = useState(false)
  const [filterTrigger, setFilterTrigger] = useState(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [records, setRecords] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false)
  const [manualFileForm, setManualFileForm] = useState({ fileName: "", dateCompleted: "", byteSize: "" })
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ file_name: "", date_completed: "", byte_size: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [computedEarnings, setComputedEarnings] = useState<string | null>(null)
  const [isAddingManualRecord, setIsAddingManualRecord] = useState(false)

  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", accountType: "", routingNumber: "", employeeId: "" })
  const [isUpdatingBank, setIsUpdatingBank] = useState(false)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentRate, setSelectedPaymentRate] = useState<number | null>(null)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false)
  const [payslipSelectedMonth, setPayslipSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [payslipSelectedCutoff, setPayslipSelectedCutoff] = useState("first")
  const [isRequestingPayslip, setIsRequestingPayslip] = useState(false)
  const [payslipRequests, setPayslipRequests] = useState<any[]>([])
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false)
  const [isAddingPaymentRecord, setIsAddingPaymentRecord] = useState(false)
  const [paymentHistoryForm, setPaymentHistoryForm] = useState({
    senderBank: "",
    referenceNumber: "",
    recipientBank: "",
    amount: "",
    dateSent: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })(),
    notes: ""
  })
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  const [isPayslipAdminModalOpen, setIsPayslipAdminModalOpen] = useState(false)
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false)
  const [editingRoleWorker, setEditingRoleWorker] = useState<any | null>(null)
  const [newRole, setNewRole] = useState('')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [adminPayslipRequests, setAdminPayslipRequests] = useState<any[]>([])
  const [loadingWorkerId, setLoadingWorkerId] = useState<string | null>(null)
  const [isProcessingRequest, setIsProcessingRequest] = useState(false)

  const [announcements, setAnnouncements] = useState<any[]>([])
  const [isAnnouncementExpanded, setIsAnnouncementExpanded] = useState(false)
  const [isAnnouncementPopupOpen, setIsAnnouncementPopupOpen] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [announcementMessage, setAnnouncementMessage] = useState("")
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false)
  const [showAnnouncementPreview, setShowAnnouncementPreview] = useState(false)
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null)
  const [announcementSchemaHint, setAnnouncementSchemaHint] = useState<string | null>(null)
  const [announcementErrorMessage, setAnnouncementErrorMessage] = useState<string | null>(null)

  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false)
  const [newWorkerForm, setNewWorkerForm] = useState({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: "United States" })
  const [isAddingWorker, setIsAddingWorker] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState(false)
  const [editWorkerForm, setEditWorkerForm] = useState({ fullName: "", jobTitle: "", department: "", email: "", location: "United States" })
  const [isUpdatingWorkerDetails, setIsUpdatingWorkerDetails] = useState(false)

  const [assignments, setAssignments] = useState<any[]>([])
  const [showAllSubmittedMessage, setShowAllSubmittedMessage] = useState(false)
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false)
  const [newAssignmentFilename, setNewAssignmentFilename] = useState("")
  const [newAssignmentDescription, setNewAssignmentDescription] = useState("")
  const [isAddingAssignment, setIsAddingAssignment] = useState(false)
  const [newAssignmentAttachment, setNewAssignmentAttachment] = useState<File | null>(null)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [editAssignmentId, setEditAssignmentId] = useState<number | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null)
  const [assignmentHeaderTemplate, setAssignmentHeaderTemplate] = useState('3fr 1fr 1fr')
  const [assignmentRowTemplate, setAssignmentRowTemplate] = useState('3fr 1fr 1fr')
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false)
  const [reportIssueAssignment, setReportIssueAssignment] = useState<any | null>(null)
  const [issueDescription, setIssueDescription] = useState("")
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  const [assignmentsWithUpdatedDescription, setAssignmentsWithUpdatedDescription] = useState<Set<number>>(new Set())

  // Check for updated descriptions based on database column
  useEffect(() => {
    if (!assignments.length || !profile?.id) return
    
    const updatedIds = new Set<number>()
    assignments.forEach((a: any) => {
      if (a.description_updated_at) {
        const stored = localStorage.getItem(`last_viewed_description_${profile.id}_${a.id}`)
        const lastViewed = stored ? new Date(stored) : null
        const descriptionUpdated = new Date(a.description_updated_at)
        
        if (!lastViewed || descriptionUpdated > lastViewed) {
          updatedIds.add(a.id)
        }
      }
    })
    
    setAssignmentsWithUpdatedDescription(updatedIds)
  }, [assignments, profile?.id])

  const normalizeGridTemplate = (template: string, expectedColumns: number) => {
    const parts = template.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= expectedColumns) return parts.join(' ')
    return parts.concat(Array(expectedColumns - parts.length).fill('1fr')).join(' ')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/"); return }
      setUser(data.user)
    })
  }, [router])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data: myProfile } = await supabase.from("worker_profiles").select("*").eq("id", user.id).single()
      if (myProfile) setProfile(myProfile)
      if (myProfile?.role === "admin") {
        const { data: workers } = await supabase.from("worker_profiles").select("*, last_seen").order("full_name")
        if (workers) setAllWorkers(workers)
      }
      setLoading(false)
    }
    fetch()
  }, [user])

  useEffect(() => {
    if (!activeWorker) return
    if (!filterApplied) {
      setRecords([])
      return
    }
    const fetch = async () => {
      let q: any = supabase.from("production_records").select("*").eq("worker_id", activeWorker.id)
      if (startDate) q = q.gte("date_completed", startDate)
      if (endDate) q = q.lte("date_completed", endDate)
      const { data } = await q.order("date_completed", { ascending: false })
      if (data) setRecords(data)
    }
    fetch()
  }, [activeWorker, filterTrigger])

  useEffect(() => {
    if (!activeWorker) return
    setBankForm({
      bankName: activeWorker.bank_name || "",
      accountNumber: activeWorker.account_number || "",
      accountType: activeWorker.account_type || "",
      routingNumber: activeWorker.routing_number || "",
      employeeId: activeWorker.employee_id || "",
    })

    // Force refresh worker data to pick up any newly added columns
    const refreshWorker = async () => {
      const { data: refreshed } = await supabase.from("worker_profiles").select("*, last_seen").eq("id", activeWorker.id).single()
      if (refreshed) {
        setActiveWorker(refreshed)
      }
    }
    refreshWorker()
  }, [activeWorker?.id])

  useEffect(() => {
    if (!activeWorker?.id) return
    fetchWorkerPayslipRequests(activeWorker.id)
    fetchAssignments(activeWorker.id)
    fetchPaymentHistory(activeWorker.id)
  }, [activeWorker?.id])

  

  useEffect(() => {
    if (profile && !activeWorker && profile.role !== "admin") {
      setActiveWorker(profile)
      setView("detail")
    }
  }, [profile, activeWorker])

  useEffect(() => {
    if (!profile) return

    const announcementsChannel = supabase.channel('announcements', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'new_announcement' }, (payload: any) => {
        console.debug('Announcement broadcast received:', payload)
        fetchAnnouncements()
      })
      .subscribe()

    fetchAnnouncements()

    return () => {
      supabase.removeChannel(announcementsChannel)
    }
  }, [profile?.id])



  // Real-time subscriptions for automatic updates
  useEffect(() => {
    if (!activeWorker?.id) return

    setRealtimeStatus('connecting')
    const activeWorkerId = activeWorker.id

    // Subscribe to production_assignments changes
    const assignmentsChannel = supabase.channel(`assignments:${activeWorkerId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_assignments',
          filter: `worker_id=eq.${activeWorkerId}`,
        },
            (payload: any) => {
                  console.debug('realtime assignments payload:', payload)
              const newRow = payload?.new ?? null
            const oldRow = payload?.old ?? null

          setAssignments((prev: any[]) => {
            let next = prev.slice()
            if (newRow && !oldRow) {
                    if (!next.find((a: any) => a.id === newRow.id)) next = [newRow, ...next]
                    ;(async () => {
                      try {
                        await fetchAssignments(activeWorkerId)
                      } catch (err) {
                        console.error('Failed fallback fetchAssignments after realtime insert:', err)
                      }
                    })()
            } else if (newRow && oldRow) {
              // If admin_deleted was set, remove the assignment from the list
              if (newRow.admin_deleted) {
                next = next.filter((a: any) => a.id !== newRow.id)
              } else {
                next = next.map((a: any) => (a.id === newRow.id ? newRow : a))
              }
            } else if (!newRow && oldRow) {
              next = next.filter((a: any) => a.id !== oldRow.id)
            }

            const hasPending = next.some((a: any) => a.status === 'pending')

            if (!hasPending && next.length > 0) {
              ;(async () => {
                for (const assignment of next) {
                  try {
                    await fetch('/api/production-assignments/delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId: assignment.id }),
                    })
                  } catch (err) {
                    console.error('Failed to delete completed assignment (realtime):', err)
                  }
                }
                setAssignments([])
                setShowAllSubmittedMessage(true)
              })()
            } else {
              setShowAllSubmittedMessage(false)
            }

            return next
          })
        })
          .on('broadcast', { event: 'new_assignment' }, (payload: any) => {
            console.debug('received broadcast new_assignment:', payload)
            try {
              fetchAssignments(activeWorkerId)
            } catch (err) {
              console.error('Failed to fetch assignments after broadcast:', err)
            }
          })
          .on('broadcast', { event: 'assignment_deleted' }, (payload: any) => {
            console.debug('received broadcast assignment_deleted:', payload)
            try {
              fetchAssignments(activeWorkerId)
            } catch (err) {
              console.error('Failed to fetch assignments after delete broadcast:', err)
            }
          })
      .subscribe()

    // Subscribe to production_records changes
    const recordsChannel = supabase.channel(`records:${activeWorkerId}`, {
      config: { broadcast: { self: true } }
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'production_records',
        filter: `worker_id=eq.${activeWorkerId}`,
      },
      (payload) => {
        
        if (filterApplied) {
          setFilterTrigger(prev => prev + 1)
        } else {
          const fetchRecords = async () => {
            const { data } = await supabase.from('production_records').select('*').eq('worker_id', activeWorkerId).order('date_completed', { ascending: false })
            if (data) setRecords(data)
          }
          fetchRecords()
        }
      }
    )
    .subscribe()

    // Subscribe to worker_profiles changes for bank details and payment rate updates
    const workerChannel = supabase.channel(`worker:${activeWorkerId}`, {
      config: { broadcast: { self: true } }
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'worker_profiles',
        filter: `id=eq.${activeWorkerId}`,
      },
      (payload) => {
        
        if (payload.new) {
          setActiveWorker(payload.new)
        }
      }
    )
    .subscribe()

    // Subscribe to payslip_requests changes
    // For admins -> subscribe to all; for workers -> subscribe to their own requests
    let payslipWorkerChannel: any = null
    let payslipAdminChannel: any = null
    if (isAdmin) {
      payslipAdminChannel = supabase.channel(`payslips:admin`, { config: { broadcast: { self: true } } })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payslip_requests' }, (payload) => { fetchPayslipRequests() })
        .subscribe()
    } else {
      payslipWorkerChannel = supabase.channel(`payslips:${activeWorkerId}`, { config: { broadcast: { self: true } } })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payslip_requests', filter: `worker_id=eq.${activeWorkerId}` }, (payload) => { fetchWorkerPayslipRequests(activeWorkerId) })
        .subscribe()
    }

    // After subscriptions are created, do a quick connectivity test and set status
    ;(async () => {
      try {
        const { error } = await supabase.from('production_assignments').select('id').eq('worker_id', activeWorkerId).limit(1)
        if (error) {
          console.warn('Supabase connectivity test failed:', error)
          setRealtimeStatus('disconnected')
        } else {
          setRealtimeStatus('connected')
        }
      } catch (err) {
        console.error('Supabase connectivity test error:', err)
        setRealtimeStatus('disconnected')
      }
    })()

    // Cleanup subscriptions
    return () => {
      setRealtimeStatus('disconnected')
      supabase.removeChannel(assignmentsChannel)
      supabase.removeChannel(recordsChannel)
      supabase.removeChannel(workerChannel)
      if (payslipWorkerChannel) supabase.removeChannel(payslipWorkerChannel)
      if (payslipAdminChannel) supabase.removeChannel(payslipAdminChannel)
    }
  }, [activeWorker?.id, filterApplied])

  // Polling fallback removed; relying on realtime subscriptions


  const handleLogout = () => { setIsLogoutModalOpen(true) }
  const performLogout = async () => { await supabase.auth.signOut(); router.push("/") }
  const handleViewWorker = (w: any) => { setActiveWorker(w); setView("detail") }
  const handleBackToList = () => { setActiveWorker(null); setRecords([]); setView("list"); setStartDate(""); setEndDate(""); setFilterApplied(false); setFilterTrigger(prev => prev + 1) }
  const clearFilters = () => { setStartDate(""); setEndDate(""); setFilterApplied(false); setFilterTrigger(prev => prev + 1) }
  const applyFilters = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates before filtering.')
      return
    }
    setFilterApplied(true)
    setFilterTrigger(prev => prev + 1)
  }
  
  const openEditModal = (r: any) => {
    setEditingRecord(r)
    setEditForm({
      date_completed: r.date_completed,
      file_name: getDisplayFileName(r.file_name),
      byte_size: r.byte_size || "",
    })
    setIsEditModalOpen(true)
  }
  
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      const response = await fetch('/api/delete-production-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete record.')
      }

      let q: any = supabase.from('production_records').select('*').eq('worker_id', activeWorker.id)
      if (startDate) q = q.gte('date_completed', startDate)
      if (endDate) q = q.lte('date_completed', endDate)
      const { data } = await q.order('date_completed', { ascending: false })
      if (data) setRecords(data)
      alert('✅ Record deleted successfully!')
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (workerId === user?.id) {
      alert('You cannot delete your own account while logged in.')
      return
    }
    if (!confirm(`Are you sure you want to delete ${workerName}? This cannot be undone.`)) return

    try {
      const response = await fetch('/api/delete-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete worker.')
      }

      const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
      if (workers) setAllWorkers(workers)

      setActiveWorker(null)
      setView('list')
      setRecords([])
      alert('✅ Worker deleted successfully!')
    } catch (err: any) {
      console.error('Delete worker error:', err)
      alert(`Failed to delete worker: ${err.message}`)
    }
  }


  
  const saveEdit = async () => {
    if (!editingRecord) return
    setIsSaving(true)
    const fileNameToSave = editingRecord.file_name?.toLowerCase().endsWith('.txt') && !editForm.file_name.toLowerCase().endsWith('.txt')
      ? `${editForm.file_name}.txt`
      : editForm.file_name
    await supabase.from("production_records").update({ date_completed: editForm.date_completed, file_name: fileNameToSave, byte_size: editForm.byte_size }).eq("id", editingRecord.id)
    setIsEditModalOpen(false)
    let q: any = supabase.from("production_records").select("*").eq("worker_id", activeWorker.id)
    if (startDate) q = q.gte("date_completed", startDate)
    if (endDate) q = q.lte("date_completed", endDate)
    const { data } = await q.order("date_completed", { ascending: false })
    if (data) setRecords(data)
    setIsSaving(false)
  }

  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !activeWorker) return
    if (!selectedFile.name.toLowerCase().endsWith('.txt')) { alert("Only .txt files are allowed."); return }
    if (hasDuplicateFileName(selectedFile.name, records)) {
      alert('A file with the same name already exists. Please rename the file before uploading.')
      return
    }
    setIsUploading(true)
    try {
      const sizeToSave = `${Math.max(0, (selectedFile.size / 1024) - 2.1).toFixed(1)} KB`
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('workerId', activeWorker.id)
      formData.append('workerName', activeWorker.full_name)
      formData.append('fileName', selectedFile.name)
      formData.append('byteSize', sizeToSave)
      const uploadUrl = new URL('/api/send-file', window.location.origin).toString()
      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData })
      const uploadText = await uploadRes.text()
      let uploadData: any = null
      try {
        uploadData = uploadText ? JSON.parse(uploadText) : null
      } catch (jsonErr) {
        throw new Error(`Upload failed: invalid JSON response (${uploadRes.status} ${uploadRes.statusText}) — ${uploadText}`)
      }
      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || `Upload failed (${uploadRes.status} ${uploadRes.statusText}) — ${uploadText}`)
      }
      
      // Check if uploaded file matches any assignment
      const normalizedUploadName = normalizeFileName(selectedFile.name)
      const existingAssignment = assignments.find((a: any) => normalizeFileName(a.filename || '') === normalizedUploadName)
      
      // Reject if assignment doesn't exist
      if (!existingAssignment) {
        alert('This file is not in your Current Assignments. Please check the assignment and try again.')
        setIsUploading(false)
        return
      }
      
      // Reject if assignment is cancelled
      if (existingAssignment.status === 'cancelled') {
        alert('This assignment has been cancelled and cannot be uploaded.')
        setIsUploading(false)
        return
      }
      
      // Mark assignment as done if it's pending
      if (existingAssignment.status === 'pending') {
        try {
          const updateRes = await fetch('/api/production-assignments/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: existingAssignment.id, status: 'done' }),
          })
          if (updateRes.ok) {
            await fetchAssignments(activeWorker.id)
          }
        } catch (err: any) {
          console.error('Failed to update assignment status:', err)
        }
      }
      
      setIsUploadModalOpen(false); setSelectedFile(null)
      
      // Fetch and display the newly uploaded record immediately
      const { data: newRecords } = await supabase.from("production_records").select("*").eq("worker_id", activeWorker.id).order("date_completed", { ascending: false }).limit(1)
      if (newRecords && newRecords.length > 0) {
        setRecords([newRecords[0]])
      }
      const successMessage = uploadData?.emailWarning
        ? `✅ File uploaded and saved successfully, but email notification failed: ${uploadData.emailWarning}`
        : '✅ File uploaded, saved, and emailed successfully!'
      alert(successMessage)
    } catch (err: any) {
      console.error(err); alert(`Upload Failed: ${err.message}`)
    } finally { setIsUploading(false) }
  }

  const handleAddManualRecord = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeWorker) return
    if (!manualFileForm.fileName || !manualFileForm.dateCompleted || !manualFileForm.byteSize) {
      alert('Please complete all fields to add a manual record.')
      return
    }
    if (hasDuplicateFileName(manualFileForm.fileName, records)) {
      alert('A record with the same file name already exists. Please choose a different file name.')
      return
    }

    setIsAddingManualRecord(true)
    try {
      const response = await fetch('/api/add-production-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          fileName: manualFileForm.fileName,
          dateCompleted: manualFileForm.dateCompleted,
          byteSize: manualFileForm.byteSize,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to add manual record.')

      setIsManualAddModalOpen(false)
      setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' })
      let q: any = supabase.from('production_records').select('*').eq('worker_id', activeWorker.id)
      if (startDate) q = q.gte('date_completed', startDate)
      if (endDate) q = q.lte('date_completed', endDate)
      const { data } = await q.order('date_completed', { ascending: false })
      if (data) setRecords(data)
      alert('✅ Manual record added successfully!')
    } catch (err: any) {
      console.error('Manual add error:', err)
      alert(`Failed to add record: ${err.message}`)
    } finally {
      setIsAddingManualRecord(false)
    }
  }

  const handleSaveBankDetails = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeWorker) return
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountType || !bankForm.routingNumber) {
      alert('Please fill in all bank details before saving.')
      return
    }

    setIsUpdatingBank(true)
    try {
      const response = await fetch('/api/update-bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          bankDetails: bankForm,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update bank details')
      }

      const { data: updatedWorker } = await response.json()
      if (updatedWorker) {
        setActiveWorker(updatedWorker)
        const admin = profile?.role === 'admin'
        if (admin) {
          const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
          if (workers) setAllWorkers(workers)
        }
        setToastMessage('✅ Bank details updated successfully!')
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      }

      setIsBankModalOpen(false)
    } catch (err: any) {
      console.error('Bank details update error:', err)
      alert(`Failed to update bank details: ${err.message}`)
    } finally {
      setIsUpdatingBank(false)
    }
  }

  const handleSavePaymentRate = async () => {
    if (!activeWorker || selectedPaymentRate === null) return

    setIsUpdatingPayment(true)
    try {
      const response = await fetch('/api/update-worker-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          basePaymentPer60kb: selectedPaymentRate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment rate')
      }

      const { data: updatedWorker } = await response.json()
      if (updatedWorker) {
        setActiveWorker(updatedWorker)
        const admin = profile?.role === 'admin'
        if (admin) {
          const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
          if (workers) setAllWorkers(workers)
        }
        setToastMessage(`✅ Payment rate updated to ${formatCurrency(selectedPaymentRate, activeWorker?.location)} per 60KB!`)
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      }

      setIsPaymentModalOpen(false)
      setSelectedPaymentRate(null)
    } catch (err: any) {
      console.error('Payment update error:', err)
      alert(`Failed to update payment rate: ${err.message}`)
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const openEditWorkerModal = () => {
    if (!activeWorker) return
    setEditWorkerForm({
      fullName: activeWorker.full_name || "",
      jobTitle: activeWorker.job_title || "",
      department: activeWorker.department || "",
      email: activeWorker.email || "",
      location: activeWorker.location || "United States",
    })
    setIsEditWorkerModalOpen(true)
  }

  const handleSaveWorkerDetails = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeWorker) return
    if (!editWorkerForm.fullName || !editWorkerForm.jobTitle || !editWorkerForm.department || !editWorkerForm.email || !editWorkerForm.location) {
      alert('Please fill in all required fields.')
      return
    }

    setIsUpdatingWorkerDetails(true)
    try {
      const response = await fetch('/api/edit-worker-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          workerDetails: {
            fullName: editWorkerForm.fullName,
            jobTitle: editWorkerForm.jobTitle,
            department: editWorkerForm.department,
            email: editWorkerForm.email,
            location: editWorkerForm.location,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update worker details')
      }

      const { data: updatedWorker } = await response.json()
      if (updatedWorker) {
        setActiveWorker(updatedWorker)
        const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
        if (workers) setAllWorkers(workers)
        setToastMessage('✅ Worker details updated successfully!')
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      }

      setIsEditWorkerModalOpen(false)
    } catch (err: any) {
      console.error('Worker details update error:', err)
      alert(`Failed to update worker details: ${err.message}`)
    } finally {
      setIsUpdatingWorkerDetails(false)
    }
  }

  const handleAddWorker = async (e: FormEvent) => {
    e.preventDefault()
    setIsAddingWorker(true)

    try {
      const response = await fetch('/api/add-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newWorkerForm.email,
          password: newWorkerForm.password,
          fullName: newWorkerForm.fullName,
          jobTitle: newWorkerForm.jobTitle,
          department: newWorkerForm.department,
          role: newWorkerForm.role,
          location: newWorkerForm.location,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Unable to add worker.')
      }

      alert('✅ Worker added successfully!')
      setIsAddWorkerModalOpen(false)
      setNewWorkerForm({ fullName: '', jobTitle: '', department: '', email: '', password: '', role: 'worker', location: 'United States' })

      const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
      if (workers) setAllWorkers(workers)
    } catch (err: any) {
      console.error('Failed to add worker:', err)
      alert(`Failed to add worker: ${err.message}`)
    } finally {
      setIsAddingWorker(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRoleWorker || !newRole) return
    setIsUpdatingRole(true)

    try {
      const response = await fetch('/api/update-worker-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: editingRoleWorker.id,
          newRole: newRole,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Unable to update worker role.')
      }

      alert('✅ Worker role updated successfully!')
      setIsRoleEditModalOpen(false)
      setEditingRoleWorker(null)
      setNewRole('')

      const { data: workers } = await supabase.from('worker_profiles').select('*').order('full_name')
      if (workers) setAllWorkers(workers)
    } catch (err: any) {
      console.error('Failed to update worker role:', err)
      alert(`Failed to update worker role: ${err.message}`)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // loading check moved below so all hooks run consistently

  const isAdmin = profile?.role === "admin"

  // Real-time subscription for worker_profiles changes (for admins to see online status updates)
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('worker-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'worker_profiles',
          filter: 'last_seen=not.is_null'
        },
        (payload) => {
          setAllWorkers(prev => prev.map(w => 
            w.id === payload.new.id ? { ...w, last_seen: payload.new.last_seen } : w
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  // Polling fallback for last_seen updates (in case real-time doesn't work)
  useEffect(() => {
    if (!isAdmin) return

    const pollLastSeen = async () => {
      try {
        const { data: workers } = await supabase.from("worker_profiles").select("*, last_seen").order("full_name")
        if (workers) {
          setAllWorkers(workers)
        }
      } catch (err) {
        console.error('Failed to poll last_seen:', err)
      }
    }

    // Poll every 10 seconds for more responsive updates
    const interval = setInterval(pollLastSeen, 10000)
    
    // Initial poll
    pollLastSeen()

    return () => {
      clearInterval(interval)
    }
  }, [isAdmin])

  // Update last_seen timestamp periodically for workers
  useEffect(() => {
    if (!profile?.id || isAdmin) return

    const updateLastSeen = async () => {
      try {
        await fetch('/api/update-last-seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId: profile.id }),
        })
      } catch (e) {
        console.error('Failed to update last_seen:', e)
      }
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [profile?.id, isAdmin])

  const effectiveHeaderTemplate = normalizeGridTemplate(assignmentHeaderTemplate, isAdmin ? 3 : 2)
  const effectiveRowTemplate = normalizeGridTemplate(assignmentRowTemplate, isAdmin ? 3 : 2)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedHeader = window.localStorage.getItem('assignmentHeaderTemplate')
    const savedRow = window.localStorage.getItem('assignmentRowTemplate')
    if (savedHeader) setAssignmentHeaderTemplate(savedHeader)
    if (savedRow) setAssignmentRowTemplate(savedRow)
  }, [])

  const hasBankColumns = !!activeWorker && (
    Object.prototype.hasOwnProperty.call(activeWorker, 'bank_name') ||
    Object.prototype.hasOwnProperty.call(activeWorker, 'account_number') ||
    Object.prototype.hasOwnProperty.call(activeWorker, 'account_type') ||
    Object.prototype.hasOwnProperty.call(activeWorker, 'routing_number')
  )
  const canEditBank = hasBankColumns && (isAdmin || activeWorker?.id === user?.id)
  const canEditProfile = isAdmin || activeWorker?.id === user?.id
  const filteredTotalFiles = records.length
  const filteredTotalKB = calculateTotalKB(records)

  // Group workers by role for the Team Members view
  const admins = allWorkers.filter((w: any) => w.role === 'admin')
  const moderators = allWorkers.filter((w: any) => w.role === 'moderator')
  const hrProjectManagers = allWorkers.filter((w: any) => ['project_manager', 'human_resource', 'project_manager_human_resource'].includes(w.role))
  const workersList = allWorkers.filter((w: any) => !['admin', 'moderator', 'project_manager', 'human_resource', 'project_manager_human_resource'].includes(w.role))

  const computeTotalEarnings = () => {
    const kbValue = parseFloat(filteredTotalKB.replace(/[^\d.]/g, '')) || 0
    const basePayment = activeWorker?.base_payment_per_60kb || 700
    const earnings = (kbValue / 60) * basePayment
    setComputedEarnings(formatCurrency(earnings, activeWorker?.location))
  }

  const requestPayslip = async () => {
    if (!activeWorker) return

    // Validate month is not in the future
    const now = new Date()
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    if (payslipSelectedMonth > currentYearMonth) {
      alert('You cannot request a payslip for a future month.')
      return
    }

    // Parse selected month
    const [selectedYear, selectedMonth] = payslipSelectedMonth.split('-').map(Number)
    
    let cutoffStart: string
    let cutoffEnd: string
    
    if (payslipSelectedCutoff === 'first') {
      // First cutoff: 1st - 14th
      cutoffStart = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      cutoffEnd = new Date(selectedYear, selectedMonth - 1, 14).toISOString().split('T')[0]
    } else {
      // Second cutoff: 15th - last day of month
      cutoffStart = new Date(selectedYear, selectedMonth - 1, 15).toISOString().split('T')[0]
      cutoffEnd = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
    }

    setIsRequestingPayslip(true)
    try {
      const res = await fetch('/api/request-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          cutoffStart,
          cutoffEnd,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request payslip')

      setIsPayslipModalOpen(false)
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setPayslipSelectedMonth(currentMonth)
      setPayslipSelectedCutoff('first')
      await fetchWorkerPayslipRequests(activeWorker.id)
      setToastMessage('✅ Payslip request submitted')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Payslip request error:', err)
      alert(`Failed to request payslip: ${err.message}`)
    } finally {
      setIsRequestingPayslip(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch announcements')
      setAnnouncements(data.announcements || [])
    } catch (err: any) {
      console.error('Fetch announcements error:', err)
      setAnnouncements([])
    }
  }

  const getAnnouncementErrorMessage = (error: any, defaultMessage: string) => {
    const message = typeof error?.message === 'string' ? error.message : String(error || '')
    let result = defaultMessage
    if (/could not find.*active|active.*column|active column|column "active" does not exist|schema cache/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema is missing the active column. Please run the latest database migration or add the active boolean column manually.'
    } else if (/could not find.*message|message.*column.*could not find|column "message" does not exist/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema is missing the message column. Please run the latest database migration or add the message text column manually.'
    } else if (/could not find.*content|content.*column.*could not find|column "content" does not exist|null value in column "content".*violates not-null constraint/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema is missing the content column. Please run the latest database migration or add the content text column manually.'
    } else if (/could not find.*created_at|created_at.*column.*could not find|column "created_at" does not exist/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema is missing the created_at column. Please run the latest database migration or add the created_at timestamp column manually.'
    } else if (/could not find.*title|title.*column.*could not find|column "title" does not exist|null value in column "title".*violates not-null constraint/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema requires title to be nullable or absent. Update the announcements schema to allow title to be null or add a default title value.'
    } else if (/null value in column "admin_id".*violates not-null constraint/i.test(message) || /column "admin_id" does not exist/i.test(message)) {
      result = 'Announcement publishing failed because the announcements table schema requires admin_id to be nullable or absent. Update the announcements schema to allow admin_id to be null or remove the NOT NULL constraint.'
    }

    if (announcementSchemaHint) {
      result += `\n\nSchema repair suggestion:\n${announcementSchemaHint}`
    }

    return result
  }

  const publishAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      alert('Please enter an announcement message.')
      return
    }

    setAnnouncementErrorMessage(null)
    setIsPublishingAnnouncement(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcementMessage.trim() }),
      })
      const data = await res.json()
      setAnnouncementSchemaHint(data.schemaHint || null)
      if (!res.ok) {
        const message = getAnnouncementErrorMessage({ message: data.error }, `Failed to publish announcement: ${data.error || 'Unknown error'}`)
        setAnnouncementErrorMessage(message)
        throw new Error(message)
      }
      setAnnouncementMessage('')
      setAnnouncementErrorMessage(null)
      setIsAnnouncementModalOpen(false)
      setToastMessage('✅ Announcement published')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      await fetchAnnouncements()
    } catch (err: any) {
      console.error('Publish announcement error:', err)
      if (!announcementErrorMessage) {
        setAnnouncementErrorMessage(err.message || 'Failed to publish announcement')
      }
    } finally {
      setIsPublishingAnnouncement(false)
    }
  }

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    setAnnouncementErrorMessage(null)
    try {
      const res = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      setAnnouncementSchemaHint(data.schemaHint || null)
      if (!res.ok) {
        const message = getAnnouncementErrorMessage({ message: data.error }, `Failed to delete announcement: ${data.error || 'Unknown error'}`)
        setAnnouncementErrorMessage(message)
        throw new Error(message)
      }
      setAnnouncementErrorMessage(null)
      setToastMessage('✅ Announcement deleted')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      await fetchAnnouncements()
    } catch (err: any) {
      console.error('Delete announcement error:', err)
      if (!announcementErrorMessage) {
        const message = getAnnouncementErrorMessage(err, `Failed to delete announcement: ${err?.message || 'Unknown error'}`)
        setAnnouncementErrorMessage(message)
      }
    }
  }

  const startEditingAnnouncement = (announcement: any) => {
    setEditingAnnouncementId(announcement.id)
    setAnnouncementMessage(announcement.message)
    setIsEditingAnnouncement(true)
    setShowAnnouncementPreview(false)
    setIsAnnouncementModalOpen(true)
  }

  const updateAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      alert('Please enter an announcement message.')
      return
    }

    setAnnouncementErrorMessage(null)
    setIsPublishingAnnouncement(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAnnouncementId, message: announcementMessage.trim() }),
      })
      const data = await res.json()
      setAnnouncementSchemaHint(data.schemaHint || null)
      if (!res.ok) {
        const message = getAnnouncementErrorMessage({ message: data.error }, `Failed to update announcement: ${data.error || 'Unknown error'}`)
        setAnnouncementErrorMessage(message)
        throw new Error(message)
      }
      setAnnouncementMessage('')
      setAnnouncementErrorMessage(null)
      setIsAnnouncementModalOpen(false)
      setIsEditingAnnouncement(false)
      setEditingAnnouncementId(null)
      setShowAnnouncementPreview(false)
      setToastMessage('✅ Announcement updated')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      await fetchAnnouncements()
    } catch (err: any) {
      console.error('Update announcement error:', err)
      if (!announcementErrorMessage) {
        const message = getAnnouncementErrorMessage(err, `Failed to update announcement: ${err?.message || 'Unknown error'}`)
        setAnnouncementErrorMessage(message)
      }
    } finally {
      setIsPublishingAnnouncement(false)
    }
  }

  const fetchPayslipRequests = async () => {
    try {
      const res = await fetch('/api/payslip-requests')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payslip requests')
      setAdminPayslipRequests(data.requests || [])

      // Automatically enrich any requests missing worker_name by fetching profiles
      const requests = data.requests || []
      const missingIds = Array.from(new Set(requests.filter((r: any) => !r.worker_name && r.worker_id).map((r: any) => String(r.worker_id)))) as string[]
      if (missingIds.length > 0) {
        await Promise.all(missingIds.map(async (id: string) => {
          try {
            const res2 = await fetch(`/api/worker-profiles?id=${encodeURIComponent(id)}`)
            const d2 = await res2.json()
            if (res2.ok && d2.profile) {
              const profile = d2.profile
              setAdminPayslipRequests((prev) => prev.map((r: any) => r.worker_id === id ? { ...r, worker_name: profile.full_name || null, worker_email: profile.email || null } : r))
            }
          } catch (e) {
            // ignore individual failures
          }
        }))
      }
    } catch (err: any) {
      console.error('Fetch payslip requests error:', err)
      alert(`Failed to load payslip requests: ${err.message}`)
    }
  }

  const fetchWorkerPayslipRequests = async (workerId: string) => {
    try {
      const res = await fetch(`/api/payslip-requests?workerId=${encodeURIComponent(workerId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payslip requests')
      setPayslipRequests(data.requests || [])
    } catch (err: any) {
      console.error('Fetch worker payslip requests error:', err)
      setPayslipRequests([])
    }
  }

  const fetchPaymentHistory = async (workerId: string) => {
    setIsLoadingPaymentHistory(true)
    try {
      const res = await fetch(`/api/payment-history?workerId=${encodeURIComponent(workerId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payment history')
      setPaymentHistory(data.payments || [])
    } catch (err: any) {
      console.error('Fetch payment history error:', err)
      setPaymentHistory([])
    } finally {
      setIsLoadingPaymentHistory(false)
    }
  }

  const addPaymentRecord = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeWorker?.id) return

    const amount = parseFloat(paymentHistoryForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    setIsAddingPaymentRecord(true)
    try {
      const res = await fetch('/api/payment-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeWorker.id,
          senderBank: paymentHistoryForm.senderBank,
          referenceNumber: paymentHistoryForm.referenceNumber,
          recipientBank: paymentHistoryForm.recipientBank,
          amount,
          paymentDate: paymentHistoryForm.dateSent,
          notes: paymentHistoryForm.notes
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add payment record')
      
      // Reset form
      setPaymentHistoryForm({
        senderBank: '',
        referenceNumber: '',
        recipientBank: '',
        amount: '',
        dateSent: (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        })(),
        notes: ''
      })
      
      // Refresh list
      await fetchPaymentHistory(activeWorker.id)
      setToastMessage('✅ Payment record added successfully')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Add payment record error:', err)
      alert(err.message || 'Failed to add payment record')
    } finally {
      setIsAddingPaymentRecord(false)
    }
  }

  const deletePaymentRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return
    if (!activeWorker?.id) return

    try {
      const res = await fetch('/api/payment-history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: recordId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment record')

      // Refresh list
      await fetchPaymentHistory(activeWorker.id)
      setToastMessage('🗑️ Payment record deleted')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Delete payment record error:', err)
      alert(err.message || 'Failed to delete payment record')
    }
  }


  const uploadPayslipFile = async (requestId: number, file: File) => {
    if (!file) return
    const formData = new FormData()
    formData.append('requestId', String(requestId))
    formData.append('file', file)

    setIsProcessingRequest(true)
    try {
      const res = await fetch('/api/payslip-requests/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload payslip')
      if (data.warning && data.payslipUrl) {
        setAdminPayslipRequests((prev) => prev.map((r: any) => r.id === requestId ? { ...r, payslip_url: data.payslipUrl } : r))
      } else {
        await fetchPayslipRequests()
        if (activeWorker?.id) await fetchWorkerPayslipRequests(activeWorker.id)
      }
      setToastMessage(data.warning ? `✅ Uploaded, but could not save URL: ${data.warning}` : '✅ Payslip uploaded successfully')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 4000)
    } catch (err: any) {
      console.error('Payslip upload error:', err)
      alert(`Failed to upload payslip: ${err.message}`)
    } finally {
      setIsProcessingRequest(false)
    }
  }

  const loadWorkerInfo = async (workerId: string, requestId: number) => {
    try {
      setLoadingWorkerId(requestId + '')
      const res = await fetch(`/api/worker-profiles?id=${encodeURIComponent(workerId)}`)
      const data = await res.json()
      if (!res.ok || !data.profile) throw new Error(data.error || 'Failed')
      const profile = data.profile
      setAdminPayslipRequests((prev) => prev.map((r: any) => r.id === requestId ? { ...r, worker_name: profile.full_name || null, worker_email: profile.email || null } : r))
    } catch (err) {
      console.error('Load worker info error:', err)
      alert('Failed to load worker info')
    } finally {
      setLoadingWorkerId(null)
    }
  }

  const updatePayslipRequestStatus = async (id: string | number, status: string) => {
    setIsProcessingRequest(true)
    try {
      const res = await fetch('/api/payslip-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update request')
      // refresh list
      await fetchPayslipRequests()
      if (activeWorker?.id) await fetchWorkerPayslipRequests(activeWorker.id)
      setToastMessage('✅ Payslip request updated')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Update payslip request error:', err)
      alert(`Failed to update payslip request: ${err.message}`)
    } finally {
      setIsProcessingRequest(false)
    }
  }

  const deletePayslipRequest = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this payslip request? This action cannot be undone.')) return
    setIsProcessingRequest(true)
    try {
      const res = await fetch('/api/payslip-requests/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete request')
      // refresh list
      await fetchPayslipRequests()
      if (activeWorker?.id) await fetchWorkerPayslipRequests(activeWorker.id)
      setToastMessage('✅ Payslip request deleted')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Delete payslip request error:', err)
      alert(`Failed to delete payslip request: ${err.message}`)
    } finally {
      setIsProcessingRequest(false)
    }
  }

  const fetchAssignments = async (workerId: string) => {
    try {
      const res = await fetch(`/api/production-assignments?workerId=${encodeURIComponent(workerId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assignments')
      const nextAssignments = data.assignments || []
      
      // Check if there are any pending assignments
      const hasPendingAssignments = nextAssignments.some((a: any) => a.status === 'pending')
      
      // If no pending assignments, delete all (done/cancelled) and show success message
      if (!hasPendingAssignments && nextAssignments.length > 0) {
        for (const assignment of nextAssignments) {
          try {
            await fetch('/api/production-assignments/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assignmentId: assignment.id }),
            })
          } catch (err) {
            console.error('Failed to delete completed assignment:', err)
          }
        }
        setAssignments([])
        setShowAllSubmittedMessage(true)
      } else {
        setAssignments(nextAssignments)
        setShowAllSubmittedMessage(false)
      }
    } catch (err: any) {
      console.error('Fetch assignments error:', err)
      setAssignments([])
      setShowAllSubmittedMessage(false)
    }
  }

  const addAssignment = async (workerId: string, filename: string) => {
    if (!filename.trim()) {
      alert('Please enter a filename')
      return
    }
    setIsAddingAssignment(true)
    try {
      // Upload attachment first if one was selected
      let attachmentUrl: string | null = null
      if (newAssignmentAttachment) {
        setIsUploadingAttachment(true)
        const formData = new FormData()
        formData.append('workerId', workerId)
        formData.append('file', newAssignmentAttachment)
        const uploadRes = await fetch('/api/production-assignments/upload-attachment', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        setIsUploadingAttachment(false)
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload attachment')
        attachmentUrl = uploadData.attachmentUrl
      }

      const requestUrl = new URL('/api/production-assignments', window.location.origin).toString()
      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workerId, 
          filename: filename.trim(),
          description: newAssignmentDescription || null,
          attachmentUrl,
        }),
      })
      let data: any = null
      try {
        data = await res.json()
      } catch (jsonErr) {
        throw new Error(`API response was not valid JSON (${res.status} ${res.statusText})`)
      }
      if (!res.ok) throw new Error(data?.error || `Failed to add assignment (${res.status})`)
      await fetchAssignments(workerId)
      setNewAssignmentFilename("")
      setNewAssignmentDescription("")
      setNewAssignmentAttachment(null)
      setIsAddAssignmentModalOpen(false)
      setEditAssignmentId(null)
      setToastMessage('✅ Assignment added')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Add assignment error:', err)
      alert(`Failed to add assignment: ${err.message}`)
    } finally {
      setIsAddingAssignment(false)
    }
  }

  const saveAssignment = async (workerId: string) => {
    if (editAssignmentId) {
      try {
        const res = await fetch('/api/production-assignments/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: editAssignmentId,
            filename: newAssignmentFilename.trim(),
            description: newAssignmentDescription || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update assignment')
        if (workerId) await fetchAssignments(workerId)
        // Add to updated description notifications if description was changed
        if (newAssignmentDescription) {
          setAssignmentsWithUpdatedDescription(prev => new Set([...prev, editAssignmentId]))
        }
        setToastMessage('✅ Assignment updated')
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
        setIsAddAssignmentModalOpen(false)
        setEditAssignmentId(null)
        setNewAssignmentFilename('')
        setNewAssignmentDescription('')
      } catch (err: any) {
        console.error('Update assignment error:', err)
        alert(`Failed to update assignment: ${err.message}`)
      }
      return
    }
    // fallback to add
    await addAssignment(workerId, newAssignmentFilename)
  }

  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      const res = await fetch('/api/production-assignments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete assignment')
      if (activeWorker?.id) await fetchAssignments(activeWorker.id)
      setToastMessage('✅ Assignment deleted')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Delete assignment error:', err)
      alert(`Failed to delete assignment: ${err.message}`)
    }
  }

  const handleSubmitIssue = async () => {
    if (!reportIssueAssignment || !issueDescription.trim()) return

    setIsSubmittingIssue(true)
    try {
      const res = await fetch('/api/report-assignment-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: reportIssueAssignment.id,
          assignmentFilename: reportIssueAssignment.filename,
          issueDescription: issueDescription.trim(),
          workerId: profile?.id,
          workerName: profile?.full_name,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to submit issue')
      }

      setToastMessage('✅ Issue reported successfully')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      setIsReportIssueModalOpen(false)
      setIssueDescription('')
      setReportIssueAssignment(null)
      setSelectedAssignment(null)
    } catch (err: any) {
      console.error('Failed to submit issue:', err)
      alert(`Failed to submit issue: ${err.message}`)
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  const cancelAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) return
    try {
      const res = await fetch('/api/production-assignments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, status: 'cancelled' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel assignment')
      if (activeWorker?.id) await fetchAssignments(activeWorker.id)
      setToastMessage('✅ Assignment cancelled')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Cancel assignment error:', err)
      alert(`Failed to cancel assignment: ${err.message}`)
    }
  }

  if (loading && !user) return <div className="flex min-h-screen items-center justify-center bg-zinc-50"><p className="text-zinc-500">Loading...</p></div>

  return (
    <div className="min-h-screen bg-zinc-50">
      {showToast && toastMessage && (
        <div className="fixed right-6 bottom-6 z-50 max-w-xs rounded-lg bg-slate-900 px-4 py-3 text-white shadow-lg">
          <div className="text-sm font-medium">{toastMessage}</div>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-white to-zinc-50 rounded-3xl shadow-2xl p-6 max-w-sm w-full border-2 border-zinc-200/80 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto mb-4 shadow-sm">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirm Log Out</h3>
            <p className="text-sm text-zinc-500 mb-6">Are you sure you want to log out of your session?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsLogoutModalOpen(false)} 
                className="flex-1 rounded-xl border-2 border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400 transition-all"
              >
                No, Stay
              </button>
              <button 
                onClick={async () => {
                  setIsLogoutModalOpen(false)
                  await performLogout()
                }} 
                className="flex-1 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-red-600/20 hover:from-red-800 hover:to-rose-800 transition-all"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="border-b border-zinc-200/80 bg-gradient-to-r from-white to-zinc-50/50 backdrop-blur-md px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-zinc-200/50">
        <div className="flex items-center gap-4">
          {isAdmin && view === "detail" && <button onClick={handleBackToList} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"><ArrowLeft className="h-4 w-4" /> Back to Team</button>}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-sky-500 text-white shadow-xl shadow-cyan-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900 tracking-tight">ApexScript Transcription Services</div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{isAdmin ? 'Admin Dashboard' : 'Worker Dashboard'}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Bell notification icon */}
          <div className="relative">
            <button
              onClick={() => setIsAnnouncementPopupOpen(prev => !prev)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-all"
              title="Announcements"
            >
              <Bell className="h-5 w-5" />
              {announcements.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {announcements.length}
                </span>
              )}
            </button>

            {/* Announcement popup */}
            {isAnnouncementPopupOpen && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-40" onClick={() => setIsAnnouncementPopupOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-zinc-800">Announcements</span>
                      {announcements.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{announcements.length}</span>
                      )}
                    </div>
                    <button onClick={() => setIsAnnouncementPopupOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
                    {announcements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <Bell className="h-8 w-8 text-zinc-300 mb-2" />
                        <p className="text-sm font-medium text-zinc-500">No announcements yet</p>
                        <p className="text-xs text-zinc-400 mt-1">Check back later for updates.</p>
                      </div>
                    ) : (
                      announcements.map((ann: any) => (
                        <div key={ann.id} className="px-4 py-3 hover:bg-zinc-50 transition">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap flex-1">{ann.message}</p>
                            {isAdmin && (
                              <div className="flex shrink-0 gap-1 ml-2">
                                <button
                                  onClick={() => { startEditingAnnouncement(ann); setIsAnnouncementPopupOpen(false) }}
                                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAnnouncement(ann.id)}
                                  className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {ann.created_at && (
                            <p className="mt-1.5 text-xs text-zinc-400">{new Date(ann.created_at).toLocaleString()}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-700 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-cyan-600/30 hover:from-cyan-700 hover:via-cyan-800 hover:to-sky-700 hover:shadow-xl hover:shadow-cyan-600/40 transition-all"><LogOut className="h-4 w-4" /> Log Out</button>
        </div>
      </header>


      <main className="mx-auto max-w-6xl p-6 space-y-6">
        {isAdmin && (
          <AdminChat workerProfiles={workersList} />
        )}
        {!isAdmin && profile?.id && (
          <WorkerRealtimeChat workerId={profile.id} initialName={profile.full_name || undefined} />
        )}
        {announcementSchemaHint && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Database migration recommended</div>
              <div className="text-xs text-red-700">Your announcements table is missing the expected column. Run the SQL below to fix it.</div>
              <pre className="overflow-x-auto rounded-2xl border border-red-100 bg-white p-3 text-xs text-zinc-900"><code>{announcementSchemaHint}</code></pre>
            </div>
          </div>
        )}

        {isAdmin && view === "list" ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">Team Members</h2>
                <p className="text-zinc-500">Select a worker to view their production records and information.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-zinc-600 mb-2">Admins</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {admins.length > 0 ? admins.map((w: any) => (
                    <div key={w.id} role="button" tabIndex={0} onClick={() => handleViewWorker(w)} onKeyDown={(e) => { if (e.key === 'Enter') handleViewWorker(w) }} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer">
                      <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-6 w-6" /></div>
                        {w.last_seen && (() => {
                          const lastSeen = new Date(w.last_seen)
                          const now = new Date()
                          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                          if (diffMinutes < 5) {
                            return <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          }
                          return null
                        })()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-zinc-900 truncate">{w.full_name}</p>
                        <p className="text-zinc-500 text-sm mt-1 truncate flex items-center gap-1">
                          <span>{w.job_title || "Transcriber"} · {w.department || "General"}</span>
                          {w.location ? (
                            <span className="inline-flex items-center gap-1">
                              · {w.location}
                              <FlagIcon country={w.location} size={14} />
                            </span>
                          ) : null}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {w.role && (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[w.role] || 'bg-zinc-100 text-zinc-700'}`}>
                              {formatRoleLabel(w.role)}
                            </span>
                          )}
                          {w.last_seen && (() => {
                            const lastSeen = new Date(w.last_seen)
                            const now = new Date()
                            const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                            // Hide last seen if offline for more than 12 hours
                            if (diffMinutes > 720) return null
                            if (diffMinutes < 5) {
                              return <span className="text-green-600 text-xs font-medium">Online</span>
                            } else {
                              const minutesAgo = Math.floor(diffMinutes)
                              if (minutesAgo < 60) {
                                return <span className="text-zinc-400 text-xs">{minutesAgo}m ago</span>
                              } else {
                                const hoursAgo = Math.floor(minutesAgo / 60)
                                if (hoursAgo < 24) {
                                  return <span className="text-zinc-400 text-xs">{hoursAgo}h ago</span>
                                } else {
                                  return <span className="text-zinc-400 text-xs">{Math.floor(hoursAgo / 24)}d ago</span>
                                }
                              }
                            }
                          })()}
                        </div>
                      </div>
                      {isAdmin && w.id !== user?.id && (
                        <div className="absolute right-3 top-3 flex gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingRoleWorker(w); setNewRole(w.role || 'worker'); setIsRoleEditModalOpen(true) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 transition" aria-label="Edit role">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id, w.full_name) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-white shadow-sm shadow-red-600/20 hover:bg-red-800 transition" aria-label="Delete worker">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-zinc-500">No admins found.</div>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-600 mb-2">Project Manager & Human Resource</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {hrProjectManagers.length > 0 ? hrProjectManagers.map((w: any) => (
                    <div key={w.id} role="button" tabIndex={0} onClick={() => handleViewWorker(w)} onKeyDown={(e) => { if (e.key === 'Enter') handleViewWorker(w) }} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer">
                      <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-6 w-6" /></div>
                        {w.last_seen && (() => {
                          const lastSeen = new Date(w.last_seen)
                          const now = new Date()
                          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                          if (diffMinutes < 5) {
                            return <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          }
                          return null
                        })()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-zinc-900 truncate">{w.full_name}</p>
                        <p className="text-zinc-500 text-sm mt-1 truncate flex items-center gap-1">
                          <span>{w.job_title || "Transcriber"} · {w.department || "General"}</span>
                          {w.location ? (
                            <span className="inline-flex items-center gap-1">
                              · {w.location}
                              <FlagIcon country={w.location} size={14} />
                            </span>
                          ) : null}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {w.role && (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[w.role] || 'bg-zinc-100 text-zinc-700'}`}>
                              {formatRoleLabel(w.role)}
                            </span>
                          )}
                          {w.last_seen && (() => {
                            const lastSeen = new Date(w.last_seen)
                            const now = new Date()
                            const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                            // Hide last seen if offline for more than 12 hours
                            if (diffMinutes > 720) return null
                            if (diffMinutes < 5) {
                              return <span className="text-green-600 text-xs font-medium">Online</span>
                            } else {
                              const minutesAgo = Math.floor(diffMinutes)
                              if (minutesAgo < 60) {
                                return <span className="text-zinc-400 text-xs">{minutesAgo}m ago</span>
                              } else {
                                const hoursAgo = Math.floor(minutesAgo / 60)
                                if (hoursAgo < 24) {
                                  return <span className="text-zinc-400 text-xs">{hoursAgo}h ago</span>
                                } else {
                                  return <span className="text-zinc-400 text-xs">{Math.floor(hoursAgo / 24)}d ago</span>
                                }
                              }
                            }
                          })()}
                        </div>
                      </div>
                      {isAdmin && w.id !== user?.id && (
                        <div className="absolute right-3 top-3 flex gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingRoleWorker(w); setNewRole(w.role || 'worker'); setIsRoleEditModalOpen(true) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 transition" aria-label="Edit role">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id, w.full_name) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-white shadow-sm shadow-red-600/20 hover:bg-red-800 transition" aria-label="Delete worker">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-zinc-500">No Project Managers & HR found.</div>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-600 mb-2">Moderators</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {moderators.length > 0 ? moderators.map((w: any) => (
                    <div key={w.id} role="button" tabIndex={0} onClick={() => handleViewWorker(w)} onKeyDown={(e) => { if (e.key === 'Enter') handleViewWorker(w) }} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer">
                      <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-6 w-6" /></div>
                        {w.last_seen && (() => {
                          const lastSeen = new Date(w.last_seen)
                          const now = new Date()
                          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                          if (diffMinutes < 5) {
                            return <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          }
                          return null
                        })()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-zinc-900 truncate">{w.full_name}</p>
                        <p className="text-zinc-500 text-sm mt-1 truncate flex items-center gap-1">
                          <span>{w.job_title || "Transcriber"} · {w.department || "General"}</span>
                          {w.location ? (
                            <span className="inline-flex items-center gap-1">
                              · {w.location}
                              <FlagIcon country={w.location} size={14} />
                            </span>
                          ) : null}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {w.role && (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[w.role] || 'bg-zinc-100 text-zinc-700'}`}>
                              {formatRoleLabel(w.role)}
                            </span>
                          )}
                          {w.last_seen && (() => {
                            const lastSeen = new Date(w.last_seen)
                            const now = new Date()
                            const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                            // Hide last seen if offline for more than 12 hours
                            if (diffMinutes > 720) return null
                            if (diffMinutes < 5) {
                              return <span className="text-green-600 text-xs font-medium">Online</span>
                            } else {
                              const minutesAgo = Math.floor(diffMinutes)
                              if (minutesAgo < 60) {
                                return <span className="text-zinc-400 text-xs">{minutesAgo}m ago</span>
                              } else {
                                const hoursAgo = Math.floor(minutesAgo / 60)
                                if (hoursAgo < 24) {
                                  return <span className="text-zinc-400 text-xs">{hoursAgo}h ago</span>
                                } else {
                                  return <span className="text-zinc-400 text-xs">{Math.floor(hoursAgo / 24)}d ago</span>
                                }
                              }
                            }
                          })()}
                        </div>
                      </div>
                      {isAdmin && w.id !== user?.id && (
                        <div className="absolute right-3 top-3 flex gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingRoleWorker(w); setNewRole(w.role || 'worker'); setIsRoleEditModalOpen(true) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 transition" aria-label="Edit role">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id, w.full_name) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-white shadow-sm shadow-red-600/20 hover:bg-red-800 transition" aria-label="Delete worker">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-zinc-500">No moderators found.</div>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-600 mb-2">Workers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {workersList.length > 0 ? workersList.map((w: any) => (
                    <div key={w.id} role="button" tabIndex={0} onClick={() => handleViewWorker(w)} onKeyDown={(e) => { if (e.key === 'Enter') handleViewWorker(w) }} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer">
                      <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-6 w-6" /></div>
                        {w.last_seen && (() => {
                          const lastSeen = new Date(w.last_seen)
                          const now = new Date()
                          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                          if (diffMinutes < 5) {
                            return <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          }
                          return null
                        })()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-zinc-900 truncate">{w.full_name}</p>
                        <p className="text-zinc-500 text-sm mt-1 truncate flex items-center gap-1">
                          <span>{w.job_title || "Transcriber"} · {w.department || "General"}</span>
                          {w.location ? (
                            <span className="inline-flex items-center gap-1">
                              · {w.location}
                              <FlagIcon country={w.location} size={14} />
                            </span>
                          ) : null}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {w.role && (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[w.role] || 'bg-zinc-100 text-zinc-700'}`}>
                              {formatRoleLabel(w.role)}
                            </span>
                          )}
                          {w.last_seen && (() => {
                            const lastSeen = new Date(w.last_seen)
                            const now = new Date()
                            const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
                            // Hide last seen if offline for more than 12 hours
                            if (diffMinutes > 720) return null
                            if (diffMinutes < 5) {
                              return <span className="text-green-600 text-xs font-medium">Online</span>
                            } else {
                              const minutesAgo = Math.floor(diffMinutes)
                              if (minutesAgo < 60) {
                                return <span className="text-zinc-400 text-xs">{minutesAgo}m ago</span>
                              } else {
                                const hoursAgo = Math.floor(minutesAgo / 60)
                                if (hoursAgo < 24) {
                                  return <span className="text-zinc-400 text-xs">{hoursAgo}h ago</span>
                                } else {
                                  return <span className="text-zinc-400 text-xs">{Math.floor(hoursAgo / 24)}d ago</span>
                                }
                              }
                            }
                          })()}
                        </div>
                      </div>
                      {isAdmin && w.id !== user?.id && (
                        <div className="absolute right-3 top-3 flex gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingRoleWorker(w); setNewRole(w.role || 'worker'); setIsRoleEditModalOpen(true) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 transition" aria-label="Edit role">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteWorker(w.id, w.full_name) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-white shadow-sm shadow-red-600/20 hover:bg-red-800 transition" aria-label="Delete worker">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-zinc-500">No workers found.</div>}
                </div>
              </section>

              {/* ── Admin Hub ── */}
              <div className="mt-10">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 p-8 shadow-2xl">
                  {/* Decorative glow blobs */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

                  <div className="relative">
                    {/* Hub Header */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-600/30">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Admin Hub</h3>
                        <p className="text-sm text-zinc-400">Quick access to administrative actions</p>
                      </div>
                    </div>

                    {/* Hub Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                      {/* Add New Worker */}
                      <button
                        onClick={() => setIsAddWorkerModalOpen(true)}
                        className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-600/20"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-200">
                          <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Add New Worker</p>
                          <p className="mt-0.5 text-xs text-zinc-400">Register a new team member</p>
                        </div>
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Announcement */}
                      <button
                        onClick={() => { setAnnouncementSchemaHint(null); setIsAnnouncementModalOpen(true) }}
                        className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm hover:bg-white/10 hover:border-amber-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-amber-600/20"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-200">
                          <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Announcement</p>
                          <p className="mt-0.5 text-xs text-zinc-400">Broadcast a message to all workers</p>
                        </div>
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Payslip Requests */}
                      <button
                        onClick={() => { setIsPayslipAdminModalOpen(true); fetchPayslipRequests() }}
                        className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm hover:bg-white/10 hover:border-emerald-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/20"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Payslip Requests</p>
                          <p className="mt-0.5 text-xs text-zinc-400">Review &amp; manage payslip requests</p>
                        </div>
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="mb-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center gap-4 sm:items-start">
                      <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-10 w-10" /></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-900">{activeWorker?.full_name || "Worker Details"}</h2>
                        {activeWorker?.role && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-800">
                            {activeWorker.role}
                          </span>
                        )}
                        {activeWorker && (
                          <div className="ml-auto flex items-center gap-2">
                            {isAdmin && (
                              <button onClick={openEditWorkerModal} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📋</span>
                          <span>{activeWorker?.job_title || "Transcriber"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">🏢</span>
                          <span>{activeWorker?.department || "General"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📍</span>
                          <span className="inline-flex items-center gap-2">
                            {activeWorker?.location || "N/A"}
                            {activeWorker?.location && <FlagIcon country={activeWorker.location} size={18} />}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">✉️</span>
                          <span>{activeWorker?.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasBankColumns && (
              <Card className="border-l-4 border-cyan-500 mb-0 relative">
                <CardHeader className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium text-zinc-500">Bank Details</CardTitle>
                    <p className="text-xs text-zinc-400">Editable by authorized users.</p>
                  </div>
                </CardHeader>
                {canEditBank && (
                  <button onClick={() => setIsBankModalOpen(true)} className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition">
                    <CreditCard className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                <CardContent>
                  <div className="space-y-1.5 text-sm text-zinc-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Bank Name</span>
                      <span>{activeWorker?.bank_name || "No bank name set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Account Number</span>
                      <span>{activeWorker?.account_number || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Account Type</span>
                      <span>{activeWorker?.account_type || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Routing Number</span>
                      <span>{activeWorker?.routing_number || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Employee ID</span>
                      <span>{activeWorker?.employee_id || "Not provided"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3 mt-3">
              <Card className="bg-gradient-to-br from-white to-zinc-50/50 border-zinc-200/80 hover:shadow-md hover:shadow-zinc-200/30 transition-all duration-300 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                  <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Files</CardTitle>
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-xl font-extrabold text-zinc-900 tracking-tight">{filteredTotalFiles}</div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{filterApplied ? "Selected Period" : "All Time"}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-white to-zinc-50/50 border-zinc-200/80 hover:shadow-md hover:shadow-zinc-200/30 transition-all duration-300 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                  <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Kilobytes</CardTitle>
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                    <HardDrive className="h-3.5 w-3.5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-xl font-extrabold text-zinc-900 tracking-tight">{filteredTotalKB}</div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{filterApplied ? "Selected Period" : "All Time"}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-white to-zinc-50/50 border-zinc-200/80 hover:shadow-md hover:shadow-zinc-200/30 transition-all duration-300 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                  <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Earnings</CardTitle>
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <CreditCard className="h-3.5 w-3.5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-xl font-extrabold text-zinc-900 tracking-tight">{computedEarnings ?? '-'}</div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{computedEarnings ? `Based on ${formatCurrency(activeWorker?.base_payment_per_60kb || 700, activeWorker?.location)} per 60KB` : ''}</p>
                  <div className="flex gap-1.5 mt-2">
                    <button type="button" onClick={computeTotalEarnings} className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm hover:from-slate-950 hover:to-black hover:shadow transition-all">
                      Compute Earnings
                    </button>
                    {isAdmin && (
                      <button type="button" onClick={() => { setIsPaymentModalOpen(true); setSelectedPaymentRate(activeWorker?.base_payment_per_60kb || 700) }} className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all">
                        <Pencil className="h-2.5 w-2.5" /> Rate
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr] xl:items-stretch mt-4">
              <Card className="bg-gradient-to-br from-white to-zinc-50 border-zinc-200/80">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-zinc-900 tracking-tight">Production Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-zinc-600 mb-1.5">Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFilterApplied(false); }} className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all" placeholder="mm/dd/yyyy" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-zinc-600 mb-1.5">End Date</label>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setFilterApplied(false); }} className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all" placeholder="mm/dd/yyyy" />
                      </div>
                      <button onClick={applyFilters} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-zinc-900 to-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-black/40 ring-1 ring-white/10 hover:from-black hover:to-zinc-900 hover:shadow-black/60 hover:shadow-xl transition-all">
                        <span>⊡</span> Filter
                      </button>
                      {(startDate || endDate) && (
                        <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-900 text-white text-xs font-semibold ring-1 ring-white/10 shadow-lg shadow-black/30 hover:from-zinc-900 hover:to-black hover:shadow-black/50 transition-all">
                          <X className="h-3 w-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-100/80 text-zinc-700 uppercase text-[11px] font-semibold tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left rounded-tl-lg">File Name</th>
                          <th className="px-4 py-3 text-left">Date Completed</th>
                          <th className="px-4 py-3 text-left">Size (KB)</th>
                          {isAdmin && <th className="px-4 py-3 text-left rounded-tr-lg">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60 bg-white">
                        {records.length > 0 ? records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="px-4 py-3 font-semibold text-zinc-900">{getDisplayFileName(r.file_name)}</td>
                            <td className="px-4 py-3 text-zinc-600">{formatDateDMY(r.date_completed)}</td>
                            <td className="px-4 py-3 font-bold text-cyan-600">{formatKB(r.byte_size)}</td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditModal(r)} className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm shadow-slate-300/80 hover:border-slate-400 hover:text-zinc-900 hover:shadow-md transition-all">
                                    <Pencil className="h-4 w-4" /> Edit
                                  </button>
                                  <button onClick={() => handleDeleteRecord(r.id)} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-xl shadow-red-600/30 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-600/40 transition-all">
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-zinc-500 font-medium">No production records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <div className="border-t border-zinc-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 bg-zinc-50/50">
                  {isAdmin && (
                    <button onClick={() => setIsManualAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm shadow-zinc-200/70 hover:bg-zinc-100 hover:border-zinc-400 hover:shadow-md transition-all">
                      <FileText className="h-4 w-4" /> Add File Manually
                    </button>
                  )}
                  <button onClick={() => setIsUploadModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-zinc-900 to-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/40 ring-1 ring-white/10 hover:from-black hover:to-zinc-900 hover:shadow-black/60 hover:shadow-xl transition-all">
                    <Upload className="h-3.5 w-3.5" /> Upload File
                  </button>
                </div>
              </Card>

              {/* Current Assignments Card */}
              <Card className="flex flex-col overflow-hidden bg-gradient-to-br from-white to-zinc-50 border-zinc-200/80 xl:h-full">
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-zinc-900 tracking-tight">Current Assignments</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button onClick={() => { setEditAssignmentId(null); setNewAssignmentFilename(''); setNewAssignmentDescription(''); setIsAddAssignmentModalOpen(true) }} className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-all shadow-sm hover:shadow-md">
                        <span>+</span> Add Assignment
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <div className="space-y-1">
                    <div className="grid gap-1 items-center bg-zinc-100/80 px-3 py-2.5 border-b border-zinc-200/60 rounded-t-lg" style={{ gridTemplateColumns: effectiveHeaderTemplate }}>
                      <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Filename</div>
                      <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Status</div>
                      {isAdmin && <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Actions</div>}
                    </div>
                    {showAllSubmittedMessage ? (
                      <div className="text-center py-4 flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700">All Assignments Submitted</p>
                      </div>
                    ) : assignments.length === 0 ? (
                      <p className="text-center text-sm text-zinc-500 font-medium py-4">No assignments for this worker.</p>
                    ) : (
                      <div className="space-y-1">
                        {assignments.map((a: any) => (
                          <div key={a.id} className="grid gap-1 items-center py-2 px-3 rounded-lg border border-zinc-200/60 bg-white hover:bg-zinc-50/80 transition-all" style={{ gridTemplateColumns: effectiveRowTemplate }}>
                            <div>
                              <button type="button" onClick={() => { setSelectedAssignment(a); if (profile?.id) localStorage.setItem(`last_viewed_description_${profile.id}_${a.id}`, new Date().toISOString()); setAssignmentsWithUpdatedDescription(prev => { const newSet = new Set(prev); newSet.delete(a.id); return newSet }) }} className="text-sm font-bold text-slate-900 underline-offset-4 hover:underline flex items-center gap-2">
                                {getDisplayFileName(a.filename)}
                                {assignmentsWithUpdatedDescription.has(a.id) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse shadow-sm">REVISED</span>
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              {a.status === 'done' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><span aria-hidden="true">✓</span><span>Done</span></span>
                              ) : a.status === 'cancelled' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800"><span aria-hidden="true">✕</span><span>Cancelled</span></span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"><span aria-hidden="true">⏳</span><span>Pending</span></span>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                {a.status !== 'cancelled' && (
                                  <button onClick={() => cancelAssignment(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-all border border-orange-200">
                                    <X className="h-3.5 w-3.5" /> Cancel
                                  </button>
                                )}
                                <button onClick={() => {
                                  setEditAssignmentId(a.id)
                                  setNewAssignmentFilename(a.filename)
                                  setNewAssignmentDescription(a.description || '')
                                  setIsAddAssignmentModalOpen(true)
                                }} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-all border border-blue-200">
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button onClick={() => deleteAssignment(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-all border border-red-200">
                                  <X className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Worker Hub ── */}
            <div className="mt-6">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 p-6 shadow-2xl">
                {/* Decorative glow blobs */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative">
                  {/* Hub Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                      <CreditCard className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Worker Hub</h3>
                      <p className="text-xs text-zinc-400">Quick access to payment &amp; payslip actions</p>
                    </div>
                  </div>

                  {/* Hub Action Cards */}
                  {(user?.id === activeWorker?.id || isAdmin) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mb-5">

                      {/* Request Payslip */}
                      <button
                        type="button"
                        onClick={() => setIsPayslipModalOpen(true)}
                        className="group relative flex flex-col items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/20"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileText className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Request Payslip</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">Submit a payslip request for a cutoff period</p>
                        </div>
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Payment History */}
                      <button
                        type="button"
                        onClick={() => { setPaymentHistory([]); setIsPaymentHistoryModalOpen(true); if (activeWorker?.id) fetchPaymentHistory(activeWorker.id) }}
                        className="group relative flex flex-col items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm hover:bg-white/10 hover:border-violet-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-violet-600/20"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-200">
                          <CreditCard className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Payment History</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">View all past payments &amp; transactions</p>
                        </div>
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                    </div>
                  )}

                  {/* Payslip Request History */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Payslip Request History</p>
                    {payslipRequests.length === 0 ? (
                      <p className="text-center text-sm text-zinc-500 font-medium py-4">No payslip requests yet for this worker.</p>
                    ) : (
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {payslipRequests.map((r: any) => (
                          <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-all">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-xs font-bold text-white">{r.cutoff_start} → {r.cutoff_end}</div>
                                <div className="text-xs text-zinc-400">Requested {new Date(r.requested_at).toLocaleDateString()}</div>
                              </div>
                              <div className="text-xs uppercase tracking-tight font-semibold text-zinc-300">{r.status}</div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              {r.payslip_url ? (
                                <a href={r.payslip_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1 text-xs font-semibold text-white hover:from-cyan-700 hover:to-sky-700 transition-all shadow-sm hover:shadow-md">
                                  Download payslip
                                </a>
                              ) : r.status === 'approved' ? (
                                <span className="rounded-xl bg-blue-900/60 border border-blue-500/30 px-2 py-1 text-xs font-semibold text-blue-300">Approved - waiting for upload</span>
                              ) : (
                                <span className="rounded-xl bg-amber-900/60 border border-amber-500/30 px-2 py-1 text-xs font-semibold text-amber-300">Waiting for approval</span>
                              )}
                              {r.status === 'paid' && (
                                <span className="rounded-xl bg-emerald-900/60 border border-emerald-500/30 px-2 py-1 text-xs font-semibold text-emerald-300">Paid</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedAssignment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Assignment details</h3>
                      <p className="text-sm text-zinc-500">More information for the selected filename</p>
                    </div>
                    <button type="button" onClick={() => setSelectedAssignment(null)} className="text-zinc-400 hover:text-zinc-900">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Filename</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">{selectedAssignment.filename}</div>
                    </div>
                    <div>
                              
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Status</div>
                      <div className="mt-1">
                        {selectedAssignment.status === 'done' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">✓ Done</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                    {selectedAssignment.description && (
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 uppercase">Description</div>
                        <div className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap break-words">{selectedAssignment.description}</div>
                      </div>
                    )}
                    {selectedAssignment.attachment_url && (
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 uppercase">Attachment</div>
                        <a
                          href={selectedAssignment.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-100 transition max-w-full"
                          title={decodeURIComponent(selectedAssignment.attachment_url.split('/').pop()?.replace(/^attachment-\d+-/, '') ?? 'attachment')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                          <span className="truncate">{decodeURIComponent(selectedAssignment.attachment_url.split('/').pop()?.replace(/^attachment-\d+-/, '') ?? 'attachment')}</span>
                        </a>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Created</div>
                      <div className="mt-1 text-sm text-zinc-700">{formatDate(selectedAssignment.created_at)}</div>
                    </div>
                  </div>
                  <div className="border-t border-zinc-200 p-5 flex gap-3 justify-end">
                    <button type="button" onClick={() => { setIsReportIssueModalOpen(true); setReportIssueAssignment(selectedAssignment) }} className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition">
                      Report Issue
                    </button>
                    <button type="button" onClick={() => setSelectedAssignment(null)} className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-700 hover:to-sky-700 transition">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isAddAssignmentModalOpen && activeWorker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                  <button onClick={() => { setIsAddAssignmentModalOpen(false); setNewAssignmentFilename(""); setNewAssignmentDescription(""); setNewAssignmentAttachment(null) }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Assignment</h3>
                  <form onSubmit={(e) => { e.preventDefault(); saveAssignment(activeWorker.id) }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Filename</label>
                      <input type="text" value={newAssignmentFilename} onChange={(e) => setNewAssignmentFilename(e.target.value)} placeholder="e.g., 771241201" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                      <textarea value={newAssignmentDescription} onChange={(e) => setNewAssignmentDescription(e.target.value)} placeholder="Add any details about this assignment..." className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none" rows={3} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Attachment <span className="text-zinc-400 font-normal">(optional)</span></label>
                      <p className="text-xs text-zinc-500 mb-2">Upload assignment instructions or a sample transcript for the worker.</p>
                      <label
                        htmlFor="assignment-attachment"
                        className="flex items-center gap-3 w-full cursor-pointer rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600 hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        <span className="truncate flex-1">
                          {newAssignmentAttachment ? newAssignmentAttachment.name : 'Click to attach a file…'}
                        </span>
                        {newAssignmentAttachment && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setNewAssignmentAttachment(null) }}
                            className="ml-auto shrink-0 text-zinc-400 hover:text-red-500 transition"
                            title="Remove attachment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </label>
                      <input
                        id="assignment-attachment"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={(e) => setNewAssignmentAttachment(e.target.files?.[0] ?? null)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setIsAddAssignmentModalOpen(false); setNewAssignmentFilename(""); setNewAssignmentDescription(""); setNewAssignmentAttachment(null) }} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                      <button type="submit" disabled={isAddingAssignment || isUploadingAttachment} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">
                        {isUploadingAttachment ? 'Uploading...' : isAddingAssignment ? 'Adding...' : 'Add Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}


      </main>

      <footer className="border-t border-zinc-200 bg-white py-4">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">© {new Date().getFullYear()} All right reserved</div>
      </footer>

      {isAddWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setIsAddWorkerModalOpen(false); setNewWorkerForm({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: 'United States' }); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Worker</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input type="text" value={newWorkerForm.fullName} onChange={(e) => setNewWorkerForm({...newWorkerForm, fullName: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Job Title</label>
                  <input type="text" value={newWorkerForm.jobTitle} onChange={(e) => setNewWorkerForm({...newWorkerForm, jobTitle: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., Transcriber" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                  <input type="text" value={newWorkerForm.department} onChange={(e) => setNewWorkerForm({...newWorkerForm, department: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., General" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                <input type="email" value={newWorkerForm.email} onChange={(e) => setNewWorkerForm({...newWorkerForm, email: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Temporary Password</label>
                <input type="password" value={newWorkerForm.password} onChange={(e) => setNewWorkerForm({...newWorkerForm, password: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="Min. 6 characters" minLength={6} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                <select value={newWorkerForm.role} onChange={(e) => setNewWorkerForm({...newWorkerForm, role: e.target.value})} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="human_resource">Human Resource</option>
                  <option value="project_manager_human_resource">Project Manager/Human Resource</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                <select value={newWorkerForm.location} onChange={(e) => setNewWorkerForm({...newWorkerForm, location: e.target.value})} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="Australia">Australia {COUNTRY_FLAGS['Australia']}</option>
                  <option value="Canada">Canada {COUNTRY_FLAGS['Canada']}</option>
                  <option value="India">India {COUNTRY_FLAGS['India']}</option>
                  <option value="Philippines">Philippines {COUNTRY_FLAGS['Philippines']}</option>
                  <option value="United Kingdom">United Kingdom {COUNTRY_FLAGS['United Kingdom']}</option>
                  <option value="United States">United States {COUNTRY_FLAGS['United States']}</option>
                </select>
                <div className="mt-2 text-sm text-zinc-600 inline-flex items-center gap-2">
                  Selected: {newWorkerForm.location}
                  <FlagIcon country={newWorkerForm.location} size={18} />
                </div>
              </div>
              <p className="text-xs text-zinc-500">A confirmation email will be sent to this address to activate the account.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsAddWorkerModalOpen(false); setNewWorkerForm({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: 'United States' }); }} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                <button type="submit" disabled={isAddingWorker} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">{isAddingWorker ? "Adding..." : "Add Worker"}</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {isBankModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setIsBankModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Bank Details</h3>
            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bank Name</label>
                <select value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="">Select your bank</option>
                  <option value="BDO Unibank">BDO Unibank</option>
                  <option value="BPI">BPI</option>
                  <option value="Metrobank">Metrobank</option>
                  <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
                  <option value="PNB">PNB</option>
                  <option value="Security Bank">Security Bank</option>
                  <option value="UnionBank">UnionBank</option>
                  <option value="China Bank">China Bank</option>
                  <option value="RCBC">RCBC</option>
                  <option value="EastWest Bank">EastWest Bank</option>
                  <option value="Maybank Philippines">Maybank Philippines</option>
                  <option value="Philippine Veterans Bank">Philippine Veterans Bank</option>
                  <option value="Cebuana Lhuillier Bank">Cebuana Lhuillier Bank</option>
                  <option value="DBP">DBP</option>
                  <option value="PNB Savings">PNB Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Account Number</label>
                <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Account Type</label>
                  <select value={bankForm.accountType} onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                    <option value="">Select account type</option>
                    <option value="Savings">Savings</option>
                    <option value="Checking">Checking</option>
                    <option value="Current">Current</option>
                    <option value="Peso Savings">Peso Savings</option>
                    <option value="Foreign Currency">Foreign Currency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Routing Number</label>
                  <input type="text" value={bankForm.routingNumber} onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={bankForm.employeeId}
                  onChange={(e) => setBankForm({ ...bankForm, employeeId: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  disabled={!isAdmin}
                  readOnly={!isAdmin}
                  placeholder={isAdmin ? "TR-XXXX" : "Contact admin to change"}
                />
                {!isAdmin && <p className="text-xs text-zinc-500 mt-1">Contact admin to change employee ID</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                <button type="submit" disabled={isUpdatingBank} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">
                  {isUpdatingBank ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setIsPaymentModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Edit Payment Rate</h3>
            <p className="text-sm text-zinc-600 mb-4">{selectedPaymentRate ? `${formatCurrency(selectedPaymentRate, activeWorker?.location)} per 60KB` : 'Select a rate'}</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[700, 800, 900, 1000, 1100, 1200].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSelectedPaymentRate(rate)}
                  className={`rounded-lg py-2 px-3 text-sm font-semibold transition ${
                    selectedPaymentRate === rate
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white'
                      : 'border border-zinc-300 text-zinc-700 hover:border-cyan-500'
                  }`}
                >
                  {formatCurrency(rate, activeWorker?.location)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
              <button type="button" onClick={handleSavePaymentRate} disabled={isUpdatingPayment} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-zinc-900 disabled:opacity-50">
                {isUpdatingPayment ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 rounded-3xl shadow-2xl shadow-cyan-500/30 w-full max-w-md p-6 relative border-2 border-cyan-200/80">
            <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="absolute right-4 top-4 text-cyan-400 hover:text-cyan-700 transition-colors"><X className="h-5 w-5" /></button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-sky-400 text-white shadow-xl shadow-cyan-500/30 mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-1">Upload New File</h3>
            <p className="text-xs text-zinc-600 mb-4">Select a .txt file to upload to your production records.</p>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Select .txt File</label>
                <div className="relative">
                  <input type="file" accept=".txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-sky-500 file:text-white hover:file:from-cyan-600 hover:file:to-sky-600 file:shadow-lg file:shadow-cyan-500/30 transition-all cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="flex-1 rounded-xl border-2 border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-cyan-300 transition-all shadow-sm hover:shadow-md">Cancel</button>
                <button type="submit" disabled={isUploading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-700 to-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-cyan-600/30 hover:from-cyan-800 hover:to-sky-800 hover:shadow-xl hover:shadow-cyan-600/40 disabled:opacity-50 transition-all">
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManualAddModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setIsManualAddModalOpen(false); setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' }) }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add File Manually</h3>
            <form onSubmit={handleAddManualRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">File Name</label>
                <input type="text" value={manualFileForm.fileName} onChange={(e) => setManualFileForm({ ...manualFileForm, fileName: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date Completed</label>
                  <input type="date" value={manualFileForm.dateCompleted} onChange={(e) => setManualFileForm({ ...manualFileForm, dateCompleted: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Size (KB)</label>
                  <input type="text" value={manualFileForm.byteSize} onChange={(e) => setManualFileForm({ ...manualFileForm, byteSize: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. 14.5 KB" required />
                </div>
              </div>
              <p className="text-xs text-zinc-500">Enter details for a new production record without uploading a file.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsManualAddModalOpen(false); setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' }) }} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                <button type="submit" disabled={isAddingManualRecord} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">
                  {isAddingManualRecord ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayslipModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 rounded-3xl shadow-2xl shadow-blue-500/30 w-full max-w-md p-6 relative border-2 border-blue-200/80">
            <button onClick={() => { setIsPayslipModalOpen(false); const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`; setPayslipSelectedMonth(currentMonth); setPayslipSelectedCutoff('first') }} className="absolute right-4 top-4 text-blue-400 hover:text-blue-700 transition-colors"><X className="h-5 w-5" /></button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/30 mb-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-1">Request Payslip</h3>
            <p className="text-xs text-zinc-600 mb-4">Select the month and payroll cutoff period.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Select Month</label>
                <input type="month" value={payslipSelectedMonth} onChange={(e) => setPayslipSelectedMonth(e.target.value)} className="w-full rounded-xl border-2 border-blue-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Select Payroll Cutoff</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all" htmlFor="cutoff-first">
                    <input type="radio" id="cutoff-first" name="payslip-cutoff" value="first" checked={payslipSelectedCutoff === 'first'} onChange={(e) => setPayslipSelectedCutoff(e.target.value)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-3 flex flex-col">
                      <span className="text-xs font-semibold text-zinc-900">First Cutoff</span>
                      <span className="text-xs text-zinc-500">1st - 14th of the month</span>
                    </span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all" htmlFor="cutoff-second">
                    <input type="radio" id="cutoff-second" name="payslip-cutoff" value="second" checked={payslipSelectedCutoff === 'second'} onChange={(e) => setPayslipSelectedCutoff(e.target.value)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-3 flex flex-col">
                      <span className="text-xs font-semibold text-zinc-900">Second Cutoff</span>
                      <span className="text-xs text-zinc-500">15th - end of month</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => { setIsPayslipModalOpen(false); const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`; setPayslipSelectedMonth(currentMonth); setPayslipSelectedCutoff('first') }} className="flex-1 rounded-xl border-2 border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">Cancel</button>
                <button type="button" disabled={isRequestingPayslip} onClick={requestPayslip} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-blue-600/30 hover:from-blue-800 hover:to-sky-800 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50 transition-all">{isRequestingPayslip ? 'Requesting...' : 'Request Payslip'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPaymentHistoryModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 rounded-3xl shadow-2xl shadow-indigo-500/20 w-full ${isAdmin ? 'max-w-2xl' : 'max-w-md'} p-6 relative border-2 border-indigo-200/80 max-h-[90vh] flex flex-col`}>
            <button onClick={() => setIsPaymentHistoryModalOpen(false)} className="absolute right-4 top-4 text-indigo-400 hover:text-indigo-700 transition-colors"><X className="h-5 w-5" /></button>
            
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/30 mb-4 flex-shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 mb-1 flex-shrink-0">Worker Hub</h3>
            <p className="text-xs text-zinc-600 mb-4 flex-shrink-0">
              {isAdmin ? "Add and view payments for this worker." : "View all your past payments received."}
            </p>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
              {isAdmin && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 shadow-sm">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Add Payment (Admin Only)</h4>
                  <form onSubmit={addPaymentRecord} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Sender's Bank</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GCash, BDO, PayPal" 
                        value={paymentHistoryForm.senderBank} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, senderBank: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Reference Number</label>
                      <input 
                        type="text" 
                        placeholder="Transaction ID / Receipt #" 
                        value={paymentHistoryForm.referenceNumber} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, referenceNumber: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Recipient Bank</label>
                      <input 
                        type="text" 
                        placeholder="e.g. BPI, Metrobank, GCash" 
                        value={paymentHistoryForm.recipientBank} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, recipientBank: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Amount</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g. 150.00" 
                        value={paymentHistoryForm.amount} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, amount: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Date Sent</label>
                      <input 
                        type="date" 
                        value={paymentHistoryForm.dateSent} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, dateSent: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Notes / Remarks</label>
                      <input 
                        type="text" 
                        placeholder="e.g. June First Cutoff Payment" 
                        value={paymentHistoryForm.notes} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, notes: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-all bg-white" 
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end mt-2">
                      <button 
                        type="submit" 
                        disabled={isAddingPaymentRecord} 
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all"
                      >
                        {isAddingPaymentRecord ? 'Adding...' : 'Save Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Past Payments</span>
                  <span className="text-[10px] lowercase font-normal text-zinc-500">({paymentHistory.length} records)</span>
                </h4>
                {isLoadingPaymentHistory ? (
                  <p className="text-center text-xs text-zinc-500 font-medium py-6">Loading payments...</p>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 font-medium py-6 bg-white/40 border border-dashed border-zinc-200 rounded-2xl">No payments found.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.map((r: any) => (
                      <div key={r.id} className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex items-start justify-between gap-3">
                        {/* Left: details */}
                        <div className="space-y-1 flex-1 min-w-0">
                          {/* Line 1: date sent */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="font-semibold text-zinc-800">Sent: {formatDate(r.payment_date)}</span>
                          </div>
                          {/* Line 2: sender bank → recipient bank */}
                          {(r.bank_type || r.reference_number) && (
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-zinc-500">
                              {r.bank_type && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider">{r.bank_type}</span>
                              )}
                              {r.bank_type && r.reference_number && <span className="text-zinc-300">→</span>}
                              {r.reference_number && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider">{r.reference_number}</span>
                              )}
                            </div>
                          )}
                          {/* Line 3: notes / ref */}
                          {r.notes && <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-600">{r.notes}</span>}

                        </div>
                        {/* Right: amount + delete */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-zinc-900">
                            {formatCurrency(r.amount, activeWorker.location)}
                          </span>
                          {isAdmin && (
                            <button 
                              type="button" 
                              onClick={() => deletePaymentRecord(r.id)} 
                              className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-zinc-200/60 pt-4 mt-4 flex justify-end flex-shrink-0">
              <button 
                type="button" 
                onClick={() => setIsPaymentHistoryModalOpen(false)} 
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isPayslipAdminModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setIsPayslipAdminModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Manage Payslip Requests</h3>
            <div className="space-y-4">
              {adminPayslipRequests.length === 0 ? (
                <p className="text-sm text-zinc-500">No payslip requests found.</p>
              ) : (
                <div className="space-y-3">
                  {adminPayslipRequests.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-md border border-zinc-200 bg-white">
                      <div>
                        <div className="text-sm font-semibold">
                          {r.worker_name ? (
                            r.worker_name
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-zinc-600">{String(r.worker_id).slice(0, 8)}…</span>
                              <button disabled={loadingWorkerId === String(r.id)} onClick={() => loadWorkerInfo(r.worker_id, r.id)} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 transition">
                                {loadingWorkerId === String(r.id) ? 'Loading…' : 'Show name'}
                              </button>
                            </div>
                          )}
                        </div>
                        {r.worker_email && <div className="text-xs text-zinc-500">{r.worker_email}</div>}
                        <div className="text-xs text-zinc-500">{r.cutoff_start} → {r.cutoff_end}</div>
                        <div className="text-xs text-zinc-400 mt-1">Status: {r.status}</div>
                        {r.payslip_url && (
                          <div className="mt-1 text-xs">
                            <a href={r.payslip_url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline">
                              Download payslip
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status !== 'approved' && (
                          <button disabled={isProcessingRequest} onClick={() => updatePayslipRequestStatus(r.id, 'approved')} className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition">Approve</button>
                        )}
                        {r.status === 'approved' && !r.payslip_url && (
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-1 text-xs font-semibold text-white hover:from-cyan-600 hover:to-sky-600 transition">
                            Upload payslip
                            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) uploadPayslipFile(r.id, file)
                              e.target.value = ''
                            }} />
                          </label>
                        )}
                        {r.payslip_url && (
                          <a href={r.payslip_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1 text-xs font-semibold text-white hover:from-cyan-700 hover:to-sky-700 transition">Download payslip</a>
                        )}
                        {r.status !== 'paid' && (
                          <button disabled={isProcessingRequest} onClick={() => updatePayslipRequestStatus(r.id, 'paid')} className="inline-flex items-center gap-2 rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 transition">Mark Paid</button>
                        )}
                        <button disabled={isProcessingRequest} onClick={() => deletePayslipRequest(r.id)} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 transition" title="Delete payslip request">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { 
              setIsAnnouncementModalOpen(false)
              setAnnouncementMessage('')
              setIsEditingAnnouncement(false)
              setEditingAnnouncementId(null)
              setShowAnnouncementPreview(false)
              setAnnouncementErrorMessage(null)
            }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">{isEditingAnnouncement ? 'Edit Announcement' : 'Publish Announcement'}</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Message</label>
                  <textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-zinc-300 px-3 py-3 text-sm text-zinc-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Write an announcement for all workers..."
                  />
                </div>
                <div className="text-xs text-zinc-500">
                  {announcementMessage.length} characters
                </div>
                {announcementErrorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    {announcementErrorMessage}
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => setShowAnnouncementPreview(!showAnnouncementPreview)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  {showAnnouncementPreview ? '← Back to editing' : 'Preview →'}
                </button>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Preview</label>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 min-h-[200px] space-y-3">
                    {announcementMessage.trim() ? (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">Announcement</div>
                        <div className="rounded-lg bg-white p-3 border border-amber-100">
                          <p className="text-sm text-zinc-900 leading-relaxed">{announcementMessage}</p>
                        </div>
                        <div className="text-xs text-amber-600">
                          {new Date().toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-amber-700 text-center py-8">
                        Start typing to see preview here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { 
                setIsAnnouncementModalOpen(false)
                setAnnouncementMessage('')
                setIsEditingAnnouncement(false)
                setEditingAnnouncementId(null)
                setShowAnnouncementPreview(false)
              }} className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
              <button type="button" onClick={isEditingAnnouncement ? updateAnnouncement : publishAnnouncement} disabled={isPublishingAnnouncement} className="inline-flex items-center justify-center rounded-md bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50">
                {isPublishingAnnouncement ? (isEditingAnnouncement ? 'Updating...' : 'Publishing...') : (isEditingAnnouncement ? 'Update' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditWorkerModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsEditWorkerModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Worker Details</h3>
            <form onSubmit={handleSaveWorkerDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input type="text" value={editWorkerForm.fullName} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, fullName: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Job Title</label>
                  <input type="text" value={editWorkerForm.jobTitle} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, jobTitle: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., Transcriber" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                  <input type="text" value={editWorkerForm.department} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, department: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., General" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input type="email" value={editWorkerForm.email} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, email: e.target.value })} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="admin@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                <select value={editWorkerForm.location} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, location: e.target.value })} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="Australia">Australia {COUNTRY_FLAGS['Australia']}</option>
                  <option value="Canada">Canada {COUNTRY_FLAGS['Canada']}</option>
                  <option value="India">India {COUNTRY_FLAGS['India']}</option>
                  <option value="Philippines">Philippines {COUNTRY_FLAGS['Philippines']}</option>
                  <option value="United Kingdom">United Kingdom {COUNTRY_FLAGS['United Kingdom']}</option>
                  <option value="United States">United States {COUNTRY_FLAGS['United States']}</option>
                </select>
                <div className="mt-2 text-sm text-zinc-600 inline-flex items-center gap-2">
                  Selected: {editWorkerForm.location}
                  <FlagIcon country={editWorkerForm.location} size={18} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditWorkerModalOpen(false)} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                <button type="submit" disabled={isUpdatingWorkerDetails} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">
                  {isUpdatingWorkerDetails ? 'Saving...' : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">File Name</label>
                <input type="text" value={editForm.file_name} onChange={(e) => setEditForm({...editForm, file_name: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date Completed</label>
                <input type="date" value={editForm.date_completed} onChange={(e) => setEditForm({...editForm, date_completed: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Byte Size (KB)</label>
                <input type="text" value={editForm.byte_size} onChange={(e) => setEditForm({...editForm, byte_size: e.target.value})} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-200 rounded-md hover:bg-zinc-300">Cancel</button>
              <button onClick={saveEdit} disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-zinc-900 disabled:opacity-50">
                {isSaving ? "Saving..." : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRoleEditModalOpen && editingRoleWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsRoleEditModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Worker Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Worker</label>
                <div className="text-sm text-zinc-600">{editingRoleWorker.full_name || editingRoleWorker.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Current Role</label>
                <div className="text-sm text-zinc-600">{editingRoleWorker.role || 'Worker'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none"
                  required
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="human_resource">Human Resource</option>
                  <option value="project_manager_human_resource">Project Manager/Human Resource</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsRoleEditModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-200 rounded-md hover:bg-zinc-300">Cancel</button>
                <button onClick={handleUpdateRole} disabled={isUpdatingRole} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-zinc-900 disabled:opacity-50">
                  {isUpdatingRole ? "Updating..." : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Update Role</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReportIssueModalOpen && reportIssueAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setIsReportIssueModalOpen(false); setIssueDescription(''); setReportIssueAssignment(null) }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Report Assignment Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Assignment</label>
                <div className="text-sm text-zinc-600">{reportIssueAssignment.filename}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Issue Description</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue with this assignment..."
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setIsReportIssueModalOpen(false); setIssueDescription(''); setReportIssueAssignment(null) }} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
                <button onClick={handleSubmitIssue} disabled={isSubmittingIssue || !issueDescription.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-800 disabled:opacity-50 transition">
                  {isSubmittingIssue ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
