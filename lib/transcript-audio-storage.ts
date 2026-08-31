/**
 * Utility for persisting audio files and playback timestamps in IndexedDB & LocalStorage.
 * IndexedDB supports large Blobs (hundreds of megabytes), ensuring local audio files
 * are not lost when closing/refreshing tabs or the editor modal.
 */

const DB_NAME = 'ApexScript_TranscriptAudioDB'
const DB_VERSION = 1
const STORE_NAME = 'audio_files'

interface StoredAudioRecord {
  id: string // e.g. "audio_USERID"
  blob: Blob
  name: string
  type: string
  size: number
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save an audio Blob to IndexedDB for the given user ID.
 */
export async function saveAudioToDB(userId: string, file: Blob, name: string): Promise<void> {
  if (!userId) return
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record: StoredAudioRecord = {
      id: `audio_${userId}`,
      blob: file,
      name: name || 'Audio File',
      type: file.type || 'audio/mpeg',
      size: file.size || 0,
      updatedAt: Date.now(),
    }

    store.put(record)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(new Error('Transaction aborted'))
    })
  } catch (err) {
    console.warn('Failed to save audio file to IndexedDB:', err)
  }
}

/**
 * Retrieve the saved audio Blob and filename for the given user ID.
 */
export async function getAudioFromDB(userId: string): Promise<{ blob: Blob; name: string } | null> {
  if (!userId) return null
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(`audio_${userId}`)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as StoredAudioRecord | undefined
        if (result && result.blob) {
          resolve({ blob: result.blob, name: result.name })
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('Failed to retrieve audio file from IndexedDB:', err)
    return null
  }
}

/**
 * Delete the saved audio Blob from IndexedDB for the given user ID.
 */
export async function deleteAudioFromDB(userId: string): Promise<void> {
  if (!userId) return
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(`audio_${userId}`)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('Failed to delete audio file from IndexedDB:', err)
  }
}

/**
 * Save audio playback position (in seconds) to localStorage.
 */
export function saveAudioPosition(userId: string, time: number): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    if (isNaN(time) || time < 0) return
    localStorage.setItem(`transcript_audio_time_${userId}`, time.toString())
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Retrieve saved audio playback position (in seconds) from localStorage.
 */
export function getAudioPosition(userId: string): number {
  if (typeof window === 'undefined' || !userId) return 0
  try {
    const val = localStorage.getItem(`transcript_audio_time_${userId}`)
    if (val) {
      const parsed = parseFloat(val)
      return isNaN(parsed) || parsed < 0 ? 0 : parsed
    }
  } catch (e) {
    // Ignore error
  }
  return 0
}

/**
 * Clear saved audio playback position.
 */
export function clearAudioPosition(userId: string): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    localStorage.removeItem(`transcript_audio_time_${userId}`)
  } catch (e) {
    // Ignore error
  }
}
