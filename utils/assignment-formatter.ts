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
 * 
 * Preserves user-added notes (including bolding/styling), standalone spaces/blank lines,
 * and the exact relative order of lines.
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

const CUSTOM_NOTE_PREFIX_REGEX =
  /^(?:<[^>]+>)*\s*(?:<b>|<strong>)?\s*(note|notes|attention|important|notice|warning|instructions?|info|comment|memo|rush)\s*:\s*/i

/**
 * Checks if the content is ALREADY formatted assignment HTML with bold labels
 * (e.g. <b>Code:</b> or <strong>Company:</strong>).
 */
export function isAlreadyFormattedAssignment(input: string): boolean {
  if (!input) return false
  return /<(?:b|strong)>\s*(?:Code|Company|Duration|Audio\s*Availability|Audio\s*Avail|Audio|Topic|Due)\s*:\s*<\/(?:b|strong)>/i.test(
    input
  )
}

/**
 * Normalizes input text/HTML into an array of lines.
 * When preserveTags is true, inline formatting tags (<b>, <strong>, <i>, <u>, <span>, <font>) are preserved.
 * When preserveBlankLines is true, empty lines / standalone spaces are represented as empty strings ("").
 */
export function extractLines(
  input: string,
  preserveTags = true,
  preserveBlankLines = true
): string[] {
  if (!input) return []

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(input)

  // Pre-normalize HTML block elements and breaks
  let s = input
    // contentEditable empty rows: <div><br></div> or <p><br></p>
    .replace(/<(?:div|p)[^>]*>\s*<br\s*\/?>\s*<\/(?:div|p)>/gi, '\n__BLANK_LINE__\n')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n__BLANK_LINE__\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<(?:div|p|li|tr|h[1-6])[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

  if (!preserveTags) {
    s = s.replace(/<[^>]*>/g, '')
  }

  const raw = s.split(/\r?\n/).map((l) => l.trim())
  const lines: string[] = []

  for (let i = 0; i < raw.length; i++) {
    const l = raw[i]
    if (l === '__BLANK_LINE__') {
      if (preserveBlankLines) {
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('')
        }
      }
    } else if (l === '') {
      if (preserveBlankLines && !hasHtmlTags) {
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('')
        }
      }
    } else {
      lines.push(l)
    }
  }

  if (preserveBlankLines) {
    while (lines.length > 0 && lines[0] === '') lines.shift()
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  }

  return lines
}

/**
 * Strips HTML and splits into trimmed non-empty lines (legacy helper).
 */
export function extractCleanLines(input: string): string[] {
  return extractLines(input, false, false)
}

/**
 * Checks if a line starts with one of our recognized labels.
 */
export function matchExistingLabel(line: string): { labelKey: string; value: string } | null {
  if (!line) return null
  const cleaned = line.replace(/^<(?:div|p)[^>]*>|<\/(?:div|p)>$/gi, '').trim()

  const match = cleaned.match(
    /^(?:<[^>]+>)*\s*(?:<b>|<strong>)?\s*(code|company|duration|audio\s*availability|audio\s*avail|audio|topic|due)\s*:\s*(?:<\/b>|<\/strong>)?\s*(.*)$/i
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

  let val = match[2].trim()
  val = val
    .replace(/^<\/(?:b|strong)>\s*/i, '')
    .replace(/<\/(?:b|strong)>$/i, '')
    .trim()

  return {
    labelKey: normalizedKey,
    value: val,
  }
}

/**
 * Safely extracts standard assignment fields without mutating the input HTML or order.
 */
export function extractAssignmentFields(input: string): {
  code?: string
  company?: string
  duration?: string
  audioAvailability?: string
  topic?: string
  due?: string
} {
  if (!input) return {}
  const lines = extractLines(input, true, false)
  const values: Record<string, string> = {}

  for (const line of lines) {
    if (!line) continue
    const match = matchExistingLabel(line)
    if (match) {
      values[match.labelKey] = match.value.replace(/<[^>]*>/g, '').trim()
    }
  }

  // If no explicit labels, try reading from standard 5-6 line sequence
  if (!values['Code'] && !values['Company']) {
    const nonEmpty = lines.filter((l) => l.length > 0 && !CUSTOM_NOTE_PREFIX_REGEX.test(l))
    if (nonEmpty.length >= 5) {
      values['Code'] = nonEmpty[0].replace(/<[^>]*>/g, '').trim()
      values['Company'] = nonEmpty[1].replace(/<[^>]*>/g, '').trim()
      values['Duration'] = nonEmpty[2].replace(/<[^>]*>/g, '').trim()
      if (nonEmpty.length === 5) {
        values['Topic'] = nonEmpty[3].replace(/<[^>]*>/g, '').trim()
        values['Due'] = nonEmpty[4].replace(/<[^>]*>/g, '').trim()
      } else {
        values['Audio Availability'] = nonEmpty[3].replace(/<[^>]*>/g, '').trim()
        values['Topic'] = nonEmpty[4].replace(/<[^>]*>/g, '').trim()
        values['Due'] = nonEmpty[5].replace(/<[^>]*>/g, '').trim()
      }
    }
  }

  return {
    code: values['Code'],
    company: values['Company'],
    duration: values['Duration'],
    audioAvailability: values['Audio Availability'],
    topic: values['Topic'],
    due: values['Due'],
  }
}

/**
 * Determines whether text is raw assignment format that needs auto-formatting.
 * Returns FALSE if the input is already formatted HTML with bold labels!
 */
export function isRawAssignmentSequence(input: string): boolean {
  if (!input) return false

  // If already formatted HTML with bold labels, it is definitely not raw
  if (isAlreadyFormattedAssignment(input)) return false

  const lines = extractLines(input, false, false)
  if (lines.length < 3) return false

  // Check if any line has explicit unbolded assignment labels
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
    const isDueOrTime =
      /\d{2,4}\s*(?:et|est|edt|ct|pt|utc|gmt|am|pm)?/i.test(lines[lines.length - 1]) ||
      /due/i.test(lines[lines.length - 1])

    if (isDuration || isDueOrTime) {
      return true
    }

    // If exactly 6 lines and first line looks like a job code/id
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
 * 
 * Preserves user notes, bold tags on notes, blank lines/standalone spaces,
 * and maintains the exact line order without pushing notes to the bottom.
 */
export function parseAndFormatAssignment(input: string): ParsedAssignment {
  const lines = extractLines(input, true, true)

  if (lines.length === 0) {
    return {
      isAssignment: false,
      formattedHtml: '',
      formattedText: '',
      extraLines: [],
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

  const hasExplicitLabels = lines.some((l) => l && matchExistingLabel(l) !== null)
  const formattedHtmlParts: string[] = []
  const formattedTextParts: string[] = []

  if (hasExplicitLabels) {
    for (const line of lines) {
      if (line === '') {
        // Standalone space / blank line
        formattedHtmlParts.push('<div><br></div>')
        formattedTextParts.push('')
        continue
      }

      const match = matchExistingLabel(line)
      if (match) {
        values[match.labelKey] = match.value.replace(/<[^>]*>/g, '').trim()
        formattedHtmlParts.push(`<div><b>${match.labelKey}:</b> ${match.value}</div>`)
        formattedTextParts.push(`${match.labelKey}: ${values[match.labelKey]}`)
      } else {
        // Extra line/note: PRESERVE EXACT FORMATTING (bold, colors, etc.) AND POSITION
        extraLines.push(line)
        formattedHtmlParts.push(`<div>${line}</div>`)
        formattedTextParts.push(line.replace(/<[^>]*>/g, ''))
      }
    }
  } else {
    // Unlabeled sequence
    const candidateLines = lines.filter((l) => l.length > 0)
    let seqIdx = 0

    for (const line of lines) {
      if (line === '') {
        formattedHtmlParts.push('<div><br></div>')
        formattedTextParts.push('')
        continue
      }

      // If line is recognized as custom note prefix, treat as extra note
      if (CUSTOM_NOTE_PREFIX_REGEX.test(line)) {
        extraLines.push(line)
        formattedHtmlParts.push(`<div>${line}</div>`)
        formattedTextParts.push(line.replace(/<[^>]*>/g, ''))
        continue
      }

      if (seqIdx < SEQUENCE_LABELS.length) {
        if (candidateLines.length === 5 && seqIdx === 3) {
          const isTime = /^\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:am|pm|et|est|edt))?$/i.test(line)
          if (!isTime) {
            seqIdx = 4 // Topic
          }
        }
        const label = SEQUENCE_LABELS[seqIdx]
        values[label] = line.replace(/<[^>]*>/g, '').trim()
        formattedHtmlParts.push(`<div><b>${label}:</b> ${line}</div>`)
        formattedTextParts.push(`${label}: ${values[label]}`)
        seqIdx++
      } else {
        extraLines.push(line)
        formattedHtmlParts.push(`<div>${line}</div>`)
        formattedTextParts.push(line.replace(/<[^>]*>/g, ''))
      }
    }
  }

  return {
    isAssignment: true,
    code: values['Code'],
    company: values['Company'],
    duration: values['Duration'],
    audioAvailability: values['Audio Availability'],
    topic: values['Topic'],
    due: values['Due'],
    formattedHtml: formattedHtmlParts.join(''),
    formattedText: formattedTextParts.join('\n'),
    extraLines,
  }
}
