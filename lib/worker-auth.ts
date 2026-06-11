"use server"

// This list is now safely hidden on the server. 
// The browser cannot see this file's contents.
const WORKERS: Record<string, { password: string; profileUrl: string }> = {
  "juan.delacruz": { 
    password: "transcriber123", 
    profileUrl: "https://apexscriptsolutions-phtranscriber.base44.app/juan" 
  },
  "maria.santos": { 
    password: "worker2024", 
    profileUrl: "https://apexscriptsolutions-phtranscriber.base44.app/maria" 
  },
}

export async function verifyWorkerLogin(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const worker = WORKERS[username]

  if (worker && worker.password === password) {
    return { success: true, url: worker.profileUrl }
  }
  
  return { success: false, error: "Invalid username or password." }
}