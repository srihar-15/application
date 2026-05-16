// Web-only localStorage wrapper with async interface so it's
// drop-in compatible when Capacitor Preferences is added for mobile.
const PREFIX = 'asquare:'

export const storage = {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(PREFIX + key)
  },

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(PREFIX + key, value)
  },

  async remove(key: string): Promise<void> {
    localStorage.removeItem(PREFIX + key)
  },

  async clear(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX)) keysToRemove.push(k)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  },
}
