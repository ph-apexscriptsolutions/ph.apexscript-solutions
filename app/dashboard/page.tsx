"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState, FormEvent, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase/client"
import { FileText, HardDrive, LogOut, Calendar, X, Pencil, Save, User, ArrowLeft, Upload, UserPlus, CreditCard, Trash2, Check, Bell, AlertCircle, Tv, Mic, Headphones, FileEdit, Newspaper, Radio, Video, BookOpen, Gavel, TrendingUp, Activity, Search, Loader2, Copy, ChevronDown, ChevronUp, Building2, Eye, MessageSquare } from "lucide-react"
import AdminChat from '@/components/admin-chat'
import WorkerRealtimeChat from '@/components/worker-realtime-chat'
import { FlagIcon } from "@/components/flag-icon"
import TranscriptCleanup from '@/components/TranscriptCleanup'
import { validateTranscript, replaceInTranscript, getHighlightClass, validationHighlightStyles, ValidationIssue, ValidationRule, Participant, extractParticipants, getValidUncommonWords, detectFillerWords, extractSenateSpeakers, detectTranscriptFormat } from '@/utils/transcript-validation'

const getDepartmentIcon = (department: string) => {
  const dept = department.toLowerCase()
  if (dept.includes('broadcast') || dept.includes('tv')) return { icon: Tv, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('podcast') || dept.includes('audio') || dept.includes('radio')) return { icon: Radio, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('video') || dept.includes('youtube')) return { icon: Video, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('academics') || dept.includes('academic') || dept.includes('education') || dept.includes('university')) return { icon: BookOpen, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('senate') || dept.includes('political') || dept.includes('politics') || dept.includes('government') || dept.includes('legal')) return { icon: Gavel, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('conference') || dept.includes('earning') || dept.includes('call') || dept.includes('investment') || dept.includes('business')) return { icon: TrendingUp, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('medical') || dept.includes('health') || dept.includes('healthcare') || dept.includes('hospital') || dept.includes('clinic')) return { icon: Activity, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('transcription') || dept.includes('transcriber')) return { icon: FileText, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('editing') || dept.includes('editor')) return { icon: FileEdit, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('news') || dept.includes('journalism')) return { icon: Newspaper, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('voice') || dept.includes('recording')) return { icon: Mic, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  if (dept.includes('review') || dept.includes('quality')) return { icon: Headphones, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
  return { icon: FileText, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' }
}

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
  const [searchQuery, setSearchQuery] = useState("")
  const [records, setRecords] = useState<any[]>([])
  const justAddedRecordRef = useRef(false)
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
  const [showPayslipConfirm, setShowPayslipConfirm] = useState(false)
  const [payslipSelectedMonth, setPayslipSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [payslipSelectedCutoff, setPayslipSelectedCutoff] = useState("first")
  const [isRequestingPayslip, setIsRequestingPayslip] = useState(false)
  const [payslipRequests, setPayslipRequests] = useState<any[]>([])
  const [payslipActiveTab, setPayslipActiveTab] = useState<'request' | 'history'>('request')
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false)
  const [isAddingPaymentRecord, setIsAddingPaymentRecord] = useState(false)
  const [isCurrentAssignmentsModalOpen, setIsCurrentAssignmentsModalOpen] = useState(false)
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

  // Transcript Validation Engine state
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [extractedParticipants, setExtractedParticipants] = useState<Participant[]>([])
  const [extractedCompanies, setExtractedCompanies] = useState<string[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState("conference")
  const [isRunningValidation, setIsRunningValidation] = useState(false)
  const [customDictionary, setCustomDictionary] = useState<string[]>([])
  const [issueSearchQuery, setIssueSearchQuery] = useState("")
  const [showValidationPanel, setShowValidationPanel] = useState(false)
  const [isTranscriptCleanupModalOpen, setIsTranscriptCleanupModalOpen] = useState(false)
  const [transcriptContent, setTranscriptContent] = useState("")
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null)
  const [debouncedTranscript, setDebouncedTranscript] = useState("")
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(true)
  const [editedTranscript, setEditedTranscript] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [validUncommonWords, setValidUncommonWords] = useState<{ word: string, line: number, column: number }[]>([])
  const [formatMismatchError, setFormatMismatchError] = useState<string | null>(null)
  const [validationProgress, setValidationProgress] = useState<{ stage: string, message: string } | null>(null)
  const [validationTime, setValidationTime] = useState<number | null>(null)
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false)
  const [reportIssueDescription, setReportIssueDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState(false)
  const [editWorkerForm, setEditWorkerForm] = useState({ fullName: "", jobTitle: "", department: "", email: "", location: "United States", departmentPermissions: ["conference", "senate", "academics", "broadcast", "podcast", "medical"] })
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
  const [isAssignmentReportIssueModalOpen, setIsAssignmentReportIssueModalOpen] = useState(false)
  const [reportIssueAssignment, setReportIssueAssignment] = useState<any | null>(null)
  const [issueDescription, setIssueDescription] = useState("")
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  const [assignmentsWithUpdatedDescription, setAssignmentsWithUpdatedDescription] = useState<Set<number>>(new Set())
  const [isAssignmentCommentModalOpen, setIsAssignmentCommentModalOpen] = useState(false)
  const [assignmentComment, setAssignmentComment] = useState("")
  const [assignmentFilename, setAssignmentFilename] = useState("")
  const [selectedWorkerForComment, setSelectedWorkerForComment] = useState<any | null>(null)
  const [isSendingComment, setIsSendingComment] = useState(false)

  // Weekly Availability
  const defaultAvailability = {
    monday: { sameday: false, overnight: false },
    tuesday: { sameday: false, overnight: false },
    wednesday: { sameday: false, overnight: false },
    thursday: { sameday: false, overnight: false },
    friday: { sameday: false, overnight: false }
  }
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState<Record<string, { sameday: boolean; overnight: boolean }>>(defaultAvailability)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [availabilitySubmittedAt, setAvailabilitySubmittedAt] = useState<string | null>(null)
  const [isResettingAvailability, setIsResettingAvailability] = useState(false)

  // Style Guides
  const [isStyleGuidesModalOpen, setIsStyleGuidesModalOpen] = useState(false)
  const [isStyleGuidesAdminModalOpen, setIsStyleGuidesAdminModalOpen] = useState(false)
  const [styleGuides, setStyleGuides] = useState<any[]>([])
  const [isLoadingStyleGuides, setIsLoadingStyleGuides] = useState(false)

  // Formatting Rules
  const [isFormattingRulesAdminModalOpen, setIsFormattingRulesAdminModalOpen] = useState(false)
  const [formattingRules, setFormattingRules] = useState<any[]>([])
  const [isLoadingFormattingRules, setIsLoadingFormattingRules] = useState(false)
  const [isValidatorReportsModalOpen, setIsValidatorReportsModalOpen] = useState(false)
  const [validatorReports, setValidatorReports] = useState<any[]>([])
  const [isLoadingValidatorReports, setIsLoadingValidatorReports] = useState(false)
  const [newFormattingRule, setNewFormattingRule] = useState({ name: "", description: "", pattern: "", replacement: "", department: "all" })
  const [sampleTextForDetection, setSampleTextForDetection] = useState("")
  const [detectedFormats, setDetectedFormats] = useState<any[]>([])
  const [isUploadingStyleGuide, setIsUploadingStyleGuide] = useState<string | null>(null)
  const [isDeletingStyleGuide, setIsDeletingStyleGuide] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<{ department: string; value: string } | null>(null)
  const [isSavingNote, setIsSavingNote] = useState<string | null>(null)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [isAddingDepartment, setIsAddingDepartment] = useState(false)
  const [renamingDepartmentId, setRenamingDepartmentId] = useState<number | null>(null)
  const [renamingValue, setRenamingValue] = useState('')
  const [isRenamingDept, setIsRenamingDept] = useState<number | null>(null)
  const [isDeletingDeptId, setIsDeletingDeptId] = useState<number | null>(null)

  // Load validation rules (from both transcript_validation_rules and formatting_rules)
  useEffect(() => {
    const loadValidationRules = async () => {
      try {
        // Load transcript validation rules
        const { data: transcriptRules, error: transcriptError } = await supabase
          .from('transcript_validation_rules')
          .select('*')
          .eq('enabled', true)
        
        // Load formatting rules from Admin Hub
        const { data: formattingRulesData, error: formattingError } = await supabase
          .from('formatting_rules')
          .select('*')
        
        let combinedRules: ValidationRule[] = []
        
        // Add transcript validation rules
        if (!transcriptError && transcriptRules) {
          combinedRules = [...combinedRules, ...transcriptRules.map((r: any) => ({
            id: r.id,
            rule_name: r.rule_name,
            department: r.department,
            category: r.category,
            find: r.find,
            replace: r.replace,
            enabled: r.enabled,
            is_regex: r.is_regex || false,
            case_sensitive: r.case_sensitive || false
          }))]
        } else if (transcriptError && !transcriptError.message.includes('does not exist')) {
          console.log('Error loading transcript validation rules:', transcriptError.message)
        }
        
        // Add formatting rules from Admin Hub
        if (!formattingError && formattingRulesData) {
          combinedRules = [...combinedRules, ...formattingRulesData.map((r: any) => ({
            id: r.id,
            rule_name: r.name,
            department: r.department,
            category: 'formatting',
            find: r.pattern,
            replace: r.replacement || '',
            enabled: true,
            is_regex: false
          }))]
        } else if (formattingError) {
          console.log('Error loading formatting rules:', formattingError.message)
        }
        
        setValidationRules(combinedRules)
      } catch (error) {
        console.log('Error loading validation rules:', error)
        setValidationRules([])
      }
    }
    
    loadValidationRules()
  }, [])

  // Load custom dictionary
  useEffect(() => {
    const loadCustomDictionary = async () => {
      try {
        console.log('[DEBUG] Loading Technical Dictionary from database...')
        console.log('[DEBUG] Selected department:', selectedDepartment)
        const { data, error } = await supabase
          .from('custom_dictionary')
          .select('term')
          .eq('enabled', true)
          .or(`department.eq.all,department.eq.${selectedDepartment}`)
        
        console.log('[DEBUG] Supabase query result - error:', error)
        console.log('[DEBUG] Supabase query result - data:', data)
        
        if (error) {
          // Table might not exist yet, that's okay
          console.log('[DEBUG] Custom dictionary table not yet created or error loading:', error.message)
          setCustomDictionary(!error.message.includes('does not exist') ? ((data as any)?.map((d: { term: string }) => d.term) || []) : [])
        } else {
          const terms = (data as any)?.map((d: { term: string }) => d.term) || []
          console.log('[DEBUG] Technical Dictionary Loaded:')
          console.log(`[DEBUG] Count: ${terms.length}`)
          console.log('[DEBUG] Entries:', terms)
          setCustomDictionary(terms)
        }
      } catch (error) {
        console.log('[DEBUG] Error loading custom dictionary:', error)
        setCustomDictionary([])
      }
    }
    
    loadCustomDictionary()
  }, [selectedDepartment])

  // Inject validation highlight styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = validationHighlightStyles
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Debounce transcript input to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTranscript(transcriptContent)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [transcriptContent])

  // Run validation when debounced transcript content changes
  useEffect(() => {
    if (debouncedTranscript) {
      runValidation()
    }
  }, [debouncedTranscript, validationRules, selectedDepartment])

  const runValidation = async () => {
    setIsRunningValidation(true)
    setValidationProgress(null)
    setValidationTime(null)
    try {
      // Extract participants and companies from transcript
      const { participants, companyNames } = extractParticipants(debouncedTranscript)
      setExtractedParticipants(participants)
      setExtractedCompanies(companyNames)

      // Get valid uncommon words for green underlining (unknown uncommon terms)
      const uncommonWords = await getValidUncommonWords(debouncedTranscript, participants, companyNames, customDictionary)
      setValidUncommonWords(uncommonWords)

      // Filter rules by selected department
      const filteredRules = selectedDepartment === 'all'
        ? validationRules
        : validationRules.filter(rule => rule.department === 'all' || rule.department === selectedDepartment)

      // Run validation with custom dictionary and progress callback
      const startTime = performance.now()

      const issues = await validateTranscript(debouncedTranscript, filteredRules, customDictionary, selectedDepartment, (progress) => {
        setValidationProgress({ stage: progress.stage, message: progress.message })
      })

      // Detect transcript format to determine if filler words should be checked
      const formatDetection = detectTranscriptFormat(debouncedTranscript)
      console.log('[DEBUG] Filler word check - Detected format:', formatDetection.format)

      // Use detected format, or fall back to selected department if format is unknown
      const effectiveFormat = formatDetection.format === 'unknown' ? selectedDepartment : formatDetection.format
      console.log('[DEBUG] Filler word check - Effective format (using department as fallback):', effectiveFormat)

      // Add filler word issues ("you know" and "like") - only for Conference/Earnings, not Senate
      const fillerWordIssues = detectFillerWords(debouncedTranscript, effectiveFormat)
      console.log('[DEBUG] Filler word issues found:', fillerWordIssues.length)
      const allIssues = [...issues, ...fillerWordIssues]

      const endTime = performance.now()
      setValidationTime(Math.round(endTime - startTime))

      // Check if format mismatch error was returned
      const formatMismatch = allIssues.find(issue => issue.id === 'format-mismatch-warning')
      if (formatMismatch) {
        setFormatMismatchError(formatMismatch.suggestedCorrection)
        setValidationIssues(allIssues)
        // Don't update highlighted transcript - block transcript display
      } else {
        setFormatMismatchError(null)
        setValidationIssues(allIssues)
        updateHighlightedTranscript(issues)
      }
    } catch (error) {
      console.error('Validation error:', error)
    }
    setIsRunningValidation(false)
    setValidationProgress(null)
  }

  // Memoize helper functions to prevent re-creation on every render
  const getCharacterPosition = useCallback((text: string, line: number, column: number): number => {
    const lines = text.split('\n')
    if (line < 1 || line > lines.length) return -1
    
    let charPos = 0
    for (let i = 0; i < line - 1; i++) {
      charPos += lines[i].length + 1 // +1 for newline
    }
    
    charPos += column - 1 // Convert to 0-based
    
    if (charPos < 0 || charPos >= text.length) return -1
    return charPos
  }, [])
  
  const escapeHtml = useCallback((text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }, [])
  
  // Memoize highlighted transcript to prevent unnecessary re-renders
  const highlightedTranscript = useMemo(() => {
    // Create a map of character positions to highlights
    const highlightMap = new Map<number, { className: string, text: string, issueId?: string }>()

    // Add validation issue highlights
    validationIssues.forEach(issue => {
      if (issue.ignored) return

      const charPos = getCharacterPosition(debouncedTranscript, issue.line, issue.column)
      if (charPos !== -1) {
        const className = getHighlightClass(issue.category)
        highlightMap.set(charPos, { className, text: issue.foundText, issueId: issue.id })
      }
    })
    
    // Sort highlights by position (ascending for character-by-character building)
    const sortedHighlights = Array.from(highlightMap.entries()).sort((a, b) => a[0] - b[0])
    
    // Build highlighted transcript character by character to avoid corruption
    let result = ''
    let i = 0
    let highlightIndex = 0
    
    while (i < debouncedTranscript.length) {
      // Check if we need to insert a highlight at this position
      if (highlightIndex < sortedHighlights.length && sortedHighlights[highlightIndex][0] === i) {
        const [pos, { className, text, issueId }] = sortedHighlights[highlightIndex]
        const escapedText = escapeHtml(text)
        const issueIdAttr = issueId ? ` data-issue-id="${issueId}"` : ''
        const span = `<span class="${className}"${issueIdAttr}>${escapedText}</span>`
        
        result += span
        i += text.length
        highlightIndex++
      } else {
        // Escape the current character and add it
        result += escapeHtml(debouncedTranscript[i])
        i++
      }
    }
    
    return result
  }, [debouncedTranscript, validUncommonWords, validationIssues, getCharacterPosition, escapeHtml])
  
  const updateHighlightedTranscript = useCallback((issues?: ValidationIssue[]) => {
    // This function is now just a placeholder - the actual highlighting is done via useMemo
    // We keep it for compatibility with existing code that calls it
    console.log('[updateHighlightedTranscript] Highlighting updated via useMemo')
  }, [])

  const handleReplaceIssue = (issue: ValidationIssue) => {
    const newTranscript = replaceInTranscript(transcriptContent, issue)
    setTranscriptContent(newTranscript)
    
    // Remove the issue from the list
    setValidationIssues(prev => prev.filter(i => i.id !== issue.id))
    updateHighlightedTranscript()
  }

  const handleIgnoreIssue = (issue: ValidationIssue) => {
    setValidationIssues(prev => 
      prev.map(i => i.id === issue.id ? { ...i, ignored: true } : i)
    )
    updateHighlightedTranscript()
  }

  const handleIssueClick = (issue: ValidationIssue) => {
    setSelectedIssue(issue)
    // Scroll to the issue in the transcript
    const element = document.querySelector(`[data-issue-id="${issue.id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

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
    // Skip fetching if a record was just added manually (to preserve the single record view)
    if (justAddedRecordRef.current) return
    if (!filterApplied && !searchQuery) {
      setRecords([])
      return
    }
    const fetch = async () => {
      let q: any = supabase.from("production_records").select("*").eq("worker_id", activeWorker.id)
      if (startDate) q = q.gte("date_completed", startDate)
      if (endDate) q = q.lte("date_completed", endDate)
      const { data } = await q.order("date_completed", { ascending: false })
      if (data) {
        let filteredData = data
        if (searchQuery) {
          filteredData = data.filter((r: any) =>
            r.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        setRecords(filteredData)
      }
    }
    fetch()
  }, [activeWorker, filterTrigger, searchQuery])

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

        // Skip fetching if a record was just added manually (to preserve the single record view)
        if (justAddedRecordRef.current) return

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

  const fetchAvailability = async (workerId: string) => {
    const { data } = await supabase.from('worker_profiles').select('weekly_availability, availability_submitted_at').eq('id', workerId).single()
    const avail = data?.weekly_availability
    setAvailabilitySubmittedAt(data?.availability_submitted_at ?? null)

    if (avail && typeof avail === 'object') {
      if ('monday' in avail && typeof (avail as any).monday === 'object') {
        setAvailabilityForm({
          monday: { sameday: !!(avail as any).monday?.sameday, overnight: !!(avail as any).monday?.overnight },
          tuesday: { sameday: !!(avail as any).tuesday?.sameday, overnight: !!(avail as any).tuesday?.overnight },
          wednesday: { sameday: !!(avail as any).wednesday?.sameday, overnight: !!(avail as any).wednesday?.overnight },
          thursday: { sameday: !!(avail as any).thursday?.sameday, overnight: !!(avail as any).thursday?.overnight },
          friday: { sameday: !!(avail as any).friday?.sameday, overnight: !!(avail as any).friday?.overnight }
        })
      } else {
        // Fallback for old format
        const isSameday = !!(avail as any).sameday
        const isOvernight = !!(avail as any).overnight
        setAvailabilityForm({
          monday: { sameday: isSameday && !!(avail as any).monday, overnight: isOvernight && !!(avail as any).monday },
          tuesday: { sameday: isSameday && !!(avail as any).tuesday, overnight: isOvernight && !!(avail as any).tuesday },
          wednesday: { sameday: isSameday && !!(avail as any).wednesday, overnight: isOvernight && !!(avail as any).wednesday },
          thursday: { sameday: isSameday && !!(avail as any).thursday, overnight: isOvernight && !!(avail as any).thursday },
          friday: { sameday: isSameday && !!(avail as any).friday, overnight: isOvernight && !!(avail as any).friday }
        })
      }
    } else {
      setAvailabilityForm(defaultAvailability)
    }
  }

  const toggleDayAvailability = (day: string, type: 'sameday' | 'overnight') => {
    setAvailabilityForm(f => ({
      ...f,
      [day]: {
        ...f[day],
        [type]: !f[day]?.[type]
      }
    }))
  }

  const saveAvailability = async () => {
    if (!activeWorker?.id) return
    setIsSavingAvailability(true)
    try {
      const workerName = activeWorker.full_name || activeWorker.name || activeWorker.email || 'Unknown Worker'
      const res = await fetch('/api/update-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: activeWorker.id, workerName, availability: availabilityForm }),
      })
      if (res.ok) {
        setAvailabilitySubmittedAt(new Date().toISOString())
        setIsAvailabilityModalOpen(false)
        setToastMessage('✅ Weekly availability saved!')
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      } else {
        const err = await res.json()
        alert('Failed to save: ' + (err.error || 'Unknown error'))
      }
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const resetAvailability = async () => {
    if (!activeWorker?.id) return
    const workerName = activeWorker.full_name || activeWorker.name || activeWorker.email || 'this worker'
    if (!confirm(`Are you sure you want to reset ${workerName}'s availability? This will unlock the form so they can submit again.`)) return

    setIsResettingAvailability(true)
    try {
      const res = await fetch('/api/reset-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: activeWorker.id }),
      })
      if (res.ok) {
        setAvailabilitySubmittedAt(null)
        setAvailabilityForm(defaultAvailability)
        setToastMessage('✅ Weekly availability reset!')
        setShowToast(true)
        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
      } else {
        const err = await res.json()
        alert('Failed to reset: ' + (err.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Failed to reset: ' + (err.message || 'Unknown error'))
    } finally {
      setIsResettingAvailability(false)
    }
  }
  const handleViewWorker = (w: any) => { setActiveWorker(w); setView("detail") }
  const handleBackToList = () => { setActiveWorker(null); setRecords([]); setView("list"); setStartDate(""); setEndDate(""); setSearchQuery(""); setFilterApplied(false); setFilterTrigger(prev => prev + 1) }
  const clearFilters = () => { setStartDate(""); setEndDate(""); setSearchQuery(""); setFilterApplied(false); setFilterTrigger(prev => prev + 1) }
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

      // Set flag to prevent useEffect from fetching all records
      justAddedRecordRef.current = true

      // Fetch and display the newly uploaded record immediately
      const { data: newRecords } = await supabase.from("production_records").select("*").eq("worker_id", activeWorker.id).order("date_completed", { ascending: false }).limit(1)
      if (newRecords && newRecords.length > 0) {
        setRecords([newRecords[0]])
      }

      // Reset the flag after a short delay to allow normal filtering to resume
      setTimeout(() => { justAddedRecordRef.current = false }, 500)

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
      // Clear filters to ensure only the newly added record is shown
      setStartDate('')
      setEndDate('')
      setSearchQuery('')
      setFilterApplied(false)
      // Set flag to prevent useEffect from fetching all records
      justAddedRecordRef.current = true
      // Fetch and display the newly added record immediately
      const { data: newRecords } = await supabase.from('production_records').select('*').eq('worker_id', activeWorker.id).order('date_completed', { ascending: false }).limit(1)
      if (newRecords && newRecords.length > 0) {
        setRecords([newRecords[0]])
      }
      // Reset the flag after a short delay to allow normal filtering to resume
      setTimeout(() => { justAddedRecordRef.current = false }, 500)
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
      departmentPermissions: activeWorker.department_permissions || ["conference", "senate", "academics", "broadcast", "podcast", "medical"],
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
      }

      // Update department permissions
      const permissionsResponse = await fetch(`/api/workers/${activeWorker.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_permissions: editWorkerForm.departmentPermissions
        }),
      })

      if (!permissionsResponse.ok) {
        console.error('Failed to update department permissions')
      }

      setToastMessage('✅ Worker details updated successfully!')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)

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

  // Returns true if a non-admin worker already submitted availability this ISO week (locks the form)
  const isAvailabilityLockedThisWeek = (() => {
    if (isAdmin) return false
    if (!availabilitySubmittedAt) return false
    const getISOWeek = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const day = date.getUTCDay() || 7
      date.setUTCDate(date.getUTCDate() + 4 - day)
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
      return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    }
    const submittedDate = new Date(availabilitySubmittedAt)
    const now = new Date()
    return (
      submittedDate.getUTCFullYear() === now.getUTCFullYear() &&
      getISOWeek(submittedDate) === getISOWeek(now)
    )
  })()

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
      const lastDay = 14
      cutoffStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      cutoffEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`
    } else {
      // Second cutoff: 15th - last day of month
      const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      cutoffStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`
      cutoffEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDayOfMonth}`
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

  const handleRequestPayslipClick = () => {
    if (!activeWorker) return
    const now = new Date()
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    if (payslipSelectedMonth > currentYearMonth) {
      alert('You cannot request a payslip for a future month.')
      return
    }
    setShowPayslipConfirm(true)
  }

  const handleProceedRequestPayslip = async () => {
    setShowPayslipConfirm(false)
    await requestPayslip()
  }

  const fetchStyleGuides = async () => {
    setIsLoadingStyleGuides(true)
    try {
      const res = await fetch('/api/style-guides')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch style guides')
      setStyleGuides(data.guides || [])
    } catch (err: any) {
      console.error('Fetch style guides error:', err)
    } finally {
      setIsLoadingStyleGuides(false)
    }
  }

  const fetchFormattingRules = async () => {
    setIsLoadingFormattingRules(true)
    try {
      const res = await fetch('/api/formatting-rules')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch formatting rules')
      setFormattingRules(data.rules || [])
    } catch (err: any) {
      console.error('Fetch formatting rules error:', err)
    } finally {
      setIsLoadingFormattingRules(false)
    }
  }

  const fetchValidatorReports = async () => {
    setIsLoadingValidatorReports(true)
    try {
      const res = await fetch('/api/validator-issue-reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch validator reports')
      setValidatorReports(data.reports || [])
    } catch (err: any) {
      console.error('Fetch validator reports error:', err)
    } finally {
      setIsLoadingValidatorReports(false)
    }
  }

  const handleStyleGuideUpload = async (department: string, file: File) => {
    if (!file) return
    setIsUploadingStyleGuide(department)
    try {
      const formData = new FormData()
      formData.append('department', department)
      formData.append('file', file)
      const res = await fetch('/api/style-guides/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload style guide')
      await fetchStyleGuides()
      setToastMessage(`✅ Style guide uploaded for ${department}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide upload error:', err)
      alert(`Failed to upload style guide: ${err.message}`)
    } finally {
      setIsUploadingStyleGuide(null)
    }
  }

  const handleStyleGuideDelete = async (department: string) => {
    setIsDeletingStyleGuide(department)
    try {
      const res = await fetch('/api/style-guides/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove style guide')
      await fetchStyleGuides()
      setToastMessage(`🗑️ Style guide removed for ${department}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide delete error:', err)
      alert(`Failed to remove style guide: ${err.message}`)
    } finally {
      setIsDeletingStyleGuide(null)
    }
  }

  const handleStyleGuideNoteSave = async (department: string, note: string) => {
    setIsSavingNote(department)
    try {
      const res = await fetch('/api/style-guides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, note }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save note')
      setStyleGuides(prev => prev.map(g => g.department === department ? { ...g, note } : g))
      setEditingNote(null)
      setToastMessage(`📝 Note saved for ${department}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide note save error:', err)
      alert(`Failed to save note: ${err.message}`)
    } finally {
      setIsSavingNote(null)
    }
  }

  const handleAddStyleGuideDept = async (deptName: string) => {
    if (!deptName || !deptName.trim()) return
    setIsAddingDepartment(true)
    try {
      const res = await fetch('/api/style-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: deptName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add department')
      await fetchStyleGuides()
      setNewDepartmentName('')
      setToastMessage(`✅ Added department: ${deptName}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide add department error:', err)
      alert(`Failed to add department: ${err.message}`)
    } finally {
      setIsAddingDepartment(false)
    }
  }

  const handleRenameStyleGuideDept = async (id: number, oldName: string, newName: string) => {
    if (!newName || !newName.trim() || newName.trim() === oldName) {
      setRenamingDepartmentId(null)
      return
    }
    setIsRenamingDept(id)
    try {
      const res = await fetch('/api/style-guides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, renameTo: newName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to rename department')
      await fetchStyleGuides()
      setRenamingDepartmentId(null)
      setToastMessage(`✅ Renamed department to: ${newName}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide rename department error:', err)
      alert(`Failed to rename department: ${err.message}`)
    } finally {
      setIsRenamingDept(null)
    }
  }

  const handleDeleteStyleGuideDept = async (id: number, deptName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the department "${deptName}" and its uploaded style guide file?`)) {
      return
    }
    setIsDeletingDeptId(id)
    try {
      const res = await fetch(`/api/style-guides?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete department')
      await fetchStyleGuides()
      setToastMessage(`🗑️ Deleted department: ${deptName}`)
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
    } catch (err: any) {
      console.error('Style guide delete department error:', err)
      alert(`Failed to delete department: ${err.message}`)
    } finally {
      setIsDeletingDeptId(null)
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
      console.error('Error fetching assignments:', err)
    }
  }

  const fetchAllWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('id, full_name, email')
        .eq('role', 'worker')
      if (error) throw error
      // Filter only workers from the existing allWorkers
      const workersOnly = (data || []).filter((w: any) => w.role === 'worker')
      // Update allWorkers with workers only
      const { data: allData } = await supabase.from('worker_profiles').select('*').order('full_name')
      if (allData) setAllWorkers(allData)
    } catch (err: any) {
      console.error('Error fetching workers:', err)
    }
  }

  const sendAssignmentComment = async () => {
    if (!selectedWorkerForComment || !assignmentComment.trim()) return

    setIsSendingComment(true)
    try {
      const res = await fetch('/api/send-assignment-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorkerForComment.id,
          workerName: selectedWorkerForComment.full_name,
          workerEmail: selectedWorkerForComment.email,
          comment: assignmentComment,
          filename: assignmentFilename,
          adminName: user?.full_name || 'Admin'
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send comment')

      setToastMessage('✅ Comment sent successfully')
      setShowToast(true)
      setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)

      setIsAssignmentCommentModalOpen(false)
      setAssignmentComment('')
      setAssignmentFilename('')
      setSelectedWorkerForComment(null)
    } catch (err: any) {
      console.error('Error sending comment:', err)
      alert(`Failed to send comment: ${err.message}`)
    } finally {
      setIsSendingComment(false)
    }
  }

  // Fetch all workers when modal opens
  useEffect(() => {
    if (isAssignmentCommentModalOpen && isAdmin) {
      fetchAllWorkers()
    }
  }, [isAssignmentCommentModalOpen, isAdmin])

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
      setIsAssignmentReportIssueModalOpen(false)
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

          <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-600/40 ring-1 ring-white/10 hover:from-red-700 hover:to-rose-700 hover:shadow-red-600/60 hover:shadow-xl transition-all"><LogOut className="h-3.5 w-3.5" /> Log Out</button>
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
              <div className="mt-4">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 p-4 shadow-2xl">
                  {/* Decorative glow blobs */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

                  <div className="relative">
                    {/* Hub Header */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Admin Hub</h3>
                        <p className="text-[10px] text-zinc-400">Quick access to administrative actions</p>
                      </div>
                    </div>

                    {/* Hub Action Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">

                      {/* Add New Worker */}
                      <button
                        onClick={() => setIsAddWorkerModalOpen(true)}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-zinc-900 shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform duration-200">
                          <UserPlus className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Add New Worker</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Register a new team member</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Announcement */}
                      <button
                        onClick={() => { setAnnouncementSchemaHint(null); setIsAnnouncementModalOpen(true) }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-amber-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-amber-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-200">
                          <Bell className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Announcement</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Broadcast a message to all workers</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Payslip Requests */}
                      <button
                        onClick={() => { setIsPayslipAdminModalOpen(true); fetchPayslipRequests() }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-emerald-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Payslip Requests</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Review &amp; manage payslip requests</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Manage Style Guides */}
                      <button
                        onClick={() => { setIsStyleGuidesAdminModalOpen(true); fetchStyleGuides() }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-amber-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-amber-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Style Guides</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Upload formatting rules by department</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Manage Formatting Rules */}
                      <button
                        onClick={() => { setIsFormattingRulesAdminModalOpen(true); fetchFormattingRules() }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-rose-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-rose-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileEdit className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Format Rules</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Manage transcript format rules</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Validator Issue Reports */}
                      <button
                        onClick={() => { setIsValidatorReportsModalOpen(true); fetchValidatorReports() }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-red-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-red-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-200">
                          <AlertCircle className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Issue Reports</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">View validator issue reports</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Transcript Validation Rules */}
                      <button
                        onClick={() => window.location.href = '/dashboard/validation-rules'}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-purple-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-200">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Validation Rules</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Manage transcript validation rules</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Technical Dictionary */}
                      <button
                        onClick={() => window.location.href = '/dashboard/technical-dictionary'}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-purple-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200">
                          <BookOpen className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Technical Dictionary</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Manage technical terms dictionary</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Assignment Comments */}
                      <button
                        onClick={() => setIsAssignmentCommentModalOpen(true)}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200">
                          <MessageSquare className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Assignment Comments</p>
                          <p className="mt-0.5 text-[8px] text-zinc-400">Send comments on assignments</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
              <div className="rounded-2xl border border-[#334155] bg-[#172033] backdrop-blur-sm transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center gap-4 sm:items-start">
                      <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-[#1E293B] text-cyan-400 border border-[#334155]">
                        <div className="flex h-full w-full items-center justify-center"><User className="h-10 w-10" /></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-white">{activeWorker?.full_name || "Worker Details"}</h2>
                        {activeWorker?.role && (
                          <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300 border border-cyan-500/30">
                            {activeWorker.role}
                          </span>
                        )}
                        {activeWorker && (
                          <div className="ml-auto flex items-center gap-2">
                            {isAdmin && (
                              <button onClick={openEditWorkerModal} className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-300">
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
                </div>
              </div>

              {hasBankColumns && (
              <div className="rounded-2xl border-l-4 border-cyan-500 border border-[#334155] bg-[#172033] backdrop-blur-sm transition-all duration-300 relative">
                <div className="flex items-start justify-between gap-4 p-6 border-b border-[#334155]">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Bank Details</h3>
                    <p className="text-xs text-gray-400">Editable by authorized users.</p>
                  </div>
                </div>
                {canEditBank && (
                  <button onClick={() => setIsBankModalOpen(true)} className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20 transition">
                    <CreditCard className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                <div className="p-6 pt-4">
                  <div className="space-y-1.5 text-sm text-gray-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-400">Bank Name</span>
                      <span className="text-white">{activeWorker?.bank_name || "No bank name set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-400">Account Number</span>
                      <span className="text-white">{activeWorker?.account_number || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-400">Account Type</span>
                      <span className="text-white">{activeWorker?.account_type || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-400">Routing Number</span>
                      <span className="text-white">{activeWorker?.routing_number || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-400">Employee ID</span>
                      <span className="text-white">{activeWorker?.employee_id || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr] xl:items-stretch mt-4">
              <div className="rounded-2xl border border-[#334155] bg-[#172033] backdrop-blur-sm transition-all duration-300">
                <div className="flex flex-col space-y-1.5 p-6 border-b border-[#334155]">
                  <h3 className="font-bold text-lg leading-none tracking-tight text-white">Production Records</h3>
                </div>
                <div className="p-6 pt-4 bg-[#1E293B]">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-white mb-1.5">Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFilterApplied(false); }} className="border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all bg-white/5" placeholder="mm/dd/yyyy" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-white mb-1.5">End Date</label>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setFilterApplied(false); }} className="border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all bg-white/5" placeholder="mm/dd/yyyy" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-white mb-1.5">Search Files</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all bg-white/5" placeholder="Search by file name..." />
                      </div>
                      <button onClick={applyFilters} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-zinc-900 to-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-black/40 ring-1 ring-white/10 hover:from-black hover:to-zinc-900 hover:shadow-black/60 hover:shadow-xl transition-all">
                        <span>⊡</span> Filter
                      </button>
                      {(startDate || endDate || searchQuery) && (
                        <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-900 text-white text-xs font-semibold ring-1 ring-white/10 shadow-lg shadow-black/30 hover:from-zinc-900 hover:to-black hover:shadow-black/50 transition-all">
                          <X className="h-3 w-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#334155]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#293548] text-white uppercase text-[10px] font-semibold tracking-wider">
                        <tr>
                          <th className="px-3 py-2 text-left rounded-tl-lg">File Name</th>
                          <th className="px-3 py-2 text-left">Date Completed</th>
                          <th className="px-3 py-2 text-left">Size (KB)</th>
                          {isAdmin && <th className="px-3 py-2 text-left rounded-tr-lg">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155] bg-[#1E293B]">
                        {records.length > 0 ? records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-[#293548] transition-colors">
                            <td className="px-3 py-2 font-semibold text-white">{getDisplayFileName(r.file_name)}</td>
                            <td className="px-3 py-2 text-gray-300">{formatDateDMY(r.date_completed)}</td>
                            <td className="px-3 py-2 font-bold text-cyan-400">{formatKB(r.byte_size)}</td>
                            {isAdmin && (
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditModal(r)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm shadow-slate-300/80 hover:border-slate-400 hover:text-zinc-900 hover:shadow-md transition-all">
                                    <Pencil className="h-3 w-3" /> Edit
                                  </button>
                                  <button onClick={() => handleDeleteRecord(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-xl shadow-red-600/30 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-600/40 transition-all">
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={isAdmin ? 4 : 3} className="px-3 py-6 text-center text-gray-400 font-medium">No production records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t border-[#334155] px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#172033]">
                  {isAdmin && (
                    <button onClick={() => setIsManualAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20 hover:border-white/30 hover:shadow-md transition-all">
                      <FileText className="h-4 w-4" /> Add File Manually
                    </button>
                  )}
                  <button onClick={() => setIsUploadModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-black to-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(0,0,0,0.7)] transition-all">
                    <Upload className="h-3.5 w-3.5" /> Upload File
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sticky top-4 self-start">
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 border-b border-white/10">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Total Files</h3>
                    <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center shadow-md shadow-white/10">
                      <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div className="p-3 pt-0">
                    <div className="text-xl font-extrabold text-white tracking-tight">{filteredTotalFiles}</div>
                    <p className="text-[10px] text-cyan-100 mt-0.5">{filterApplied ? "Selected Period" : "All Time"}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 border-b border-white/10">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Total Kilobytes</h3>
                    <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center shadow-md shadow-white/10">
                      <HardDrive className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div className="p-3 pt-0">
                    <div className="text-xl font-extrabold text-white tracking-tight">{filteredTotalKB}</div>
                    <p className="text-[10px] text-cyan-100 mt-0.5">{filterApplied ? "Selected Period" : "All Time"}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 border-b border-white/10">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Total Earnings</h3>
                    <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center shadow-md shadow-white/10">
                      <CreditCard className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div className="p-3 pt-0">
                    <div className="text-xl font-extrabold text-white tracking-tight">{computedEarnings ?? '-'}</div>
                    <p className="text-[10px] text-cyan-100 mt-0.5">{computedEarnings ? `Based on ${formatCurrency(activeWorker?.base_payment_per_60kb || 700, activeWorker?.location)} per 60KB` : ''}</p>
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={computeTotalEarnings} className="inline-flex items-center justify-center rounded-md bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition-all">
                        Compute Earnings
                      </button>
                      {isAdmin && (
                        <button type="button" onClick={() => { setIsPaymentModalOpen(true); setSelectedPaymentRate(activeWorker?.base_payment_per_60kb || 700) }} className="inline-flex items-center gap-1 rounded-md border border-white/30 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20 transition-all">
                          <Pencil className="h-2.5 w-2.5" /> Rate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Worker Hub ── */}
            <div className="mt-4">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 p-4 shadow-2xl">
                {/* Decorative glow blobs */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative">
                  {/* Hub Header */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                      <CreditCard className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Worker Hub</h3>
                      <p className="text-[10px] text-zinc-400">Quick access to payment &amp; payslip actions</p>
                    </div>
                  </div>

                  {/* Hub Action Cards */}
                  {(user?.id === activeWorker?.id || isAdmin) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 mb-4">

                      {/* Current Assignments */}
                      <button
                        type="button"
                        onClick={() => setIsCurrentAssignmentsModalOpen(true)}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Current Assignments</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">View your active work assignments</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Request Payslip */}
                      <button
                        type="button"
                        onClick={() => { setIsPayslipModalOpen(true); setPayslipActiveTab('request'); if (activeWorker?.id) fetchWorkerPayslipRequests(activeWorker.id); }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Request Payslip</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">Submit a payslip request for a cutoff period</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Payment History */}
                      <button
                        type="button"
                        onClick={() => { setPaymentHistory([]); setIsPaymentHistoryModalOpen(true); if (activeWorker?.id) fetchPaymentHistory(activeWorker.id) }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-violet-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-violet-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-200">
                          <CreditCard className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Payment History</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">View all past payments &amp; transactions</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Weekly Availability */}
                      <button
                        type="button"
                        onClick={() => { if (activeWorker?.id) fetchAvailability(activeWorker.id); setIsAvailabilityModalOpen(true) }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-emerald-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Weekly Availability</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">Set your sameday, overnight &amp; daily schedule</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Style Guides & Formatting Rules */}
                      <button
                        type="button"
                        onClick={() => { setIsStyleGuidesModalOpen(true); fetchStyleGuides() }}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-amber-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-amber-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Style Guides</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">Download formatting rules by department</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Transcript Validation */}
                      <button
                        type="button"
                        onClick={() => setShowValidationPanel(true)}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-purple-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-200">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Transcript Validation</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">Check transcript for errors & issues</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                      {/* Transcript Cleanup */}
                      <button
                        type="button"
                        onClick={() => setIsTranscriptCleanupModalOpen(true)}
                        className="group relative flex flex-col items-start gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-left backdrop-blur-sm hover:bg-white/10 hover:border-green-400/40 transition-all duration-200 hover:shadow-xl hover:shadow-green-600/20"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-200">
                          <FileEdit className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Transcript Cleanup</p>
                          <p className="mt-0.5 text-[8px] leading-relaxed text-zinc-400">Auto-remove timestamps & fillers</p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-2.5 w-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>

                    </div>
                  )}
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
                    <button type="button" onClick={() => { setIsAssignmentReportIssueModalOpen(true); setReportIssueAssignment(selectedAssignment) }} className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition">
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
          <div className="bg-gradient-to-br from-white via-zinc-50 to-slate-50 rounded-3xl shadow-2xl shadow-black/30 w-full max-w-md p-6 relative border border-zinc-200/80">
            <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-colors"><X className="h-5 w-5" /></button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-slate-900 text-white shadow-xl shadow-black/40 mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-1">Upload New File</h3>
            <p className="text-xs text-zinc-600 mb-4">Select a .txt file to upload to your production records.</p>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Select .txt File</label>
                <div className="relative">
                  <input type="file" accept=".txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-zinc-900 file:to-slate-900 file:text-white hover:file:from-black hover:file:to-zinc-900 file:shadow-lg file:shadow-black/40 file:ring-1 file:ring-white/10 transition-all cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm">Cancel</button>
                <button type="submit" disabled={isUploading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-zinc-900 to-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/40 ring-1 ring-white/10 hover:from-black hover:to-zinc-900 hover:shadow-black/60 hover:shadow-xl disabled:opacity-50 transition-all">
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

            {payslipActiveTab === 'request' ? (
              <>
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
                    <button type="button" onClick={() => setPayslipActiveTab('history')} className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-blue-300 transition-all shadow-sm">View Status</button>
                    <button type="button" disabled={isRequestingPayslip} onClick={handleRequestPayslipClick} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-blue-600/30 hover:from-blue-800 hover:to-sky-800 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50 transition-all">{isRequestingPayslip ? 'Requesting...' : 'Request Payslip'}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-zinc-900 mb-1">Payslip Requests</h3>
                <p className="text-xs text-zinc-600 mb-4">View the status of your past requests.</p>
                <div className="space-y-4">
                  {payslipRequests.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500 py-6">No payslip requests yet.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {payslipRequests.map((r: any) => (
                        <div key={r.id} className="rounded-2xl border border-blue-100 bg-white/60 p-3.5 hover:bg-white transition-all">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-xs font-bold text-zinc-800">{(() => { const [y, m, day] = r.cutoff_start.split('-').map(Number); const month = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' }); const cutoff = day <= 14 ? 'First Cutoff' : 'Second Cutoff'; return `${month} ${y} — ${cutoff}`; })()}</div>
                              <div className="text-[10px] text-zinc-500">Requested {new Date(r.requested_at).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                              r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {r.payslip_url ? (
                              <a href={r.payslip_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1 text-[11px] font-bold text-white hover:from-cyan-700 hover:to-sky-700 transition-all shadow-sm">
                                Download payslip
                              </a>
                            ) : r.status === 'approved' ? (
                              <span className="text-[11px] text-blue-700 font-medium">Approved - waiting for upload</span>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-medium">Waiting for approval</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex mt-4">
                    <button type="button" onClick={() => setPayslipActiveTab('request')} className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                      Back to Request Form
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPayslipConfirm && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/50 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative border-2 border-blue-200/80 animate-scale-up">
            <button onClick={() => setShowPayslipConfirm(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/30 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirm Payslip Request</h3>
            <p className="text-xs text-zinc-600 leading-relaxed mb-6">
              To check the status of your request later, please check the <strong className="text-zinc-800">"View Status"</strong> tab in the Payslip menu.<br/><br/>
              Would you like to proceed with submitting this request?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPayslipConfirm(false)}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={handleProceedRequestPayslip}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-blue-600/30 hover:from-blue-800 hover:to-sky-800 hover:shadow-xl transition-all"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayslipConfirm && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/50 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative border-2 border-blue-200/80 animate-scale-up">
            <button onClick={() => setShowPayslipConfirm(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/30 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirm Payslip Request</h3>
            <p className="text-xs text-zinc-600 leading-relaxed mb-6">
              To check the status of your request later, please check the <strong className="text-zinc-800">"View Status"</strong> tab in the Payslip menu.<br/><br/>
              Would you like to proceed with submitting this request?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPayslipConfirm(false)}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={handleProceedRequestPayslip}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-blue-600/30 hover:from-blue-800 hover:to-sky-800 hover:shadow-xl transition-all"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Style Guides Worker Modal ── */}
      {isStyleGuidesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-orange-50 to-white border border-orange-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(249,115,22,0.12)] rounded-3xl w-full max-w-xl p-4 relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">

            <button 
              onClick={() => setIsStyleGuidesModalOpen(false)} 
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-orange-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 flex-shrink-0">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">Style Guides & Formatting Rules</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Download formatting guidelines for your department</p>
              </div>
            </div>

            {/* Department Tiles */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {isLoadingStyleGuides ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
                  <svg className="h-6 w-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <span className="text-xs">Loading style guides...</span>
                </div>
              ) : styleGuides.length === 0 ? (
                <div className="text-center py-14 text-zinc-400 flex flex-col items-center gap-2">
                  <span className="text-2xl opacity-60">📁</span>
                  <p className="text-sm font-medium">No style guides available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {styleGuides.map((guide: any) => {
                    const { icon: Icon, color, bg } = getDepartmentIcon(guide.department)
                    return (
                      <div key={guide.id} className="group relative flex flex-col items-center text-center rounded-xl border border-orange-100 bg-white hover:bg-orange-50 hover:border-orange-300/60 p-3 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        {/* Icon */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bg} ${color} group-hover:scale-110 transition-all duration-300 mb-2`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {/* Title */}
                        <p className="text-xs font-bold text-zinc-800 group-hover:text-orange-600 transition-colors mb-1 line-clamp-2 leading-tight">{guide.department}</p>
                        {guide.file_name && <p className="text-[9px] text-zinc-400 truncate max-w-full mb-1.5">{guide.file_name}</p>}
                        {/* Action */}
                        {guide.file_url ? (
                          <a
                            href={guide.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-[10px] font-bold text-white hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-md shadow-orange-500/25 hover:shadow-orange-500/35"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download
                          </a>
                        ) : (
                          <p className="mt-auto text-[10px] text-zinc-400 italic">{guide.note || 'No file uploaded.'}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 pt-3 border-t border-orange-100 mt-3">
              <button 
                onClick={() => setIsStyleGuidesModalOpen(false)} 
                className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-orange-100 hover:text-zinc-900 hover:border-orange-300 transition-all duration-300 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transcript Validation Panel ── */}
      {showValidationPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-gradient-to-br from-white via-purple-50/30 to-white border border-purple-200/60 backdrop-blur-2xl shadow-[0_25px_100px_rgba(168,85,247,0.25)] rounded-3xl w-full max-w-7xl p-0 relative max-h-[94vh] flex flex-col overflow-hidden animate-scale-up ring-1 ring-purple-300/50">

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5 pointer-events-none" />

            <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
              <button
                onClick={() => setIsReportIssueModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 bg-gradient-to-r from-red-50 to-red-100/80 border border-red-200/60 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300"
              >
                <AlertCircle className="h-4 w-4" />
                Report Issue
              </button>
              <button
                onClick={() => setShowValidationPanel(false)}
                className="cursor-pointer text-zinc-400 hover:text-red-500 hover:rotate-90 transition-all duration-300 bg-white/80 hover:bg-red-50 rounded-full p-2.5 shadow-sm hover:shadow-md border border-zinc-200 hover:border-red-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center gap-3 mb-5 flex-shrink-0 pb-4 border-b border-purple-200/60 px-8 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 flex-shrink-0 ring-2 ring-purple-300/50">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-700 via-violet-600 to-purple-700 bg-clip-text text-transparent tracking-tight">Transcript Validation Engine</h3>
                <p className="text-[10px] text-zinc-500 font-medium mt-0.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                  Validate transcripts against style guides and formatting rules
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-hidden flex gap-6 px-8 pb-8">
              {/* Left Column */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-3">
                {/* Department Selector */}
                <div className="bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-3 shadow-sm ring-1 ring-purple-100/50">
                  <label className="text-[10px] font-bold text-zinc-700 mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <Building2 className="h-3 w-3 text-purple-600" />
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full border border-purple-300/60 rounded-lg px-3 py-2 text-xs text-zinc-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all bg-white shadow-sm font-medium"
                  >
                    {isAdmin ? (
                      <>
                        <option value="conference">Conference / Earnings Call</option>
                        <option value="senate">Senate Hearing / Political</option>
                        <option value="academics">Academics</option>
                        <option value="broadcast">Broadcast</option>
                        <option value="podcast">Podcast</option>
                        <option value="medical">Medical</option>
                      </>
                    ) : (
                      (user?.department_permissions || ['conference', 'senate', 'academics', 'broadcast', 'podcast', 'medical']).map((dept: string) => (
                        <option key={dept} value={dept}>
                          {dept === 'conference' ? 'Conference / Earnings Call' :
                           dept === 'senate' ? 'Senate Hearing / Political' :
                           dept === 'academics' ? 'Academics' :
                           dept === 'broadcast' ? 'Broadcast' :
                           dept === 'podcast' ? 'Podcast' :
                           dept === 'medical' ? 'Medical' : dept}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Transcript Input */}
                <div className="bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-3 shadow-sm ring-1 ring-purple-100/50">
                  <label className="text-[10px] font-bold text-zinc-700 mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="h-3 w-3 text-purple-600" />
                    Transcript Text
                  </label>
                  <textarea
                    value={transcriptContent}
                    onChange={(e) => setTranscriptContent(e.target.value)}
                    className="w-full border border-purple-300/60 rounded-lg px-3 py-2 text-xs text-zinc-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all bg-white min-h-[120px] resize-y font-mono shadow-sm leading-relaxed"
                    placeholder="Paste your transcript here to validate..."
                  />
                </div>

                {/* Validation Status */}
                {isRunningValidation && (
                  <div className="bg-gradient-to-r from-purple-100/80 via-violet-100/80 to-purple-100/80 border border-purple-300/60 rounded-xl p-3 flex items-center gap-3 shadow-sm ring-1 ring-purple-200/50">
                    <Loader2 className="h-4 w-4 text-purple-700 animate-spin" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-purple-900">Running validation...</span>
                      {validationProgress && (
                        <p className="text-[10px] text-purple-700 mt-0.5 font-medium">{validationProgress.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Extracted References Panel */}
                {(extractedParticipants.length > 0 || extractedCompanies.length > 0) && (
                  <div className="bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-3 shadow-sm ring-1 ring-purple-100/50">
                    <div
                      className="flex items-center justify-between gap-2 mb-3 cursor-pointer"
                      onClick={() => setIsReferencesExpanded(!isReferencesExpanded)}
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-900">Extracted References</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Live Counters */}
                        <div className="flex gap-3 text-[9px] text-zinc-600 font-medium">
                          <span>Companies: <span className="font-bold text-purple-600">{extractedCompanies.length}</span></span>
                          <span>Corporate Participants: <span className="font-bold text-purple-600">{extractedParticipants.filter(p => p.type === 'board').length}</span></span>
                          <span>Analysts: <span className="font-bold text-purple-600">{extractedParticipants.filter(p => p.type === 'analyst').length}</span></span>
                          <span>Validation Issues: <span className="font-bold text-purple-600">{validationIssues.filter(i => !i.ignored).length}</span></span>
                        </div>
                        {isReferencesExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </div>
                    </div>
                    
                    {isReferencesExpanded && (
                      <>
                    {/* Company */}
                    {extractedCompanies.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-semibold text-zinc-600 mb-1.5 flex items-center gap-1">
                          🏢 Company
                        </div>
                        <div className="space-y-1">
                          {extractedCompanies.map((company, index) => {
                            const companyIssues = validationIssues.filter(i => i.category === 'company' && i.suggestedCorrection === company)
                            const statusColor = companyIssues.length === 0 ? 'text-green-500' : 'text-orange-500'
                            const statusIcon = companyIssues.length === 0 ? '🟢' : '🟠'
                            
                            return (
                              <div 
                                key={index}
                                onClick={() => {
                                  // Find all occurrences of this company in the transcript
                                  const regex = new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                                  const matches = transcriptContent.match(regex)
                                  if (matches && matches.length > 0) {
                                    // Scroll to first occurrence
                                    const firstMatchIndex = transcriptContent.search(regex)
                                    const line = transcriptContent.substring(0, firstMatchIndex).split('\n').length
                                    const element = document.querySelector('.validation-issue-orange')
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }
                                  }
                                }}
                                className="text-xs text-zinc-700 cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                              >
                                {statusIcon} {company} {companyIssues.length > 0 && `(${companyIssues.length} possible spelling issue${companyIssues.length > 1 ? 's' : ''})`}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Corporate Participants */}
                    {extractedParticipants.filter(p => p.type === 'board').length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-semibold text-zinc-600 mb-1.5 flex items-center gap-1">
                          👔 Corporate Participants
                        </div>
                        <div className="space-y-1">
                          {extractedParticipants.filter(p => p.type === 'board').map((participant, index) => {
                            const nameIssues = validationIssues.filter(i => i.category === 'name' && i.suggestedCorrection === participant.name)
                            const statusColor = nameIssues.length === 0 ? 'text-green-500' : 'text-yellow-500'
                            const statusIcon = nameIssues.length === 0 ? '🟢' : '🟡'
                            
                            return (
                              <div 
                                key={index}
                                onClick={() => {
                                  // Find all occurrences of this name in the transcript
                                  const regex = new RegExp(participant.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                                  const matches = transcriptContent.match(regex)
                                  if (matches && matches.length > 0) {
                                    // Scroll to first occurrence
                                    const firstMatchIndex = transcriptContent.search(regex)
                                    const line = transcriptContent.substring(0, firstMatchIndex).split('\n').length
                                    const element = document.querySelector('.validation-issue-red')
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }
                                  }
                                }}
                                className="text-xs text-zinc-700 cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                              >
                                {statusIcon} {participant.name} {nameIssues.length > 0 && `(${nameIssues.length} possible spelling issue${nameIssues.length > 1 ? 's' : ''})`}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Analysts */}
                    {extractedParticipants.filter(p => p.type === 'analyst').length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-zinc-600 mb-1.5 flex items-center gap-1">
                          📊 Analysts / Participants
                        </div>
                        <div className="space-y-1">
                          {extractedParticipants.filter(p => p.type === 'analyst').map((participant, index) => {
                            const nameIssues = validationIssues.filter(i => i.category === 'name' && i.suggestedCorrection === participant.name)
                            const statusColor = nameIssues.length === 0 ? 'text-green-500' : 'text-yellow-500'
                            const statusIcon = nameIssues.length === 0 ? '🟢' : '🟡'
                            
                            return (
                              <div 
                                key={index}
                                onClick={() => {
                                  // Find all occurrences of this name in the transcript
                                  const regex = new RegExp(participant.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                                  const matches = transcriptContent.match(regex)
                                  if (matches && matches.length > 0) {
                                    // Scroll to first occurrence
                                    const firstMatchIndex = transcriptContent.search(regex)
                                    const line = transcriptContent.substring(0, firstMatchIndex).split('\n').length
                                    const element = document.querySelector('.validation-issue-red')
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }
                                  }
                                }}
                                className="text-xs text-zinc-700 cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                              >
                                {statusIcon} {participant.name} {nameIssues.length > 0 && `(${nameIssues.length} possible spelling issue${nameIssues.length > 1 ? 's' : ''})`}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                )}

                {/* Issues Panel */}
                {validationIssues.length > 0 || isRunningValidation ? (
                  <div className="bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-3 shadow-sm ring-1 ring-purple-100/50">
                    {/* Validation Progress */}
                    {isRunningValidation && validationProgress && (
                      <div className="bg-gradient-to-r from-blue-100/80 via-purple-100/80 to-blue-100/80 border border-blue-300/60 rounded-xl p-3 mb-3 shadow-sm ring-1 ring-blue-200/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
                          <span className="text-xs font-bold text-blue-900">Validating...</span>
                        </div>
                        <div className="text-xs text-blue-800 font-medium">{validationProgress.message}</div>
                      </div>
                    )}

                    {/* Validation Summary */}
                    {!isRunningValidation && validationIssues.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-100/90 via-violet-100/90 to-purple-100/90 border border-purple-300/70 rounded-xl p-3 mb-3 shadow-sm ring-1 ring-purple-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="h-4 w-4 text-purple-800" />
                          <span className="text-xs font-bold text-purple-900">Validation Summary</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/60 shadow-sm">
                            <div className="text-zinc-600 text-[9px] font-semibold uppercase tracking-wider mb-1">Total Issues</div>
                            <div className="font-bold text-purple-700 text-lg">{validationIssues.filter(i => !i.ignored).length}</div>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/60 shadow-sm">
                            <div className="text-zinc-600 text-[9px] font-semibold uppercase tracking-wider mb-1">Style Issues</div>
                            <div className="font-bold text-yellow-600 text-lg">{validationIssues.filter(i => !i.ignored && i.category === 'style').length}</div>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/60 shadow-sm">
                            <div className="text-zinc-600 text-[9px] font-semibold uppercase tracking-wider mb-1">Formatting Issues</div>
                            <div className="font-bold text-purple-600 text-lg">{validationIssues.filter(i => !i.ignored && i.category === 'formatting').length}</div>
                          </div>
                        </div>
                        {validationTime && (
                          <div className="text-[10px] text-zinc-500 mt-3 flex items-center gap-1.5 font-medium">
                            <Activity className="h-3 w-3" />
                            Validation time: {validationTime}ms
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-bold text-purple-900">{validationIssues.filter(i => !i.ignored).length} Issue(s) Found</span>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                        <input
                          type="text"
                          value={issueSearchQuery}
                          onChange={(e) => setIssueSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs border border-purple-300/60 rounded-lg text-zinc-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all bg-white w-40 shadow-sm font-medium"
                          placeholder="Search issues..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                      {validationIssues
                        .filter(issue => !issue.ignored)
                        .filter((issue) =>
                          issueSearchQuery === '' ||
                          issue.foundText.toLowerCase().includes(issueSearchQuery.toLowerCase()) ||
                          issue.suggestedCorrection.toLowerCase().includes(issueSearchQuery.toLowerCase()) ||
                          issue.category.toLowerCase().includes(issueSearchQuery.toLowerCase())
                        )
                        .map((issue, index) => (
                          <div
                            key={issue.id}
                            onClick={() => handleIssueClick(issue)}
                            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                              selectedIssue?.id === issue.id
                                ? 'bg-purple-100/90 border-purple-400 shadow-md shadow-purple-200/50 ring-1 ring-purple-300/50'
                                : 'bg-white border-purple-200/60 hover:bg-purple-50/50 hover:border-purple-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-zinc-600 mb-1">
                                  <span className="font-semibold text-zinc-700">Found:</span> <span className="font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md border border-red-200">{issue.foundText}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600">
                                  <span className="font-medium text-zinc-700">Suggested:</span> <span className="font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-200">{issue.suggestedCorrection}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                {issue.ruleName !== 'Repeated Words' && issue.ruleName !== 'Filler Check' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleReplaceIssue(issue) }}
                                    className="px-2 py-1 text-[10px] font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                                    title="Replace"
                                  >
                                    Replace
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleIgnoreIssue(issue) }}
                                  className="px-2 py-1 text-[10px] font-semibold bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition-all"
                                  title="Ignore"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50/50 to-white border border-green-200 rounded-xl p-6">
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-700">No Issues Found</span>
                      <p className="text-xs text-zinc-500 text-center">Your transcript looks great!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Highlighted Transcript */}
              <div className="w-1/2 overflow-y-auto pl-3">
                {isRunningValidation ? (
                  <div className="flex items-center justify-center h-full min-h-[300px] border border-purple-300/60 rounded-xl bg-gradient-to-br from-purple-100/80 via-violet-100/80 to-purple-100/80 shadow-sm ring-1 ring-purple-200/50">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-3 animate-spin" />
                      <p className="text-xs font-bold text-purple-900">Validating transcript...</p>
                      <p className="text-[10px] text-purple-700 mt-1 font-medium">Please wait</p>
                    </div>
                  </div>
                ) : debouncedTranscript ? (
                  <div className="sticky top-0">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-2 uppercase tracking-wider">
                        <FileText className="h-3 w-3 text-purple-600" />
                        Highlighted Transcript
                      </label>
                      {validationIssues.filter(i => !i.ignored).length === 0 && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transcriptContent)
                            setCopySuccess(true)
                            setTimeout(() => setCopySuccess(false), 2000)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                        >
                          {copySuccess ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy Transcript
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {validationIssues.filter(i => !i.ignored).length > 0 && (
                      <p className="text-xs text-amber-700 font-semibold mb-3">Resolve all issues before copying</p>
                    )}
                    {formatMismatchError ? (
                      <div className="w-full border border-red-300/80 bg-gradient-to-br from-red-50/90 to-orange-50/90 rounded-xl px-6 py-8 text-center shadow-sm ring-1 ring-red-200/50">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h3 className="text-xs font-semibold text-red-800">Department Format Mismatch</h3>
                        </div>
                        <p className="text-[10px] text-red-700 mb-2">
                          The transcript format does not match the selected department. Please select the correct department to continue.
                        </p>
                        <div className="inline-block bg-white border border-red-200 rounded-lg px-4 py-2 shadow-sm">
                          <p className="text-[10px] text-red-800 font-bold">
                            Suggested Department: <span className="font-extrabold">{formatMismatchError}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
                          >
                            {isEditMode ? (
                              <>
                                <Eye className="h-4 w-4" />
                                View Mode
                              </>
                            ) : (
                              <>
                                <Pencil className="h-4 w-4" />
                                Edit Mode
                              </>
                            )}
                          </button>
                          {isEditMode && (
                            <button
                              onClick={() => {
                                setTranscriptContent(editedTranscript)
                                setIsEditMode(false)
                              }}
                              className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1"
                            >
                              <Save className="h-4 w-4" />
                              Save Changes
                            </button>
                          )}
                        </div>
                        {isEditMode ? (
                          <textarea
                            value={editedTranscript || transcriptContent}
                            onChange={(e) => setEditedTranscript(e.target.value)}
                            className="w-full border border-purple-300/60 rounded-xl px-4 py-3 text-[10px] text-zinc-800 bg-white min-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono shadow-sm ring-1 ring-purple-100/50 leading-relaxed outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all"
                            placeholder="Edit the transcript here..."
                          />
                        ) : (
                          <div
                            dangerouslySetInnerHTML={{ __html: highlightedTranscript || debouncedTranscript }}
                            className="w-full border border-purple-300/60 rounded-xl px-4 py-3 text-[10px] text-zinc-800 bg-white min-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono shadow-sm ring-1 ring-purple-100/50 leading-relaxed"
                          />
                        )}
                        <div className="mt-3 flex gap-3 text-[10px] flex-wrap bg-gradient-to-br from-purple-100/80 via-violet-100/80 to-purple-100/80 border border-purple-300/60 rounded-lg p-3 shadow-sm ring-1 ring-purple-200/50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded-md shadow-sm"></div>
                            <span className="text-zinc-700 font-semibold">Style Rule</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-200 border border-purple-400 rounded-md shadow-sm"></div>
                            <span className="text-zinc-700 font-semibold">Formatting</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px] border-2 border-dashed border-purple-300/60 rounded-xl bg-gradient-to-br from-purple-50/60 via-white to-purple-50/60">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm ring-1 ring-purple-200/50">
                        <FileText className="h-8 w-8 text-purple-500" />
                      </div>
                      <p className="text-xs font-bold text-zinc-700">Paste transcript to see highlighted preview</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-medium">The transcript will be displayed here with validation highlights</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex-shrink-0 pt-4 border-t border-purple-200/60 mt-4 flex justify-center gap-3 px-8 pb-6">
              <button
                onClick={() => {
                  setTranscriptContent("")
                  setValidationIssues([])
                  setExtractedParticipants([])
                  setExtractedCompanies([])
                  setIssueSearchQuery("")
                }}
                className="rounded-lg border border-purple-300/60 bg-white px-6 py-2 text-[10px] font-bold text-zinc-700 hover:bg-purple-50 hover:text-zinc-900 hover:border-purple-400 transition-all duration-300 shadow-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setShowValidationPanel(false)}
                className="rounded-lg border border-purple-300/60 bg-purple-50/80 px-6 py-2 text-[10px] font-bold text-zinc-700 hover:bg-purple-100 hover:text-zinc-900 hover:border-purple-400 transition-all duration-300 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transcript Cleanup Modal ── */}
      {isTranscriptCleanupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-green-50 to-white border border-green-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(34,197,94,0.12)] rounded-3xl w-full max-w-6xl p-4 relative h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <button
              onClick={() => setIsTranscriptCleanupModalOpen(false)}
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-green-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 flex-shrink-0">
                <FileEdit className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Transcript Cleanup</h3>
                <p className="text-[10px] text-zinc-500">Automatically clean up your transcript</p>
              </div>
            </div>

            {/* Transcript Cleanup Component */}
            <div className="flex-1 overflow-hidden">
              <TranscriptCleanup
                transcript={transcriptContent}
                onTranscriptChange={setTranscriptContent}
                department={selectedDepartment}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Style Guides Admin Modal ── */}
      {isStyleGuidesAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-orange-50 to-white border border-orange-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(249,115,22,0.12)] rounded-3xl w-full max-w-xl p-4 relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">

            <button 
              onClick={() => setIsStyleGuidesAdminModalOpen(false)} 
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-orange-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 flex-shrink-0">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">Manage Style Guides</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Add, rename, or remove formatting guides per department</p>
              </div>
            </div>

            {/* Add Department Form */}
            <div className="mb-3 bg-orange-50/80 border border-orange-200/50 rounded-xl p-3 flex-shrink-0">
              <p className="text-[10px] font-bold text-orange-600 mb-1.5">Add New Department</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Finance Transcription"
                  className="flex-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 transition-all duration-200"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  disabled={isAddingDepartment}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddStyleGuideDept(newDepartmentName)
                    }
                  }}
                />
                <button
                  onClick={() => handleAddStyleGuideDept(newDepartmentName)}
                  disabled={isAddingDepartment || !newDepartmentName.trim()}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-1.5 text-[10px] font-bold text-white transition-all duration-300 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isAddingDepartment ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>

            {/* Department Tiles */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {isLoadingStyleGuides ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
                  <svg className="h-6 w-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <span className="text-xs">Loading departments...</span>
                </div>
              ) : styleGuides.length === 0 ? (
                <div className="text-center py-14 text-zinc-400">
                  <p className="text-sm font-medium">No departments found. Add one above to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {styleGuides.map((guide: any) => {
                    const { icon: Icon, color, bg } = getDepartmentIcon(guide.department)
                    return (
                      <div key={guide.id} className="group relative flex flex-col items-center text-center rounded-xl border border-orange-100 bg-white hover:bg-orange-50 hover:border-orange-300/60 p-3 transition-all duration-300 shadow-sm hover:shadow-md">
                        
                        {/* Delete department button */}
                        <button
                          onClick={() => handleDeleteStyleGuideDept(guide.id, guide.department)}
                          disabled={isDeletingDeptId === guide.id}
                          className="absolute right-2 top-2 text-zinc-300 hover:text-red-500 hover:scale-110 transition-all duration-200 p-1 cursor-pointer"
                          title="Delete Department"
                        >
                          {isDeletingDeptId === guide.id ? (
                            <svg className="h-3 w-3 animate-spin text-red-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          ) : (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          )}
                        </button>

                        {/* Icon */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bg} ${color} group-hover:scale-110 transition-all duration-300 mb-2`}>
                          <Icon className="h-5 w-5" />
                        </div>

                      {/* Title / Rename */}
                      {renamingDepartmentId === guide.id ? (
                        <div className="w-full space-y-2 mb-3">
                          <input
                            type="text"
                            autoFocus
                            className="w-full rounded-xl border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs text-zinc-800 text-center outline-none focus:ring-2 focus:ring-orange-200/50"
                            value={renamingValue}
                            onChange={(e) => setRenamingValue(e.target.value)}
                            disabled={isRenamingDept === guide.id}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameStyleGuideDept(guide.id, guide.department, renamingValue)
                              } else if (e.key === 'Escape') {
                                setRenamingDepartmentId(null)
                              }
                            }}
                          />
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleRenameStyleGuideDept(guide.id, guide.department, renamingValue)}
                              disabled={isRenamingDept === guide.id || !renamingValue.trim()}
                              className="rounded-lg bg-orange-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-orange-600 transition shadow-md shadow-orange-500/25"
                            >
                              {isRenamingDept === guide.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => setRenamingDepartmentId(null)}
                              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 group/title mb-1">
                          <p className="text-sm font-bold text-zinc-800 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">{guide.department}</p>
                          <button
                            onClick={() => {
                              setRenamingDepartmentId(guide.id)
                              setRenamingValue(guide.department)
                            }}
                            className="opacity-0 group-hover/title:opacity-100 text-zinc-400 hover:text-orange-500 p-0.5 transition-opacity cursor-pointer flex-shrink-0"
                            title="Rename Department"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </div>
                      )}

                      {/* File info / Note */}
                      {guide.file_url ? (
                        <div className="w-full space-y-2 mt-auto">
                          <a 
                            href={guide.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-[11px] text-orange-600 font-semibold underline truncate hover:text-orange-700 transition-colors"
                          >
                            {guide.file_name || 'View file'}
                          </a>
                          <button
                            onClick={() => handleStyleGuideDelete(guide.department)}
                            disabled={isDeletingStyleGuide === guide.department}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isDeletingStyleGuide === guide.department ? (
                              <svg className="h-3 w-3 animate-spin text-red-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            )}
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-full mt-auto">
                          {editingNote?.department === guide.department ? (
                            <div className="space-y-2 text-left">
                              <textarea
                                autoFocus
                                rows={2}
                                className="w-full rounded-xl border border-orange-200 bg-orange-50/50 px-3 py-1.5 text-xs text-zinc-700 outline-none resize-none focus:ring-2 focus:ring-orange-200/50 placeholder-zinc-400"
                                placeholder="Type a note for workers…"
                                value={editingNote?.value || ''}
                                onChange={(e) => setEditingNote({ department: guide.department, value: e.target.value })}
                              />
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleStyleGuideNoteSave(guide.department, editingNote?.value || '')}
                                  disabled={isSavingNote === guide.department}
                                  className="rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-1 text-[11px] font-semibold text-white transition disabled:opacity-50 cursor-pointer"
                                >
                                  {isSavingNote === guide.department ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingNote({ department: guide.department, value: guide.note || '' })}
                              className="text-[11px] text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer italic"
                            >
                              {guide.note || 'Add a note…'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Upload control */}
                      <label className={`w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 cursor-pointer transition-all duration-250 ${isUploadingStyleGuide === guide.department ? 'border-orange-400 bg-orange-100' : 'border-orange-200 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50'}`}>
                        {isUploadingStyleGuide === guide.department ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            <span className="text-[11px] text-orange-600 font-semibold">Uploading…</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="text-[11px] text-zinc-500 font-medium">{guide.file_url ? 'Replace' : 'Upload'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.txt"
                          disabled={isUploadingStyleGuide !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleStyleGuideUpload(guide.department, file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-orange-100 mt-4">
              <button 
                onClick={() => setIsStyleGuidesAdminModalOpen(false)} 
                className="w-full rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-orange-100 hover:text-zinc-900 hover:border-orange-300 transition-all duration-300 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formatting Rules Admin Modal ── */}
      {isFormattingRulesAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-rose-50 to-white border border-rose-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(244,63,94,0.12)] rounded-3xl w-full max-w-xl p-4 relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">

            <button 
              onClick={() => setIsFormattingRulesAdminModalOpen(false)} 
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 flex-shrink-0">
                <FileEdit className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 bg-clip-text text-transparent">Manage Format Rules</h3>
                <p className="text-[10px] text-zinc-500">Add, edit, or remove transcript formatting rules</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Format Detection */}
              <div className="bg-white border border-rose-200 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-zinc-700 mb-2">Detect Format from Sample Text</h4>
                <div className="space-y-2">
                  <textarea
                    value={sampleTextForDetection}
                    onChange={(e) => setSampleTextForDetection(e.target.value)}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white min-h-[80px] resize-y"
                    placeholder="Paste a sample transcript to detect its format..."
                  />
                  <button
                    onClick={() => {
                      const detected = []
                      const lines = sampleTextForDetection.split('\n')
                      
                      // Detect speaker label format
                      const speakerLabelLines = lines.filter(line => {
                        const trimmed = line.trim()
                        return /^([A-Za-z\s]+)\^(\s*\[.+\])$/.test(trimmed)
                      })
                      if (speakerLabelLines.length > 0) {
                        detected.push({
                          name: 'Speaker Labels',
                          description: 'Speaker labels with ^ and brackets',
                          pattern: '^([A-Za-z\\s]+)\\^(\\s*\\[.+\\])$'
                        })
                      }
                      
                      // Detect double spaces
                      if (sampleTextForDetection.includes('  ')) {
                        detected.push({
                          name: 'No Double Spaces',
                          description: 'Transcript should not contain double spaces',
                          pattern: '^(?!.*  ).*$'
                        })
                      }
                      
                      // Detect multiple dots
                      if (sampleTextForDetection.includes('..')) {
                        detected.push({
                          name: 'No Multiple Dots',
                          description: 'Transcript should not contain consecutive dots',
                          pattern: '^(?!.*\\.\\.).*$'
                        })
                      }
                      
                      // Detect header format
                      const hasCLine = lines.some(line => line.trim().toLowerCase().startsWith('c:'))
                      const hasPLine = lines.some(line => line.trim().toLowerCase().startsWith('p:'))
                      const hasPresentation = lines.some(line => line.trim().toLowerCase() === '+++presentation')
                      
                      if (hasCLine || hasPLine) {
                        detected.push({
                          name: 'Header Format',
                          description: 'Transcript should have C: and/or P: header lines',
                          pattern: '^(C:|P:|\\+\\+\\+presentation)'
                        })
                      }
                      
                      setDetectedFormats(detected)
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 hover:from-rose-600 hover:to-pink-700 hover:shadow-xl hover:shadow-rose-600/40 transition-all duration-300"
                  >
                    Detect Formats
                  </button>
                  
                  {detectedFormats.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <h5 className="text-[10px] font-semibold text-zinc-600">Detected Formats:</h5>
                      {detectedFormats.map((format, index) => (
                        <div key={index} className="bg-rose-50 border border-rose-200 rounded-lg p-2">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-rose-800">{format.name}</span>
                            <button
                              onClick={() => setNewFormattingRule(format)}
                              className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded hover:bg-rose-600 transition"
                            >
                              Use This
                            </button>
                          </div>
                          <p className="text-[10px] text-rose-600">{format.description}</p>
                          <code className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded mt-1 inline-block">{format.pattern}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Rule */}
              <div className="bg-white border border-rose-200 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-zinc-700 mb-2">Add New Format Rule</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFormattingRule.name}
                    onChange={(e) => setNewFormattingRule({...newFormattingRule, name: e.target.value})}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white"
                    placeholder="Rule name (e.g., Fix repeated words)"
                  />
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-700 mb-1 block">Department</label>
                    <select
                      value={newFormattingRule.department}
                      onChange={(e) => setNewFormattingRule({...newFormattingRule, department: e.target.value})}
                      className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white"
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
                  <textarea
                    value={newFormattingRule.description}
                    onChange={(e) => setNewFormattingRule({...newFormattingRule, description: e.target.value})}
                    className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white min-h-[60px] resize-y"
                    placeholder="Description (e.g., Find and fix repeated words)"
                  />
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-700 mb-1 block">Pattern (what to find)</label>
                    <input
                      type="text"
                      value={newFormattingRule.pattern}
                      onChange={(e) => setNewFormattingRule({...newFormattingRule, pattern: e.target.value})}
                      className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white"
                      placeholder="e.g., because -- because"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-700 mb-1 block">Suggestion (what it should be)</label>
                    <input
                      type="text"
                      value={newFormattingRule.replacement}
                      onChange={(e) => setNewFormattingRule({...newFormattingRule, replacement: e.target.value})}
                      className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all bg-white"
                      placeholder="e.g., because"
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-[9px] text-green-800">
                      <strong>📝 Example:</strong> To fix repeated words with "--"
                      <br/>• <strong>Pattern:</strong> "be -- be" (will match ANY "word -- word")
                      <br/>• <strong>Suggestion:</strong> "be" (will suggest the single word)
                      <br/><em>(The pattern is generic and works for any repeated word)</em>
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!newFormattingRule.name || !newFormattingRule.pattern) {
                        alert('Please enter a rule name and pattern')
                        return
                      }
                      try {
                        const res = await fetch('/api/formatting-rules', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newFormattingRule)
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'Failed to add rule')
                        await fetchFormattingRules()
                        // Reload validation rules to include the new formatting rule
                        const { data: newRules, error: rulesError } = await supabase
                          .from('formatting_rules')
                          .select('*')
                        if (!rulesError && newRules) {
                          const formattingRulesMapped = newRules.map((r: any) => ({
                            id: r.id,
                            rule_name: r.name,
                            department: r.department,
                            category: 'formatting',
                            find: r.pattern,
                            replace: r.replacement || '',
                            enabled: true,
                            is_regex: false
                          }))
                          setValidationRules(prev => [...prev.filter(r => r.category !== 'formatting'), ...formattingRulesMapped])
                        }
                        setNewFormattingRule({ name: "", description: "", pattern: "", replacement: "", department: "all" })
                        setToastMessage('✅ Format rule added successfully')
                        setShowToast(true)
                        setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
                      } catch (err: any) {
                        console.error('Add rule error:', err)
                        alert('Failed to add rule: ' + (err.message || 'Unknown error'))
                      }
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 hover:from-rose-600 hover:to-pink-700 hover:shadow-xl hover:shadow-rose-600/40 transition-all duration-300"
                  >
                    Add Rule
                  </button>
                </div>
              </div>

              {/* Existing Rules */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-700">Existing Rules</h4>
                {isLoadingFormattingRules ? (
                  <div className="text-center text-zinc-500 text-xs py-4">Loading...</div>
                ) : formattingRules.length === 0 ? (
                  <div className="text-center text-zinc-500 text-xs py-4">No formatting rules yet</div>
                ) : (
                  formattingRules.map((rule: any) => (
                    <div key={rule.id} className="bg-white border border-rose-200 rounded-lg p-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-xs font-semibold text-zinc-800">{rule.name}</h5>
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full capitalize">
                            {rule.department === 'all' ? 'All Departments' : rule.department}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">{rule.description}</p>
                        <code className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-1 inline-block">{rule.pattern}</code>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this rule?')) return
                          if (!rule.id) {
                            alert('Error: Rule ID is missing')
                            return
                          }
                          try {
                            console.log('[Delete formatting rule] Rule ID:', rule.id)
                            const res = await fetch(`/api/formatting-rules/${rule.id}`, { method: 'DELETE' })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error || 'Failed to delete rule')
                            await fetchFormattingRules()
                            // Reload validation rules to remove the deleted formatting rule
                            const { data: newRules, error: rulesError } = await supabase
                              .from('formatting_rules')
                              .select('*')
                            if (!rulesError) {
                              const formattingRulesMapped = (newRules || []).map((r: any) => ({
                                id: r.id,
                                rule_name: r.name,
                                department: r.department,
                                category: 'formatting',
                                find: r.pattern,
                                replace: r.replacement || '',
                                enabled: true,
                                is_regex: false
                              }))
                              setValidationRules(prev => [...prev.filter(r => r.category !== 'formatting'), ...formattingRulesMapped])
                            }
                            setToastMessage('✅ Format rule deleted')
                            setShowToast(true)
                            setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
                          } catch (err: any) {
                            console.error('Delete rule error:', err)
                            alert('Failed to delete rule: ' + (err.message || 'Unknown error'))
                          }
                        }}
                        className="text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 pt-4 border-t border-rose-100 mt-4">
              <button 
                onClick={() => setIsFormattingRulesAdminModalOpen(false)} 
                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-rose-100 hover:text-zinc-900 hover:border-rose-300 transition-all duration-300 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Issue Modal ── */}
      {isReportIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-red-50 to-white border border-red-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(239,68,68,0.12)] rounded-3xl w-full max-w-xl p-4 relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <button 
              onClick={() => setIsReportIssueModalOpen(false)} 
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-red-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Report Validator Issue</h3>
              <p className="text-[10px] text-zinc-600 mt-1">Report any issues with the Transcript Validation Engine to the admin</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-zinc-700 mb-1 block">Issue Description</label>
                <textarea
                  value={reportIssueDescription}
                  onChange={(e) => setReportIssueDescription(e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white min-h-[120px] resize-y"
                  placeholder="Describe the issue you encountered with the validator..."
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-[9px] text-red-800">
                  <strong>ℹ️ Info:</strong> Your report will include the current transcript content and department for admin review.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-red-100 mt-4">
              <button
                onClick={async () => {
                  if (!reportIssueDescription.trim()) {
                    alert('Please describe the issue')
                    return
                  }
                  setIsSubmittingReport(true)
                  try {
                    const res = await fetch('/api/validator-issue-reports', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        worker_id: user?.id || 'unknown',
                        worker_name: user?.full_name || 'Unknown Worker',
                        transcript_content: transcriptContent,
                        issue_description: reportIssueDescription,
                        department: selectedDepartment
                      })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to submit report')
                    setReportIssueDescription('')
                    setIsReportIssueModalOpen(false)
                    setToastMessage('✅ Issue reported successfully')
                    setShowToast(true)
                    setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
                  } catch (err: any) {
                    console.error('Report issue error:', err)
                    alert('Failed to report issue: ' + (err.message || 'Unknown error'))
                  } finally {
                    setIsSubmittingReport(false)
                  }
                }}
                disabled={isSubmittingReport}
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-rose-700 hover:shadow-xl hover:shadow-red-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Validator Issue Reports Modal ── */}
      {isValidatorReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-red-50 to-white border border-red-200/60 backdrop-blur-xl shadow-[0_8px_60px_rgba(239,68,68,0.12)] rounded-3xl w-full max-w-2xl p-4 relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <button 
              onClick={() => setIsValidatorReportsModalOpen(false)} 
              className="absolute right-4 top-4 z-10 cursor-pointer text-zinc-400 hover:text-red-500 hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Validator Issue Reports</h3>
              <p className="text-[10px] text-zinc-600 mt-1">View and manage reported validator issues from workers</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingValidatorReports ? (
                <div className="text-center text-zinc-500 text-xs py-8">Loading reports...</div>
              ) : validatorReports.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-8">No issue reports yet</div>
              ) : (
                validatorReports.map((report: any) => (
                  <div key={report.id} className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-zinc-800">{report.worker_name}</span>
                          <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full capitalize">
                            {report.department}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-zinc-100 text-zinc-700'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600">{new Date(report.created_at).toLocaleString()}</p>
                      </div>
                      {report.status === 'pending' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/validator-issue-reports', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: report.id, status: 'resolved' })
                              })
                              if (res.ok) {
                                await fetchValidatorReports()
                                setToastMessage('✅ Report marked as resolved')
                                setShowToast(true)
                                setTimeout(() => { setShowToast(false); setToastMessage(null) }, 3000)
                              }
                            } catch (err) {
                              console.error('Error updating report status:', err)
                            }
                          }}
                          className="text-[9px] bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-700 bg-red-50 p-2 rounded mb-2">{report.issue_description}</p>
                    <div className="bg-zinc-50 p-2 rounded max-h-24 overflow-y-auto">
                      <p className="text-[9px] text-zinc-600 font-mono whitespace-pre-wrap">{report.transcript_content.substring(0, 200)}{report.transcript_content.length > 200 ? '...' : ''}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-red-100 mt-4">
              <button 
                onClick={() => setIsValidatorReportsModalOpen(false)} 
                className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-red-100 hover:text-zinc-900 hover:border-red-300 transition-all duration-300 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Current Assignments Modal ── */}
      {isCurrentAssignmentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-white to-zinc-50 rounded-3xl shadow-2xl shadow-zinc-500/20 w-full max-w-xl p-4 relative border border-zinc-200 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsCurrentAssignmentsModalOpen(false)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 transition-colors"><X className="h-4 w-4" /></button>
            
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-0.5 flex-shrink-0">Current Assignments</h3>
                <p className="text-[10px] text-zinc-600">View your active work assignments</p>
              </div>
              {isAdmin && (
                <button onClick={() => { setIsCurrentAssignmentsModalOpen(false); setEditAssignmentId(null); setNewAssignmentFilename(''); setNewAssignmentDescription(''); setIsAddAssignmentModalOpen(true) }} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-all shadow-sm hover:shadow-md">
                  <span>+</span> Add Assignment
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 mb-3">
              <div className="space-y-1">
                <div className="grid gap-1 items-center bg-zinc-100/80 px-2.5 py-2 border-b border-zinc-200/60 rounded-t-lg" style={{ gridTemplateColumns: effectiveHeaderTemplate }}>
                  <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Filename</div>
                  <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Status</div>
                  {isAdmin && <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Actions</div>}
                </div>
                {showAllSubmittedMessage ? (
                  <div className="text-center py-3 flex flex-col items-center gap-1.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700">All Assignments Submitted</p>
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 font-medium py-3">No assignments for this worker.</p>
                ) : (
                  <div className="space-y-1">
                    {assignments.map((a: any) => (
                      <div key={a.id} className="grid gap-1 items-center py-1.5 px-2.5 rounded-md border border-zinc-200/60 bg-white hover:bg-zinc-50/80 transition-all" style={{ gridTemplateColumns: effectiveRowTemplate }}>
                        <div>
                          <button type="button" onClick={() => { setSelectedAssignment(a); setIsCurrentAssignmentsModalOpen(false); if (profile?.id) localStorage.setItem(`last_viewed_description_${profile.id}_${a.id}`, new Date().toISOString()); setAssignmentsWithUpdatedDescription(prev => { const newSet = new Set(prev); newSet.delete(a.id); return newSet }) }} className="text-xs font-bold text-slate-900 underline-offset-4 hover:underline flex items-center gap-2">
                            {getDisplayFileName(a.filename)}
                            {assignmentsWithUpdatedDescription.has(a.id) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse shadow-sm">REVISED</span>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          {a.status === 'done' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><span aria-hidden="true">✓</span><span>Done</span></span>
                          ) : a.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800"><span aria-hidden="true">✕</span><span>Cancelled</span></span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"><span aria-hidden="true">⏳</span><span>Pending</span></span>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            {a.status !== 'cancelled' && (
                              <button onClick={() => cancelAssignment(a.id)} className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 hover:bg-orange-100 transition-all border border-orange-200">
                                <X className="h-3 w-3" /> Cancel
                              </button>
                            )}
                            <button onClick={() => {
                              setEditAssignmentId(a.id)
                              setNewAssignmentFilename(a.filename)
                              setNewAssignmentDescription(a.description || '')
                              setIsAddAssignmentModalOpen(true)
                            }} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-all border border-blue-200">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={() => deleteAssignment(a.id)} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-100 transition-all border border-red-200">
                              <X className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200/60 pt-3 mt-3 flex justify-end flex-shrink-0">
              <button 
                type="button" 
                onClick={() => setIsCurrentAssignmentsModalOpen(false)} 
                className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Weekly Availability Modal ── */}
      {isAvailabilityModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-green-50 rounded-3xl shadow-2xl shadow-emerald-950/20 w-full max-w-lg p-6 relative border border-green-200 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsAvailabilityModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-colors"><X className="h-5 w-5" /></button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 flex-shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Weekly Availability</h3>
                <p className="text-xs text-zinc-600">Weekly Availability will automatically reset every Saturday.</p>
              </div>
            </div>


            {/* Locked badge (workers who already submitted this week) */}
            {isAvailabilityLockedThisWeek && (
              <div className="flex-shrink-0 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs flex-shrink-0">✓</span>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Availability submitted for this week</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Your schedule has been recorded. You may update it again next week.</p>
                </div>
              </div>
            )}

            {/* Admin override notice */}
            {isAdmin && availabilitySubmittedAt && (
              <div className="flex-shrink-0 mb-4 rounded-2xl bg-sky-50 border border-sky-200 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sky-500 text-sm">🔓</span>
                  <p className="text-xs text-sky-850 font-medium">Admin override — you can edit or reset this worker's availability.</p>
                </div>
                <button
                  type="button"
                  onClick={resetAvailability}
                  disabled={isResettingAvailability}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50 flex-shrink-0"
                >
                  {isResettingAvailability ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            )}

            {/* Day-by-Day Availability Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mb-5 pr-1">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map(day => (
                <div key={day} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 rounded-xl border transition-all duration-150 ${isAvailabilityLockedThisWeek ? 'bg-zinc-50 border-zinc-100 opacity-80' : 'bg-zinc-50/50 border-zinc-100 hover:bg-zinc-50'}`}>
                  <span className="text-xs font-bold text-zinc-800 capitalize flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${(availabilityForm[day]?.sameday || availabilityForm[day]?.overnight) ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                    {day}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isAvailabilityLockedThisWeek}
                      onClick={() => toggleDayAvailability(day, 'sameday')}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold border transition-all duration-200 disabled:cursor-not-allowed ${
                        availabilityForm[day]?.sameday
                          ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-500/25'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:enabled:bg-zinc-100 hover:enabled:border-zinc-300'
                      }`}
                    >
                      {availabilityForm[day]?.sameday ? '✓ Sameday' : 'Sameday'}
                    </button>
                    <button
                      type="button"
                      disabled={isAvailabilityLockedThisWeek}
                      onClick={() => toggleDayAvailability(day, 'overnight')}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold border transition-all duration-200 disabled:cursor-not-allowed ${
                        availabilityForm[day]?.overnight
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:enabled:bg-zinc-100 hover:enabled:border-zinc-300'
                      }`}
                    >
                      {availabilityForm[day]?.overnight ? '✓ Overnight' : 'Overnight'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsAvailabilityModalOpen(false)} className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm">
                {isAvailabilityLockedThisWeek ? 'Close' : 'Cancel'}
              </button>
              {!isAvailabilityLockedThisWeek && (
                <button type="button" onClick={saveAvailability} disabled={isSavingAvailability} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/50 hover:shadow-xl disabled:opacity-50 transition-all">
                  {isSavingAvailability ? 'Saving...' : 'Save Availability'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isPaymentHistoryModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 rounded-3xl shadow-2xl shadow-violet-500/20 w-full ${isAdmin ? 'max-w-2xl' : 'max-w-md'} p-6 relative border-2 border-violet-200/80 max-h-[90vh] flex flex-col`}>
            <button onClick={() => setIsPaymentHistoryModalOpen(false)} className="absolute right-4 top-4 text-violet-400 hover:text-violet-700 transition-colors"><X className="h-5 w-5" /></button>
            
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/30 mb-4 flex-shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 mb-1 flex-shrink-0">Payment History</h3>
            <p className="text-xs text-zinc-600 mb-4 flex-shrink-0">
              {isAdmin ? "Add and view payments for this worker." : "View all your past payments received."}
            </p>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
              {isAdmin && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-violet-100 shadow-sm">
                  <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wider mb-3">Add Payment (Admin Only)</h4>
                  <form onSubmit={addPaymentRecord} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Sender's Bank</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GCash, BDO, PayPal" 
                        value={paymentHistoryForm.senderBank} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, senderBank: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Reference Number</label>
                      <input 
                        type="text" 
                        placeholder="Transaction ID / Receipt #" 
                        value={paymentHistoryForm.referenceNumber} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, referenceNumber: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Recipient Bank</label>
                      <input 
                        type="text" 
                        placeholder="e.g. BPI, Metrobank, GCash" 
                        value={paymentHistoryForm.recipientBank} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, recipientBank: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
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
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Date Sent</label>
                      <input 
                        type="date" 
                        value={paymentHistoryForm.dateSent} 
                        onChange={(e) => setPaymentHistoryForm({ ...paymentHistoryForm, dateSent: e.target.value })} 
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
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
                        className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 transition-all bg-white" 
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end mt-2">
                      <button 
                        type="submit" 
                        disabled={isAddingPaymentRecord} 
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all"
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
                                <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider">{r.bank_type}</span>
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
                        <div className="text-xs text-zinc-500">{(() => { const [y, m, day] = r.cutoff_start.split('-').map(Number); const month = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' }); const cutoff = day <= 14 ? 'First Cutoff' : 'Second Cutoff'; return `${month} ${y} — ${cutoff}`; })()}</div>
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

      {isAssignmentCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => {
              setIsAssignmentCommentModalOpen(false)
              setAssignmentComment('')
              setAssignmentFilename('')
              setSelectedWorkerForComment(null)
            }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Send Assignment Comment</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Select Worker</label>
                <select
                  value={selectedWorkerForComment?.id || ''}
                  onChange={(e) => {
                    const worker = allWorkers.find(w => w.id === e.target.value)
                    setSelectedWorkerForComment(worker)
                  }}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a worker...</option>
                  {allWorkers.filter((w: any) => w.role === 'worker').map((worker: any) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name} ({worker.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Assignment Filename</label>
                <input
                  type="text"
                  value={assignmentFilename}
                  onChange={(e) => setAssignmentFilename(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter the assignment filename..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Comment</label>
                <textarea
                  value={assignmentComment}
                  onChange={(e) => setAssignmentComment(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-zinc-300 px-3 py-3 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Write your comment about the assignment..."
                />
              </div>
              <div className="text-xs text-zinc-500">
                {assignmentComment.length} characters
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => {
                setIsAssignmentCommentModalOpen(false)
                setAssignmentComment('')
                setAssignmentFilename('')
                setSelectedWorkerForComment(null)
              }} className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
              <button type="button" onClick={sendAssignmentComment} disabled={!selectedWorkerForComment || !assignmentComment.trim() || isSendingComment} className="inline-flex items-center justify-center rounded-md bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition disabled:opacity-50">
                {isSendingComment ? 'Sending...' : 'Send Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditWorkerModalOpen && activeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsEditWorkerModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900 z-10"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Worker Details</h3>
            <form onSubmit={handleSaveWorkerDetails} className="space-y-4 overflow-y-auto flex-1 pr-2">
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
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Department Permissions</label>
                <div className="space-y-2">
                  {['conference', 'senate', 'academics', 'broadcast', 'podcast', 'medical'].map((dept) => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editWorkerForm.departmentPermissions.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditWorkerForm({
                              ...editWorkerForm,
                              departmentPermissions: [...editWorkerForm.departmentPermissions, dept]
                            })
                          } else {
                            setEditWorkerForm({
                              ...editWorkerForm,
                              departmentPermissions: editWorkerForm.departmentPermissions.filter(d => d !== dept)
                            })
                          }
                        }}
                        className="rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-zinc-700 capitalize">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
            <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-200">
              <button type="button" onClick={() => setIsEditWorkerModalOpen(false)} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
              <button type="button" onClick={handleSaveWorkerDetails} disabled={isUpdatingWorkerDetails} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50">
                {isUpdatingWorkerDetails ? 'Saving...' : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</span>}
              </button>
            </div>
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

      {isAssignmentReportIssueModalOpen && reportIssueAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setIsAssignmentReportIssueModalOpen(false); setIssueDescription(''); setReportIssueAssignment(null) }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>
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
                <button onClick={() => { setIsAssignmentReportIssueModalOpen(false); setIssueDescription(''); setReportIssueAssignment(null) }} className="flex-1 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition">Cancel</button>
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
