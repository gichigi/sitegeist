// Client-side storage using localStorage
export function saveToLocalStorage(key: string, data: any): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }
}

export function getFromLocalStorage(key: string): any {
  if (typeof window !== "undefined") {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Error retrieving from localStorage:", error)
      return null
    }
  }
  return null
}

// Generate unique keys for different websites
export function generateStorageKey(url: string, type: "sitemap" | "report" | "ai-insights"): string {
  try {
    // Extract hostname from URL to use as the key - using global URL constructor
    const hostname = new URL(url).hostname
    return `sitegeist:${type}:${hostname}`
  } catch (error) {
    // Fallback if URL parsing fails
    console.error("Error generating storage key:", error)
    return `sitegeist:${type}:${url.replace(/[^a-zA-Z0-9]/g, "")}`
  }
}
