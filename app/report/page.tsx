"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Share2Icon, ActivityIcon, HomeIcon, AlertTriangleIcon, LinkIcon, GhostIcon, BrainIcon } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { saveToLocalStorage, getFromLocalStorage, generateStorageKey } from "@/lib/client-storage"
import { normalizeUrl } from "@/lib/utils"
import { LoadingScreen } from "@/components/loading-screen"

export default function ReportPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawUrl = searchParams.get("url")
  const url = rawUrl ? normalizeUrl(rawUrl) : null
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [shareTooltip, setShareTooltip] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiInsights, setAiInsights] = useState("")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!url) {
      router.push("/")
      return
    }

    async function fetchReport() {
      try {
        setLoading(true)

        // Start progress simulation
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 50) return Math.min(prev + 5, 95)
            if (prev < 80) return Math.min(prev + 2, 95)
            return Math.min(prev + 0.5, 95)
          })
        }, 1000)

        // Check if we have cached data
        const reportStorageKey = generateStorageKey(url, "report")
        const cachedReport = getFromLocalStorage(reportStorageKey)

        if (cachedReport) {
          setReportData(cachedReport)
          setProgress(100)
          setLoading(false)
          clearInterval(progressInterval)

          // Check for cached AI insights
          const insightsStorageKey = generateStorageKey(url, "ai-insights")
          const cachedInsights = getFromLocalStorage(insightsStorageKey)
          if (cachedInsights) {
            setAiInsights(cachedInsights)
          } else {
            // Run AI analysis if we have report but no insights
            runAiAnalysis(cachedReport)
          }
          return
        }

        // Get sitemap data from localStorage
        const sitemapData = getFromLocalStorage(generateStorageKey(url, "sitemap"))

        if (!sitemapData) {
          // Redirect to sitemap page to generate data first
          clearInterval(progressInterval)
          router.push(`/sitemap?url=${encodeURIComponent(url)}`)
          return
        }

        // Process the data to generate a report
        const processedData = {
          url,
          metrics: {
            revenueLost: calculateRevenueLost(sitemapData),
            usersLost: calculateUsersLost(sitemapData),
            structuralDecay: calculateStructuralDecay(sitemapData),
          },
          issues: {
            orphanPages: identifyOrphanedPages(sitemapData),
            deadLinks: findDeadLinks(sitemapData),
            deadEnds: findDeadEnds(sitemapData),
          },
        }

        // Save to localStorage
        saveToLocalStorage(reportStorageKey, processedData)

        setReportData(processedData)
        setProgress(100)
        setLoading(false)
        clearInterval(progressInterval)

        // Start AI analysis
        runAiAnalysis(sitemapData)
      } catch (err) {
        console.error("Report error:", err)
        setError(err.message || "The analysis failed. The site resists our gaze.")
        setLoading(false)
      }
    }

    async function runAiAnalysis(sitemapData) {
      try {
        setAiAnalyzing(true)

        // Check if we have cached AI insights
        const storageKey = generateStorageKey(url, "ai-insights")
        const cachedInsights = getFromLocalStorage(storageKey)

        if (cachedInsights) {
          setAiInsights(cachedInsights)
          setAiAnalyzing(false)
          return
        }

        // Run AI analysis
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodes: sitemapData.nodes,
            links: sitemapData.links,
          }),
        })

        // Check for non-JSON responses
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned a non-JSON response. Please try again later.")
        }

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || "AI analysis failed")
        }

        // Save insights to localStorage
        saveToLocalStorage(storageKey, responseData.aiInsights)

        setAiInsights(responseData.aiInsights)
      } catch (error) {
        console.error("AI analysis error:", error)
        setAiInsights("The AI couldn't penetrate the site's defenses. Manual analysis only.")
      } finally {
        setAiAnalyzing(false)
      }
    }

    fetchReport()
  }, [url, router])

  // Helper functions for report generation
  function calculateRevenueLost(sitemapData) {
    const deadLinks = findDeadLinks(sitemapData).length
    const orphanedPages = identifyOrphanedPages(sitemapData).length
    const deadEnds = findDeadEnds(sitemapData).length

    // Simple formula: $100 per dead link, $50 per orphaned page, $75 per dead end
    return deadLinks * 100 + orphanedPages * 50 + deadEnds * 75
  }

  function calculateUsersLost(sitemapData) {
    const deadLinks = findDeadLinks(sitemapData).length
    const orphanedPages = identifyOrphanedPages(sitemapData).length

    // Simple formula: 20 users per dead link, 10 users per orphaned page
    return deadLinks * 20 + orphanedPages * 10
  }

  function calculateStructuralDecay(sitemapData) {
    const totalPages = sitemapData.nodes.length
    if (totalPages === 0) return 0

    const problematicPages =
      findDeadLinks(sitemapData).length + identifyOrphanedPages(sitemapData).length + findDeadEnds(sitemapData).length

    return Math.min(100, Math.round((problematicPages / totalPages) * 100))
  }

  function identifyOrphanedPages(sitemapData) {
    return sitemapData.nodes
      .filter((node) => node.isOrphaned)
      .map((node) => ({
        url: node.url,
        lastUpdated: "Unknown",
        note: generateOrphanNote(node),
      }))
  }

  function findDeadLinks(sitemapData) {
    const urlStatusMap = new Map()

    sitemapData.nodes.forEach((node) => {
      urlStatusMap.set(node.url, node.status)
    })

    return sitemapData.links
      .filter((link) => {
        const targetStatus = urlStatusMap.get(link.target)
        return targetStatus && targetStatus >= 400
      })
      .map((link) => ({
        source: link.source,
        target: link.target,
        impact: generateDeadLinkImpact(),
      }))
  }

  function findDeadEnds(sitemapData) {
    const outboundLinkCounts = new Map()

    sitemapData.nodes.forEach((node) => {
      outboundLinkCounts.set(node.url, 0)
    })

    sitemapData.links.forEach((link) => {
      const count = outboundLinkCounts.get(link.source) || 0
      outboundLinkCounts.set(link.source, count + 1)
    })

    return sitemapData.nodes
      .filter((node) => {
        const outboundCount = outboundLinkCounts.get(node.url) || 0
        return outboundCount === 0 && node.status < 400
      })
      .map((node) => ({
        url: node.url,
        impact: generateDeadEndImpact(),
      }))
  }

  function generateOrphanNote(node) {
    const notes = [
      "Page exists but cannot be discovered. SEO value wasted.",
      "Content disconnected from site structure. The memory lingers.",
      "Isolated page. No pathways lead to this content.",
      "Forgotten but not gone. Revenue opportunity lost.",
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  function generateDeadLinkImpact() {
    const impacts = [
      "Users lost in the void. Trust eroded with each dead end.",
      "Potential revenue loss. Users abandon their journey here.",
      "Content discovery broken. SEO impact significant.",
      "User experience degraded. Conversion path disrupted.",
    ]
    return impacts[Math.floor(Math.random() * impacts.length)]
  }

  function generateDeadEndImpact() {
    const impacts = [
      "Users reach this page but cannot continue their journey.",
      "No related content shown. Engagement opportunity lost.",
      "Dead end detected. Users trapped in the void.",
      "No next steps provided. Users abandon the site here.",
    ]
    return impacts[Math.floor(Math.random() * impacts.length)]
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShareTooltip(true)
    setTimeout(() => setShareTooltip(false), 3000)
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-mono p-4">
        <div className="max-w-md text-center space-y-4">
          <Alert variant="destructive" className="bg-red-900 border-red-800 text-red-300">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="border-gray-800 text-gray-400 hover:text-green-400">
            <Link href="/">Return to the void</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Show the loading screen while loading
  if (loading) {
    return <LoadingScreen progress={progress} url={url} message="The spirits are communing with your site's digital essence..." />
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white font-mono">
      <header className="border-b border-gray-900 p-3 sm:p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-green-400 flex items-center gap-2" aria-label="Return to homepage">
            <HomeIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Sitegeist</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 relative">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => router.push(`/sitemap?url=${encodeURIComponent(url)}`)}
              aria-label="View Map"
            >
              <ActivityIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">View Map</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 px-2 sm:px-3"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Share</span>
            </Button>

            {shareTooltip && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-green-900 text-green-400 text-xs rounded animate-fade-in z-10">
                Report link copied to clipboard
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 sm:p-4 container mx-auto max-w-4xl">
        <div className="space-y-8 sm:space-y-12">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight">
              Site Analysis: <span className="text-green-400 break-all">{url}</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">We've seen what lurks beneath. Here's what we found.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-950 border border-gray-900 p-4 sm:p-6 rounded-md flex flex-col">
              <div className="text-red-500 text-3xl sm:text-4xl font-light mb-2" aria-label="Revenue lost this month">
                ${reportData.metrics.revenueLost}
              </div>
              <div className="text-xs text-gray-500 mt-auto pt-4">Based on average conversion value</div>
            </div>

            <div className="bg-gray-950 border border-gray-900 p-4 sm:p-6 rounded-md flex flex-col">
              <div className="text-red-500 text-3xl sm:text-4xl font-light mb-2" aria-label="Users lost in the void">
                {reportData.metrics.usersLost}
              </div>
              <div className="text-xs text-gray-500 mt-auto pt-4">30-day period</div>
            </div>

            <div className="bg-gray-950 border border-gray-900 p-4 sm:p-6 rounded-md flex flex-col">
              <div
                className="text-red-500 text-3xl sm:text-4xl font-light mb-2"
                aria-label="Structural decay percentage"
              >
                {reportData.metrics.structuralDecay}%
              </div>
              <div className="text-xs text-gray-500 mt-auto pt-4">Overall site health score</div>
            </div>
          </div>

          {aiInsights && (
            <section className="space-y-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <BrainIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                <span>AI Insights: The machine speaks.</span>
              </h2>
              <div className="bg-gray-950 border border-gray-900 p-4 rounded-md">
                <div className="space-y-4">
                  {aiAnalyzing ? (
                    <div className="text-center py-4">
                      <div className="flex space-x-2 justify-center">
                        <div
                          className="h-2 w-2 bg-green-400 rounded-full animate-ping"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-green-400 rounded-full animate-ping"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-green-400 rounded-full animate-ping"
                          style={{ animationDelay: "600ms" }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-sm mt-4">AI is analyzing your site structure...</p>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm whitespace-pre-line">{aiInsights}</div>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="space-y-6 sm:space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <GhostIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                <span>Orphan Pages: Forgotten, but not gone.</span>
              </h2>
              <div className="bg-gray-950 border border-gray-900 p-4 rounded-md">
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    We found {reportData.issues.orphanPages.length} pages with no inbound links. They exist, but no one
                    can reach them.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {reportData.issues.orphanPages.slice(0, 3).map((page, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-500">
                        <span className="text-red-500 mt-0.5" aria-hidden="true">
                          •
                        </span>
                        <span>
                          {page.url} <span className="text-gray-700">— {page.note}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                <span>Dead Links: Pathways to nowhere.</span>
              </h2>
              <div className="bg-gray-950 border border-gray-900 p-4 rounded-md">
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    {reportData.issues.deadLinks.length} links on your site lead to 404 pages. Users follow, then
                    vanish.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {reportData.issues.deadLinks.slice(0, 3).map((link, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-500">
                        <span className="text-red-500 mt-0.5" aria-hidden="true">
                          •
                        </span>
                        <span>
                          {link.source} → {link.target} <span className="text-gray-700">— {link.impact}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                <span>Dead Ends: No escape.</span>
              </h2>
              <div className="bg-gray-950 border border-gray-900 p-4 rounded-md">
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    {reportData.issues.deadEnds.length} pages have no outbound links. Users arrive, but cannot leave.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {reportData.issues.deadEnds.slice(0, 3).map((page, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-500">
                        <span className="text-red-500 mt-0.5" aria-hidden="true">
                          •
                        </span>
                        <span>
                          {page.url} <span className="text-gray-700">— {page.impact}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-900 pt-8">
            <p className="text-sm text-gray-500 italic">
              "Your site's structure tells a story. This one is a ghost story."
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
