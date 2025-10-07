"use client"

import { useState, useEffect } from "react"
import {
  SearchIcon,
  UsersIcon,
  CodeIcon,
  FileTextIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiInsightsProps {
  insights: string
  onRetryInsights?: () => void
}

export function AiInsights({ insights, onRetryInsights }: AiInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [currentMessage, setCurrentMessage] = useState("")
  const [visibleSections, setVisibleSections] = useState({
    seo: false,
    ux: false,
    technical: false,
    content: false,
  })
  const [typewriterText, setTypewriterText] = useState({
    seo: "",
    ux: "",
    technical: "",
    content: "",
  })

  const loadingMessages = [
    "The spirits are analyzing your digital realm...",
    "Ancient pathways are being mapped...",
    "The digital spirits whisper their findings...",
    "Echoes of forgotten pages call from the void...",
    "The spirits are patient, but they will speak...",
    "Lost pages emerge from the digital shadows...",
    "The digital realm reveals its secrets...",
    "The spirits are gathering their wisdom...",
    "Hidden connections are being discovered...",
    "The digital void yields its mysteries...",
  ]

  // Parse insights into sections from the AI-generated report
  const parseInsights = (text: string) => {
    // Default fallback content in Sitegeist brand voice
    const defaultSections = {
      seo: "The digital spirits whisper of SEO opportunities hidden in the shadows. Your meta descriptions and title tags need the spirits' attention.",
      ux: "Users are wandering through digital dead ends, lost in the void of poor navigation. The spirits suggest clearer pathways.",
      technical: "The digital realm has structural issues that need the spirits' intervention. Broken links and errors haunt your site.",
      content: "Orphaned pages lurk in the shadows, valuable content that users cannot discover. The spirits know their secrets.",
    }

    // If no AI insights, return defaults
    if (!text || text.length < 50) {
      return defaultSections
    }

    // Simple parsing for the AI response format: **Section:** followed by bullet points
    const sections = { ...defaultSections }

    // Extract sections using simple regex for **Section:** format
    const seoMatch = text.match(/\*\*SEO:\*\*([\s\S]*?)(?=\*\*|$)/i)
    if (seoMatch) {
      sections.seo = seoMatch[1].trim()
    }

    const uxMatch = text.match(/\*\*User Experience:\*\*([\s\S]*?)(?=\*\*|$)/i)
    if (uxMatch) {
      sections.ux = uxMatch[1].trim()
    }

    const techMatch = text.match(/\*\*Technical Issues:\*\*([\s\S]*?)(?=\*\*|$)/i)
    if (techMatch) {
      sections.technical = techMatch[1].trim()
    }

    const contentMatch = text.match(/\*\*Content Strategy:\*\*([\s\S]*?)(?=\*\*|$)/i)
    if (contentMatch) {
      sections.content = contentMatch[1].trim()
    }

    return sections
  }

  const insightSections = parseInsights(insights)

  // Rotate loading messages
  useEffect(() => {
    if (!isAnalyzing) return

    let messageIndex = 0
    const interval = setInterval(() => {
      setCurrentMessage(loadingMessages[messageIndex])
      messageIndex = (messageIndex + 1) % loadingMessages.length
    }, 2000)

    return () => clearInterval(interval)
  }, [isAnalyzing])

  // Start the analysis sequence
  useEffect(() => {
    if (!insights) return

    // Start analysis after a short delay
    const timer = setTimeout(() => {
      setIsAnalyzing(false)
      startRevealSequence()
    }, 3000)

    return () => clearTimeout(timer)
  }, [insights])

  const startRevealSequence = () => {
    const sections = ['seo', 'ux', 'technical', 'content'] as const
    
    const startNextSection = (index: number) => {
      if (index >= sections.length) return
      
      const section = sections[index]
      setVisibleSections(prev => ({ ...prev, [section]: true }))
      
      // Start typewriter for this section
      startTypewriter(section, insightSections[section], () => {
        // When this section finishes typing, start the next one after a delay
        setTimeout(() => {
          startNextSection(index + 1)
        }, 1000) // 1 second pause between sections
      })
    }
    
    // Start with the first section
    startNextSection(0)
  }

  const startTypewriter = (section: keyof typeof typewriterText, text: string, onComplete?: () => void) => {
    let currentIndex = 0
    const typewriterInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setTypewriterText(prev => ({
          ...prev,
          [section]: text.substring(0, currentIndex + 1)
        }))
        currentIndex++
      } else {
        clearInterval(typewriterInterval)
        // Call the completion callback
        if (onComplete) {
          onComplete()
        }
      }
    }, 30) // 30ms per character for smooth typing
  }

  if (isAnalyzing) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Insights</h2>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-white mb-2">The spirits are at work...</h3>
            <p className="text-sm text-gray-400 min-h-[3rem] flex items-center transition-opacity duration-500">
              {currentMessage}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">AI Insights</h2>
        {onRetryInsights && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryInsights}
            className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Respawn Insights
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* SEO Section */}
        <div className={`transition-all duration-1000 ${visibleSections.seo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div className="flex items-center mb-3">
              <SearchIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-semibold text-white">SEO Insights</span>
            </div>
            {visibleSections.seo && (
              <div className="text-sm text-gray-300 leading-relaxed">
                <div className="whitespace-pre-line">
                  {typewriterText.seo}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* UX Section */}
        <div className={`transition-all duration-1000 ${visibleSections.ux ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div className="flex items-center mb-3">
              <UsersIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-semibold text-white">User Experience</span>
            </div>
            {visibleSections.ux && (
              <div className="text-sm text-gray-300 leading-relaxed">
                <div className="whitespace-pre-line">
                  {typewriterText.ux}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Section */}
        <div className={`transition-all duration-1000 ${visibleSections.technical ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div className="flex items-center mb-3">
              <CodeIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-semibold text-white">Technical Issues</span>
            </div>
            {visibleSections.technical && (
              <div className="text-sm text-gray-300 leading-relaxed">
                <div className="whitespace-pre-line">
                  {typewriterText.technical}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className={`transition-all duration-1000 ${visibleSections.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div className="flex items-center mb-3">
              <FileTextIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-semibold text-white">Content Strategy</span>
            </div>
            {visibleSections.content && (
              <div className="text-sm text-gray-300 leading-relaxed">
                <div className="whitespace-pre-line">
                  {typewriterText.content}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}