'use client'

import { useState, useCallback, useMemo } from 'react'
import { Check, X, Clock, MessageSquare, Repeat, User } from 'lucide-react'

interface CleanupOptions {
  removeTimestamps: boolean
  removeFillerWords: boolean
  removeImmediateRepetitions: boolean
  automaticSpeakerLabeling: boolean
}

interface CleanupSummary {
  timestampsRemoved: number
  fillerWordsRemoved: number
  repetitionsRemoved: number
  speakerLabelsStandardized: number
}

interface SpeakerName {
  name: string
}

interface TranscriptCleanupProps {
  transcript: string
  onCleanupApplied: (cleanedTranscript: string) => void
  department?: string
}

const FILLER_WORDS = [
  'um', 'uh', 'ah', 'er', 'erm', 'hmm', 'mm', 'mmm'
]

export default function TranscriptCleanup({ transcript, onCleanupApplied, department = 'conference' }: TranscriptCleanupProps) {
  const [options, setOptions] = useState<CleanupOptions>({
    removeTimestamps: true,
    removeFillerWords: true,
    removeImmediateRepetitions: true,
    automaticSpeakerLabeling: false
  })

  const [speakerNames, setSpeakerNames] = useState<string[]>([])
  const [speakerInput, setSpeakerInput] = useState('')
  const [cleanedTranscript, setCleanedTranscript] = useState<string>('')
  const [summary, setSummary] = useState<CleanupSummary>({
    timestampsRemoved: 0,
    fillerWordsRemoved: 0,
    repetitionsRemoved: 0,
    speakerLabelsStandardized: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const addSpeakerName = useCallback(() => {
    if (speakerInput.trim() && !speakerNames.includes(speakerInput.trim())) {
      setSpeakerNames([...speakerNames, speakerInput.trim()])
      setSpeakerInput('')
    }
  }, [speakerInput, speakerNames])

  const removeSpeakerName = useCallback((name: string) => {
    setSpeakerNames(speakerNames.filter(n => n !== name))
  }, [speakerNames])

  const removeTimestamps = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0
    let cleaned = text

    // Match various timestamp formats:
    // 00:00:01 - 00:00:05
    // [00:00:01]
    // 00:15
    // 00:00:00.000
    const timestampPatterns = [
      /\d{2}:\d{2}:\d{2}\s*-\s*\d{2}:\d{2}:\d{2}/g,
      /\[\d{2}:\d{2}:\d{2}\]/g,
      /\[\d{1,2}:\d{2}\]/g,
      /\d{2}:\d{2}:\d{2}\.\d{3}/g,
      /\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{3})?/g
    ]

    timestampPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern)
      if (matches) count += matches.length
      cleaned = cleaned.replace(pattern, '')
    })

    // Clean up extra whitespace left by timestamp removal, but preserve paragraph breaks
    // Process line by line to preserve paragraph structure
    const lines = cleaned.split('\n')
    const cleanedLines = lines.map(line => {
      // Collapse multiple spaces within each line, but preserve the line itself
      return line.replace(/\s+/g, ' ').trim()
    })
    // Join lines back with newlines to preserve paragraph breaks
    cleaned = cleanedLines.join('\n').trim()

    return { cleaned, count }
  }, [])

  const removeFillerWords = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0

    // Process line by line to preserve paragraph structure
    const lines = text.split('\n')
    const cleanedLines = lines.map(line => {
      const words = line.split(/(\s+)/)
      const cleanedWords: string[] = []

      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase().replace(/[.,!?;:'"()]/g, '')

        // Check if this is a standalone filler word
        if (FILLER_WORDS.includes(word)) {
          // Check if it's standalone (not part of another word)
          const prevWord = i > 0 ? words[i - 1].toLowerCase() : ''
          const nextWord = i < words.length - 1 ? words[i + 1].toLowerCase() : ''

          // Only remove if it's truly standalone (surrounded by whitespace or punctuation)
          const isStandalone =
            (!prevWord || /^\s*$/.test(prevWord) || /[.,!?;:'"()]/.test(prevWord)) &&
            (!nextWord || /^\s*$/.test(nextWord) || /[.,!?;:'"()]/.test(nextWord))

          if (isStandalone) {
            count++
            // Remove the filler word and its following whitespace
            if (i < words.length - 1 && /^\s+$/.test(words[i + 1])) {
              cleanedWords.push('') // Skip the filler word
              i++ // Skip the whitespace
            } else {
              cleanedWords.push('') // Skip the filler word
            }
            continue
          }
        }

        cleanedWords.push(words[i])
      }

      return cleanedWords.join('').replace(/\s+/g, ' ').trim()
    })

    const cleaned = cleanedLines.join('\n').trim()
    return { cleaned, count }
  }, [])

  const removeImmediateRepetitions = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0

    // Process line by line to preserve paragraph structure
    const lines = text.split('\n')
    const cleanedLines = lines.map(line => {
      const words = line.split(/(\s+)/)
      const cleanedWords: string[] = []

      for (let i = 0; i < words.length; i++) {
        const currentWord = words[i].toLowerCase().replace(/[.,!?;:'"()]/g, '')
        const nextWord = i < words.length - 1 ? words[i + 1].toLowerCase().replace(/[.,!?;:'"()]/g, '') : ''

        // Check if current word and next word are identical (case-insensitive)
        if (currentWord === nextWord && currentWord.length > 0 && !/^\s+$/.test(words[i])) {
          count++
          cleanedWords.push(words[i]) // Keep one instance
          i++ // Skip the duplicate
          // Also skip whitespace after duplicate
          if (i < words.length - 1 && /^\s+$/.test(words[i + 1])) {
            i++
          }
        } else {
          cleanedWords.push(words[i])
        }
      }

      return cleanedWords.join('').replace(/\s+/g, ' ').trim()
    })

    const cleaned = cleanedLines.join('\n').trim()
    return { cleaned, count }
  }, [])

  const standardizeSpeakerLabels = useCallback((text: string, speakers: string[]): { cleaned: string, count: number } => {
    if (speakers.length === 0) return { cleaned: text, count: 0 }

    let count = 0
    let cleaned = text

    speakers.forEach(speaker => {
      const speakerRegex = new RegExp(`^${escapeRegex(speaker)}:`, 'gm')
      const matches = cleaned.match(speakerRegex)
      
      if (matches) {
        count += matches.length
        
        // Format based on department
        let standardizedLabel: string
        if (department === 'senate') {
          // Senate format: LASTNAME:
          const lastName = speaker.split(' ').pop()?.toUpperCase() || speaker.toUpperCase()
          standardizedLabel = `${lastName}:`
        } else {
          // Conference format: Name^
          standardizedLabel = `${speaker}^`
        }
        
        cleaned = cleaned.replace(speakerRegex, standardizedLabel)
      }
    })

    return { cleaned, count }
  }, [department])

  const escapeRegex = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const processCleanup = useCallback(() => {
    setIsProcessing(true)
    
    // Use setTimeout to allow UI to update before processing
    setTimeout(() => {
      let currentText = transcript
      let newSummary: CleanupSummary = {
        timestampsRemoved: 0,
        fillerWordsRemoved: 0,
        repetitionsRemoved: 0,
        speakerLabelsStandardized: 0
      }

      if (options.removeTimestamps) {
        const result = removeTimestamps(currentText)
        currentText = result.cleaned
        newSummary.timestampsRemoved = result.count
      }

      if (options.removeFillerWords) {
        const result = removeFillerWords(currentText)
        currentText = result.cleaned
        newSummary.fillerWordsRemoved = result.count
      }

      if (options.removeImmediateRepetitions) {
        const result = removeImmediateRepetitions(currentText)
        currentText = result.cleaned
        newSummary.repetitionsRemoved = result.count
      }

      if (options.automaticSpeakerLabeling && speakerNames.length > 0) {
        const result = standardizeSpeakerLabels(currentText, speakerNames)
        currentText = result.cleaned
        newSummary.speakerLabelsStandardized = result.count
      }

      setCleanedTranscript(currentText)
      setSummary(newSummary)
      setIsProcessing(false)
    }, 100)
  }, [transcript, options, speakerNames, removeTimestamps, removeFillerWords, removeImmediateRepetitions, standardizeSpeakerLabels])

  const handleApplyCleanup = useCallback(() => {
    onCleanupApplied(cleanedTranscript)
  }, [cleanedTranscript, onCleanupApplied])

  const handleDiscard = useCallback(() => {
    setCleanedTranscript('')
    setSummary({
      timestampsRemoved: 0,
      fillerWordsRemoved: 0,
      repetitionsRemoved: 0,
      speakerLabelsStandardized: 0
    })
  }, [])

  const hasChanges = cleanedTranscript.length > 0

  return (
    <div className="bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-4 shadow-sm ring-1 ring-purple-100/50">
      <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-600" />
        Transcript Cleanup
      </h3>

      {/* Cleanup Options */}
      <div className="space-y-3 mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.removeTimestamps}
            onChange={(e) => setOptions({ ...options, removeTimestamps: e.target.checked })}
            className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-zinc-700">Remove Timestamps</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.removeFillerWords}
            onChange={(e) => setOptions({ ...options, removeFillerWords: e.target.checked })}
            className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-zinc-700">Remove Filler Words</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.removeImmediateRepetitions}
            onChange={(e) => setOptions({ ...options, removeImmediateRepetitions: e.target.checked })}
            className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-zinc-700">Remove Immediate Word Repetitions</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.automaticSpeakerLabeling}
            onChange={(e) => setOptions({ ...options, automaticSpeakerLabeling: e.target.checked })}
            className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-zinc-700">Automatic Speaker Labeling</span>
          </div>
        </label>
      </div>

      {/* Speaker Names Input */}
      {options.automaticSpeakerLabeling && (
        <div className="mb-4 p-3 bg-purple-50/50 rounded-lg border border-purple-200/60">
          <label className="text-[10px] font-bold text-zinc-700 mb-2 block">Confirmed Speaker Names</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={speakerInput}
              onChange={(e) => setSpeakerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSpeakerName()}
              placeholder="Enter speaker name"
              className="flex-1 rounded-md border border-purple-300/60 px-3 py-1.5 text-xs text-zinc-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all bg-white"
            />
            <button
              onClick={addSpeakerName}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {speakerNames.map((name) => (
              <div
                key={name}
                className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-purple-200/60 text-xs text-zinc-700"
              >
                {name}
                <button
                  onClick={() => removeSpeakerName(name)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={processCleanup}
        disabled={isProcessing || !transcript.trim()}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5"
      >
        {isProcessing ? 'Processing...' : 'Process Cleanup'}
      </button>

      {/* Cleanup Summary */}
      {hasChanges && (
        <div className="mt-4 p-3 bg-gradient-to-br from-green-50/80 to-emerald-50/80 border border-green-300/60 rounded-lg">
          <h4 className="text-[10px] font-bold text-green-900 mb-2 flex items-center gap-1.5">
            <Check className="h-3 w-3" />
            Cleanup Summary
          </h4>
          <div className="space-y-1">
            {summary.timestampsRemoved > 0 && (
              <div className="text-[10px] text-green-800 flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                {summary.timestampsRemoved} timestamps removed
              </div>
            )}
            {summary.fillerWordsRemoved > 0 && (
              <div className="text-[10px] text-green-800 flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                {summary.fillerWordsRemoved} filler words removed
              </div>
            )}
            {summary.repetitionsRemoved > 0 && (
              <div className="text-[10px] text-green-800 flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                {summary.repetitionsRemoved} repeated words removed
              </div>
            )}
            {summary.speakerLabelsStandardized > 0 && (
              <div className="text-[10px] text-green-800 flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                {summary.speakerLabelsStandardized} speaker labels standardized
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDiscard}
            className="flex-1 rounded-lg border border-zinc-300/60 bg-white px-4 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 transition-all duration-300 shadow-sm"
          >
            Discard
          </button>
          <button
            onClick={handleApplyCleanup}
            className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300"
          >
            Apply Cleanup
          </button>
        </div>
      )}
    </div>
  )
}
