import axios from "axios"
import * as cheerio from "cheerio"

// Types
export interface PageNode {
  id: string
  url: string
  status: number
  title: string
  description: string
  contentType: string
  isOrphaned?: boolean
}

export interface Link {
  source: string
  target: string
  text: string
}

export interface CrawlResult {
  nodes: PageNode[]
  links: Link[]
}

export interface CrawlOptions {
  maxPages: number
  maxDepth: number
  timeout?: number
}

// Optimized crawler function
export async function crawlWebsite(
  url: string,
  options: CrawlOptions = { maxPages: 20, maxDepth: 1 },
): Promise<CrawlResult> {
  try {
    // Normalize URL
    const baseUrl = new URL(url)
    const normalizedUrl = baseUrl.origin + baseUrl.pathname.replace(/\/$/, "")

    // Initialize crawl data
    const nodes: PageNode[] = []
    const links: Link[] = []
    const visited = new Set<string>()
    const queue: { url: string; depth: number }[] = [{ url: normalizedUrl, depth: 0 }]

    // Set default timeout if not provided
    const timeout = options.timeout || 15000 // Increased from 5000ms to 15000ms (15 seconds)

    // Create axios instance with defaults for better performance
    const axiosInstance = axios.create({
      timeout: timeout,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SitegeistBot/1.0; +https://sitegeist.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
    })

    // Process queue with concurrency limit
    const concurrencyLimit = 3 // Process 3 pages at a time

    while (queue.length > 0 && nodes.length < options.maxPages) {
      // Take up to concurrencyLimit items from the queue
      const batch = queue.splice(0, Math.min(concurrencyLimit, queue.length))

      // Process batch in parallel
      await Promise.all(
        batch.map(async (current) => {
          // Skip if already visited
          if (visited.has(current.url)) return

          // Mark as visited
          visited.add(current.url)

          try {
            // Fetch the page with timeout handling
            const response = await axiosInstance.get(current.url).catch((error) => {
              console.error(`Error fetching ${current.url}:`, error.message)
              // Return a standardized error response
              return {
                status: error.code === "ECONNABORTED" ? 408 : 500,
                headers: { "content-type": "text/plain" },
                data: "",
              }
            })

            // Process the page
            const pageNode: PageNode = {
              id: current.url,
              url: current.url,
              status: response.status,
              title: "",
              description: "",
              contentType: response.headers["content-type"] || "",
            }

            // Only process HTML content
            if (response.status < 400 && pageNode.contentType.includes("text/html")) {
              try {
                const $ = cheerio.load(response.data)

                // Extract title and description
                pageNode.title = $("title").text().trim() || ""
                pageNode.description = $('meta[name="description"]').attr("content") || ""

                // If not at max depth, extract links
                if (current.depth < options.maxDepth) {
                  // Only process a limited number of links per page for performance
                  const linkElements = $("a").slice(0, 20) // Limit to 20 links per page

                  linkElements.each((_, element) => {
                    const href = $(element).attr("href")
                    if (!href) return

                    try {
                      // Handle relative URLs
                      let fullUrl: URL
                      if (href.startsWith("/")) {
                        fullUrl = new URL(href, baseUrl.origin)
                      } else if (href.startsWith("http")) {
                        fullUrl = new URL(href)
                      } else {
                        fullUrl = new URL(href, current.url)
                      }

                      // Only include links from the same domain
                      if (fullUrl.hostname !== baseUrl.hostname) return

                      // Normalize URL
                      const targetUrl = fullUrl.origin + fullUrl.pathname.replace(/\/$/, "")

                      // Skip anchors, javascript:, mailto:, etc.
                      if (
                        !targetUrl.startsWith("http") ||
                        targetUrl.includes("#") ||
                        targetUrl.includes("javascript:") ||
                        targetUrl.includes("mailto:") ||
                        targetUrl.includes("tel:")
                      ) {
                        return
                      }

                      // Add link
                      links.push({
                        source: current.url,
                        target: targetUrl,
                        text: $(element).text().trim() || "",
                      })

                      // Add to queue if not visited
                      if (!visited.has(targetUrl) && queue.findIndex((item) => item.url === targetUrl) === -1) {
                        queue.push({ url: targetUrl, depth: current.depth + 1 })
                      }
                    } catch (error) {
                      // Skip invalid links
                      console.error(`Error processing link ${href}:`, error)
                    }
                  })
                }
              } catch (parseError) {
                console.error(`Error parsing HTML for ${current.url}:`, parseError)
                // Continue with the basic page info we have
              }
            }

            // Add to nodes
            nodes.push(pageNode)
          } catch (error) {
            console.error(`Error processing ${current.url}:`, error)
            // Add as error page
            nodes.push({
              id: current.url,
              url: current.url,
              status: 500,
              title: "",
              description: "",
              contentType: "",
            })
          }
        }),
      )
    }

    // Identify orphaned pages
    const pagesWithIncomingLinks = new Set<string>()
    links.forEach((link) => {
      pagesWithIncomingLinks.add(link.target)
    })

    // Mark nodes as orphaned if they have no incoming links (except homepage)
    const processedNodes = nodes.map((node) => ({
      ...node,
      isOrphaned: !pagesWithIncomingLinks.has(node.url) && node.url !== normalizedUrl,
    }))

    return {
      nodes: processedNodes,
      links,
    }
  } catch (error) {
    console.error("Crawler error:", error)
    // Return empty result on error
    return {
      nodes: [],
      links: [],
    }
  }
}
