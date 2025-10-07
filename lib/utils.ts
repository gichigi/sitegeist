import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: string): boolean {
  try {
    // Normalize the URL first
    const normalizedUrl = normalizeUrl(url)
    // Use global URL constructor
    new URL(normalizedUrl)
    return true
  } catch (e) {
    return false
  }
}

export function normalizeUrl(url: string): string {
  // Trim whitespace
  let normalizedUrl = url.trim()

  // Check if the URL starts with http:// or https://
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    // Add https:// prefix
    normalizedUrl = "https://" + normalizedUrl
  }

  return normalizedUrl
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
}
