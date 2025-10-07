"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GhostIcon } from "lucide-react"
import { normalizeUrl } from "@/lib/utils"
import { LoadingScreen } from "@/components/loading-screen"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!url.trim()) return

    // Show loading screen
    setIsLoading(true)

    // Normalize the URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url)

    // Navigate to the sitemap page with the normalized URL
    // Using setTimeout to ensure the loading screen renders before navigation
    setTimeout(() => {
      router.push(`/sitemap?url=${encodeURIComponent(normalizedUrl)}`)
    }, 100)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-mono p-4 sm:p-6">
      {isLoading && <LoadingScreen url={url} />}

      <div className="max-w-3xl w-full space-y-4 sm:space-y-6 text-center">
        <div className="space-y-4">
          <GhostIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-400 opacity-80" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter px-2">
            There's something lurking in your website.
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto px-2">
            Summon the spirits. Reveal the forgotten.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto w-full px-2">
          <div className="relative">
            <Input
              type="text"
              name="url"
              placeholder="Enter a domain for the spirits to explore..."
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-gray-900 border-gray-800 h-12 sm:h-14 pl-4 pr-24 sm:pr-32 text-green-400 placeholder:text-gray-600 focus:ring-green-900 focus:border-green-800"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1 h-10 sm:h-12 bg-green-900 hover:bg-green-800 text-green-400 border-none"
            >
              Summon
            </Button>
          </div>
          <p className="text-xs text-gray-400">Enter any URL. The spirits will explore its depths. Reveal what lurks in the digital shadows.</p>
        </form>

        <div className="pt-6 sm:pt-8 border-t border-gray-900 max-w-md mx-auto w-full px-2">
          <p className="text-xs sm:text-sm text-gray-500">
            "It sees the pages you've abandoned. The links that lead nowhere. The users lost in the void."
          </p>
        </div>
      </div>
    </main>
  )
}
