"use client"

import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SitemapVisualization({ data, onNodeSelect }) {
  const svgRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1.5) // Start more zoomed in

  // Enhanced mock data for the prototype or fallback
  const mockData = {
    nodes: [
      { id: "/", name: "Homepage", slug: "/" },
      { id: "/about", name: "About", slug: "/about" },
      { id: "/products", name: "Products", slug: "/products" },
      { id: "/products/item-1", name: "Product 1", slug: "/products/item-1" },
      { id: "/products/item-2", name: "Product 2", slug: "/products/item-2" },
      {
        id: "/products/discontinued/legacy-item-2018",
        name: "Legacy Product",
        slug: "/products/discontinued/legacy-item-2018",
      },
      { id: "/blog", name: "Blog", slug: "/blog" },
      { id: "/blog/post-1", name: "Blog Post 1", slug: "/blog/post-1" },
      { id: "/blog/post-2", name: "Blog Post 2", slug: "/blog/post-2" },
      { id: "/blog/draft-announcement-2022", name: "Draft Post", slug: "/blog/draft-announcement-2022" },
      { id: "/contact", name: "Contact", slug: "/contact" },
      { id: "/contact/thank-you", name: "Thank You", slug: "/contact/thank-you" },
      { id: "/about/team", name: "Team", slug: "/about/team" },
      { id: "/about/team/former-ceo", name: "Former CEO", slug: "/about/team/former-ceo" },
    ],
    links: [
      { source: "/", target: "/about" },
      { source: "/", target: "/products" },
      { source: "/", target: "/blog" },
      { source: "/", target: "/contact" },
      { source: "/products", target: "/products/item-1" },
      { source: "/products", target: "/products/item-2" },
      { source: "/blog", target: "/blog/post-1" },
      { source: "/blog", target: "/blog/post-2" },
      { source: "/contact", target: "/contact/thank-you" },
      { source: "/about", target: "/about/team" },
      { source: "/about/team", target: "/about/team/former-ceo" },
    ],
  }

  const identifyOrphanedPages = (data) => {
    // Create a set of all pages that have incoming links
    const pagesWithIncomingLinks = new Set()
    data.links.forEach((link) => {
      pagesWithIncomingLinks.add(link.target)
    })

    // Mark nodes as orphaned if they have no incoming links (except homepage)
    return {
      ...data,
      nodes: data.nodes.map((node) => ({
        ...node,
        isOrphaned: !pagesWithIncomingLinks.has(node.id) && node.id !== "/",
      })),
    }
  }

  // Enhance data with names if missing
  const enhanceData = (data) => {
    if (!data || !data.nodes || data.nodes.length === 0) {
      return identifyOrphanedPages(mockData)
    }

    // Add name and slug if missing
    const enhancedNodes = data.nodes.map((node) => {
      // Extract a name from the URL if missing
      if (!node.name) {
        try {
          const url = new URL(node.url)
          const pathSegments = url.pathname.split("/").filter(Boolean)
          const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : "Homepage"
          node.name = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
        } catch (error) {
          node.name = "Unknown"
        }
      }

      // Add slug if missing
      if (!node.slug) {
        node.slug = node.url
      }

      return node
    })

    return identifyOrphanedPages({
      ...data,
      nodes: enhancedNodes,
    })
  }

  // Use provided data or fallback to mock data if there's an issue
  const graphData = enhanceData(data)

  useEffect(() => {
    if (!svgRef.current) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])

    const g = svg.append("g")

    // Create a map for faster node lookup
    const nodeMap = {}
    graphData.nodes.forEach((node) => {
      nodeMap[node.id] = node
    })

    // Process links to use the actual node objects
    const links = graphData.links
      .map((link) => {
        const source = nodeMap[link.source] || link.source
        const target = nodeMap[link.target] || link.target

        // Skip links with missing nodes
        if (!source || !target) return null

        return { source, target }
      })
      .filter(Boolean) // Remove null links

    // Create a hierarchical layout for better organization
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150), // Increased distance between nodes
      )
      .force("charge", d3.forceManyBody().strength(-300)) // Stronger repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(70)) // Add collision detection with larger radius
      .force(
        "x",
        d3.forceX(width / 2).strength((d) => (d.isOrphaned ? 0.05 : 0.01)),
      )
      .force(
        "y",
        d3.forceY(height / 2).strength((d) => (d.isOrphaned ? 0.05 : 0.01)),
      )

    // Add hierarchical structure - push child nodes below parents
    simulation.force(
      "y",
      d3
        .forceY()
        .strength((d) => {
          // Calculate depth based on URL path segments
          const depth = d.id.split("/").filter(Boolean).length
          // Apply stronger force based on depth
          return 0.1 * depth
        })
        .y((d) => {
          const depth = d.id.split("/").filter(Boolean).length
          // Position nodes vertically based on their depth
          return 100 + depth * 120
        }),
    )

    // Create links
    const link = g
      .selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "rgba(74, 222, 128, 0.2)")
      .attr("stroke-width", 1)

    // Create node groups
    const node = g
      .selectAll(".node")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("mouseover", (event, d) => {
        setHoveredNode(d)
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("fill", (d) => (d.isOrphaned ? "rgba(239, 68, 68, 1)" : "rgba(74, 222, 128, 1)"))

        d3.select(event.currentTarget).select("circle.glow").transition().duration(200).attr("opacity", 0.3)
      })
      .on("mouseout", (event, d) => {
        if (selectedNode !== d) {
          setHoveredNode(null)
          d3.select(event.currentTarget)
            .select("circle")
            .transition()
            .duration(200)
            .attr("r", 4)
            .attr("fill", (d) => (d.isOrphaned ? "rgba(239, 68, 68, 0.8)" : "rgba(74, 222, 128, 0.6)"))

          d3.select(event.currentTarget).select("circle.glow").transition().duration(200).attr("opacity", 0)
        }
      })
      .on("click", (event, d) => {
        const newSelected = d === selectedNode ? null : d
        setSelectedNode(newSelected)
        if (onNodeSelect) onNodeSelect(newSelected)
      })

    // Add drag behavior separately
    const dragBehavior = d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on("drag", (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    // Apply drag behavior to nodes
    node.call(dragBehavior)

    // Add glow circles
    node.append("circle").attr("class", "glow").attr("r", 8).attr("fill", "rgba(74, 222, 128, 0.2)").attr("opacity", 0)

    // Add node circles
    node
      .append("circle")
      .attr("r", 4)
      .attr("fill", (d) => (d.isOrphaned ? "rgba(239, 68, 68, 0.8)" : "rgba(74, 222, 128, 0.6)"))

    // Create a background for labels to improve readability
    node
      .append("rect")
      .attr("class", "label-bg")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "rgba(0, 0, 0, 0.7)")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .attr("opacity", 0)

    // Add node labels with improved visibility
    const labels = node
      .append("text")
      .attr("class", "label")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .style("font-weight", "bold")
      .text((d) => {
        // Truncate long names
        const name = d.name || ""
        return name.length > 20 ? name.substring(0, 17) + "..." : name
      })

    // Adjust label background sizes based on text content
    labels.each(function (d) {
      const bbox = this.getBBox()
      d3.select(this.parentNode)
        .select("rect.label-bg")
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 2)
        .attr("x", -bbox.width / 2 - 5)
        .attr("y", bbox.y - 1)
        .attr("opacity", 0.7)
    })

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)

      node.attr("transform", (d) => {
        // Keep nodes within bounds
        d.x = Math.max(50, Math.min(width - 50, d.x))
        d.y = Math.max(50, Math.min(height - 50, d.y))
        return `translate(${d.x},${d.y})`
      })
    })

    // Add zoom behavior
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoomBehavior)

    // Set initial zoom level
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 4, height / 4).scale(zoomLevel))

    // Run simulation for longer to find a better layout
    simulation.alpha(1).restart()

    // Heat up the simulation and let it run longer
    for (let i = 0; i < 300; ++i) simulation.tick()

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [data, selectedNode, zoomLevel])

  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current).select("svg")
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 8])
    svg.transition().call(zoomBehavior.scaleBy, 1.3)
  }

  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current).select("svg")
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 8])
    svg.transition().call(zoomBehavior.scaleBy, 0.7)
  }

  const handleReset = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current).select("svg")
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 8])
    svg.transition().call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 4, height / 4).scale(1.5))
    setZoomLevel(1.5)
  }

  return (
    <div className="w-full h-full relative">
      <div ref={svgRef} className="w-full h-full"></div>

      <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-black bg-opacity-70 p-3 rounded-md border border-gray-800">
        {hoveredNode || selectedNode ? (
          <div>
            <div className="font-medium text-green-400">{(hoveredNode || selectedNode).name}</div>
            <div className="text-gray-400">{(hoveredNode || selectedNode).slug}</div>
          </div>
        ) : (
          <div>
            <p>Hover over nodes to see details. Click to select.</p>
            <p className="text-gray-500 mt-1">Drag nodes to rearrange. Scroll to zoom.</p>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800"
          onClick={handleZoomIn}
        >
          <ZoomInIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800"
          onClick={handleZoomOut}
        >
          <ZoomOutIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800"
          onClick={handleReset}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
