import { type NextRequest, NextResponse } from "next/server"
import type { PageNode, Link } from "@/lib/crawler"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  let body = { nodes: [], links: [] }

  try {
    // Parse the request body with error handling
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          success: true, // Return success to avoid client-side error
          aiInsights: "The AI couldn't analyze the site structure due to invalid data format. Using fallback analysis.",
          error: "Invalid request format",
        },
        { status: 200 }, // Return 200 to ensure client can process the response
      )
    }

    console.log("👻 AI Analysis API received data:", JSON.stringify(body, null, 2))
    console.log("👻 Body has metrics:", !!body.metrics)
    console.log("👻 Body has issues:", !!body.issues)
    console.log("👻 Issues has orphanPages:", !!(body.issues && body.issues.orphanPages))
    
    // Handle both old format (nodes/links) and new format (report data)
    let siteData
    
    if (body.nodes && body.links) {
      // Old format - raw sitemap data
      const { nodes, links } = body
      siteData = {
        pageCount: nodes.length,
        linkCount: links.length,
        statusCodes: countStatusCodes(nodes),
        orphanedPages: nodes.filter((node) => node.isOrphaned),
        deadLinks: findDeadLinks(nodes, links),
      }
    } else if (body.metrics && body.issues) {
      // New format - processed report data
      siteData = {
        url: body.url,
        metrics: body.metrics,
        issues: body.issues,
        summary: {
          totalPages: body.issues.orphanPages.length + body.issues.deadLinks.length + body.issues.deadEnds.length,
          orphanedPages: body.issues.orphanPages.length,
          deadLinks: body.issues.deadLinks.length,
          deadEnds: body.issues.deadEnds.length,
          revenueLost: body.metrics.revenueLost,
          usersLost: body.metrics.usersLost,
          healthScore: body.metrics.structuralDecay,
        },
        specificIssues: {
          orphanedPages: body.issues.orphanPages,
          deadLinks: body.issues.deadLinks,
          deadEnds: body.issues.deadEnds,
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid data for analysis. The spirits need proper data to work their magic.",
        },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "The digital spirits require an API key to commune with the ethereal plane. Please configure OPENAI_API_KEY.",
        },
        { status: 500 }
      )
    }

    try {
      // Use AI to generate insights with Sitegeist's brand voice
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are SitegeistAI, a neo-gothic digital spirit. Analyze the website data and provide insights based on the ACTUAL issues found. Use the specific numbers and data provided. Format with SHORT bullet points (100-120 characters each):\n\n**SEO:**\n• [short insight based on actual data]\n• [short insight based on actual data]\n\n**User Experience:**\n• [short insight based on actual data]\n• [short insight based on actual data]\n\n**Technical Issues:**\n• [short insight based on actual data]\n• [short insight based on actual data]\n\n**Content Strategy:**\n• [short insight based on actual data]\n• [short insight based on actual data]\n\nIMPORTANT: Reference specific numbers from the data (e.g., '13 dead ends trap users', '0 orphaned pages found'). Use atmospheric gothic language but be specific about the actual issues discovered."
          },
          {
            role: "user",
            content: `Analyze this site data: ${JSON.stringify(siteData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })

      const aiInsights = completion.choices[0]?.message?.content || "The spirits are silent... Please try again."
      
      console.log("👻 AI Analysis complete. Raw response:", aiInsights)

      return NextResponse.json({
        success: true,
        aiInsights: aiInsights,
      })
    } catch (aiError) {
      console.error("AI generation error:", aiError)

      return NextResponse.json(
        {
          success: false,
          error: "The digital spirits are restless and cannot provide analysis at this time. Please try again later.",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("AI analysis API error:", error)

    // Return error response - no mock data
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : "The digital spirits encountered an unexpected disturbance. Please try again.",
      },
      { status: 500 }
    )
  }
}

// Helper functions
function countStatusCodes(nodes: PageNode[]) {
  const counts = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
  }

  nodes.forEach((node) => {
    const firstDigit = Math.floor(node.status / 100)
    if (firstDigit === 2) counts["2xx"]++
    else if (firstDigit === 3) counts["3xx"]++
    else if (firstDigit === 4) counts["4xx"]++
    else if (firstDigit === 5) counts["5xx"]++
  })

  return counts
}

function findDeadLinks(nodes: PageNode[], links: Link[]) {
  const urlStatusMap = new Map<string, number>()

  nodes.forEach((node) => {
    urlStatusMap.set(node.url, node.status)
  })

  return links.filter((link) => {
    const targetStatus = urlStatusMap.get(link.target)
    return targetStatus && targetStatus >= 400
  })
}
