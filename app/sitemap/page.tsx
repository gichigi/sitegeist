"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Share2Icon, FileTextIcon, HomeIcon, AlertCircleIcon, RefreshCwIcon, DownloadIcon } from "lucide-react"
import SitemapVisualization from "@/components/sitemap-visualization"
import { MetricsPanel } from "@/components/metrics-panel"
import { AiInsights } from "@/components/ai-insights"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { saveToLocalStorage, getFromLocalStorage, generateStorageKey } from "@/lib/client-storage"
import { normalizeUrl } from "@/lib/utils"
import { LoadingScreen } from "@/components/loading-screen"
import { exportToPdf } from "@/lib/pdf-export"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function SitemapPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawUrl = searchParams.get("url")
  const url = rawUrl ? normalizeUrl(rawUrl) : null
  const [loading, setLoading] = useState(true)
  const [sitemapData, setSitemapData] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [warning, setWarning] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [aiInsights, setAiInsights] = useState("")
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [reportData, setReportData] = useState(null)

  // Calculate metrics for the condensed panel
  const calculateMetrics = (sitemapData) => {
    if (!sitemapData) return null

    const orphanedPages = sitemapData.nodes.filter((node) => node.isOrphaned).length
    const deadLinks = findDeadLinks(sitemapData).length
    const deadEnds = findDeadEnds(sitemapData).length

    // Simple formulas for metrics
    const revenueLost = deadLinks * 100 + orphanedPages * 50 + deadEnds * 75
    const usersLost = deadLinks * 20 + orphanedPages * 10
    const totalPages = sitemapData.nodes.length
    const structuralDecay =
      totalPages === 0 ? 0 : Math.min(100, Math.round(((deadLinks + orphanedPages + deadEnds) / totalPages) * 100))

    return {
      revenueLost,
      usersLost,
      structuralDecay,
      orphanedPages,
      deadLinks,
      deadEnds,
    }
  }

  // Helper functions for finding issues
  function findDeadLinks(sitemapData) {
    const urlStatusMap = new Map()

    sitemapData.nodes.forEach((node) => {
      urlStatusMap.set(node.url, node.status)
    })

    return sitemapData.links.filter((link) => {
      const targetStatus = urlStatusMap.get(link.target)
      return targetStatus && targetStatus >= 400
    })
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

    return sitemapData.nodes.filter((node) => {
      const outboundCount = outboundLinkCounts.get(node.url) || 0
      return outboundCount === 0 && node.status < 400
    })
  }

  useEffect(() => {
    if (!url) {
      router.push("/")
      return
    }

    async function fetchSitemap() {
      try {
        setLoading(true)
        setWarning(null)

        // Check if we have cached data
        const storageKey = generateStorageKey(url, "sitemap")
        const cachedData = getFromLocalStorage(storageKey)

        if (cachedData && !retrying) {
          setSitemapData(cachedData)

          // Calculate metrics
          const metrics = calculateMetrics(cachedData)

          // Generate report data structure
          const reportDataObj = {
            url,
            metrics: {
              revenueLost: metrics.revenueLost,
              usersLost: metrics.usersLost,
              structuralDecay: metrics.structuralDecay,
            },
            issues: {
              orphanPages: cachedData.nodes
                .filter((node) => node.isOrphaned)
                .map((node) => ({
                  url: node.url,
                  lastUpdated: "Unknown",
                  note: "Page exists but cannot be discovered. SEO value wasted.",
                })),
              deadLinks: findDeadLinks(cachedData).map((link) => ({
                source: link.source,
                target: link.target,
                impact: "Users lost in the void. Trust eroded with each dead end.",
              })),
              deadEnds: findDeadEnds(cachedData).map((node) => ({
                url: node.url,
                impact: "Users reach this page but cannot continue their journey.",
              })),
            },
          }

          setReportData(reportDataObj)
          setLoading(false)

          // Check for cached AI insights
          const insightsStorageKey = generateStorageKey(url, "ai-insights")
          const cachedInsights = getFromLocalStorage(insightsStorageKey)

          if (cachedInsights) {
            setAiInsights(cachedInsights)
          } else {
            // Run AI analysis if we have report but no insights
            runAiAnalysis(cachedData)
          }
          return
        }

        // Reset retrying state
        if (retrying) setRetrying(false)

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            // Slow down progress as it gets higher to manage expectations
            if (prev < 50) return Math.min(prev + 5, 95)
            if (prev < 80) return Math.min(prev + 2, 95)
            return Math.min(prev + 0.5, 95)
          })
        }, 1000)

        // Start a new crawl
        const response = await fetch("/api/crawler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            maxPages: 20, // Limit to 20 pages for faster crawling
            maxDepth: 1, // Limit to depth 1 for faster crawling
            timeout: 15000, // 15 seconds timeout for each request
          }),
        })

        clearInterval(progressInterval)

        // Check for non-JSON responses
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Non-JSON response received:", await response.text())
          throw new Error("Server returned a non-JSON response. Please try again later.")
        }

        // Safely parse JSON
        let responseData
        try {
          responseData = await response.json()
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          throw new Error("Failed to parse server response. Please try again later.")
        }

        if (!response.ok || !responseData.success) {
          // If we got a timeout error, show a warning but use partial data if available
          if ((responseData.error && responseData.error.includes("timed out")) || responseData.isTimeout) {
            setWarning(
              "The site took too long to respond. Some pages may be missing from the map. " +
                "Try reducing the crawl depth or number of pages.",
            )

            // If we have some data, use it
            if (responseData.data && responseData.data.nodes && responseData.data.nodes.length > 0) {
              // Save partial data to localStorage
              saveToLocalStorage(storageKey, responseData.data)
              setSitemapData(responseData.data)

              // Calculate metrics
              const metrics = calculateMetrics(responseData.data)

              // Generate report data
              const reportDataObj = {
                url,
                metrics: {
                  revenueLost: metrics.revenueLost,
                  usersLost: metrics.usersLost,
                  structuralDecay: metrics.structuralDecay,
                },
                issues: {
                  orphanPages: responseData.data.nodes
                    .filter((node) => node.isOrphaned)
                    .map((node) => ({
                      url: node.url,
                      lastUpdated: "Unknown",
                      note: "Page exists but cannot be discovered. SEO value wasted.",
                    })),
                  deadLinks: findDeadLinks(responseData.data).map((link) => ({
                    source: link.source,
                    target: link.target,
                    impact: "Users lost in the void. Trust eroded with each dead end.",
                  })),
                  deadEnds: findDeadEnds(responseData.data).map((node) => ({
                    url: node.url,
                    impact: "Users reach this page but cannot continue their journey.",
                  })),
                },
              }

              setReportData(reportDataObj)
              setProgress(100)
              setLoading(false)

              // Run AI analysis
              runAiAnalysis(responseData.data)
              return
            }

            // Create minimal mock data based on the URL
            const mockData = {
              nodes: [{ id: url, url: url, status: 200, title: "Homepage", description: "", contentType: "text/html" }],
              links: [],
            }

            // Save to localStorage
            saveToLocalStorage(storageKey, mockData)
            setSitemapData(mockData)

            // Set minimal report data
            setReportData({
              url,
              metrics: {
                revenueLost: 0,
                usersLost: 0,
                structuralDecay: 0,
              },
              issues: {
                orphanPages: [],
                deadLinks: [],
                deadEnds: [],
              },
            })

            setProgress(100)
            setLoading(false)
            return
          }

          throw new Error(responseData.error || "Failed to crawl website")
        }

        // Save to localStorage
        saveToLocalStorage(storageKey, responseData.data)

        setSitemapData(responseData.data)

        // Calculate metrics
        const metrics = calculateMetrics(responseData.data)

        // Generate report data
        const reportDataObj = {
          url,
          metrics: {
            revenueLost: metrics.revenueLost,
            usersLost: metrics.usersLost,
            structuralDecay: metrics.structuralDecay,
          },
          issues: {
            orphanPages: responseData.data.nodes
              .filter((node) => node.isOrphaned)
              .map((node) => ({
                url: node.url,
                lastUpdated: "Unknown",
                note: "Page exists but cannot be discovered. SEO value wasted.",
              })),
            deadLinks: findDeadLinks(responseData.data).map((link) => ({
              source: link.source,
              target: link.target,
              impact: "Users lost in the void. Trust eroded with each dead end.",
            })),
            deadEnds: findDeadEnds(responseData.data).map((node) => ({
              url: node.url,
              impact: "Users reach this page but cannot continue their journey.",
            })),
          },
        }

        setReportData(reportDataObj)
        setProgress(100)
        setLoading(false)

        // Run AI analysis
        runAiAnalysis(responseData.data)
      } catch (err) {
        console.error("Sitemap error:", err)
        setError(err.message || "The spirits are restless. Try again later.")
        setLoading(false)

        // Create fallback data for development/testing
        const mockData = {
          nodes: [
            { id: url, url: url, status: 200, title: "Homepage", description: "", contentType: "text/html" },
            {
              id: `${url}/about`,
              url: `${url}/about`,
              status: 200,
              title: "About",
              description: "",
              contentType: "text/html",
            },
            {
              id: `${url}/contact`,
              url: `${url}/contact`,
              status: 200,
              title: "Contact",
              description: "",
              contentType: "text/html",
            },
          ],
          links: [
            { source: url, target: `${url}/about`, text: "About" },
            { source: url, target: `${url}/contact`, text: "Contact" },
          ],
        }

        // In development, use mock data even on error
        if (process.env.NODE_ENV === "development") {
          setSitemapData(mockData)
          setWarning("Using mock data due to API error. This is only shown in development mode.")
          setLoading(false)
        }
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

        // Generate fallback insights in case the API fails
        const fallbackInsights = `I've scanned your site and found ${sitemapData.nodes.length} pages connected by ${sitemapData.links.length} pathways. 

The digital structure reveals potential issues that need attention. Focus on fixing broken links and improving navigation paths.

Remember, in the digital realm, structure is destiny. Fix these issues, and your site will rise from the shadows.`

        try {
          // Run AI analysis with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nodes: sitemapData.nodes,
              links: sitemapData.links,
            }),
            signal: controller.signal,
          }).catch((error) => {
            console.error("Fetch error:", error)
            throw new Error("Failed to connect to analysis service")
          })

          clearTimeout(timeoutId)

          // Handle non-200 responses
          if (!response.ok) {
            console.error("API returned error status:", response.status)
            throw new Error(`API error: ${response.status}`)
          }

          // Check for non-JSON responses
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.error(
              "Non-JSON response from AI analysis:",
              await response.text().catch(() => "Could not read response text"),
            )
            throw new Error("Server returned a non-JSON response")
          }

          // Safely parse JSON
          const responseData = await response.json().catch((error) => {
            console.error("JSON parse error:", error)
            throw new Error("Failed to parse server response")
          })

          if (!responseData.success) {
            throw new Error(responseData.error || "AI analysis failed")
          }

          // Save insights to localStorage
          const insights = responseData.aiInsights || fallbackInsights
          saveToLocalStorage(storageKey, insights)
          setAiInsights(insights)
        } catch (error) {
          console.error("AI analysis error:", error)

          // Use fallback insights
          saveToLocalStorage(storageKey, fallbackInsights)
          setAiInsights(fallbackInsights)
        }
      } catch (error) {
        console.error("Unexpected error in AI analysis:", error)

        // Ultimate fallback
        const ultimateFallback = "The AI couldn't analyze your site structure. Please try again later."
        setAiInsights(ultimateFallback)
      } finally {
        setAiAnalyzing(false)
      }
    }

    fetchSitemap()
  }, [url, router, retrying])

  const handleRetry = () => {
    setRetrying(true)
  }

  const handleNodeSelect = (node) => {
    setSelectedNode(node)
  }

  const handleExportPdf = async () => {
    if (!reportData || !url) return

    const success = await exportToPdf(url, reportData, aiInsights)

    if (success) {
      alert("PDF report exported successfully!")
    } else {
      alert("Failed to export PDF. Please try again.")
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-mono p-4">
        <div className="max-w-md text-center space-y-4">
          <Alert variant="destructive" className="bg-red-900 border-red-800 text-red-300">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              className="border-gray-800 text-gray-400 hover:text-green-400"
              onClick={handleRetry}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="border-gray-800 text-gray-400 hover:text-green-400">
              <Link href="/">Return to the void</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show the loading screen while loading
  if (loading) {
    return <LoadingScreen progress={progress} url={url} message="Mapping site structure..." />
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white font-mono">
      <header className="border-b border-gray-900 p-3 sm:p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-green-400 flex items-center gap-2" aria-label="Return to homepage">
            <HomeIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Sitegeist</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => router.push(`/report?url=${encodeURIComponent(url)}`)}
              aria-label="View Report"
            >
              <FileTextIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">View Report</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 px-2 sm:px-3"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert("Link copied to clipboard")
              }}
              aria-label="Share"
            >
              <Share2Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Share</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 px-2 sm:px-3"
              onClick={handleExportPdf}
              aria-label="Export PDF"
            >
              <DownloadIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Export PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-900 px-2 sm:px-3"
              onClick={handleRetry}
              aria-label="Retry"
            >
              <RefreshCwIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Retry</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 sm:p-4 container mx-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight">
              Site Structure: <span className="text-green-400 break-all">{url}</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              The map reveals all connections. Hover on nodes to see details. Click to select.
            </p>

            {warning && (
              <Alert className="mt-4 bg-yellow-900 border-yellow-800 text-yellow-300">
                <AlertCircleIcon className="h-4 w-4 mr-2" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Split-screen layout */}
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[75vh] border border-gray-900 rounded-md bg-gray-950 overflow-hidden"
          >
            {/* Left panel - Sitemap visualization */}
            <ResizablePanel defaultSize={65} minSize={40}>
              <div className="h-full">
                <SitemapVisualization data={sitemapData} onNodeSelect={handleNodeSelect} />
              </div>
            </ResizablePanel>

            <ResizableHandle className="bg-gray-900 w-1" />

            {/* Right panel - Report and insights */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {/* Selected node details */}
                {selectedNode && (
                  <div className="bg-gray-900 border border-gray-800 rounded-md p-4 mb-4">
                    <h3 className="text-green-400 font-medium mb-2">{selectedNode.name}</h3>
                    <p className="text-gray-400 text-xs mb-2">{selectedNode.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span className={selectedNode.status >= 400 ? "text-red-500" : "text-green-400"}>
                          {selectedNode.status}
                        </span>
                      </div>
                      {selectedNode.isOrphaned && <div className="text-red-500">Orphaned Page</div>}
                    </div>
                  </div>
                )}

                {/* Metrics panel */}
                {reportData && <MetricsPanel data={calculateMetrics(sitemapData)} />}

                {/* AI Insights */}
                {aiAnalyzing ? (
                  <div className="bg-gray-950 border border-gray-900 rounded-md p-4 text-center">
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
                ) : aiInsights ? (
                  <AiInsights insights={aiInsights} onExportPdf={handleExportPdf} />
                ) : null}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>

          <div className="text-sm text-gray-400">
            <p>
              Found {sitemapData.nodes.length} pages and {sitemapData.links.length} connections.
            </p>
            <p className="text-red-500">
              {sitemapData.nodes.filter((n) => n.isOrphaned).length} orphaned pages detected.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
