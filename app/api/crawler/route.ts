import { type NextRequest, NextResponse } from "next/server"
import { isValidUrl, normalizeUrl } from "@/lib/utils"
import { crawlWebsite } from "@/lib/crawler"

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  console.log("👻 The digital spirits have been summoned to the API...")
  
  try {
    // Parse the request body
    const body = await request.json().catch((error) => {
      console.error("👻 The spirits struggle to understand the summoning ritual:", error)
      return { url: null }
    })

    const { url, maxPages = 8, maxDepth = 1, timeout = 30000 } = body // Limited to 8 pages for cost control

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
      console.log(`👻 The spirits prepare to explore ${normalizedUrl} with their scroll of parameters:`, { maxPages, maxDepth, timeout })
      
      // Start the crawl with a longer timeout
      const crawlPromise = crawlWebsite(normalizedUrl, { maxPages, maxDepth, timeout })

      // Add a timeout to prevent hanging - increased to 60 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Crawl timed out after 60 seconds")), 60000)
      })

      // Race the crawl against the timeout
      const crawlResult = await Promise.race([crawlPromise, timeoutPromise])
      
      console.log(`✨ The spirits have completed their digital journey: ${crawlResult.nodes.length} realms explored, ${crawlResult.links.length} pathways mapped`)

      return NextResponse.json({
        success: true,
        data: crawlResult,
      })
    } catch (crawlError) {
      console.error("👻 The spirits encountered resistance during their journey:", crawlError)

      // Check if it's a timeout or rate limiting error
      const isTimeout =
        crawlError.message &&
        (crawlError.message.includes("timed out") ||
          crawlError.message.includes("ETIMEDOUT") ||
          crawlError.message.includes("timeout"))
      
      const isRateLimited = crawlError.message && crawlError.message.includes("429")

      // Return a proper JSON response for the crawl error
      return NextResponse.json(
        {
          success: false,
          error: isRateLimited 
            ? "The digital realm is protecting itself from too many requests. The spirits must wait before exploring again."
            : crawlError.message || "Failed to crawl website. The site resists our gaze.",
          isTimeout: isTimeout,
          isRateLimited: isRateLimited,
          data: { nodes: [], links: [] }, // Return empty data structure for graceful degradation
        },
        { status: isTimeout ? 408 : isRateLimited ? 429 : 500 },
      )
    }
  } catch (error) {
    console.error("👻 The digital spirits have been overwhelmed by the summoning ritual:", error)

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
