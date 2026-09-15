/**
 * Utility to detect, parse, and auto-format raw assignment text into the standard
 * bold-labeled structure:
 * 
 * Code: [code]
 * Company: [company]
 * Duration: [duration]
 * Audio Availability: [audio availability]
 * Topic: [topic]
 * Due: [due]
 */

export interface ParsedAssignment {
  isAssignment: boolean
  code?: string
  company?: string
  duration?: string
  audioAvailability?: string
  topic?: string
  due?: string
  formattedHtml: string
  formattedText: string
  extraLines?: string[]
}

const SEQUENCE_LABELS = [
  'Code',
  'Company',
  'Duration',
  'Audio Availability',
  'Topic',
  'Due',
] as const

/**
 * Strips HTML and splits into trimmed non-empty lines.
 */
export function extractCleanLines(input: string): string[] {
  if (!input) return []

  // Replace block breaks with newlines
  const textWithNewlines = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<(div|p|li|tr|h[1-6])[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '') // remove remaining HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

  return textWithNewlines
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Checks if a line starts with one of our recognized labels.
 */
export function matchExistingLabel(line: string): { labelKey: string; value: string } | null {
  const match = line.match(
    /^(?:<b>|<strong>)?(code|company|duration|audio\s*availability|audio\s*avail|audio|topic|due)\s*:\s*(?:<\/b>|<\/strong>)?\s*(.*)$/i
  )
  if (!match) return null

  const rawKey = match[1].toLowerCase().replace(/\s+/g, ' ')
  let normalizedKey = 'Code'
  if (rawKey === 'code') normalizedKey = 'Code'
  else if (rawKey === 'company') normalizedKey = 'Company'
  else if (rawKey === 'duration') normalizedKey = 'Duration'
  else if (rawKey.startsWith('audio')) normalizedKey = 'Audio Availability'
  else if (rawKey === 'topic') normalizedKey = 'Topic'
  else if (rawKey === 'due') normalizedKey = 'Due'

  return {
    labelKey: normalizedKey,
    value: match[2].trim(),
  }
}

/**
 * Determines whether text is raw assignment format or has assignment labels.
 */
export function isRawAssignmentSequence(input: string): boolean {
  const lines = extractCleanLines(input)
  if (lines.length < 3) return false

  // Check if any line has explicit assignment labels
  const hasKnownLabel = lines.some((l) => matchExistingLabel(l) !== null)
  if (hasKnownLabel) return true

  // Check 6-line client format:
  // Line 0: Code (typically digits/alphanumeric, e.g. 782084601)
  // Line 1: Company (text)
  // Line 2: Duration (e.g. 0:30:00, 30:00, or duration)
  // Line 3: Audio Availability (e.g. 10:00)
  // Line 4: Topic (text)
  // Line 5: Due (e.g. 1500ET, 15:00, etc.)
  if (lines.length >= 5) {
    const isDuration = /\d+:\d+/.test(lines[2]) || /\d+\s*(?:min|mins|hr|hrs)/i.test(lines[2])
    const isDueOrTime = /\d{2,4}\s*(?:et|est|edt|ct|pt|utc|gmt|am|pm)?/i.test(lines[lines.length - 1]) ||
      /due/i.test(lines[lines.length - 1])

    if (isDuration || isDueOrTime) {
      return true
    }

    // If exactly 6 lines and first line looks like a job code/id (e.g. digits or alphanumeric without punctuation)
    if (lines.length === 6 && /^[a-zA-Z0-9_-]{4,20}$/.test(lines[0])) {
      return true
    }
  }

  return false
}

/**
 * Formats parsed items into HTML with bold labels:
 * <div><b>Code:</b> 782084601</div>
 * <div><b>Company:</b> ORIC PHARMACEUTICALS INC</div>
 * <div><b>Duration:</b> 0:30:00</div>
 * <div><b>Audio Availability:</b> 10:00</div>
 * <div><b>Topic:</b> Morgan Stanley 24th Annual Global Healthcare Conference</div>
 * <div><b>Due:</b> 1500ET</div>
 */
export function parseAndFormatAssignment(input: string): ParsedAssignment {
  const lines = extractCleanLines(input)

  if (lines.length === 0) {
    return {
      isAssignment: false,
      formattedHtml: '',
      formattedText: '',
    }
  }

  const values: Record<string, string> = {
    Code: '',
    Company: '',
    Duration: '',
    'Audio Availability': '',
    Topic: '',
    Due: '',
  }
  const extraLines: string[] = []

  const hasExplicitLabels = lines.some((l) => matchExistingLabel(l) !== null)

  if (hasExplicitLabels) {
    // Parse using matching labels
    for (const line of lines) {
      const match = matchExistingLabel(line)
      if (match) {
        values[match.labelKey] = match.value
      } else {
        extraLines.push(line)
      }
    }
  } else if (lines.length >= 6) {
    // Exact standard sequence:
    // [0] Code, [1] Company, [2] Duration, [3] Audio Availability, [4] Topic, [5] Due
    values['Code'] = lines[0]
    values['Company'] = lines[1]
    values['Duration'] = lines[2]
    values['Audio Availability'] = lines[3]
    values['Topic'] = lines[4]
    values['Due'] = lines[5]

    for (let i = 6; i < lines.length; i++) {
      extraLines.push(lines[i])
    }
  } else if (lines.length === 5) {
    // 5 lines could mean either Audio Availability is missing or Topic/Due are shifted
    // Check if line 3 is audio availability (time format e.g. 10:00)
    values['Code'] = lines[0]
    values['Company'] = lines[1]
    values['Duration'] = lines[2]

    const line3IsTime = /^\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:am|pm|et|est|edt))?$/i.test(lines[3])
    if (line3IsTime) {
      values['Audio Availability'] = lines[3]
      values['Topic'] = lines[4]
    } else {
      // Audio Availability was omitted, line 3 is Topic, line 4 is Due
      values['Topic'] = lines[3]
      values['Due'] = lines[4]
    }
  } else {
    // Map whatever lines exist in sequence
    lines.forEach((line, idx) => {
      if (idx < SEQUENCE_LABELS.length) {
        values[SEQUENCE_LABELS[idx]] = line
      } else {
        extraLines.push(line)
      }
    })
  }

  // Construct HTML with bold labels
  const htmlParts: string[] = []
  const textParts: string[] = []

  for (const label of SEQUENCE_LABELS) {
    const val = values[label] || ''
    // Only include if there's a value or if standard sequence was detected
    if (val) {
      htmlParts.push(`<div><b>${label}:</b> ${val}</div>`)
      textParts.push(`${label}: ${val}`)
    }
  }

  for (const extra of extraLines) {
    htmlParts.push(`<div>${extra}</div>`)
    textParts.push(extra)
  }

  return {
    isAssignment: true,
    code: values['Code'],
    company: values['Company'],
    duration: values['Duration'],
    audioAvailability: values['Audio Availability'],
    topic: values['Topic'],
    due: values['Due'],
    formattedHtml: htmlParts.join(''),
    formattedText: textParts.join('\n'),
    extraLines,
  }
}
