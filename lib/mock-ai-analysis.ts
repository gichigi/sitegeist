import type { PageNode, Link } from "@/lib/crawler"

export function generateMockAiAnalysis(nodes: PageNode[] = [], links: Link[] = []): string {
  try {
    // Handle empty data
    if (!nodes.length) {
      return "I couldn't fully analyze your site structure due to limited data. Please try crawling more pages or check your connection."
    }

    // Count issues
    const orphanedPages = nodes.filter((node) => node.isOrphaned).length
    const errorPages = nodes.filter((node) => node.status >= 400).length
    const totalPages = nodes.length

    // Calculate percentages
    const orphanedPercentage = Math.round((orphanedPages / totalPages) * 100) || 0
    const errorPercentage = Math.round((errorPages / totalPages) * 100) || 0

    // Generate insights based on the data
    let insights = `I've scanned the digital shadows of your site and found ${totalPages} pages connected by ${links.length} pathways.\n\n`

    // SEO section
    insights += `## SEO Vulnerabilities\n\n`
    if (orphanedPages > 0) {
      insights += `${orphanedPercentage}% of your pages exist as digital ghosts - orphaned from the main structure. Search engines can't find what they can't crawl. These pages are wasting your content investment.\n\n`
    } else {
      insights += `Your site structure appears solid from an SEO perspective. All pages are connected to your main navigation structure, allowing search engines to discover your content.\n\n`
    }

    // User Experience section
    insights += `## User Experience Fractures\n\n`
    if (errorPages > 0) {
      insights += `${errorPercentage}% of your pages return error codes. Users are encountering digital dead ends, eroding trust with each 404. Fix these broken pathways to prevent users from vanishing into the void.\n\n`
    } else {
      insights += `No error pages detected. Your users can navigate freely without encountering broken pathways. However, consider optimizing your navigation structure to reduce the number of clicks required to reach important content.\n\n`
    }

    // Technical section
    insights += `## Technical Decay\n\n`
    insights += `Your site's structure reveals ${links.length > nodes.length ? "excessive" : "minimal"} internal linking. ${links.length > nodes.length * 2 ? "This web of connections may confuse both users and crawlers." : "Consider adding more internal links to improve content discovery."}\n\n`

    // Content strategy
    insights += `## Content Strategy\n\n`
    insights += `The digital footprint of your site suggests ${totalPages < 10 ? "a minimal content strategy" : "a substantial content investment"}. ${totalPages < 10 ? "Consider expanding your content to establish authority in your domain." : "Ensure your most valuable content is easily accessible from your main navigation paths."}\n\n`

    // Conclusion
    insights += `Remember, in the digital realm, structure is destiny. Fix these issues, and your site will rise from the shadows.`

    return insights
  } catch (error) {
    console.error("Error generating mock analysis:", error)
    return "I've analyzed your site structure and found potential issues that need attention. Focus on improving navigation and fixing broken links to enhance user experience and SEO performance."
  }
}
