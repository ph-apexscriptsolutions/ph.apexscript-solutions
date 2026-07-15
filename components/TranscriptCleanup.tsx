'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Check, X, Clock, MessageSquare, Repeat, User, FileEdit } from 'lucide-react'

interface CleanupOptions {
  removeTimestamps: boolean
  removeFillerWords: boolean
  removeImmediateRepetitions: boolean
}

interface CleanupSummary {
  timestampsRemoved: number
  fillerWordsRemoved: number
  repetitionsRemoved: number
}

interface SpeakerName {
  name: string
}

interface TranscriptCleanupProps {
  transcript: string
  onTranscriptChange: (transcript: string) => void
  department?: string
}

const FILLER_WORDS = [
  'um', 'uh', 'ah', 'er', 'erm', 'hmm', 'mm', 'mmm'
]

export default function TranscriptCleanup({ transcript, onTranscriptChange, department = 'conference' }: TranscriptCleanupProps) {
  const [options, setOptions] = useState<CleanupOptions>({
    removeTimestamps: true,
    removeFillerWords: true,
    removeImmediateRepetitions: true
  })

  const [summary, setSummary] = useState<CleanupSummary>({
    timestampsRemoved: 0,
    fillerWordsRemoved: 0,
    repetitionsRemoved: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClear = useCallback(() => {
    setOptions({
      removeTimestamps: true,
      removeFillerWords: true,
      removeImmediateRepetitions: true
    })
    setSummary({
      timestampsRemoved: 0,
      fillerWordsRemoved: 0,
      repetitionsRemoved: 0
    })
    setIsProcessing(false)
    onTranscriptChange('')
  }, [onTranscriptChange])

  // Auto-clear data when component unmounts (modal closes)
  useEffect(() => {
    return () => {
      handleClear()
    }
  }, [handleClear])

  const removeTimestamps = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0
    const lines = text.split('\n')

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

    // Track which lines became empty due to timestamp removal
    const linesBecameEmpty = new Set<number>()

    const cleanedLines = lines.map((line, index) => {
      const originalLine = line.trim()
      let cleanedLine = line
      let lineCount = 0

      timestampPatterns.forEach(pattern => {
        const matches = cleanedLine.match(pattern)
        if (matches) {
          lineCount += matches.length
          count += matches.length
          cleanedLine = cleanedLine.replace(pattern, '')
        }
      })

      // Collapse multiple spaces within the line
      cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim()

      // Mark lines that became empty due to timestamp removal
      // (original line had content, but cleaned line is empty)
      if (originalLine.length > 0 && cleanedLine.length === 0) {
        linesBecameEmpty.add(index)
      }

      return cleanedLine
    })

    // Process lines to preserve paragraph structure
    // Remove lines that became empty due to timestamp removal
    // Keep original empty lines as paragraph separators
    const resultLines: string[] = []
    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i]
      const lineBecameEmpty = linesBecameEmpty.has(i)
      const prevLine = resultLines.length > 0 ? resultLines[resultLines.length - 1] : null

      if (line.length > 0) {
        // Content line - add it
        resultLines.push(line)
      } else if (!lineBecameEmpty) {
        // Original empty line - preserve as paragraph separator
        // Only add if previous line wasn't empty (avoid consecutive empty lines)
        if (!prevLine || prevLine.length > 0) {
          resultLines.push(line)
        }
      }
      // Skip lines that became empty due to timestamp removal
    }

    const cleaned = resultLines.join('\n')

    return { cleaned, count }
  }, [])

  const removeFillerWords = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0

    // Process line by line to preserve paragraph structure
    const lines = text.split('\n')
    const cleanedLines = lines
      .map(line => {
        let result = line

        // Remove filler words with their surrounding punctuation and whitespace
        FILLER_WORDS.forEach(fillerWord => {
          // Pattern: word + comma + filler word + comma + word (e.g., "is, um, not")
          const pattern1 = new RegExp(`(\\b[\\w']+\\b)\\s*,\\s*\\b${fillerWord}\\b\\s*,\\s*(\\b[\\w']+\\b)`, 'gi')
          result = result.replace(pattern1, (match, beforeWord, afterWord) => {
            count++
            return beforeWord + ' ' + afterWord
          })
          
          // Pattern: word + comma + filler word (e.g., "is, um")
          const pattern2 = new RegExp(`(\\b[\\w']+\\b)\\s*,\\s*\\b${fillerWord}\\b`, 'gi')
          result = result.replace(pattern2, (match, word) => {
            count++
            return word + ' '
          })
          
          // Pattern: filler word + comma + word (e.g., "um, not")
          const pattern3 = new RegExp(`\\b${fillerWord}\\b\\s*,\\s*(\\b[\\w']+\\b)`, 'gi')
          result = result.replace(pattern3, (match, nextWord) => {
            count++
            return ' ' + nextWord
          })
          
          // Pattern: comma + filler word (e.g., ", um")
          const pattern4 = new RegExp(`,\\s*\\b${fillerWord}\\b`, 'gi')
          result = result.replace(pattern4, (match) => {
            count++
            return ''
          })
          
          // Pattern: filler word + comma (e.g., "um,")
          const pattern5 = new RegExp(`\\b${fillerWord}\\b\\s*,`, 'gi')
          result = result.replace(pattern5, (match) => {
            count++
            return ''
          })
          
          // Pattern: standalone filler word with whitespace (e.g., " um ")
          const pattern6 = new RegExp(`\\s+\\b${fillerWord}\\b\\s+`, 'gi')
          result = result.replace(pattern6, (match) => {
            count++
            return ' '
          })
          
          // Pattern: filler word at beginning
          const pattern7 = new RegExp(`^\\b${fillerWord}\\b\\s+`, 'gi')
          result = result.replace(pattern7, (match) => {
            count++
            return ''
          })
          
          // Pattern: filler word at end
          const pattern8 = new RegExp(`\\s+\\b${fillerWord}\\b$`, 'gi')
          result = result.replace(pattern8, (match) => {
            count++
            return ''
          })
        })

        // Clean up multiple spaces and trim
        result = result.replace(/\s+/g, ' ').trim()
        
        // Clean up any remaining standalone commas
        result = result.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim()
        
        return result
      })

    const cleaned = cleanedLines.join('\n')
    return { cleaned, count }
  }, [])

  const removeImmediateRepetitions = useCallback((text: string): { cleaned: string, count: number } => {
    let count = 0

    // Process line by line to preserve paragraph structure
    const lines = text.split('\n')
    const cleanedLines = lines
      .map(line => {
        let cleanedLine = line

        // First, handle phrase repetitions (multi-word patterns) BEFORE single word repetitions
        // This handles cases like "I think I think I think" -> "I think"
        const phrasePatterns = [
          // Pattern for 3-word phrase repetitions: "word1 word2 word3 word1 word2 word3 word1 word2 word3" -> "word1 word2 word3"
          /(\b[\w']+\b\s+\b[\w']+\b\s+\b[\w']+\b)([\s,.;:!?'"()]+)(\1)([\s,.;:!?'"()]+)(\1)/gi,
          // Pattern for 2-word phrase repetitions: "word1 word2 word1 word2 word1 word2" -> "word1 word2"
          /(\b[\w']+\b\s+\b[\w']+\b)([\s,.;:!?'"()]+)(\1)([\s,.;:!?'"()]+)(\1)/gi,
          // Pattern for 2-word phrase repetitions: "word1 word2 word1 word2" -> "word1 word2"
          /(\b[\w']+\b\s+\b[\w']+\b)([\s,.;:!?'"()]+)(\1)/gi,
          // Pattern for 3-word phrase repetitions: "word1 word2 word3 word1 word2 word3" -> "word1 word2 word3"
          /(\b[\w']+\b\s+\b[\w']+\b\s+\b[\w']+\b)([\s,.;:!?'"()]+)(\1)/gi
        ]

        phrasePatterns.forEach(pattern => {
          cleanedLine = cleanedLine.replace(pattern, (match, phrase, separator1, repetition1, separator2, repetition2) => {
            if (repetition2) {
              count += 2
            } else {
              count += 1
            }
            return phrase
          })
        })

        // Then handle single word repetitions
        // Split into words while preserving whitespace and punctuation
        const words = cleanedLine.split(/(\s+)/)
        const cleanedWords: string[] = []
        const indicesToSkip = new Set<number>()
        const capitalizationMap = new Map<number, string>() // Store capitalization changes
        let i = 0

        while (i < words.length) {
          const currentWord = words[i]
          // Preserve apostrophes for contractions, but remove other punctuation
          const currentWordClean = currentWord.toLowerCase().replace(/[.,!?;:"()]/g, '')

          // Check if this is a word (not whitespace or punctuation)
          if (!/^\s+$/.test(currentWord) && !/^[.,!?;:'"()]+$/.test(currentWord) && currentWordClean.length > 0) {
            // Look for immediate repeated words (with or without punctuation between them)
            let nextIndex = i + 1
            let foundRepetition = false
            let startIndex = i
            let lastRepetitionIndex = i

            // Check if this is at the start of the sentence (after sentence-ending punctuation or start of line)
            let isAtStart = false
            if (i === 0) {
              isAtStart = true
            } else {
              // Check if previous word is sentence-ending punctuation
              let prevIndex = i - 1
              while (prevIndex >= 0 && (/^\s+$/.test(words[prevIndex]) || /^[.,!?;:'"()]+$/.test(words[prevIndex]))) {
                if (/[.!?]$/.test(words[prevIndex])) {
                  isAtStart = true
                  break
                }
                prevIndex--
              }
            }

            // Check forImmediate repetition (next word after whitespace/punctuation)
            while (nextIndex < words.length) {
              // Skip whitespace and punctuation
              if (/^\s+$/.test(words[nextIndex]) || /^[.,!?;:'"()]+$/.test(words[nextIndex])) {
                nextIndex++
                continue
              }

              const nextWord = words[nextIndex]
              // Preserve apostrophes for contractions
              const nextWordClean = nextWord.toLowerCase().replace(/[.,!?;:"()]/g, '')

              // Check if this word is a repetition of the current word
              if (nextWordClean === currentWordClean) {
                foundRepetition = true
                lastRepetitionIndex = nextIndex
                count++
                // Skip the repetition and continue looking for more
                nextIndex++
              } else {
                // Not a repetition, stop looking
                break
              }
            }

            // If we found repetitions, keep only the LAST occurrence and remove earlier ones
            if (foundRepetition) {
              // Mark all indices from startIndex to lastRepetitionIndex-1 for removal
              for (let j = startIndex; j < lastRepetitionIndex; j++) {
                indicesToSkip.add(j)
              }

              // If at start of sentence, capitalize the kept word
              if (isAtStart && lastRepetitionIndex < words.length) {
                const wordToCapitalize = words[lastRepetitionIndex]
                if (wordToCapitalize.length > 0) {
                  capitalizationMap.set(lastRepetitionIndex, wordToCapitalize.charAt(0).toUpperCase() + wordToCapitalize.slice(1))
                }
              }
            }
          }

          i++
        }

        // Build cleaned words array, skipping marked indices and applying capitalization
        for (let i = 0; i < words.length; i++) {
          if (!indicesToSkip.has(i)) {
            if (capitalizationMap.has(i)) {
              cleanedWords.push(capitalizationMap.get(i)!)
            } else {
              cleanedWords.push(words[i])
            }
          }
        }

        return cleanedWords.join('')
      })

    const cleaned = cleanedLines.join('\n')
    return { cleaned, count }
  }, [])

  const standardizeSpeakerLabels = useCallback((text: string, speakers: string[], format: 'conference' | 'senate', detectAnalysts: boolean): { cleaned: string, count: number } => {
    if (speakers.length === 0) return { cleaned: text, count: 0 }

    let count = 0
    let cleaned = text

    speakers.forEach(speaker => {
      const speakerRegex = new RegExp(`^${escapeRegex(speaker)}:`, 'gm')
      const matches = cleaned.match(speakerRegex)

      if (matches) {
        count += matches.length

        // Format based on selected format
        let standardizedLabel: string
        if (format === 'senate') {
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

    // Add context-aware speaker detection
    // When a speaker mentions another speaker's name, add the label
    speakers.forEach(speaker => {
      const nameVariations = [
        speaker,
        speaker.split(' ').pop() || '', // Last name only
        speaker.split(' ')[0] || '' // First name only
      ].filter(n => n.length > 0)

      nameVariations.forEach(variation => {
        // Pattern: "SpeakerName, do you want to add something?" or "SpeakerName, yes"
        const contextPattern = new RegExp(`(${escapeRegex(variation)})(?:,|\\s+do|\\s+yes|\\s+no|\\s+sure|\\s+of course)`, 'gi')
        const matches = cleaned.match(contextPattern)
        if (matches) {
          count += matches.length
          const standardFormat = format === 'conference' ? `${speaker}^` : `${speaker.split(' ').pop()?.toUpperCase() || speaker.toUpperCase()}:`
          // Replace the name mention with the full label
          cleaned = cleaned.replace(contextPattern, standardFormat)
        }
      })
    })

    // Add unidentified speaker labels for unknown speakers
    // Look for patterns that might indicate unidentified speakers
    const unidentifiedPatterns = [
      /(?:speaker|participant|person|individual)(?:\s+\d+)?:/gi,
      /\[unidentified\]/gi,
      /\[unknown\]/gi,
      /\[?\?\?\]?/gi
    ]

    unidentifiedPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern)
      if (matches) {
        count += matches.length
        const unidentifiedLabel = format === 'conference' ? 'Unidentified Speaker^' : 'UNIDENTIFIED SPEAKER:'
        cleaned = cleaned.replace(pattern, unidentifiedLabel)
      }
    })

    // Detect analysts (question askers) if enabled
    if (detectAnalysts) {
      // Look for question patterns that might indicate analysts
      const questionPatterns = [
        /^(?:\w+\s*)+\?$/gm, // Lines ending with ?
        /^(?:\w+\s*)+(?:ask|question|wonder|curious|want to know|can you tell|could you explain)/gim
      ]

      questionPatterns.forEach(pattern => {
        const matches = cleaned.match(pattern)
        if (matches) {
          count += matches.length
          const analystLabel = format === 'conference' ? 'Unidentified Participant^' : 'UNIDENTIFIED PARTICIPANT:'
          // Replace the question line with analyst label
          cleaned = cleaned.replace(pattern, analystLabel)
        }
      })
    }

    return { cleaned, count }
  }, [])

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
        repetitionsRemoved: 0
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

      setSummary(newSummary)
      setIsProcessing(false)

      // Auto-apply the cleaned transcript
      onTranscriptChange(currentText)
    }, 100)
  }, [transcript, options, removeTimestamps, removeFillerWords, removeImmediateRepetitions, onTranscriptChange])

  const hasChanges = summary.timestampsRemoved > 0 || summary.fillerWordsRemoved > 0 || summary.repetitionsRemoved > 0

  return (
    <div className="flex gap-4 h-full">
      {/* Left Column - Cleanup Controls */}
      <div className="w-1/2 bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-200/70 rounded-xl p-4 shadow-sm ring-1 ring-purple-100/50 flex flex-col overflow-hidden">
        <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-purple-600" />
          Transcript Cleanup
        </h3>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 space-y-4 flex-1" style={{ maxHeight: 'calc(100vh - 400px)' }}>

        {/* Cleanup Options */}
        <div className="space-y-3">
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
        </div>
        </div>

        {/* Process Button - Fixed at bottom */}
        <div className="mt-4 flex-shrink-0 flex gap-2">
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="flex-1 rounded-lg bg-gradient-to-r from-zinc-500 via-zinc-600 to-zinc-700 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-zinc-500/30 hover:from-zinc-600 hover:via-zinc-700 hover:to-zinc-800 hover:shadow-xl hover:shadow-zinc-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5"
          >
            Clear
          </button>
          <button
            onClick={processCleanup}
            disabled={isProcessing || !transcript.trim()}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5"
          >
            {isProcessing ? 'Processing...' : 'Process Cleanup'}
          </button>
        </div>

        {/* Cleanup Summary */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-gradient-to-br from-green-50/80 to-emerald-50/80 border border-green-300/60 rounded-lg flex-shrink-0">
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
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Transcript Input */}
      <div className="w-1/2 bg-gradient-to-br from-white via-green-50/40 to-white border border-green-200/70 rounded-xl p-4 shadow-sm ring-1 ring-green-100/50 flex flex-col">
        <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-green-600" />
          Transcript
        </h3>
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          className="flex-1 w-full border border-green-300/60 rounded-lg px-3 py-2 text-xs text-zinc-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/25 transition-all bg-white min-h-[400px] resize-y font-mono shadow-sm leading-relaxed"
          placeholder="Paste your transcript here to clean up..."
        />
      </div>
    </div>
  )
}
