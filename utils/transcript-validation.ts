// Transcript Validation Engine
// Rule-based validation without AI/LLMs

export interface ValidationIssue {
  id: string
  category: 'style' | 'name' | 'company' | 'spelling' | 'formatting'
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
  enabled: boolean
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

// Validate names using exact matching against extracted participants
export function validateNames(transcript: string, participants: Participant[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  let presentationStartIndex = -1
  
  console.log('[validateNames] Participants:', participants)
  console.log('[validateNames] Transcript lines:', lines.length)
  
  // Find +++presentation line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === '+++presentation') {
      presentationStartIndex = i
      break
    }
  }
  
  console.log('[validateNames] Found +++presentation at line:', presentationStartIndex)
  
  if (presentationStartIndex < 0) return issues
  
  // Extract all expected names (exact matches only)
  const expectedNames = participants.map(p => p.name)
  const expectedNamesLower = expectedNames.map(n => n.toLowerCase())
  
  // Extract first names from participant names
  const firstNames = participants.map(p => p.name.split(' ')[0])
  const firstNamesLower = firstNames.map(n => n.toLowerCase())
  
  console.log('[validateNames] Expected names:', expectedNames)
  console.log('[validateNames] First names:', firstNames)
  
  // Check speaker labels after +++presentation
  for (let i = presentationStartIndex + 1; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    // Match speaker labels: Name^ (anything after the caret)
    const speakerLabelRegex = /^([A-Za-z\s]+)\^/
    const match = trimmedLine.match(speakerLabelRegex)
    
    if (match) {
      const speakerName = match[1].trim()
      const speakerNameLower = speakerName.toLowerCase()
      
      console.log(`[validateNames] Found speaker label: "${speakerName}" at line ${i + 1}`)
      
      // Check for exact match with expected names (case-insensitive)
      const hasExactMatch = expectedNamesLower.includes(speakerNameLower)
      
      console.log(`[validateNames] Exact match for "${speakerName}": ${hasExactMatch}`)
      
      // If no exact match, flag as error
      if (!hasExactMatch) {
        // Find closest match for suggestion (using fuzzy matching only for suggestion)
        let bestMatch = ''
        let bestSimilarity = 0
        for (const expectedName of expectedNames) {
          const similarity = calculateSimilarity(speakerName, expectedName)
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestMatch = expectedName
          }
        }
        
        // Only suggest if similarity is reasonable (>= 0.5)
        const suggestion = bestSimilarity >= 0.5 ? bestMatch : ''
        
        console.log(`[validateNames] Adding issue for "${speakerName}" -> suggestion: "${suggestion}"`)
        
        issues.push({
          id: `name-${i}-${speakerName}`,
          category: 'name',
          foundText: speakerName,
          suggestedCorrection: suggestion,
          line: i + 1,
          column: lines[i].indexOf(speakerName) + 1,
          ignored: false
        })
      }
    }
  }
  
  // Check transcript text for misspelled first names (after +++presentation)
  for (let i = presentationStartIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    // Skip speaker label lines (lines that end with ^)
    if (line.trim().match(/\^$/)) continue
    
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      // Clean the word - remove punctuation but keep letters
      const cleanWord = word.replace(/[^a-zA-Z]/g, '')
      if (cleanWord.length < 2) return // Skip very short words
      
      const cleanWordLower = cleanWord.toLowerCase()
      
      // Check if this word might be a misspelled first name
      // It should not be an exact match to any first name
      if (!firstNamesLower.includes(cleanWordLower)) {
        // Check for fuzzy match with first names
        for (let j = 0; j < firstNames.length; j++) {
          const firstName = firstNames[j]
          const firstNameLower = firstNamesLower[j]
          const similarity = calculateSimilarity(cleanWord, firstName)
          
          // If similarity is high enough but not exact, flag it
          if (similarity >= 0.6 && similarity < 1.0) {
            const lineStart = line.indexOf(word)
            console.log(`[validateNames] Found misspelled first name in text: "${cleanWord}" -> "${firstName}" at line ${i + 1}`)
            
            issues.push({
              id: `name-text-${i}-${wordIndex}`,
              category: 'name',
              foundText: word,
              suggestedCorrection: firstName,
              line: i + 1,
              column: lineStart + 1,
              ignored: false
            })
            break // Only add one issue per word
          }
        }
      }
    })
  }
  
  console.log('[validateNames] Total name issues found:', issues.length)
  return issues
}

// Basic English spell checker using common misspellings dictionary
const commonMisspellings: Record<string, string> = {
  'thnk': 'think',
  'thnking': 'thinking',
  'togther': 'together',
  'recieve': 'receive',
  'occured': 'occurred',
  'seperate': 'separate',
  'definately': 'definitely',
  'accomodate': 'accommodate',
  'neccessary': 'necessary',
  'maintainance': 'maintenance',
  'goverment': 'government',
  'enviroment': 'environment',
  'acheive': 'achieve',
  'beleive': 'believe',
  'begining': 'beginning',
  'buisness': 'business',
  'calender': 'calendar',
  'catagory': 'category',
  'cemetary': 'cemetery',
  'collegue': 'colleague',
  'comming': 'coming',
  'concious': 'conscious',
  'curiousity': 'curiosity',
  'decieve': 'deceive',
  'desparate': 'desperate',
  'diffrent': 'different',
  'disapear': 'disappear',
  'embarass': 'embarrass',
  'existance': 'existence',
  'experiance': 'experience',
  'familar': 'familiar',
  'finaly': 'finally',
  'foriegn': 'foreign',
  'fourty': 'forty',
  'freind': 'friend',
  'gaurd': 'guard',
  'grammer': 'grammar',
  'greatful': 'grateful',
  'happend': 'happened',
  'heros': 'heroes',
  'higest': 'highest',
  'humourous': 'humorous',
  'immediatly': 'immediately',
  'independant': 'independent',
  'intresting': 'interesting',
  'irrelevent': 'irrelevant',
  'knowlege': 'knowledge',
  'labratory': 'laboratory',
  'lisence': 'license',
  'loose': 'lose',
  'millenium': 'millennium',
  'mischievious': 'mischievous',
  'noticable': 'noticeable',
  'ocassion': 'occasion',
  'offical': 'official',
  'oftenly': 'often',
  'origionally': 'originally',
  'pavillion': 'pavilion',
  'percieve': 'perceive',
  'pharoah': 'pharaoh',
  'posession': 'possession',
  'potatos': 'potatoes',
  'prefered': 'preferred',
  'priviledge': 'privilege',
  'profesion': 'profession',
  'publically': 'publicly',
  'questionaire': 'questionnaire',
  'realise': 'realize',
  'realy': 'really',
  'reccomend': 'recommend',
  'recomend': 'recommend',
  'refered': 'referred',
  'relevent': 'relevant',
  'religous': 'religious',
  'remeber': 'remember',
  'repetition': 'repetition',
  'resistence': 'resistance',
  'responsability': 'responsibility',
  'rythm': 'rhythm',
  'sacrilegious': 'sacrilegious',
  'sargent': 'sergeant',
  'scedule': 'schedule',
  'sence': 'sense',
  'sieze': 'seize',
  'similiar': 'similar',
  'sincerly': 'sincerely',
  'speach': 'speech',
  'sucessful': 'successful',
  'supercede': 'supersede',
  'suprise': 'surprise',
  'temperture': 'temperature',
  'tendancy': 'tendency',
  'thankyou': 'thank you',
  'therefor': 'therefore',
  'thier': 'their',
  'tomatos': 'tomatoes',
  'tommorrow': 'tomorrow',
  'tounge': 'tongue',
  'truely': 'truly',
  'unfortunatly': 'unfortunately',
  'untill': 'until',
  'unuseual': 'unusual',
  'usuable': 'usable',
  'usualy': 'usually',
  'vaccuum': 'vacuum',
  'vegetaian': 'vegetarian',
  'vehical': 'vehicle',
  'visious': 'vicious',
  'weird': 'weird',
  'wether': 'whether',
  'wierd': 'weird',
  'writting': 'writing',
  'yours': 'yours',
  'zebra': 'zebra',
  // Additional common misspellings
  'grat': 'great',
  'graet': 'great',
  'lke': 'like',
  'jone': 'john',
  'jonh': 'john',
  'johm': 'john',
  'micheal': 'michael',
  'michal': 'michael',
  'mathew': 'matthew',
  'steven': 'stephen',
  'stevan': 'stephen',
  'sara': 'sarah',
  'davud': 'david',
  'robrt': 'robert',
  'wiliiam': 'william',
  'jaims': 'james',
  'richad': 'richard',
  'josef': 'joseph',
  'thoms': 'thomas',
  'charls': 'charles',
  'christofer': 'christopher',
  'danial': 'daniel',
  'mattew': 'matthew',
  'antony': 'anthony',
  'marc': 'mark',
  'donlad': 'donald',
  'pual': 'paul',
  'stven': 'steven',
  'andrw': 'andrew',
  'joshau': 'joshua',
  'keneth': 'kenneth',
  'keven': 'kevin',
  'bryan': 'brian',
  'gorge': 'george',
  'edwad': 'edward',
  'ronad': 'ronald',
  'timoth': 'timothy',
  'jasn': 'jason',
  'jeffry': 'jeffrey',
  'ryna': 'ryan',
  'jaccob': 'jacob',
  'garey': 'gary',
  'erik': 'eric',
  'jonthan': 'jonathan',
  'stphen': 'stephen',
  'lary': 'larry',
  'justn': 'justin',
  'scot': 'scott',
  'bradon': 'brandon',
  'benjamen': 'benjamin',
  'samual': 'samuel',
  'raymod': 'raymond',
  'alexandar': 'alexander',
  'alexandr': 'alexander',
  'patric': 'patrick',
  'jac': 'jack',
  'denis': 'dennis',
  'jery': 'jerry',
  'tyer': 'tyler',
  'jos': 'jose',
  'ada': 'adam',
  'henrey': 'henry',
  'nathen': 'nathan',
  'duglas': 'douglas',
  'petr': 'peter',
  'kyl': 'kyle',
  'waltr': 'walter',
  'ethen': 'ethan',
  'jermy': 'jeremy',
  'harod': 'harold',
  'kieth': 'keith',
  'christain': 'christian',
  'logon': 'logan',
  'alexix': 'alexis',
  'coln': 'colin',
  'cody': 'cody',
  'claton': 'clayton',
  'shne': 'shane',
  'camron': 'cameron',
  'felip': 'felipe',
  'elijha': 'elijah',
  'dylun': 'dylan',
  'jorden': 'jordan',
  'jacksn': 'jackson',
  'gavon': 'gavin',
  'kenedy': 'kennedy',
  'braxtn': 'braxton',
  'carsn': 'carson',
  'huntr': 'hunter',
  'tristn': 'tristan',
  'parkr': 'parker',
  'lincon': 'lincoln',
  'masn': 'mason',
  'jaspr': 'jasper',
  'conor': 'connor',
  'finly': 'finley',
  'graysn': 'grayson',
  'charli': 'charlie',
  'luek': 'luke',
  'luk': 'luke'
}

// Validate spelling using common misspellings dictionary
export function validateSpelling(transcript: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  console.log('[validateSpelling] Checking transcript for spelling errors')
  console.log('[validateSpelling] Dictionary size:', Object.keys(commonMisspellings).length)
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
      
      if (commonMisspellings[cleanWord]) {
        const lineStart = line.indexOf(word)
        console.log(`[validateSpelling] Found misspelling: ${cleanWord} -> ${commonMisspellings[cleanWord]} at line ${lineIndex + 1}`)
        issues.push({
          id: `spelling-${lineIndex}-${wordIndex}`,
          category: 'spelling',
          foundText: word,
          suggestedCorrection: commonMisspellings[cleanWord],
          line: lineIndex + 1,
          column: lineStart + 1,
          ignored: false
        })
      }
    })
  })
  
  // Check for double dash repeated words pattern: word -- word (whole words only)
  const doubleDashRegex = /\b(\w+)\s*--\s*\1\b/gi
  let match
  while ((match = doubleDashRegex.exec(transcript)) !== null) {
    const line = transcript.substring(0, match.index).split('\n').length
    const lineStart = transcript.lastIndexOf('\n', match.index - 1) + 1
    const column = match.index - lineStart + 1
    
    console.log(`[validateSpelling] Found double dash pattern: "${match[0]}" at line ${line}`)
    
    issues.push({
      id: `formatting-double-dash-${match.index}`,
      category: 'formatting',
      foundText: match[0],
      suggestedCorrection: match[1],
      line,
      column,
      ignored: false
    })
  }
  
  console.log('[validateSpelling] Total spelling issues found:', issues.length)
  return issues
}
export function validateCompanyNames(transcript: string, companyNames: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = transcript.split('\n')
  
  if (companyNames.length === 0) return issues
  
  // Check each line for company name mentions
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/)
    
    words.forEach((word, wordIndex) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '')
      
      for (const companyName of companyNames) {
        const cleanCompany = companyName.replace(/[^a-zA-Z0-9]/g, '')
        
        // Skip if it's an exact match
        if (cleanWord.toLowerCase() === cleanCompany.toLowerCase()) {
          continue
        }
        
        // Check for fuzzy match
        const similarity = calculateSimilarity(cleanWord, cleanCompany)
        
        if (similarity >= 0.7 && similarity < 0.95) {
          const lineStart = line.indexOf(word)
          issues.push({
            id: `company-${lineIndex}-${wordIndex}`,
            category: 'company',
            foundText: word,
            suggestedCorrection: companyName,
            line: lineIndex + 1,
            column: lineStart + 1,
            ignored: false
          })
        }
      }
    })
  })
  
  return issues
}

// Apply style and formatting rules
export function applyStyleRules(transcript: string, rules: ValidationRule[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const enabledRules = rules.filter(r => r.enabled)
  
  enabledRules.forEach(rule => {
    const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    let matchCount = 0
    
    while ((match = regex.exec(transcript)) !== null) {
      matchCount++
      // Limit to first 10 matches per rule to avoid overwhelming
      if (matchCount > 10) break
      
      const line = transcript.substring(0, match.index).split('\n').length
      const lineStart = transcript.lastIndexOf('\n', match.index - 1) + 1
      const column = match.index - lineStart + 1
      
      // Determine category based on rule's category field
      const category = rule.category === 'formatting' ? 'formatting' : 'style'
      
      issues.push({
        id: `${category}-${rule.id}-${matchCount}`,
        category,
        foundText: match[0],
        suggestedCorrection: rule.replace,
        line,
        column,
        ignored: false
      })
    }
  })
  
  return issues
}

// Main validation function
export async function validateTranscript(
  transcript: string,
  rules: ValidationRule[]
): Promise<ValidationIssue[]> {
  const allIssues: ValidationIssue[] = []
  
  // Extract participants and company names
  const { participants, companyNames } = extractParticipants(transcript)
  
  // Validate names
  const nameIssues = validateNames(transcript, participants)
  allIssues.push(...nameIssues)
  
  // Validate company names
  const companyIssues = validateCompanyNames(transcript, companyNames)
  allIssues.push(...companyIssues)
  
  // Validate spelling
  const spellingIssues = validateSpelling(transcript)
  allIssues.push(...spellingIssues)
  
  // Apply style rules
  const styleIssues = applyStyleRules(transcript, rules)
  allIssues.push(...styleIssues)
  
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
    
    // Find the text to replace
    const regex = new RegExp(issue.foundText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const newLine = line.replace(regex, issue.suggestedCorrection)
    
    lines[lineIndex] = newLine
    return lines.join('\n')
  }
  
  // If line info is not available, do global replace
  const regex = new RegExp(issue.foundText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
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
`
