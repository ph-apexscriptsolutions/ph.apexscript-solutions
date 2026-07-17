// Transcript Validation Engine
// Rule-based validation without AI/LLMs

import Typo from 'typo-js'

// Initialize spell checker with English dictionary
let spellChecker: Typo | null = null

export async function initializeSpellChecker() {
  if (spellChecker) return spellChecker
  
  try {
    // Load dictionary from CDN (browser-compatible)
    const affResponse = await fetch('https://cdn.jsdelivr.net/npm/typo-js/dictionaries/en_US/en_US.aff')
    const dicResponse = await fetch('https://cdn.jsdelivr.net/npm/typo-js/dictionaries/en_US/en_US.dic')
    
    const affData = await affResponse.text()
    const dicData = await dicResponse.text()
    
    spellChecker = new Typo('en_US', affData, dicData)
    return spellChecker
  } catch (error) {
    console.error('Failed to initialize spell checker:', error)
    return null
  }
}

// Progress callback interface
export interface ValidationProgress {
  stage: string
  current: number
  total: number
  message: string
}

export interface ValidationIssue {
  id: string
  category: 'style' | 'name' | 'company' | 'spelling' | 'formatting'
  ruleName?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  foundText: string
  suggestedCorrection: string
  line: number
  column: number
  ignored: boolean
}

export interface Participant {
  name: string
  position: string
  company: string
  type: 'board' | 'analyst'
}

export interface ValidationRule {
  id: number
  rule_name: string
  department: string
  category: string
  find: string
  replace: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  enabled: boolean
  is_regex?: boolean
  case_sensitive?: boolean
}

// Extract Senate speakers from transcript
export interface ExtractedSenateSpeaker {
  type: 'participant' | 'witness'
  fullName: string
  lastName: string
  lastNameUpper: string
  label: string
}

export function extractSenateSpeakers(transcript: string): { participants: ExtractedSenateSpeaker[], witnesses: ExtractedSenateSpeaker[], transcriptStartIndex: number } {
  const participants: ExtractedSenateSpeaker[] = []
  const witnesses: ExtractedSenateSpeaker[] = []
  const lines = transcript.split('\n')
  const speakerLabels = new Set<string>()
  
  // Find the transcript start marker [*]
  let transcriptStartIndex = 0
  let foundTranscriptStart = false
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '[*]') {
      transcriptStartIndex = i + 1
      foundTranscriptStart = true
      break
    }
  }
  
  console.log('[extractSenateSpeakers] Transcript start marker found:', foundTranscriptStart, 'at line:', transcriptStartIndex)
  
  // Extract speaker labels from the actual transcript (after [*])
  for (let i = transcriptStartIndex; i < lines.length; i++) {
    const match = lines[i].match(/^([A-Z]{2,}):\s*(.*)/)
    if (match) {
      speakerLabels.add(match[1])
    }
  }
  
  // Extract participants from PARTICIPANTS section (before [*])
  // Handle both ALL CAPS and mixed case formats
  // Handle both R-State, R-S.D., R-S.DOT formats (state codes can have dots)
  const participantsPattern = /(?:SEN\.|REP\.|Sen\.|Rep\.)\s+([A-Za-z\s]+),\s+[RD]-[A-Za-z]{1,4}(?:\.[A-Za-z]{0,2})?/g
  let match
  
  while ((match = participantsPattern.exec(transcript)) !== null) {
    const fullName = match[1].trim()
    // Convert to title case if it's all caps
    const titleCaseName = fullName.toUpperCase() === fullName 
      ? fullName.split(/\s+/).map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
      : fullName
    
    const nameParts = titleCaseName.split(/\s+/)
    const lastName = nameParts[nameParts.length - 1]
    const lastNameUpper = lastName.toUpperCase()
    
    // Check if this speaker has a label in the transcript
    const label = speakerLabels.has(lastNameUpper) ? lastNameUpper : ''
    
    participants.push({
      type: 'participant',
      fullName: titleCaseName,
      lastName,
      lastNameUpper,
      label
    })
  }
  
  // Extract witnesses from WITNESSES section (before [*])
  // Handle various witness formats
  const witnessPatterns = [
    /(?:HONORABLE|Honorable)\s+([A-Za-z\s]+)(?:,\s+[^.]+\.?)/g,
    /(?:DR\.|Dr\.)\s+([A-Za-z\s]+)(?:,\s+to be\s+[^.]+\.?)/g,
    /(?:MR\.|Mr\.|MS\.|Ms\.|MRS\.|Mrs\.)\s+([A-Za-z\s]+)(?:,\s+[^.]+\.?)/g
  ]
  
  for (const pattern of witnessPatterns) {
    while ((match = pattern.exec(transcript)) !== null) {
      const fullName = match[1].trim()
      // Convert to title case if it's all caps
      const titleCaseName = fullName.toUpperCase() === fullName 
        ? fullName.split(/\s+/).map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
        : fullName
      
      const nameParts = titleCaseName.split(/\s+/)
      const lastName = nameParts[nameParts.length - 1]
      const lastNameUpper = lastName.toUpperCase()
      
      // Check if this speaker has a label in the transcript
      const label = speakerLabels.has(lastNameUpper) ? lastNameUpper : ''
      
      // Avoid duplicates
      if (!witnesses.some(w => w.fullName === titleCaseName)) {
        witnesses.push({
          type: 'witness',
          fullName: titleCaseName,
          lastName,
          lastNameUpper,
          label
        })
      }
    }
  }
  
  console.log('[extractSenateSpeakers] Participants found:', participants.length)
  console.log('[extractSenateSpeakers] Witnesses found:', witnesses.length)
  console.log('[extractSenateSpeakers] Speaker labels found:', Array.from(speakerLabels))
  console.log('[extractSenateSpeakers] Participants:', participants.map(p => p.fullName))
  console.log('[extractSenateSpeakers] Witnesses:', witnesses.map(w => w.fullName))
  
  return { participants, witnesses, transcriptStartIndex }
}

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

// Calculate similarity between two strings (0-1)
export function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLength = Math.max(a.length, b.length)
  return maxLength === 0 ? 1 : 1 - (distance / maxLength)
}

// Normalize word by removing common grammatical suffixes for smart matching
export function normalizeWordForMatching(word: string): string {
  const lower = word.toLowerCase()
  // Remove common possessive and plural suffixes
  const suffixes = ["'s", "s", "'"]
  for (const suffix of suffixes) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 1) {
      return lower.slice(0, -suffix.length)
    }
  }
  return lower
}

// Check if a word is a common English word (to avoid false positives)
const commonEnglishWords = new Set([
  // Most common English words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being',
  'has', 'had', 'having', 'does', 'did', 'doing', 'should', 'would', 'could', 'might', 'must', 'shall', 'may', 'great', 'like', 'luke',
  'john', 'michael', 'david', 'james', 'robert', 'william', 'richard', 'joseph', 'thomas', 'charles', 'christopher', 'daniel', 'matthew',
  'anthony', 'mark', 'donald', 'paul', 'steven', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy',
  'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel',
  'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'jose', 'adam', 'henry', 'nathan', 'douglas', 'peter', 'kyle',
  'walter', 'ethan', 'jeremy', 'harold', 'keith', 'christian', 'logan', 'alexis', 'colin', 'cody', 'clayton', 'shane', 'cameron', 'felipe',
  'elijah', 'dylan', 'jordan', 'jackson', 'gavin', 'kennedy', 'braxton', 'carson', 'hunter', 'tristan', 'parker', 'lincoln', 'mason',
  'jasper', 'connor', 'finley', 'grayson', 'charlie'
])

// Strict fuzzy matching conditions to reduce false positives
export function shouldFuzzyMatch(
  word: string,
  candidate: string,
  normalizedWord: string,
  normalizedCandidate: string,
  skipCommonEnglishCheck: boolean = false
): boolean {
  // DEBUG: Log for specific words
  const wordLower = word.toLowerCase()
  const candidateLower = candidate.toLowerCase()
  if (wordLower === 'lke' || wordLower === 'jhon' || wordLower === 'grg' || wordLower === 'smtih' || wordLower === 'canacord') {
    console.log(`[shouldFuzzyMatch] Checking "${word}" -> "${candidate}"`)
    console.log(`[shouldFuzzyMatch] Exact match: ${normalizedWord === normalizedCandidate}`)
    console.log(`[shouldFuzzyMatch] First letter match: ${word[0].toLowerCase() === candidate[0].toLowerCase()}`)
    console.log(`[shouldFuzzyMatch] Length diff: ${Math.abs(word.length - candidate.length)}`)
    console.log(`[shouldFuzzyMatch] Is common English: ${commonEnglishWords.has(normalizedCandidate)}`)
    console.log(`[shouldFuzzyMatch] Skip common English check: ${skipCommonEnglishCheck}`)
  }
  
  // Condition 1: Exact match must have failed (case-sensitive)
  if (word === candidate) {
    return false
  }
  
  // Condition 2: First letter must be the same
  if (word[0].toLowerCase() !== candidate[0].toLowerCase()) {
    return false
  }
  
  // Condition 3: Length difference must be <= 2 characters
  const lengthDiff = Math.abs(word.length - candidate.length)
  if (lengthDiff > 2) {
    return false
  }
  
  // Condition 4: Candidate must NOT be a common English word
  // Skip this check if the candidate is from extracted names (not general dictionary)
  if (!skipCommonEnglishCheck && commonEnglishWords.has(normalizedCandidate)) {
    return false
  }
  
  // Note: Similarity check is done AFTER this function returns
  // to avoid circular dependency
  return true
}

// Extract participants from transcript header
export function extractParticipants(transcript: string): { participants: Participant[], companyNames: string[] } {
  const lines = transcript.split('\n')
  const participants: Participant[] = []
  const companyNames: Set<string> = new Set()
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.toLowerCase() === '+++presentation') {
      break
    }
    
    // Parse C: lines (Board Directors)
    if (line.toLowerCase().startsWith('c:')) {
      const match = line.match(/^C:\s*([^;]+);\s*([^;]+);\s*(.+)$/i)
      if (match) {
        const name = match[1].trim()
        const position = match[2].trim()
        const company = match[3].trim()
        participants.push({ name, position, company, type: 'board' })
        companyNames.add(company)
      }
    }
    
    // Parse P: lines (Participants/Analysts)
    if (line.toLowerCase().startsWith('p:')) {
      const match = line.match(/^P:\s*([^;]+);\s*([^;]+);\s*(.+)$/i)
      if (match) {
        const name = match[1].trim()
        const position = match[2].trim()
        const company = match[3].trim()
        participants.push({ name, position, company, type: 'analyst' })
        companyNames.add(company)
      }
    }
    
    // Also check for "Analyst:" format as alternative
    if (line.toLowerCase().startsWith('analyst:')) {
      const match = line.match(/^Analyst:\s*([^;]+);\s*([^;]+);\s*(.+)$/i)
      if (match) {
        const name = match[1].trim()
        const position = match[2].trim()
        const company = match[3].trim()
        participants.push({ name, position, company, type: 'analyst' })
        companyNames.add(company)
      }
    }
  }
  
  return { participants, companyNames: Array.from(companyNames) }
}

// Validate speaker labels after +++presentation marker
export function validateSpeakerLabels(transcript: string, participants: Participant[]): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  let presentationStartIndex = -1
  
  // Find +++presentation line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === '+++presentation') {
      presentationStartIndex = i
      break
    }
  }
  
  if (presentationStartIndex < 0) {
    console.log(`[PERF] Speaker Label Validation: ${Math.round(performance.now() - startTime)}ms (no +++presentation found)`)
    return issues
  }
  
  if (participants.length === 0) {
    console.log(`[PERF] Speaker Label Validation: ${Math.round(performance.now() - startTime)}ms (no participants)`)
    return issues
  }
  
  // Extract all expected names
  const expectedNames = participants.map(p => p.name)
  const expectedNamesLower = expectedNames.map(n => n.toLowerCase())
  
  // Check speaker labels after +++presentation
  for (let i = presentationStartIndex + 1; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    // Match speaker labels: Name^ (anything after the caret)
    // Allow optional leading spaces and match any characters before the caret
    const speakerLabelRegex = /^([A-Za-z\s]+)\^/
    const match = trimmedLine.match(speakerLabelRegex)
    
    // DEBUG: Log lines that look like speaker labels but don't match
    if (trimmedLine.includes('^') && !match) {
      console.log(`[validateSpeakerLabels] Line with caret but no match: "${trimmedLine}"`)
    }
    
    // DEBUG: Log specific speaker labels
    if (match && (trimmedLine.includes('Lster') || trimmedLine.includes('Edmnd'))) {
      console.log(`[validateSpeakerLabels] Matched speaker label: "${trimmedLine}"`)
    }
    
    if (match) {
      const speakerName = match[1].trim()
      const speakerNameLower = speakerName.toLowerCase()
      const nameParts = speakerName.split(/\s+/).filter(p => p.length > 0)
      
      // Skip validation for "Operator^" - this is a valid generic label
      if (speakerNameLower === 'operator') continue
      
      // Rule: Speaker labels must include first name AND last name
      // First-name-only labels are invalid (e.g., "Jhon^" is invalid)
      // Valid examples: "John Cena^", "John S. Cena^"
      
      if (nameParts.length < 2) {
        // First-name-only speaker label - this is invalid
        // Find the matching participant and suggest their full name
        const firstName = nameParts[0]
        let matchingParticipant = participants.find(p => {
          const participantFirst = p.name.split(/\s+/)[0]
          return participantFirst.toLowerCase() === firstName.toLowerCase()
        })
        
        // If no exact match, try fuzzy matching on first name
        if (!matchingParticipant) {
          const normalizedFirstName = normalizeWordForMatching(firstName)
          let bestMatch: Participant | null = null
          let bestSimilarity = 0
          
          for (const p of participants) {
            const participantFirst = p.name.split(/\s+/)[0]
            const normalizedParticipantFirst = normalizeWordForMatching(participantFirst)
            
            if (shouldFuzzyMatch(firstName, participantFirst, normalizedFirstName, normalizedParticipantFirst, true)) {
              const similarity = calculateSimilarity(normalizedFirstName, normalizedParticipantFirst)
              if (similarity > bestSimilarity) {
                bestSimilarity = similarity
                bestMatch = p
              }
            }
          }
          
          // Use 40% threshold for very short names (to catch Jhon → John)
          if (bestMatch && bestSimilarity >= 0.40) {
            matchingParticipant = bestMatch
          }
        }
        
        if (matchingParticipant) {
          // Calculate exact column position
          const column = lines[i].indexOf(speakerName) + 1
          // Include the caret in foundText for speaker labels
          const foundTextWithCaret = speakerName + '^'
          issues.push({
            id: `speaker-label-${i}-${speakerName}`,
            category: 'name',
            ruleName: 'Speaker Label Validation',
            severity: 'high',
            foundText: foundTextWithCaret,
            suggestedCorrection: matchingParticipant.name,
            line: i + 1,
            column: column,
            ignored: false
          })
        } else {
          // First name not found in participants - still invalid
          const column = lines[i].indexOf(speakerName) + 1
          // Include the caret in foundText for speaker labels
          const foundTextWithCaret = speakerName + '^'
          issues.push({
            id: `speaker-label-${i}-${speakerName}`,
            category: 'name',
            ruleName: 'Speaker Label Validation',
            severity: 'high',
            foundText: foundTextWithCaret,
            suggestedCorrection: 'Use full name (first + last)',
            line: i + 1,
            column: column,
            ignored: false
          })
        }
      } else {
        // Speaker label has multiple parts - check if it matches expected names
        const hasExactMatch = expectedNamesLower.includes(speakerNameLower)
        
        // DEBUG: Log multi-part speaker labels
        if (speakerNameLower.includes('lke') || speakerNameLower.includes('smtih') || speakerNameLower.includes('lester')) {
          console.log(`[validateSpeakerLabels] Multi-part speaker label: "${speakerName}"`)
          console.log(`[validateSpeakerLabels] Has exact match: ${hasExactMatch}`)
          console.log(`[validateSpeakerLabels] Name parts:`, nameParts)
          console.log(`[validateSpeakerLabels] Expected names:`, expectedNames)
        }
        
        // Check if speaker label is missing middle name (e.g., "Lester Knight^" vs "Lester B. Knight^")
        if (nameParts.length === 2 && !hasExactMatch) {
          const firstName = nameParts[0]
          const lastName = nameParts[1]
          
          // DEBUG: Log for specific names
          if (speakerNameLower.includes('lster') || speakerNameLower.includes('edmund') || speakerNameLower.includes('edmnd')) {
            console.log(`[validateSpeakerLabels] Checking for missing middle name: "${speakerName}"`)
            console.log(`[validateSpeakerLabels] First name: "${firstName}", Last name: "${lastName}"`)
          }
          
          // Find participant with matching first and last name but has middle name
          // Use fuzzy matching for first name to catch misspellings like "Leter" -> "Lester"
          const participantWithMiddle = participants.find(p => {
            const parts = p.name.split(/\s+/)
            if (parts.length >= 3) {
              const pFirst = parts[0]
              const pLast = parts[parts.length - 1]
              
              // DEBUG: Log participant comparison
              if (speakerNameLower.includes('lster') || speakerNameLower.includes('edmund') || speakerNameLower.includes('edmnd')) {
                console.log(`[validateSpeakerLabels] Comparing with participant: "${p.name}"`)
                console.log(`[validateSpeakerLabels] Last name match: ${pLast.toLowerCase() === lastName.toLowerCase()}`)
                console.log(`[validateSpeakerLabels] First name exact match: ${pFirst.toLowerCase() === firstName.toLowerCase()}`)
              }
              
              // Check last name exact match
              if (pLast.toLowerCase() !== lastName.toLowerCase()) return false
              
              // Check first name exact match or fuzzy match
              if (pFirst.toLowerCase() === firstName.toLowerCase()) return true
              
              // Try fuzzy matching for first name
              const normalizedFirstName = normalizeWordForMatching(firstName)
              const normalizedPFirst = normalizeWordForMatching(pFirst)
              if (shouldFuzzyMatch(firstName, pFirst, normalizedFirstName, normalizedPFirst, true)) {
                const similarity = calculateSimilarity(normalizedFirstName, normalizedPFirst)
                // Use more lenient threshold for missing middle name detection (0.75 instead of 0.92)
                // This catches misspellings like "Lster" -> "Lester" (0.83 similarity)
                const threshold = pFirst.length <= 4 ? 0.40 : 0.75
                
                if (speakerNameLower.includes('lster') || speakerNameLower.includes('edmund') || speakerNameLower.includes('edmnd')) {
                  console.log(`[validateSpeakerLabels] First name fuzzy similarity: ${similarity.toFixed(2)}, threshold: ${threshold}`)
                }
                
                return similarity >= threshold
              }
              
              return false
            }
            return false
          })
          
          if (participantWithMiddle) {
            const column = lines[i].indexOf(speakerName) + 1
            const foundTextWithCaret = speakerName + '^'
            issues.push({
              id: `speaker-label-${i}-${speakerName}`,
              category: 'name',
              ruleName: 'Speaker Label Validation',
              severity: 'high',
              foundText: foundTextWithCaret,
              suggestedCorrection: participantWithMiddle.name,
              line: i + 1,
              column: column,
              ignored: false
            })
            continue
          }
        }
        
        if (!hasExactMatch) {
          // Check each part of the name individually for misspellings
          // If any part is misspelled, suggest the correct full name
          let foundMisspelledPart = false
          
          for (const expectedName of expectedNames) {
            const expectedParts = expectedName.split(/\s+/)
            
            // DEBUG: Log expected name comparison
            if (speakerNameLower.includes('lke') || speakerNameLower.includes('smtih')) {
              console.log(`[validateSpeakerLabels] Comparing with expected: "${expectedName}"`)
              console.log(`[validateSpeakerLabels] Expected parts:`, expectedParts)
              console.log(`[validateSpeakerLabels] Parts count match: ${nameParts.length === expectedParts.length}`)
            }
            
            // Check if the number of parts matches
            if (nameParts.length === expectedParts.length) {
              let allPartsMatch = true
              
              for (let k = 0; k < nameParts.length; k++) {
                const speakerPart = nameParts[k]
                const expectedPart = expectedParts[k]
                const normalizedSpeakerPart = normalizeWordForMatching(speakerPart)
                const normalizedExpectedPart = normalizeWordForMatching(expectedPart)
                
                // Check if this part matches exactly
                if (speakerPart.toLowerCase() !== expectedPart.toLowerCase()) {
                  // No exact match - check fuzzy match
                  if (shouldFuzzyMatch(speakerPart, expectedPart, normalizedSpeakerPart, normalizedExpectedPart, true)) {
                    const similarity = calculateSimilarity(normalizedSpeakerPart, normalizedExpectedPart)
                    const threshold = expectedPart.length <= 4 ? 0.50 : 0.92
                    
                    if (speakerNameLower.includes('lke') || speakerNameLower.includes('smtih')) {
                      console.log(`[validateSpeakerLabels] Similarity: ${similarity.toFixed(2)}, threshold: ${threshold}`)
                    }
                    
                    if (similarity >= threshold) {
                      // This part is misspelled but close enough
                      foundMisspelledPart = true
                    } else {
                      // This part doesn't match at all
                      allPartsMatch = false
                    }
                  } else {
                    // This part doesn't match at all
                    allPartsMatch = false
                  }
                }
              }
              
              // DEBUG: Log result
              if (speakerNameLower.includes('lke') || speakerNameLower.includes('smtih')) {
                console.log(`[validateSpeakerLabels] allPartsMatch: ${allPartsMatch}, foundMisspelledPart: ${foundMisspelledPart}`)
              }
              
              // If all parts match (either exactly or with fuzzy match), suggest this name
              if (allPartsMatch && foundMisspelledPart) {
                const column = lines[i].indexOf(speakerName) + 1
                // Include the caret in foundText for speaker labels
                const foundTextWithCaret = speakerName + '^'
                issues.push({
                  id: `speaker-label-${i}-${speakerName}`,
                  category: 'name',
                  ruleName: 'Speaker Label Validation',
                  severity: 'high',
                  foundText: foundTextWithCaret,
                  suggestedCorrection: expectedName,
                  line: i + 1,
                  column: column,
                  ignored: false
                })
                break
              }
            }
          }
          
          // If no part-by-part match, try full name fuzzy matching as fallback
          if (!foundMisspelledPart) {
            let bestMatch = ''
            let bestSimilarity = 0
            
            for (const expectedName of expectedNames) {
              const normalizedSpeakerName = normalizeWordForMatching(speakerName)
              const normalizedExpectedName = normalizeWordForMatching(expectedName)
              
              if (shouldFuzzyMatch(speakerName, expectedName, normalizedSpeakerName, normalizedExpectedName, true)) {
                const similarity = calculateSimilarity(normalizedSpeakerName, normalizedExpectedName)
                if (similarity > bestSimilarity) {
                  bestSimilarity = similarity
                  bestMatch = expectedName
                }
              }
            }
            
            // Only suggest if we found a good match
            if (bestMatch && bestSimilarity >= 0.80) {
              const column = lines[i].indexOf(speakerName) + 1
              // Include the caret in foundText for speaker labels
              const foundTextWithCaret = speakerName + '^'
              issues.push({
                id: `speaker-label-${i}-${speakerName}`,
                category: 'name',
                ruleName: 'Speaker Label Validation',
                severity: 'high',
                foundText: foundTextWithCaret,
                suggestedCorrection: bestMatch,
                line: i + 1,
                column: column,
                ignored: false
              })
            }
          }
        }
      }
    }
  }
  
  console.log(`[PERF] Speaker Label Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Validate names in transcript body using extracted references
export function validateBodyNames(transcript: string, participants: Participant[], customDictionary: string[] = []): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  if (participants.length === 0) {
    console.log(`[PERF] Body Name Validation: ${Math.round(performance.now() - startTime)}ms (no participants)`)
    return issues
  }
  
  // Extract all expected names (exact matches only)
  const expectedNames = participants.map(p => p.name)
  const expectedNamesLower = expectedNames.map(n => n.toLowerCase())
  
  // Extract first names from participant names for individual word validation
  const firstNames = participants.map(p => p.name.split(' ')[0])
  const firstNamesLower = firstNames.map(n => n.toLowerCase())
  
  // Extract last names from participant names
  const lastNames = participants.map(p => {
    const parts = p.name.split(' ')
    return parts.length > 1 ? parts[parts.length - 1] : ''
  }).filter(n => n.length > 0)
  const lastNamesLower = lastNames.map(n => n.toLowerCase())
  
  // Build Set of custom dictionary words for filtering
  const customDictLower = new Set(customDictionary.map(w => w.toLowerCase()))
  
  // Validate entire transcript body for misspelled names
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '')
      if (cleanWord.length < 2) return
      
      const cleanWordLower = cleanWord.toLowerCase()
      
      // DEBUG: Log specific words we're looking for
      if (cleanWordLower === 'jhon' || cleanWordLower === 'smtih' || cleanWordLower === 'lke' || cleanWordLower === 'grg') {
        console.log(`[validateBodyNames] Checking word: "${word}" -> cleanWord: "${cleanWord}"`)
        console.log(`[validateBodyNames] Expected names:`, expectedNamesLower)
        console.log(`[validateBodyNames] First names:`, firstNamesLower)
        console.log(`[validateBodyNames] Last names:`, lastNamesLower)
      }
      
      // Skip if exact match to any expected name (case-insensitive)
      if (expectedNamesLower.includes(cleanWordLower)) return
      
      // Skip if exact match to first name or last name
      if (firstNamesLower.includes(cleanWordLower)) return
      if (lastNamesLower.includes(cleanWordLower)) return
      
      // Skip speaker labels (words ending with ^) - these are handled by speaker label validation
      if (word.endsWith('^')) return
      
      // Skip words that are part of a speaker label (before a word ending with ^)
      // Find if there's a word ending with ^ after this word in the same line
      const hasSpeakerLabelAfter = words.slice(wordIndex + 1).some(w => w.endsWith('^'))
      if (hasSpeakerLabelAfter) return
      
      // Skip if in custom dictionary (technical terms)
      if (customDictLower.has(cleanWordLower)) return
      
      // Skip if common English word
      if (commonEnglishWords.has(cleanWordLower)) return
      
      // Skip if word doesn't start with uppercase (not a candidate name token)
      // Check cleanWord instead of original word to handle punctuation
      if (cleanWord[0] !== cleanWord[0].toUpperCase()) return
      
      // Skip if ALL CAPS
      if (word === word.toUpperCase()) return
      
      // Skip if contains numbers
      if (/\d/.test(word)) return
      
      // Check for fuzzy match with first names
      const normalizedWord = normalizeWordForMatching(cleanWord)
      for (let j = 0; j < firstNames.length; j++) {
        const firstName = firstNames[j]
        const normalizedFirstName = normalizeWordForMatching(firstName)
        
        if (shouldFuzzyMatch(cleanWord, firstName, normalizedWord, normalizedFirstName, true)) {
          const similarity = calculateSimilarity(normalizedWord, normalizedFirstName)
          
          // DEBUG: Log similarity for specific words
          if (cleanWordLower === 'lke' || cleanWordLower === 'jhon' || cleanWordLower === 'grg') {
            console.log(`[validateBodyNames] Comparing "${cleanWord}" -> "${firstName}"`)
            console.log(`[validateBodyNames] Similarity: ${similarity.toFixed(2)}, threshold: ${firstName.length <= 4 ? 0.40 : 0.92}`)
          }
          
          // Adjust threshold based on word length - shorter names need lower threshold
          const threshold = firstName.length <= 4 ? 0.40 : 0.92
          
          if (similarity >= threshold && similarity < 1.0) {
            // Calculate column: position of original word in line + position of cleanWord within original word
            const wordStart = line.indexOf(word)
            const cleanWordStart = word.indexOf(cleanWord)
            const column = wordStart + cleanWordStart + 1
            issues.push({
              id: `body-name-${i}-${wordIndex}`,
              category: 'name',
              ruleName: 'Body Name Validation',
              severity: 'high',
              foundText: cleanWord, // Use cleanWord without punctuation for accurate highlighting
              suggestedCorrection: firstName, // Suggest only the first name for body name validation
              line: i + 1,
              column: column,
              ignored: false
            })
            break // Only add one issue per word for first names
          }
        }
      }
      
      // Check for fuzzy match with last names
      for (let j = 0; j < lastNames.length; j++) {
        const lastName = lastNames[j]
        const normalizedLastName = normalizeWordForMatching(lastName)
        
        if (shouldFuzzyMatch(cleanWord, lastName, normalizedWord, normalizedLastName, true)) {
          const similarity = calculateSimilarity(normalizedWord, normalizedLastName)
          
          // Adjust threshold based on word length - shorter names need lower threshold
          const threshold = lastName.length <= 4 ? 0.40 : 0.92
          
          if (similarity >= threshold && similarity < 1.0) {
            // Calculate column: position of original word in line + position of cleanWord within original word
            const wordStart = line.indexOf(word)
            const cleanWordStart = word.indexOf(cleanWord)
            const column = wordStart + cleanWordStart + 1
            issues.push({
              id: `body-name-${i}-${wordIndex}`,
              category: 'name',
              ruleName: 'Body Name Validation',
              severity: 'high',
              foundText: cleanWord, // Use cleanWord without punctuation for accurate highlighting
              suggestedCorrection: lastName,
              line: i + 1,
              column: column,
              ignored: false
            })
            break // Only add one issue per word for last names
          }
        }
      }
    })
  }
  
  console.log(`[PERF] Body Name Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Basic English dictionary - common words (simplified for demo purposes)
const englishDictionary: Set<string> = new Set([
  // Common words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  // Business/financial terms
  'company', 'business', 'market', 'stock', 'share', 'price', 'value', 'cost', 'profit', 'revenue', 'income', 'expense', 'growth', 'investment', 'capital', 'asset', 'liability', 'equity', 'dividend', 'portfolio', 'fund', 'bank', 'loan', 'credit', 'debt', 'interest', 'rate', 'tax', 'financial', 'economic', 'economy', 'industry', 'sector', 'trade', 'export', 'import', 'supply', 'demand', 'production', 'manufacturing', 'service', 'customer', 'client', 'sale', 'purchase', 'order', 'contract', 'agreement', 'deal', 'transaction', 'payment', 'cash', 'money', 'currency', 'dollar', 'euro', 'pound', 'yen',
  // Common verbs
  'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought', 'need', 'dare', 'used', 'to', 'get', 'got', 'gotten', 'make', 'made', 'making', 'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came', 'coming', 'see', 'sees', 'saw', 'seen', 'seeing', 'know', 'knows', 'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking', 'take', 'takes', 'took', 'taken', 'taking', 'give', 'gives', 'gave', 'given', 'giving',
  // Common adjectives
  'good', 'bad', 'big', 'small', 'large', 'little', 'great', 'high', 'low', 'long', 'short', 'old', 'new', 'young', 'right', 'wrong', 'true', 'false', 'real', 'fake', 'same', 'different', 'important', 'significant', 'major', 'minor', 'main', 'primary', 'secondary', 'first', 'last', 'early', 'late', 'fast', 'slow', 'hard', 'soft', 'easy', 'difficult', 'simple', 'complex', 'clear', 'unclear', 'sure', 'certain', 'likely', 'unlikely', 'possible', 'impossible',
  // Common nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'thing', 'world', 'life', 'hand', 'part', 'place', 'case', 'week', 'system', 'program', 'question', 'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'name',
  // Common connectors
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'although', 'though', 'because', 'since', 'as', 'if', 'unless', 'until', 'while', 'where', 'when', 'before', 'after', 'during', 'through', 'in', 'on', 'at', 'to', 'from', 'by', 'with', 'without', 'about', 'against', 'between', 'among', 'throughout', 'within', 'beyond', 'across', 'behind', 'below', 'above', 'over', 'under'
])

// Check if a word should be skipped from spell checking
function shouldSkipSpellCheck(word: string): boolean {
  // Skip ALL CAPS words (acronyms, abbreviations) - but only if length > 1
  if (word.length > 1 && word === word.toUpperCase()) {
    return true
  }
  
  // Skip words with numbers
  if (/\d/.test(word)) {
    return true
  }
  
  // Skip contractions (we've, don't, I'm, they'll, etc.)
  if (/'/.test(word)) {
    return true
  }
  
  // Skip very short words (less than 2 characters)
  if (word.length < 2) {
    return true
  }
  
  // Skip single letter words
  if (word.length === 1) {
    return true
  }
  
  // Skip words that are mostly punctuation (after removing apostrophes)
  const withoutApostrophes = word.replace(/'/g, '')
  if (withoutApostrophes.length === 0 || /[^a-zA-Z]/.test(withoutApostrophes)) {
    return true
  }
  
  // Skip timestamps (e.g., 10:30, 12:45 PM)
  if (/^\d{1,2}:\d{2}(\s*(AM|PM|am|pm))?$/.test(word)) {
    return true
  }
  
  // Skip speaker labels (e.g., OPERATOR:, PARTICIPANT:)
  if (/^[A-Z][A-Z\s]*:$/.test(word)) {
    return true
  }
  
  return false
}

// Validate spelling using English dictionary, extracted references, and custom dictionary
export async function validateSpelling(
  transcript: string, 
  participants: Participant[], 
  companyNames: string[],
  customDictionary: string[] = [],
  onProgress?: (progress: ValidationProgress) => void
): Promise<ValidationIssue[]> {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSpelling] Checking transcript for spelling errors')
  console.log('[validateSpelling] Custom dictionary size:', customDictionary.length)
  console.log('[validateSpelling] Custom dictionary entries:', customDictionary)
  
  // Initialize spell checker
  const spell = await initializeSpellChecker()
  if (!spell) {
    console.warn('[validateSpelling] Spell checker not available, falling back to manual dictionary')
  }
  
  // Build Set for valid uncommon words (references + custom dictionary) - O(1) lookup (case-sensitive)
  const validUncommonWords = new Set<string>()
  
  // Add company names (case-sensitive)
  companyNames.forEach(name => {
    const words = name.split(/\s+/)
    words.forEach(word => validUncommonWords.add(word))
  })
  
  // Add participant names (case-sensitive)
  participants.forEach(p => {
    const words = p.name.split(/\s+/)
    words.forEach(word => validUncommonWords.add(word))
  })
  
  // Add custom dictionary words (case-sensitive)
  customDictionary.forEach(word => validUncommonWords.add(word))
  
  console.log('[validateSpelling] Valid uncommon words:', Array.from(validUncommonWords).length)
  
  // Cache for spell check results - avoid checking same word multiple times
  const spellCheckCache = new Map<string, boolean>()
  
  // Track processed words to avoid duplicates
  const processedWords = new Set<string>()
  
  let processedCount = 0
  
  onProgress?.({ stage: 'technical', current: 0, total: lines.length, message: 'Checking technical terms...' })
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '')
      
      // Skip very short words early
      if (cleanWord.length < 2) return
      
      // Skip if already processed this word (early exit for duplicates) - case-sensitive
      if (processedWords.has(cleanWord)) return
      processedWords.add(cleanWord)
      
      processedCount++
      
      // Check for fuzzy match with custom dictionary (misspelled technical terms)
      // This must happen BEFORE skip logic to catch ALL CAPS misspellings like EBTDA -> EBITDA
      // Use smart matching that ignores common grammatical suffixes (case-sensitive)
      const normalizedWord = normalizeWordForMatching(cleanWord)
      
      // DEBUG: Log specific words we're looking for
      if (cleanWord === 'ebtida' || cleanWord === 'canacord' || cleanWord === 'ebitda' || cleanWord === 'canaccord' || cleanWord === 'EBITDA' || cleanWord === 'Canaccord') {
        console.log(`[DEBUG] Checking word: "${cleanWord}" (normalized: "${normalizedWord}")`)
      }
      
      for (const customTerm of customDictionary) {
        const normalizedTerm = normalizeWordForMatching(customTerm)
        
        // DEBUG: Log when comparing specific terms
        if ((cleanWord === 'ebtida' || cleanWord === 'canacord' || cleanWord === 'cannacord' || cleanWord === 'EBITDA' || cleanWord === 'Canaccord') && (customTerm === 'EBITDA' || customTerm === 'Canaccord')) {
          console.log(`[DEBUG] Comparing: "${cleanWord}" -> "${customTerm}"`)
          console.log(`[DEBUG] Normalized: "${normalizedWord}" -> "${normalizedTerm}"`)
          console.log(`[DEBUG] Exact match: ${cleanWord === customTerm}`)
        }
        
        // Case-sensitive exact match check
        if (cleanWord !== customTerm) {
          // Check if it's a case mismatch (same letters, different case)
          // This should be flagged as an issue with 100% similarity
          if (cleanWord.toLowerCase() === customTerm.toLowerCase()) {
            // Calculate column: position of original word in line + position of cleanWord within original word
            const wordStart = line.indexOf(word)
            const cleanWordStart = word.indexOf(cleanWord)
            const column = wordStart + cleanWordStart + 1
            console.log(`[validateSpelling] Found case mismatch: "${cleanWord}" -> "${customTerm}" at line ${lineIndex + 1}`)
            issues.push({
              id: `spelling-custom-${lineIndex}-${wordIndex}`,
              category: 'spelling',
              ruleName: 'Technical Dictionary',
              severity: 'medium',
              foundText: cleanWord,
              suggestedCorrection: customTerm,
              line: lineIndex + 1,
              column: column,
              ignored: false
            })
            return // Exit early after finding a match
          }
          
          // Use strict fuzzy matching conditions for technical dictionary (case-sensitive)
          if (shouldFuzzyMatch(cleanWord, customTerm, normalizedWord, normalizedTerm)) {
            const similarity = calculateSimilarity(normalizedWord, normalizedTerm)
            
            // DEBUG: Log similarity for specific comparisons
            if ((cleanWord === 'ebtida' || cleanWord === 'canacord' || cleanWord === 'cannacord') && (customTerm === 'EBITDA' || customTerm === 'Canaccord')) {
              console.log(`[DEBUG] Similarity: ${similarity.toFixed(2)} (threshold: 0.65)`)
              console.log(`[DEBUG] Passes threshold: ${similarity >= 0.65}`)
            }
            
            // Use 65% threshold for Technical Dictionary (lower than 92% for names)
            // Technical terms are more distinctive and less prone to false positives
            // EBTIDA → EBITDA is 67% similarity, so we need at least 65%
            if (similarity >= 0.65 && similarity < 1.0) {
              // Calculate column: position of original word in line + position of cleanWord within original word
              const wordStart = line.indexOf(word)
              const cleanWordStart = word.indexOf(cleanWord)
              const column = wordStart + cleanWordStart + 1
              console.log(`[validateSpelling] Found misspelled custom term: "${cleanWord}" -> "${customTerm}" at line ${lineIndex + 1} (similarity: ${similarity.toFixed(2)})`)
              issues.push({
                id: `spelling-custom-${lineIndex}-${wordIndex}`,
                category: 'spelling',
                ruleName: 'Technical Dictionary',
                severity: 'medium',
                foundText: cleanWord, // Use cleanWord without punctuation for accurate highlighting
                suggestedCorrection: customTerm,
                line: lineIndex + 1,
                column: column,
                ignored: false
              })
              return // Exit early after finding a match
            }
          } else {
            // DEBUG: Log why fuzzy match failed
            if ((cleanWord === 'ebtida' || cleanWord === 'canacord') && (customTerm === 'EBITDA' || customTerm === 'Canaccord')) {
              console.log(`[DEBUG] shouldFuzzyMatch returned FALSE`)
              console.log(`[DEBUG] First letter match: ${word[0].toLowerCase() === customTerm[0].toLowerCase()}`)
              console.log(`[DEBUG] Length diff: ${Math.abs(word.length - customTerm.length)}`)
              console.log(`[DEBUG] Is common English word: ${commonEnglishWords.has(normalizedTerm)}`)
            }
          }
        }
      }
      
      // Skip if word should not be spell checked
      if (shouldSkipSpellCheck(word)) return
      
      // Check if it's a valid uncommon word (reference or custom dict) - early exit
      if (validUncommonWords.has(cleanWord)) return
      
      // Check if it's a common English word using typo-js (with cache)
      let isCorrect = false
      if (spellCheckCache.has(cleanWord)) {
        isCorrect = spellCheckCache.get(cleanWord)!
      } else if (spell) {
        isCorrect = spell.check(cleanWord)
        spellCheckCache.set(cleanWord, isCorrect)
      } else if (englishDictionary.has(cleanWord)) {
        isCorrect = true
        spellCheckCache.set(cleanWord, true)
      }
      
      if (isCorrect) return
      
      // Word is not valid English, but we don't add it as an issue here
      // Issues are only added from:
      // 1. Technical Dictionary fuzzy matching (already handled above)
      // 2. Admin Hub style/formatting rules (handled in applyStyleRules)
      // 3. Extracted references validation (handled in validateSpeakerLabels/validateBodyNames/validateCompanyNames)
    })
    
    // Update progress
    if (lineIndex % 10 === 0) {
      onProgress?.({ stage: 'technical', current: lineIndex + 1, total: lines.length, message: `Checking technical terms... (${lineIndex + 1}/${lines.length})` })
    }
  })
  
  const endTime = performance.now()
  const validationTime = Math.round(endTime - startTime)
  console.log(`[validateSpelling] Total technical dictionary issues found: ${issues.length}`)
  console.log(`[validateSpelling] Validation time: ${validationTime}ms`)
  console.log(`[validateSpelling] Unique words processed: ${processedCount}`)
  console.log(`[validateSpelling] Cache hit rate: ${spellCheckCache.size > 0 ? Math.round((processedCount - spellCheckCache.size) / processedCount * 100) : 0}%`)
  
  return issues
}

// Get valid uncommon words for green underlining
// This should ONLY include unknown uncommon terms (not in English dict, not extracted, not in custom dict)
export async function getValidUncommonWords(
  transcript: string,
  participants: Participant[],
  companyNames: string[],
  customDictionary: string[] = []
): Promise<{ word: string, line: number, column: number }[]> {
  const uncommonWords: { word: string, line: number, column: number }[] = []
  const lines = transcript.split('\n')
  
  // Build set of words to EXCLUDE from green underlining
  const excludedWords = new Set<string>()
  
  // Add company names
  companyNames.forEach(name => {
    const words = name.split(/\s+/)
    words.forEach(word => excludedWords.add(word.toLowerCase()))
  })
  
  // Add participant names
  participants.forEach(p => {
    const words = p.name.split(/\s+/)
    words.forEach(word => excludedWords.add(word.toLowerCase()))
  })
  
  // Add custom dictionary terms
  customDictionary.forEach(word => excludedWords.add(word.toLowerCase()))
  
  // Initialize spell checker to check if words are valid English
  const spell = await initializeSpellChecker()
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
      if (cleanWord.length < 2) return
      
      // Skip if word should not be spell checked (acronyms, ALL CAPS, contractions, etc.)
      if (shouldSkipSpellCheck(word)) return
      
      // Skip company and participant names (they're already in Extracted References)
      if (excludedWords.has(cleanWord)) return
      
      // Check if it's a valid English word using the spell checker
      let isEnglishWord = false
      if (spell) {
        isEnglishWord = spell.check(cleanWord)
      } else if (englishDictionary.has(cleanWord)) {
        isEnglishWord = true
      }
      
      // Skip if it's a valid English word
      if (isEnglishWord) return
      
      // Green underline unknown uncommon terms (not in English dict, not extracted, not in custom dict)
      const lineStart = line.indexOf(word)
      uncommonWords.push({
        word: word,
        line: lineIndex + 1,
        column: lineStart + 1
      })
    })
  })
  
  return uncommonWords
}
export function validateCompanyNames(transcript: string, companyNames: string[]): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateCompanyNames] Company names:', companyNames)
  
  if (companyNames.length === 0) {
    console.log('[validateCompanyNames] No company names to validate')
    console.log(`[PERF] Company Validation: ${Math.round(performance.now() - startTime)}ms`)
    return issues
  }
  
  // Build Set for fast exact match lookup (case-sensitive)
  const companyNamesSet = new Set(companyNames.map(n => n.replace(/[^a-zA-Z0-9]/g, '')))
  
  // Check each line for company name mentions
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '')
      if (cleanWord.length < 2) return
      
      // Skip if exact match (case-sensitive)
      if (companyNamesSet.has(cleanWord)) return
      
      const normalizedWord = normalizeWordForMatching(cleanWord)
      
      for (const companyName of companyNames) {
        const cleanCompany = companyName.replace(/[^a-zA-Z0-9]/g, '')
        const normalizedCompany = normalizeWordForMatching(cleanCompany)
        
        // Use strict fuzzy matching conditions (case-sensitive)
        if (shouldFuzzyMatch(cleanWord, cleanCompany, normalizedWord, normalizedCompany)) {
          const similarity = calculateSimilarity(normalizedWord, normalizedCompany)
          
          // Only suggest if similarity is very high (>= 92%)
          if (similarity >= 0.92 && similarity < 1.0) {
            // Calculate column: position of original word in line + position of cleanWord within original word
            const wordStart = line.indexOf(word)
            const cleanWordStart = word.indexOf(cleanWord)
            const column = wordStart + cleanWordStart + 1
            console.log(`[validateCompanyNames] Found misspelled company: "${cleanWord}" -> "${companyName}" at line ${lineIndex + 1} (similarity: ${similarity.toFixed(2)})`)
            issues.push({
              id: `company-${lineIndex}-${wordIndex}`,
              category: 'company',
              ruleName: 'Company Name Validation',
              severity: 'high',
              foundText: cleanWord, // Use cleanWord without punctuation for accurate highlighting
              suggestedCorrection: companyName,
              line: lineIndex + 1,
              column: column,
              ignored: false
            })
            return // Only add one issue per word
          }
        }
      }
    })
  })
  
  console.log(`[validateCompanyNames] Total company issues found: ${issues.length}`)
  console.log(`[PERF] Company Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Apply style and formatting rules
export function applyStyleRules(transcript: string, rules: ValidationRule[]): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const enabledRules = rules.filter(r => r.enabled)
  
  console.log('[applyStyleRules] Rules to apply:', enabledRules.length)
  
  enabledRules.forEach(rule => {
    let regex: RegExp
    let patternToUse = rule.find
    let useCapturedGroup = false

    // Log the rule pattern to debug
    console.log(`[applyStyleRules] Processing rule: ${rule.rule_name}, find: "${rule.find}", replace: "${rule.replace}"`)

    // Skip rules with empty find pattern
    if (!patternToUse || patternToUse.trim() === '') {
      console.log(`[applyStyleRules] Skipping rule with empty find pattern: ${rule.rule_name}`)
      return
    }

    // Skip rules where find pattern is just "--" or only dashes (change of thought marker)
    if (patternToUse.trim().match(/^[-\s]+$/)) {
      console.log(`[applyStyleRules] Skipping rule with only dashes/whitespace in find pattern (change of thought): ${rule.rule_name}`)
      return
    }

    // Skip standalone "--" patterns (change of thought markers)
    if (patternToUse.trim() === '--' || patternToUse.trim() === ' -- ' || patternToUse.trim() === '  --  ') {
      console.log(`[applyStyleRules] Skipping standalone "--" pattern (change of thought): ${rule.rule_name}`)
      return
    }

    // Skip any rule that contains only "--" with optional spaces (change of thought marker)
    if (patternToUse.replace(/\s/g, '') === '--') {
      console.log(`[applyStyleRules] Skipping rule that is only "--" with spaces (change of thought): ${rule.rule_name}`)
      return
    }

    // Handle special " -- " pattern format for repeated words
    // Example: "be -- be" should match ANY "word -- word" pattern and suggest "word"
    // Example: "because of -- because of" should match "phrase -- phrase" and suggest "phrase"
    if (patternToUse.includes(' -- ')) {
      const parts = patternToUse.split(' -- ')
      if (parts.length === 2 && parts[0] === parts[1]) {
        // Skip if the pattern is just "--" (no actual word to match)
        if (parts[0].trim() === '') {
          console.log(`[applyStyleRules] Skipping empty " -- " pattern: ${rule.find}`)
          return
        }
        // Convert to regex that matches any repeated word/phrase with " -- " separator
        // Pattern: \b(.+?)\b\s*--\s*\b\1\b
        // Using \b word boundaries to ensure complete word matching
        // This prevents matching "discipline -- disciplined" (partial match)
        // Using backreference \1 to ensure exact match (same word, same case)
        patternToUse = '\\b(.+?)\\b\\s*--\\s*\\b\\1\\b'
        useCapturedGroup = true
        console.log(`[applyStyleRules] Converting " -- " pattern: ${rule.find} -> ${patternToUse}`)
      }
    } else {
      // Also check if the pattern contains "--" without spaces (e.g., "word--word")
      if (patternToUse.includes('--')) {
        const parts = patternToUse.split('--')
        if (parts.length === 2 && parts[0] === parts[1]) {
          // Skip if the pattern is just "--" (no actual word to match)
          if (parts[0].trim() === '') {
            console.log(`[applyStyleRules] Skipping empty "--" pattern: ${rule.find}`)
            return
          }
          // Convert to regex that matches any repeated word/phrase with "--" separator
          // Using \b word boundaries to ensure complete word matching
          patternToUse = '\\b(.+?)\\b--\\b\\1\\b'
          useCapturedGroup = true
          console.log(`[applyStyleRules] Converting "--" pattern: ${rule.find} -> ${patternToUse}`)
        }
      }
    }

    // Skip rules with empty replace pattern (but only if not using captured group)
    if (!useCapturedGroup && (!rule.replace || rule.replace.trim() === '')) {
      console.log(`[applyStyleRules] Skipping rule with empty replace pattern: ${rule.rule_name}`)
      return
    }
    
    // Check if this is a regex pattern or literal string
    if (rule.is_regex || useCapturedGroup) {
      // Use the pattern as-is for regex mode (or for " -- " patterns)
      // For " -- " patterns, use case-sensitive matching to prevent "I -- i" false positives
      // Also respect case_sensitive flag from the rule
      const flags = (useCapturedGroup || rule.case_sensitive) ? 'g' : 'gi'
      regex = new RegExp(patternToUse, flags)
    } else {
      // Escape special regex characters for literal string matching
      // Respect case_sensitive flag from the rule
      const flags = rule.case_sensitive ? 'g' : 'gi'
      regex = new RegExp(patternToUse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    }
    
    console.log(`[applyStyleRules] Rule: ${rule.rule_name}, Pattern: ${patternToUse}, Regex: ${regex.toString()}`)

    let match
    let matchCount = 0

    while ((match = regex.exec(transcript)) !== null) {
      matchCount++
      console.log(`[applyStyleRules] Match ${matchCount}: "${match[0]}" at index ${match.index}, captured: ${match[1]}`)
      // Limit to first 10 matches per rule to avoid overwhelming
      if (matchCount > 10) break
      
      const line = transcript.substring(0, match.index).split('\n').length
      const lineStart = transcript.lastIndexOf('\n', match.index - 1) + 1
      const column = match.index - lineStart + 1
      
      // Determine category based on rule's category field
      const category = rule.category === 'formatting' ? 'formatting' : 'style'
      
      // Calculate the suggested correction
      let suggestedCorrection: string
      if (rule.is_regex) {
        // Replace with captured groups if regex mode
        suggestedCorrection = match[0].replace(regex, rule.replace)
      } else if (useCapturedGroup) {
        // Use the first captured group (the word) for " -- " patterns
        suggestedCorrection = match[1] || rule.replace
      } else {
        suggestedCorrection = rule.replace
      }
      
      // Skip if found and suggested are the same (no actual correction needed)
      if (match[0] === suggestedCorrection) {
        console.log(`[applyStyleRules] Skipping duplicate suggestion: "${match[0]}" -> "${suggestedCorrection}"`)
        continue
      }
      
      issues.push({
        id: `${category}-${rule.id}-${matchCount}`,
        category,
        ruleName: rule.rule_name,
        severity: rule.severity || 'medium',
        foundText: match[0],
        suggestedCorrection,
        line,
        column,
        ignored: false
      })
    }
  })
  
  // Deduplicate issues based on found text and position
  const uniqueIssues = issues.filter((issue, index, self) =>
    index === self.findIndex((i) =>
      i.foundText === issue.foundText &&
      i.line === issue.line &&
      i.column === issue.column
    )
  )

  console.log(`[applyStyleRules] Total style/formatting issues found: ${issues.length}`)
  console.log(`[applyStyleRules] After deduplication: ${uniqueIssues.length}`)
  console.log(`[PERF] Style Rules: ${Math.round(performance.now() - startTime)}ms`)
  return uniqueIssues
}

// Detect repeated words in transcript
export function detectRepeatedWords(transcript: string): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[detectRepeatedWords] Checking for repeated words')
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      // Check for repeated letters at the beginning of a word (e.g., "NNice", "TThe")
      if (word.length >= 3) {
        const firstChar = word[0]
        const secondChar = word[1]

        // Skip if the word is all uppercase (likely an acronym like SST, NASA, etc.)
        if (word === word.toUpperCase() && word.length <= 6) {
          continue
        }

        // Check if first two characters are the same letter (case-insensitive)
        if (firstChar.toLowerCase() === secondChar.toLowerCase() && /[a-zA-Z]/.test(firstChar)) {
          // Calculate column position
          let column = 0
          for (let k = 0; k < i; k++) {
            column += words[k].length + 1 // +1 for space
          }
          column += 1 // 1-indexed column

          console.log(`[detectRepeatedWords] Found repeated letter at start: "${word}" at line ${lineIndex + 1}`)

          issues.push({
            id: `repeated-letter-${lineIndex}-${i}`,
            category: 'style',
            ruleName: 'Repeated Letter at Word Start',
            severity: 'medium',
            foundText: word,
            suggestedCorrection: firstChar + word.substring(2), // Remove the duplicate first letter
            line: lineIndex + 1,
            column,
            ignored: false
          })
        }
      }
    }
    
    // Check for repeated consecutive words (e.g., "the the")
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i].replace(/[^a-zA-Z]/g, '')
      const nextWord = words[i + 1].replace(/[^a-zA-Z]/g, '')
      
      // Skip if either word is empty after removing non-letters (e.g., "--")
      if (currentWord.length === 0 || nextWord.length === 0) continue
      
      // Skip very short words
      if (currentWord.length < 2 || nextWord.length < 2) continue
      
      // Skip if either word is just a single letter (like "I" or "a")
      if (currentWord.length === 1 || nextWord.length === 1) continue
      
      // Check if current word equals next word (case-sensitive to avoid "I -- i" false positives)
      if (currentWord === nextWord) {
        // Calculate column position for the second (duplicate) word
        let column = 0
        for (let k = 0; k <= i; k++) {
          column += words[k].length + 1 // +1 for space
        }
        
        console.log(`[detectRepeatedWords] Found repeated word: "${words[i]} ${words[i+1]}" at line ${lineIndex + 1}`)
        
        issues.push({
          id: `repeated-word-${lineIndex}-${i}`,
          category: 'style',
          ruleName: 'Repeated Words',
          severity: 'medium',
          foundText: words[i + 1], // Show the duplicate word
          suggestedCorrection: 'Remove repeated word', // Suggest removing it
          line: lineIndex + 1,
          column: column + 1,
          ignored: false
        })
      }
    }
  })
  
  console.log(`[detectRepeatedWords] Total repeated word issues found: ${issues.length}`)
  console.log(`[PERF] Repeated Words Detection: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Validate Senate Hearing participant names (Sen. format)
export function validateSenateParticipantNames(transcript: string, extractedSpeakers?: { participants: ExtractedSenateSpeaker[], witnesses: ExtractedSenateSpeaker[], transcriptStartIndex: number }): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSenateParticipantNames] Checking Senate participant names')
  console.log('[validateSenateParticipantNames] Extracted speakers provided:', extractedSpeakers ? 'Yes' : 'No')
  
  // Use extracted speakers if available
  const validSpeakers = new Set<string>()
  if (extractedSpeakers) {
    extractedSpeakers.participants.forEach(speaker => {
      validSpeakers.add(speaker.fullName.toLowerCase())
    })
    console.log('[validateSenateParticipantNames] Valid speakers from extraction:', Array.from(validSpeakers))
  }
  
  lines.forEach((line, lineIndex) => {
    // Skip validation if we're before the transcript start marker [*]
    if (extractedSpeakers && lineIndex < extractedSpeakers.transcriptStartIndex) {
      return
    }
    
    // Pattern for Senate participants: Sen. or Rep. Name, R/D-State (e.g., Sen. Deb Fischer, R-Neb.)
    const senatePattern = /(?:Sen\.|Rep\.)\s+([A-Za-z\s]+),\s+([RD])-[A-Za-z]{2,4}\.?/i
    
    const match = line.match(senatePattern)
    if (match) {
      const fullName = match[1].trim()
      const parts = fullName.split(/\s+/)
      
      // Check if name has at least first and last name
      if (parts.length < 2) {
        const column = line.indexOf(match[0]) + 1
        console.log(`[validateSenateParticipantNames] Incomplete participant name at line ${lineIndex + 1}`)
        
        issues.push({
          id: `senate-participant-${lineIndex}`,
          category: 'name',
          ruleName: 'Senate Participant Name',
          severity: 'medium',
          foundText: match[0],
          suggestedCorrection: 'Sen./Rep. [First Last], [R/D]-[State]',
          line: lineIndex + 1,
          column,
          ignored: false
        })
      }
      
      // Check if name matches provided speaker names
      if (validSpeakers.size > 0) {
        const normalizedName = fullName.toLowerCase()
        if (!validSpeakers.has(normalizedName)) {
          const column = line.indexOf(fullName) + 1
          console.log(`[validateSenateParticipantNames] Name not in speaker list at line ${lineIndex + 1}: ${fullName}`)
          
          issues.push({
            id: `senate-unknown-participant-${lineIndex}`,
            category: 'name',
            ruleName: 'Unknown Senate Participant',
            severity: 'medium',
            foundText: fullName,
            suggestedCorrection: 'Check if this name should be in the speaker list',
            line: lineIndex + 1,
            column,
            ignored: false
          })
        }
      }
      
      // Check for proper capitalization
      const capitalizedParts = parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      const expectedName = capitalizedParts.join(' ')
      
      if (fullName !== expectedName) {
        const column = line.indexOf(fullName) + 1
        console.log(`[validateSenateParticipantNames] Capitalization issue at line ${lineIndex + 1}`)
        
        issues.push({
          id: `senate-capitalization-${lineIndex}`,
          category: 'name',
          ruleName: 'Senate Name Capitalization',
          severity: 'low',
          foundText: fullName,
          suggestedCorrection: expectedName,
          line: lineIndex + 1,
          column,
          ignored: false
        })
      }
    }
  })
  
  console.log(`[validateSenateParticipantNames] Total issues found: ${issues.length}`)
  console.log(`[PERF] Senate Participant Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Validate Senate Hearing witness names (Dr. format)
export function validateSenateWitnessNames(transcript: string, extractedSpeakers?: { participants: ExtractedSenateSpeaker[], witnesses: ExtractedSenateSpeaker[], transcriptStartIndex: number }): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSenateWitnessNames] Checking Senate witness names')
  console.log('[validateSenateWitnessNames] Extracted speakers provided:', extractedSpeakers ? 'Yes' : 'No')
  
  // Use extracted speakers if available
  const validSpeakers = new Set<string>()
  if (extractedSpeakers) {
    extractedSpeakers.witnesses.forEach(speaker => {
      validSpeakers.add(speaker.fullName.toLowerCase())
    })
    console.log('[validateSenateWitnessNames] Valid speakers from extraction:', Array.from(validSpeakers))
  }
  
  lines.forEach((line, lineIndex) => {
    // Skip validation if we're before the transcript start marker [*]
    if (extractedSpeakers && lineIndex < extractedSpeakers.transcriptStartIndex) {
      return
    }
    
    // Pattern for Senate witnesses: Dr. Name, to be [position]
    const witnessPattern = /Dr\.\s+([A-Za-z\s\.-]+),\s+to\s+be\s+[A-Za-z\s]+/i
    
    const match = line.match(witnessPattern)
    if (match) {
      const fullName = match[1].trim()
      const parts = fullName.split(/\s+/)
      
      // Check if name has at least first and last name
      if (parts.length < 2) {
        const column = line.indexOf(match[0]) + 1
        console.log(`[validateSenateWitnessNames] Incomplete witness name at line ${lineIndex + 1}`)
        
        issues.push({
          id: `senate-witness-${lineIndex}`,
          category: 'name',
          ruleName: 'Senate Witness Name',
          severity: 'medium',
          foundText: match[0],
          suggestedCorrection: 'Dr. [First Last], to be [Position]',
          line: lineIndex + 1,
          column,
          ignored: false
        })
      }
      
      // Check if name matches provided speaker names
      if (validSpeakers.size > 0) {
        const normalizedName = fullName.toLowerCase()
        if (!validSpeakers.has(normalizedName)) {
          const column = line.indexOf(fullName) + 1
          console.log(`[validateSenateWitnessNames] Name not in speaker list at line ${lineIndex + 1}: ${fullName}`)
          
          issues.push({
            id: `senate-unknown-witness-${lineIndex}`,
            category: 'name',
            ruleName: 'Unknown Senate Witness',
            severity: 'medium',
            foundText: fullName,
            suggestedCorrection: 'Check if this name should be in the speaker list',
            line: lineIndex + 1,
            column,
            ignored: false
          })
        }
      }
      
      // Check for proper capitalization
      const capitalizedParts = parts.map(part => {
        // Handle hyphenated names
        if (part.includes('-')) {
          return part.split('-').map(subPart => 
            subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase()
          ).join('-')
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      })
      const expectedName = capitalizedParts.join(' ')
      
      if (fullName !== expectedName) {
        const column = line.indexOf(fullName) + 1
        console.log(`[validateSenateWitnessNames] Capitalization issue at line ${lineIndex + 1}`)
        
        issues.push({
          id: `senate-witness-capitalization-${lineIndex}`,
          category: 'name',
          ruleName: 'Senate Witness Capitalization',
          severity: 'low',
          foundText: fullName,
          suggestedCorrection: expectedName,
          line: lineIndex + 1,
          column,
          ignored: false
        })
      }
    }
  })
  
  console.log(`[validateSenateWitnessNames] Total issues found: ${issues.length}`)
  console.log(`[PERF] Senate Witness Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Validate speaker name spelling throughout the transcript
export function validateSpeakerNameSpelling(transcript: string, extractedSpeakers?: { participants: ExtractedSenateSpeaker[], witnesses: ExtractedSenateSpeaker[], transcriptStartIndex: number }): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSpeakerNameSpelling] Checking speaker name spelling throughout transcript')
  console.log('[validateSpeakerNameSpelling] Extracted speakers provided:', extractedSpeakers ? 'Yes' : 'No')
  
  // Use extracted speakers if available
  const validSpeakers = new Map<string, string>() // normalized -> original
  if (extractedSpeakers) {
    // Add participants
    extractedSpeakers.participants.forEach(speaker => {
      validSpeakers.set(speaker.fullName.toLowerCase(), speaker.fullName)
    })
    // Add witnesses
    extractedSpeakers.witnesses.forEach(speaker => {
      validSpeakers.set(speaker.fullName.toLowerCase(), speaker.fullName)
    })
    console.log('[validateSpeakerNameSpelling] Valid speakers from extraction:', Array.from(validSpeakers.keys()))
  }
  
  if (validSpeakers.size === 0) {
    console.log('[validateSpeakerNameSpelling] No speaker names provided, skipping validation')
    return issues
  }
  
  // Check each line for potential name mentions
  lines.forEach((line, lineIndex) => {
    // Skip validation if we're before the transcript start marker [*]
    if (extractedSpeakers && lineIndex < extractedSpeakers.transcriptStartIndex) {
      return
    }
    
    // Skip lines that are speaker labels (ALL CAPS + colon)
    if (/^[A-Z]{2,}:\s*/.test(line)) {
      return
    }
    
    // Skip lines that are already validated by other Senate validators
    if (/Sen\.\s+[A-Za-z\s]+,\s+[RD]-[A-Za-z]{2,3}/i.test(line) || 
        /Dr\.\s+[A-Za-z\s\.-]+,\s+to\s+be\s+[A-Za-z\s]+/i.test(line)) {
      return
    }
    
    // Check for each valid speaker name in the line
    validSpeakers.forEach((originalName, normalizedName) => {
      // Split the name into parts to check for partial matches
      const nameParts = originalName.split(/\s+/)
      
      nameParts.forEach(part => {
        if (part.length < 2) return // Skip very short parts
        
        // Create regex pattern for this name part (case-insensitive)
        const pattern = new RegExp(`\\b${part}\\b`, 'gi')
        const matches = line.matchAll(pattern)
        
        for (const match of matches) {
          const matchedText = match[0]
          const column = match.index + 1
          
          // Check if the matched text has correct capitalization
          if (matchedText !== part) {
            console.log(`[validateSpeakerNameSpelling] Spelling issue at line ${lineIndex + 1}: "${matchedText}" should be "${part}"`)
            
            issues.push({
              id: `speaker-spelling-${lineIndex}-${column}`,
              category: 'name',
              ruleName: 'Speaker Name Spelling',
              severity: 'medium',
              foundText: matchedText,
              suggestedCorrection: part,
              line: lineIndex + 1,
              column,
              ignored: false
            })
          }
        }
      })
    })
  })
  
  console.log(`[validateSpeakerNameSpelling] Total issues found: ${issues.length}`)
  console.log(`[PERF] Speaker Name Spelling Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Validate Senate speaker labels (ALL CAPS + colon format)
export function validateSenateSpeakerLabels(transcript: string, extractedSpeakers?: { participants: ExtractedSenateSpeaker[], witnesses: ExtractedSenateSpeaker[], transcriptStartIndex: number }): ValidationIssue[] {
  const startTime = performance.now()
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSenateSpeakerLabels] Checking Senate speaker labels')
  console.log('[validateSenateSpeakerLabels] Extracted speakers provided:', extractedSpeakers ? 'Yes' : 'No')
  
  // Use extracted speakers if available to check against labels
  const validSpeakers = new Map<string, { fullName: string, lastName: string, lastNameUpper: string }>()
  const lastNameList: string[] = []
  if (extractedSpeakers) {
    // Add participants
    extractedSpeakers.participants.forEach(speaker => {
      validSpeakers.set(speaker.fullName.toLowerCase(), { fullName: speaker.fullName, lastName: speaker.lastName, lastNameUpper: speaker.lastNameUpper })
      lastNameList.push(speaker.lastName.toLowerCase())
    })
    // Add witnesses
    extractedSpeakers.witnesses.forEach(speaker => {
      validSpeakers.set(speaker.fullName.toLowerCase(), { fullName: speaker.fullName, lastName: speaker.lastName, lastNameUpper: speaker.lastNameUpper })
      lastNameList.push(speaker.lastName.toLowerCase())
    })
    console.log('[validateSenateSpeakerLabels] Valid speakers from extraction:', Array.from(validSpeakers.keys()))
    console.log('[validateSenateSpeakerLabels] Last names:', lastNameList)
  }
  
  lines.forEach((line, lineIndex) => {
    // Skip validation if we're before the transcript start marker [*]
    if (extractedSpeakers && lineIndex < extractedSpeakers.transcriptStartIndex) {
      return
    }
    
    // Pattern for Senate speaker labels: ALL CAPS + colon (e.g., FISCHER:, SULLIVAN:)
    const speakerLabelPattern = /^([A-Z]{2,}):\s*(.*)/
    const match = line.match(speakerLabelPattern)
    
    if (match) {
      const label = match[1]
      const restOfLine = match[2]
      
      // Check if the label matches any valid speaker name
      if (validSpeakers.size > 0) {
        const normalizedLabel = label.toLowerCase()
        let foundMatch = false
        let suggestedName = ''
        
        validSpeakers.forEach((speakerInfo, speakerName) => {
          // Check if the label is a last name match (e.g., FISCHER matches Deb Fischer)
          if (normalizedLabel === speakerInfo.lastName.toLowerCase()) {
            foundMatch = true
          }
          // Also check if label is close to a last name (for typos)
          if (speakerInfo.lastNameUpper.includes(label) || label.includes(speakerInfo.lastNameUpper.slice(0, -1))) {
            suggestedName = speakerInfo.lastNameUpper
          }
        })
        
        // If no match found, use Levenshtein distance to find the closest last name
        if (!foundMatch && !suggestedName) {
          let bestMatch = ''
          let bestDistance = Infinity
          
          validSpeakers.forEach((speakerInfo) => {
            const distance = levenshteinDistance(label, speakerInfo.lastNameUpper)
            const maxLen = Math.max(label.length, speakerInfo.lastNameUpper.length)
            const similarity = maxLen === 0 ? 0 : 1 - (distance / maxLen)
            
            // If similarity is 60% or higher, consider it a potential match
            if (similarity >= 0.60 && distance < bestDistance) {
              bestDistance = distance
              bestMatch = speakerInfo.lastNameUpper
            }
          })
          
          if (bestMatch) {
            suggestedName = bestMatch
            console.log(`[validateSenateSpeakerLabels] Found similar last name: "${label}" -> "${bestMatch}" (distance: ${bestDistance})`)
          }
        }
        
        console.log(`[validateSenateSpeakerLabels] Label: ${label}, Normalized: ${normalizedLabel}, Found match: ${foundMatch}`)
        console.log(`[validateSenateSpeakerLabels] Valid speakers count: ${validSpeakers.size}`)
        console.log(`[validateSenateSpeakerLabels] Valid speakers last names:`, Array.from(validSpeakers.values()).map(s => s.lastName))
        
        if (!foundMatch) {
          console.log(`[validateSenateSpeakerLabels] Unknown speaker label at line ${lineIndex + 1}: ${label}`)
          
          issues.push({
            id: `senate-unknown-label-${lineIndex}`,
            category: 'name',
            ruleName: 'Unknown Senate Speaker Label',
            severity: 'high',
            foundText: label,
            suggestedCorrection: suggestedName || 'Check if this speaker is in the speaker list',
            line: lineIndex + 1,
            column: 1,
            ignored: false
          })
        }
      }
      
      // Check for misspellings in the rest of the line (like "Ruonds" instead of "Rounds")
      if (validSpeakers.size > 0) {
        console.log(`[validateSenateSpeakerLabels] Checking rest of line for typos: "${restOfLine}"`)
        
        // Collect all valid name parts to check if a word is already a valid name
        const allValidParts = new Set<string>()
        validSpeakers.forEach((speakerInfo) => {
          speakerInfo.fullName.split(/\s+/).forEach(part => {
            if (part.length >= 3) {
              allValidParts.add(part.toLowerCase())
            }
          })
        })
        console.log(`[validateSenateSpeakerLabels] All valid parts:`, Array.from(allValidParts))
        
        // Track suggested pairs to avoid reciprocal suggestions (e.g., Joni->John and John->Joni)
        const suggestedPairs = new Set<string>()
        
        // First pass: collect all potential typos with their similarities
        const potentialTypos = new Map<string, { word: string, part: string, similarity: number, wordIndex: number }>()
        
        validSpeakers.forEach((speakerInfo) => {
          const speakerParts = speakerInfo.fullName.split(/\s+/)
          console.log(`[validateSenateSpeakerLabels] Checking speaker parts: ${speakerParts.join(', ')}`)
          
          speakerParts.forEach(part => {
            if (part.length < 3) return // Skip very short parts
            
            // Check for words that start with capital letter (potential names)
            const capitalWordPattern = new RegExp(`\\b[A-Z][a-z]+\\b`, 'g')
            let match
            while ((match = capitalWordPattern.exec(restOfLine)) !== null) {
              const capitalWord = match[0]
              const wordIndex = match.index
              
              console.log(`[validateSenateSpeakerLabels] Found capital word: "${capitalWord}" comparing to "${part}"`)
              
              // Check if this capital word is similar to a name part
              const normalizedWord = capitalWord.toLowerCase()
              const normalizedPart = part.toLowerCase()
              
              // Skip if the word itself is already a valid name (avoid reciprocal suggestions)
              if (allValidParts.has(normalizedWord)) {
                console.log(`[validateSenateSpeakerLabels] Skipping "${capitalWord}" - it's already a valid name`)
                continue
              }
              
              // Calculate Levenshtein distance for better typo detection
              const distance = levenshteinDistance(normalizedWord, normalizedPart)
              const maxLen = Math.max(normalizedWord.length, normalizedPart.length)
              const similarity = maxLen === 0 ? 0 : 1 - (distance / maxLen)
              
              console.log(`[validateSenateSpeakerLabels] Distance: ${distance}, Similarity: ${similarity.toFixed(2)}, Word: "${normalizedWord}", Part: "${normalizedPart}"`)
              
              // If words are similar (50% or more) but not identical, collect as potential typo
              if (normalizedWord !== normalizedPart && similarity >= 0.50) {
                const key = `${normalizedWord}-${wordIndex}`
                const existing = potentialTypos.get(key)
                
                // Calculate a score for tiebreaking
                let score = similarity
                // Prefer matches with same first letter
                if (normalizedWord[0] === normalizedPart[0]) {
                  score += 0.1
                }
                // Prefer matches with same length
                if (normalizedWord.length === normalizedPart.length) {
                  score += 0.1
                }
                // Prefer matches that are anagrams (same letters, different order) - likely transpositions
                const wordSorted = normalizedWord.split('').sort().join('')
                const partSorted = normalizedPart.split('').sort().join('')
                if (wordSorted === partSorted) {
                  score += 0.2
                }
                
                // Only keep the best match (highest score) for each word position
                if (!existing || score > existing.similarity || (score === existing.similarity && similarity > existing.similarity)) {
                  potentialTypos.set(key, { word: capitalWord, part, similarity: score, wordIndex })
                }
              }
            }
          })
        })
        
        // Second pass: add only the best matches to issues
        potentialTypos.forEach((value, key) => {
          const { word, part, similarity, wordIndex } = value
          
          // Calculate column: position in restOfLine + label length + ": " (2 chars) + 1 (for 1-indexed columns)
          const column = wordIndex + label.length + 2 + 1
          
          console.log(`[validateSenateSpeakerLabels] Possible typo at line ${lineIndex + 1}: "${word}" vs "${part}" (similarity: ${similarity.toFixed(2)})`)
          console.log(`[validateSenateSpeakerLabels] Column calculation: wordIndex=${wordIndex}, label.length=${label.length}, column=${column}`)
          console.log(`[validateSenateSpeakerLabels] Full line: "${line}"`)
          console.log(`[validateSenateSpeakerLabels] Rest of line: "${restOfLine}"`)
          
          // Use a unique ID that includes the word and part to avoid duplicates
          issues.push({
            id: `senate-typo-${lineIndex}-${column}-${word}-${part}`,
            category: 'name',
            ruleName: 'Possible Name Typo',
            severity: 'medium',
            foundText: word,
            suggestedCorrection: part,
            line: lineIndex + 1,
            column,
            ignored: false
          })
        })
      }
    }
    
    // Also check for full name speaker labels (should be last name only)
    const fullNameLabelPattern = /^([A-Z][a-z]+\s+[A-Z][a-z]+):\s*(.*)/
    const fullNameMatch = line.match(fullNameLabelPattern)
    
    if (fullNameMatch && validSpeakers.size > 0) {
      const fullNameLabel = fullNameMatch[1]
      const labelParts = fullNameLabel.split(/\s+/)
      const lastName = labelParts[labelParts.length - 1]
      const lastNameUpper = lastName.toUpperCase()
      
      console.log(`[validateSenateSpeakerLabels] Full name label detected at line ${lineIndex + 1}: ${fullNameLabel}`)
      
      issues.push({
        id: `senate-fullname-label-${lineIndex}`,
        category: 'formatting',
        ruleName: 'Senate Speaker Label Format',
        severity: 'high',
        foundText: fullNameLabel,
        suggestedCorrection: `${lastNameUpper}:`,
        line: lineIndex + 1,
        column: 1,
        ignored: false
      })
    }
  })
  
  console.log(`[validateSenateSpeakerLabels] Total issues found: ${issues.length}`)
  console.log(`[PERF] Senate Speaker Label Validation: ${Math.round(performance.now() - startTime)}ms`)
  return issues
}

// Detect transcript format to warn if wrong department is selected
export function detectTranscriptFormat(transcript: string): { format: string; confidence: number } {
  const lines = transcript.split('\n').filter(line => line.trim())
  let conferenceScore = 0
  let senateScore = 0
  
  // Conference/Earnings Call format indicators
  const conferencePatterns = [
    /\^/, // Speaker labels with ^
    /\[.*\]/, // Brackets for speaker labels
    /C:\s*\d{1,2}:\d{2}/i, // C: timestamp format
    /P:\s*\d{1,2}:\d{2}/i, // P: timestamp format
    /\+\+\+presentation/i, // +++presentation header
    /\+\+\+q&a/i, // +++q&a header
  ]
  
  // Senate Hearing format indicators (ALL CAPS + colon speaker labels)
  const senatePatterns = [
    /^[A-Z]{2,}:\s*\[/m, // ALL CAPS + colon + bracket (e.g., DOE: [text])
    /Sen\.\s+[A-Za-z]+,\s+[RD]-[A-Za-z]{2,3}/i, // Sen. Name, R-State
    /Dr\.\s+[A-Za-z\s]+,\s+to\s+be/i, // Dr. Name, to be
    /Chairman/i, // Chairman
    /Senator/i, // Senator
    /The Chair/i, // The Chair
    /Mr\./i, // Mr. (formal address)
    /Ms\./i, // Ms. (formal address)
    /Rep\./i, // Rep. (Representative)
  ]
  
  // Score Conference format
  conferencePatterns.forEach(pattern => {
    const matches = transcript.match(new RegExp(pattern.source, 'gi'))
    if (matches) conferenceScore += matches.length
  })
  
  // Score Senate format
  senatePatterns.forEach(pattern => {
    const matches = transcript.match(new RegExp(pattern.source, 'gi'))
    if (matches) senateScore += matches.length
  })
  
  console.log(`[detectTranscriptFormat] Conference score: ${conferenceScore}, Senate score: ${senateScore}`)
  
  // Determine format based on scores
  if (conferenceScore > senateScore && conferenceScore > 0) {
    return { format: 'conference', confidence: Math.min(conferenceScore / (conferenceScore + senateScore), 1) }
  } else if (senateScore > conferenceScore && senateScore > 0) {
    return { format: 'senate', confidence: Math.min(senateScore / (conferenceScore + senateScore), 1) }
  } else {
    return { format: 'unknown', confidence: 0 }
  }
}

// Main validation function
export async function validateTranscript(
  transcript: string,
  rules: ValidationRule[],
  customDictionary: string[] = [],
  department: string = 'all',
  onProgress?: (progress: ValidationProgress) => void
): Promise<ValidationIssue[]> {
  const startTime = performance.now()
  const allIssues: ValidationIssue[] = []
  
  console.log('[DEBUG] validateTranscript() called')
  console.log('[DEBUG] Department:', department)
  console.log('[DEBUG] Technical Dictionary passed in:')
  console.log(`[DEBUG] Count: ${customDictionary.length}`)
  console.log('[DEBUG] Entries:', customDictionary)
  
  // Detect transcript format to warn if wrong department is selected
  const formatDetection = detectTranscriptFormat(transcript)
  console.log(`[DEBUG] Detected format: ${formatDetection.format} (confidence: ${formatDetection.confidence.toFixed(2)})`)
  
  // Check for department/format mismatch - return early with error if mismatch detected
  if (formatDetection.format !== 'unknown' && formatDetection.confidence > 0.5) {
    const normalizedDepartment = department.toLowerCase().replace(/\s+/g, '')
    const isConferenceDepartment = normalizedDepartment === 'conference/earningscall' || normalizedDepartment === 'conference'
    const isSenateDepartment = normalizedDepartment === 'senate' || normalizedDepartment === 'senatehearing/political'
    
    if (formatDetection.format === 'conference' && isSenateDepartment) {
      console.log('[DEBUG] WARNING: Senate department selected but Conference format detected')
      return [{
        id: 'format-mismatch-warning',
        category: 'formatting',
        ruleName: 'Department Format Mismatch',
        severity: 'high',
        foundText: 'Senate Hearing / Political',
        suggestedCorrection: 'Conference / Earnings Call',
        line: 1,
        column: 1,
        ignored: false
      }]
    } else if (formatDetection.format === 'senate' && isConferenceDepartment) {
      console.log('[DEBUG] WARNING: Conference department selected but Senate format detected')
      return [{
        id: 'format-mismatch-warning',
        category: 'formatting',
        ruleName: 'Department Format Mismatch',
        severity: 'high',
        foundText: 'Conference / Earnings Call',
        suggestedCorrection: 'Senate Hearing / Political',
        line: 1,
        column: 1,
        ignored: false
      }]
    }
  }
  
  // Filter rules by department (custom rules from Admin Hub)
  const filteredRules = department === 'all' 
    ? rules 
    : rules.filter(r => r.department === department || r.department === 'all')
  
  // Name and company validation removed - only format and style guide validation
  console.log('[DEBUG] Skipping name and company validation - only format and style validation enabled')
  
  onProgress?.({ stage: 'style', current: 1, total: 100, message: 'Applying style rules...' })
  const styleStart = performance.now()
  // Apply style rules (filtered by department)
  const styleIssues = applyStyleRules(transcript, filteredRules)
  allIssues.push(...styleIssues)
  const styleTime = Math.round(performance.now() - styleStart)
  console.log(`[PERF] Style Rules: ${styleTime}ms`)
  
  onProgress?.({ stage: 'spelling', current: 2, total: 100, message: 'Checking technical dictionary...' })
  const spellingStart = performance.now()
  // Validate spelling using technical dictionary (custom dictionary)
  const spellingIssues = await validateSpelling(transcript, [], [], customDictionary, onProgress)
  allIssues.push(...spellingIssues)
  const spellingTime = Math.round(performance.now() - spellingStart)
  console.log(`[PERF] Spelling (Technical Dictionary): ${spellingTime}ms`)
  
  onProgress?.({ stage: 'repeated', current: 3, total: 100, message: 'Checking for repeated words...' })
  const repeatedStart = performance.now()
  // Detect repeated words
  const repeatedWordIssues = detectRepeatedWords(transcript)
  allIssues.push(...repeatedWordIssues)
  const repeatedTime = Math.round(performance.now() - repeatedStart)
  console.log(`[PERF] Repeated Words: ${repeatedTime}ms`)
  
  const endTime = performance.now()
  const validationTime = Math.round(endTime - startTime)
  console.log(`[validateTranscript] Total validation time: ${validationTime}ms`)
  console.log(`[validateTranscript] Total issues found: ${allIssues.length}`)
  console.log(`[PERF] Breakdown: Style=${styleTime}ms, Spelling=${spellingTime}ms, Repeated=${repeatedTime}ms`)
  
  onProgress?.({ stage: 'complete', current: 100, total: 100, message: `Validation complete (${validationTime}ms)` })
  
  return allIssues
}

// Replace text in transcript
export function replaceInTranscript(
  transcript: string,
  issue: ValidationIssue
): string {
  const lines = transcript.split('\n')
  
  if (issue.line > 0 && issue.line <= lines.length) {
    const lineIndex = issue.line - 1
    const line = lines[lineIndex]
    
    // If column info is available, replace only at that specific position
    if (issue.column > 0 && issue.column <= line.length) {
      const columnZeroBased = issue.column - 1
      // Get the actual text at the position to ensure we replace the right thing
      const actualText = line.substring(columnZeroBased, columnZeroBased + issue.foundText.length)
      
      console.log(`[replaceInTranscript] Line: ${issue.line}, Column: ${issue.column}`)
      console.log(`[replaceInTranscript] FoundText: "${issue.foundText}", Suggested: "${issue.suggestedCorrection}"`)
      console.log(`[replaceInTranscript] Actual text at position: "${actualText}"`)
      
      // Only replace if the actual text matches what we expect (case-insensitive)
      if (actualText.toLowerCase() === issue.foundText.toLowerCase()) {
        const before = line.substring(0, columnZeroBased)
        const after = line.substring(columnZeroBased + issue.foundText.length)
        const newLine = before + issue.suggestedCorrection + after
        lines[lineIndex] = newLine
        console.log(`[replaceInTranscript] Match found, replacing. New line: "${newLine}"`)
        return lines.join('\n')
      } else {
        // If the text doesn't match, try to find it in the line
        console.log(`[replaceInTranscript] Text doesn't match at position, searching in line...`)
        const foundIndex = line.toLowerCase().indexOf(issue.foundText.toLowerCase())
        if (foundIndex !== -1) {
          const before = line.substring(0, foundIndex)
          const after = line.substring(foundIndex + issue.foundText.length)
          const newLine = before + issue.suggestedCorrection + after
          lines[lineIndex] = newLine
          console.log(`[replaceInTranscript] Found at index ${foundIndex}, replacing. New line: "${newLine}"`)
          return lines.join('\n')
        } else {
          console.log(`[replaceInTranscript] Could not find "${issue.foundText}" in line`)
        }
      }
    }
    
    // If column info is not available, use exact case match but only first occurrence
    console.log(`[replaceInTranscript] No column info, using regex replacement`)
    const regex = new RegExp(issue.foundText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const newLine = line.replace(regex, issue.suggestedCorrection)
    
    lines[lineIndex] = newLine
    return lines.join('\n')
  }
  
  // If line info is not available, do global replace with exact case
  console.log(`[replaceInTranscript] No line info, doing global replace`)
  const regex = new RegExp(issue.foundText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  return transcript.replace(regex, issue.suggestedCorrection)
}

// Get CSS class for highlighting based on category
export function getHighlightClass(category: ValidationIssue['category']): string {
  switch (category) {
    case 'style':
      return 'validation-issue-yellow'
    case 'name':
      return 'validation-issue-red'
    case 'company':
      return 'validation-issue-orange'
    case 'spelling':
      return 'validation-issue-blue'
    case 'formatting':
      return 'validation-issue-purple'
    default:
      return 'validation-issue-yellow'
  }
}

// CSS styles for highlighting
export const validationHighlightStyles = `
  .validation-issue-yellow {
    background-color: #fef08a;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    border: 1px solid #fde047;
  }
  .validation-issue-red {
    background-color: #fecaca;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    border: 1px solid #f87171;
  }
  .validation-issue-orange {
    background-color: #fed7aa;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    border: 1px solid #fb923c;
  }
  .validation-issue-blue {
    background-color: #bfdbfe;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    border: 1px solid #60a5fa;
  }
  .validation-issue-purple {
    background-color: #e9d5ff;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    border: 1px solid #a855f7;
  }
  .validation-issue-green-underline {
    text-decoration: underline;
    text-decoration-color: #22c55e;
    text-decoration-thickness: 2px;
    text-underline-offset: 2px;
    cursor: pointer;
  }
`
