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

// Helper function to prioritize important page types
function isImportantPage(url: string, title: string): boolean {
  const urlLower = url.toLowerCase()
  const titleLower = title.toLowerCase()
  
  // Important page patterns
  const importantPatterns = [
    // Main pages
    /^\/$/,  // Homepage
    /\/about/, /\/company/, /\/team/,
    /\/contact/, /\/support/, /\/help/,
    /\/pricing/, /\/plans/, /\/cost/,
    /\/features/, /\/product/, /\/services/,
    /\/blog/, /\/news/, /\/articles/,
    /\/docs/, /\/documentation/, /\/guide/,
    /\/login/, /\/signup/, /\/register/,
    /\/dashboard/, /\/account/, /\/profile/,
    /\/shop/, /\/store/, /\/products/,
    /\/careers/, /\/jobs/, /\/hiring/
  ]
  
  // Skip unimportant patterns
  const skipPatterns = [
    /\/api\//, /\/admin\//, /\/wp-admin\//, /\/wp-content\//,
    /\.pdf$/, /\.doc$/, /\.docx$/, /\.xls$/, /\.xlsx$/,
    /\.zip$/, /\.rar$/, /\.tar$/, /\.gz$/,
    /\.jpg$/, /\.jpeg$/, /\.png$/, /\.gif$/, /\.svg$/,
    /\.css$/, /\.js$/, /\.json$/, /\.xml$/,
    /\/search/, /\/filter/, /\/sort/, /\/page\/\d+/,
    /\/tag\//, /\/category\//, /\/archive\//,
    /\/feed/, /\/rss/, /\/sitemap/
  ]
  
  // Check skip patterns first
  for (const pattern of skipPatterns) {
    if (pattern.test(urlLower)) return false
  }
  
  // Check important patterns
  for (const pattern of importantPatterns) {
    if (pattern.test(urlLower)) return true
  }
  
  // Check title for important keywords
  const importantKeywords = [
    'home', 'about', 'contact', 'pricing', 'features', 'product',
    'service', 'blog', 'news', 'help', 'support', 'documentation',
    'login', 'signup', 'dashboard', 'account', 'shop', 'store',
    'careers', 'jobs', 'team', 'company'
  ]
  
  return importantKeywords.some(keyword => 
    titleLower.includes(keyword) || urlLower.includes(keyword)
  )
}

// Optimized crawler function
export async function crawlWebsite(
  url: string,
  options: CrawlOptions = { maxPages: 8, maxDepth: 1 },
): Promise<CrawlResult> {
  const startTime = Date.now()
  console.log(`👻 The digital spirits begin their exploration of ${url}...`, options)
  
  // Track metrics
  const metrics = {
    startTime,
    pagesAttempted: 0,
    pagesSuccessful: 0,
    pagesFailed: 0,
    linksFound: 0,
    linksProcessed: 0,
    errors: [] as string[]
  }
  
  try {
    // Normalize URL
    const baseUrl = new URL(url)
    const normalizedUrl = baseUrl.origin + baseUrl.pathname.replace(/\/$/, "")
    console.log(`🌐 The spirits have chosen their entry point: ${normalizedUrl}`)

    // Initialize crawl data
    const nodes: PageNode[] = []
    const links: Link[] = []
    const visited = new Set<string>()
    const queue: { url: string; depth: number }[] = [{ url: normalizedUrl, depth: 0 }]
    
    console.log(`📜 The spirits prepare their scroll of destinations: ${queue.length} pages await`)

    // Set default timeout if not provided
    const timeout = options.timeout || 15000 // Increased from 5000ms to 15000ms (15 seconds)

    // Create axios instance with defaults for better performance
    const axiosInstance = axios.create({
      timeout: timeout,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
    })

    // Process queue with concurrency limit - be respectful to avoid rate limiting
    const concurrencyLimit = 1 // Process 1 page at a time to avoid rate limiting

    while (queue.length > 0 && nodes.length < options.maxPages) {
      // Take up to concurrencyLimit items from the queue
      const batch = queue.splice(0, Math.min(concurrencyLimit, queue.length))
      console.log(`👻 The spirits venture forth to ${batch.length} digital realms (${nodes.length}/${options.maxPages} pages explored)`)
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (current, index) => {
          // Add delay between requests to be respectful
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)) // 1-2 second delay
          }
          // Skip if already visited
          if (visited.has(current.url)) return

          // Mark as visited
          visited.add(current.url)

          try {
            metrics.pagesAttempted++
            console.log(`🔍 The spirits peer into the digital void: ${current.url} (depth: ${current.depth})`)
            // Fetch the page with retry logic for rate limiting
            let response
            let retryCount = 0
            const maxRetries = 3
            
            while (retryCount <= maxRetries) {
              try {
                response = await axiosInstance.get(current.url)
                break // Success, exit retry loop
              } catch (error) {
                if (error.response?.status === 429 && retryCount < maxRetries) {
                  // Rate limited - wait longer and retry
                  const waitTime = Math.pow(2, retryCount) * 2000 + Math.random() * 1000 // Exponential backoff
                  console.log(`👻 The spirits are asked to wait ${Math.round(waitTime/1000)}s before trying ${current.url} again...`)
                  await new Promise(resolve => setTimeout(resolve, waitTime))
                  retryCount++
                  continue
                }
                
                // Other errors or max retries reached
                console.error(`👻 The spirits whisper of resistance at ${current.url}:`, error.message)
                
                // Handle different types of errors
                let status = 500
                if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
                  status = 408
                  console.log(`⏰ The digital realm grows impatient with ${current.url}...`)
                } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
                  status = 404
                  console.log(`🌐 The spirits cannot find the path to ${current.url}...`)
                } else if (error.response?.status) {
                  status = error.response.status
                  console.log(`📡 The digital realm responds with ${status} for ${current.url}`)
                }
                
                // Return a standardized error response
                response = {
                  status,
                  headers: { "content-type": "text/plain" },
                  data: "",
                }
                break
              }
            }
            
            console.log(`✨ The spirits have gazed upon ${current.url} - Status: ${response.status}`)
            
            // Track success/failure
            if (response.status < 400) {
              metrics.pagesSuccessful++
            } else {
              metrics.pagesFailed++
              metrics.errors.push(`${current.url}: HTTP ${response.status}`)
            }

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
                console.log(`📜 The spirits have read the digital scroll: "${pageNode.title}" from ${current.url}`)

                // If not at max depth, extract links
                if (current.depth < options.maxDepth) {
                  // Only process a limited number of links per page for performance
                  const linkElements = $("a").slice(0, 20) // Limit to 20 links per page
                  metrics.linksFound += linkElements.length
                  console.log(`🔗 The spirits discover ${linkElements.length} pathways from ${current.url}`)

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
                      metrics.linksProcessed++
                      console.log(`🔗 The spirits have mapped a connection: ${current.url} → ${targetUrl}`)

                      // Add to queue if not visited and is an important page
                      if (!visited.has(targetUrl) && queue.findIndex((item) => item.url === targetUrl) === -1) {
                        // Check if this is an important page to crawl
                        const linkText = $(element).text().trim() || ""
                        if (isImportantPage(targetUrl, linkText)) {
                          queue.push({ url: targetUrl, depth: current.depth + 1 })
                          console.log(`📜 The spirits add another destination to their scroll: ${targetUrl} (depth: ${current.depth + 1})`)
                        } else {
                          console.log(`👻 The spirits skip an unimportant page: ${targetUrl}`)
                        }
                      }
                    } catch (error) {
                      // Skip invalid links
                      console.error(`👻 The spirits whisper of a broken pathway ${href}:`, error)
                    }
                  })
                }
              } catch (parseError) {
                console.error(`👻 The spirits struggle to read the digital scroll at ${current.url}:`, parseError)
                // Continue with the basic page info we have
              }
            }

            // Add to nodes
            nodes.push(pageNode)
            console.log(`📊 The spirits have mapped ${nodes.length} realms, ${links.length} connections, with ${queue.length} destinations remaining`)
          } catch (error) {
            console.error(`👻 The spirits encounter resistance at ${current.url}:`, error)
            metrics.pagesFailed++
            metrics.errors.push(`${current.url}: ${error.message}`)
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
      
      // Add delay between batches to be respectful
      if (queue.length > 0 && nodes.length < options.maxPages) {
        console.log(`👻 The spirits pause to respect the digital realm...`)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000)) // 2-3 second delay between batches
      }
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

    const endTime = Date.now()
    const duration = endTime - metrics.startTime
    
    console.log(`🎯 The spirits have completed their digital exploration! Found ${processedNodes.length} realms and ${links.length} connections`)
    console.log(`👻 Orphaned pages (lost in the digital void): ${processedNodes.filter(n => n.isOrphaned).length}`)
    console.log(`📊 The spirits' journey metrics:`)
    console.log(`   ⏱️  Time in the digital realm: ${duration}ms`)
    console.log(`   📄 Realms attempted: ${metrics.pagesAttempted}`)
    console.log(`   ✨ Realms successfully explored: ${metrics.pagesSuccessful}`)
    console.log(`   👻 Realms that resisted the spirits: ${metrics.pagesFailed}`)
    console.log(`   🔗 Pathways discovered: ${metrics.linksFound}`)
    console.log(`   🔗 Pathways mapped: ${metrics.linksProcessed}`)
    console.log(`   📈 The spirits' success rate: ${metrics.pagesAttempted > 0 ? Math.round((metrics.pagesSuccessful / metrics.pagesAttempted) * 100) : 0}%`)
    
    if (metrics.errors.length > 0) {
      console.log(`   ⚠️  The spirits encountered resistance: ${metrics.errors.length} times`)
      console.log(`   🔍 The spirits whisper of these challenges:`, metrics.errors.slice(0, 5)) // Show first 5 errors
    }

    // Validate the result
    const result = {
      nodes: processedNodes,
      links,
    }
    
    // Ensure we have at least the homepage
    if (result.nodes.length === 0) {
      console.warn("👻 The spirits found no realms to explore - the digital void may be empty...")
    }
    
    // Ensure all links reference existing nodes
    const nodeUrls = new Set(result.nodes.map(n => n.url))
    const invalidLinks = result.links.filter(link => 
      !nodeUrls.has(link.source) || !nodeUrls.has(link.target)
    )
    
    if (invalidLinks.length > 0) {
      console.warn(`👻 The spirits discovered ${invalidLinks.length} broken pathways that lead to nowhere...`)
      console.warn("Broken pathways:", invalidLinks)
    }
    
    // Ensure all nodes have required fields
    const invalidNodes = result.nodes.filter(node => 
      !node.id || !node.url || typeof node.status !== 'number'
    )
    
    if (invalidNodes.length > 0) {
      console.warn(`👻 The spirits found ${invalidNodes.length} realms with incomplete information...`)
      console.warn("Incomplete realms:", invalidNodes)
    }

    return result
  } catch (error) {
    console.error("👻 The digital spirits have encountered a great disturbance:", error)
    
    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      console.error("👻 The spirits cannot understand the path you have given them...")
      throw new Error("Invalid URL: The digital spirits cannot comprehend this path")
    } else if (error.code === "ENOTFOUND") {
      console.error("👻 The spirits cannot find the realm you seek...")
      throw new Error("Domain not found: The digital realm you seek does not exist")
    } else if (error.message.includes("timeout")) {
      console.error("👻 The spirits grow weary of waiting...")
      throw new Error("Crawl timeout: The digital realm has grown impatient with the spirits")
    } else {
      console.error("👻 The spirits whisper of an unknown disturbance:", error.message)
      throw new Error(`The digital spirits have failed: ${error.message}`)
    }
  }
}
