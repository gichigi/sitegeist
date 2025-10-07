import { type NextRequest, NextResponse } from "next/server"
import { isValidUrl, normalizeUrl } from "@/lib/utils"
import { crawlWebsite } from "@/lib/crawler"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json().catch((error) => {
      console.error("Error parsing request body:", error)
      return { url: null }
    })

    const { url, maxPages = 20, maxDepth = 1, timeout = 15000 } = body // Added timeout parameter with 15s default

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required.",
        },
        { status: 400 },
      )
    }

    // Normalize the URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url)

    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL. The void cannot be mapped.",
        },
        { status: 400 },
      )
    }

    try {
      // Start the crawl with a longer timeout
      const crawlPromise = crawlWebsite(normalizedUrl, { maxPages, maxDepth, timeout })

      // Add a timeout to prevent hanging - increased to 60 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Crawl timed out after 60 seconds")), 60000)
      })

      // Race the crawl against the timeout
      const crawlResult = await Promise.race([crawlPromise, timeoutPromise])

      return NextResponse.json({
        success: true,
        data: crawlResult,
      })
    } catch (crawlError) {
      console.error("Crawl execution error:", crawlError)

      // Check if it's a timeout error
      const isTimeout =
        crawlError.message &&
        (crawlError.message.includes("timed out") ||
          crawlError.message.includes("ETIMEDOUT") ||
          crawlError.message.includes("timeout"))

      // Return a proper JSON response for the crawl error
      return NextResponse.json(
        {
          success: false,
          error: crawlError.message || "Failed to crawl website. The site resists our gaze.",
          isTimeout: isTimeout,
          data: { nodes: [], links: [] }, // Return empty data structure for graceful degradation
        },
        { status: isTimeout ? 408 : 500 },
      )
    }
  } catch (error) {
    console.error("Crawler API error:", error)

    // Ensure we always return a proper JSON response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to crawl website. The site resists our gaze.",
        data: { nodes: [], links: [] }, // Return empty data structure for graceful degradation
      },
      { status: 500 },
    )
  }
}
