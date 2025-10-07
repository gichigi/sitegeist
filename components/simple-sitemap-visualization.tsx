"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomInIcon, ZoomOutIcon, ExternalLinkIcon } from "lucide-react"

interface PageNode {
  id: string
  url: string
  name: string
  title: string
  status: number
  isOrphaned: boolean
  children?: PageNode[]
}

interface SimpleSitemapVisualizationProps {
  data: {
    nodes: PageNode[]
    links: { source: string; target: string }[]
  }
  onNodeSelect?: (node: PageNode) => void
}

export default function SimpleSitemapVisualization({ data, onNodeSelect }: SimpleSitemapVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<PageNode | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Generate clean, scannable card titles
  const getCardTitle = (node: PageNode): string => {
    try {
      const url = new URL(node.url)
      const pathname = url.pathname
      
      // For homepage, use domain name
      if (pathname === "/" || pathname === "") {
        return url.hostname.replace('www.', '')
      }
      
      // Extract the last meaningful part of the path
      const pathParts = pathname.split('/').filter(part => part.length > 0)
      if (pathParts.length === 0) return url.hostname.replace('www.', '')
      
      // Get the last part and clean it up
      let lastPart = pathParts[pathParts.length - 1]
      
      // Remove common file extensions
      lastPart = lastPart.replace(/\.(html|php|asp|jsp)$/i, '')
      
      // Replace hyphens and underscores with spaces
      lastPart = lastPart.replace(/[-_]/g, ' ')
      
      // Capitalize first letter of each word
      lastPart = lastPart.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      // If it's too long, truncate
      if (lastPart.length > 20) {
        lastPart = lastPart.substring(0, 17) + '...'
      }
      
      return lastPart || url.hostname.replace('www.', '')
    } catch {
      // Fallback to original title or URL
      return node.title || node.name || node.url.replace('https://', '').replace('http://', '')
    }
  }

  // Find homepage (root node)
  const homepage = data.nodes.find(node => {
    try {
      const url = new URL(node.url)
      return url.pathname === "/" || url.pathname === ""
    } catch {
      return false
    }
  }) || data.nodes[0]

  // Build hierarchy from links
  const buildHierarchy = (nodes: PageNode[], links: { source: string; target: string }[]) => {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, children: [] }]))
    
    // Add children based on links
    links.forEach(link => {
      const parent = nodeMap.get(link.source)
      const child = nodeMap.get(link.target)
      if (parent && child && parent.id !== child.id) {
        parent.children = parent.children || []
        if (!parent.children.find(c => c.id === child.id)) {
          parent.children.push(child)
        }
      }
    })

    return Array.from(nodeMap.values())
  }

  const hierarchy = buildHierarchy(data.nodes, data.links)
  const rootNode = hierarchy.find(node => node.id === homepage?.id) || hierarchy[0]

  const getStatusColor = (status: number, isOrphaned: boolean) => {
    if (isOrphaned) return "bg-red-500"
    if (status >= 200 && status < 300) return "bg-green-500"
    if (status >= 300 && status < 400) return "bg-yellow-500"
    if (status >= 400) return "bg-red-500"
    return "bg-gray-500"
  }

  const getStatusText = (status: number, isOrphaned: boolean) => {
    if (isOrphaned) return "Orphaned"
    if (status >= 200 && status < 300) return "Healthy"
    if (status >= 300 && status < 400) return "Redirect"
    if (status >= 400) return "Error"
    return "Unknown"
  }

  const handleNodeClick = (node: PageNode) => {
    setSelectedNode(node)
    onNodeSelect?.(node)
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))

  const renderNode = (node: PageNode, level: number = 0, index: number = 0) => {
    const isSelected = selectedNode?.id === node.id
    const statusColor = getStatusColor(node.status, node.isOrphaned)
    const statusText = getStatusText(node.status, node.isOrphaned)
    
    return (
      <div key={node.id} className="relative">
        {/* Node */}
        <div
          className={`
            relative group cursor-pointer transition-all duration-200
            ${isSelected ? 'ring-2 ring-green-400' : 'hover:ring-1 hover:ring-gray-400'}
          `}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left'
          }}
          onClick={() => handleNodeClick(node)}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-full min-h-[80px] flex flex-col justify-between"> {/* More rectangular, taller */}
            {/* Page title - Primary text */}
            <div className="font-semibold text-white text-sm mb-2 line-clamp-2" title={node.title || node.name}>
              {getCardTitle(node)}
            </div>
            
            {/* URL - shortened */}
            <div className="text-xs text-gray-500 truncate mb-2" title={node.url}>
              {node.url.replace('https://', '').replace('http://', '')}
            </div>
            
            {/* Status indicator - moved to bottom */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></div>
                <span className="text-xs text-gray-400">{statusText}</span>
                {node.isOrphaned && <span className="text-xs text-red-400">👻</span>}
              </div>
              <div className="text-xs text-gray-600">
                {node.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-gray-950">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-70 p-3 rounded-lg border border-gray-800">
          <h3 className="text-white text-sm font-medium mb-1">Site Structure</h3>
          <p className="text-gray-400 text-xs">
            {data.nodes.length} pages • {data.links.length} connections
          </p>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800 transition-all duration-200 hover:scale-105"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOutIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800 transition-all duration-200 hover:scale-105"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomInIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Visualization */}
      <div className="w-full h-full overflow-auto p-4">
        <div className="min-h-full">
          {rootNode ? (
            <div className="space-y-2">
              {/* Homepage at top */}
              <div className="flex justify-center mb-4">
                {renderNode(rootNode, 0, 0)}
              </div>
              
              {/* Child pages in a compact grid */}
              {rootNode.children && rootNode.children.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-4xl mx-auto">
                  {rootNode.children.map((child, index) => 
                    renderNode(child, 0, index)
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">👻</div>
                <div className="text-gray-400">The digital void is empty...</div>
                <div className="text-gray-500 text-sm">No pages found to explore</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black bg-opacity-90 p-4 rounded-lg border border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-white font-medium mb-1">{selectedNode.name}</h4>
                <p className="text-gray-400 text-sm mb-2">{selectedNode.url}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    selectedNode.isOrphaned ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {getStatusText(selectedNode.status, selectedNode.isOrphaned)}
                  </span>
                  <span className="text-gray-500">Status: {selectedNode.status}</span>
                  {selectedNode.children && (
                    <span className="text-gray-500">
                      {selectedNode.children.length} child pages
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600"
                onClick={() => window.open(selectedNode.url, '_blank')}
              >
                <ExternalLinkIcon className="h-3 w-3 mr-1" />
                Visit
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
