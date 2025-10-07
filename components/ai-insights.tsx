"use client"

import { useState } from "react"
import {
  SearchIcon,
  UsersIcon,
  CodeIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiInsightsProps {
  insights: string
  onExportPdf: () => void
}

export function AiInsights({ insights, onExportPdf }: AiInsightsProps) {
  const [expandedSections, setExpandedSections] = useState({
    seo: true,
    ux: false,
    technical: false,
    content: false,
  })

  // Parse insights into sections
  // In a real implementation, we'd have the AI return structured data
  // For now, we'll simulate by splitting the text
  const parseInsights = (text: string) => {
    // This is a simplified parsing approach
    // In reality, we'd have the AI return structured data
    const sections = {
      seo: "Optimize your meta descriptions and title tags for better search visibility. Several pages lack proper meta descriptions.",
      ux: "User experience is hindered by dead-end pages and broken navigation paths. Consider adding related content sections.",
      technical: "Fix the 404 errors and redirect old URLs to maintain link equity. Update internal linking structure.",
      content:
        "Content gaps exist in key areas. Orphaned pages contain valuable information that users can't discover.",
    }

    // If we have real insights, try to extract sections
    if (text && text.length > 50) {
      // Very basic extraction - in reality we'd have better parsing
      if (text.includes("SEO")) {
        sections.seo = text.split("SEO")[1].split("\n\n")[0]
      }
      if (text.includes("User Experience")) {
        sections.ux = text.split("User Experience")[1].split("\n\n")[0]
      }
      if (text.includes("Technical")) {
        sections.technical = text.split("Technical")[1].split("\n\n")[0]
      }
      if (text.includes("Content")) {
        sections.content = text.split("Content")[1].split("\n\n")[0]
      }
    }

    return sections
  }

  const insightSections = parseInsights(insights)

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-md">
      <div className="flex items-center justify-between p-4 border-b border-gray-900">
        <h2 className="text-lg font-light text-green-400">AI Insights</h2>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800"
          onClick={onExportPdf}
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="divide-y divide-gray-900">
        {/* SEO Section */}
        <div className="p-4">
          <button className="flex items-center justify-between w-full text-left" onClick={() => toggleSection("seo")}>
            <div className="flex items-center">
              <SearchIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">SEO Insights</span>
            </div>
            {expandedSections.seo ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.seo && <div className="mt-2 text-xs text-gray-400 pl-6">{insightSections.seo}</div>}
        </div>

        {/* UX Section */}
        <div className="p-4">
          <button className="flex items-center justify-between w-full text-left" onClick={() => toggleSection("ux")}>
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">User Experience</span>
            </div>
            {expandedSections.ux ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.ux && <div className="mt-2 text-xs text-gray-400 pl-6">{insightSections.ux}</div>}
        </div>

        {/* Technical Section */}
        <div className="p-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection("technical")}
          >
            <div className="flex items-center">
              <CodeIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">Technical Issues</span>
            </div>
            {expandedSections.technical ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.technical && (
            <div className="mt-2 text-xs text-gray-400 pl-6">{insightSections.technical}</div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection("content")}
          >
            <div className="flex items-center">
              <FileTextIcon className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">Content Strategy</span>
            </div>
            {expandedSections.content ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.content && <div className="mt-2 text-xs text-gray-400 pl-6">{insightSections.content}</div>}
        </div>
      </div>
    </div>
  )
}
