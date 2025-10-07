import { describe, it, expect } from "vitest"
import { identifyOrphanedPages } from "@/lib/analysis/orphaned-pages"
import { findDeadLinks } from "@/lib/analysis/dead-links"
import { findDeadEnds } from "@/lib/analysis/dead-ends"
import type { PageNode, Link, SitemapData } from "@/lib/types/crawler"

describe("Analysis", () => {
  describe("identifyOrphanedPages", () => {
    it("should mark pages with no incoming links as orphaned", () => {
      const data: SitemapData = {
        nodes: [
          { id: "/home", url: "/home", status: 200 } as PageNode,
          { id: "/about", url: "/about", status: 200 } as PageNode,
          { id: "/contact", url: "/contact", status: 200 } as PageNode,
          { id: "/orphaned", url: "/orphaned", status: 200 } as PageNode,
        ],
        links: [
          { source: "/home", target: "/about", text: "About" },
          { source: "/about", target: "/contact", text: "Contact" },
          { source: "/contact", target: "/home", text: "Home" },
        ],
      }

      const result = identifyOrphanedPages(data)

      const orphanedPage = result.nodes.find((node) => node.url === "/orphaned")
      expect(orphanedPage?.isOrphaned).toBe(true)

      const nonOrphanedPage = result.nodes.find((node) => node.url === "/about")
      expect(nonOrphanedPage?.isOrphaned).toBe(false)
    })

    it("should not mark the first page (homepage) as orphaned even with no incoming links", () => {
      const data: SitemapData = {
        nodes: [
          { id: "/", url: "/", status: 200 } as PageNode,
          { id: "/about", url: "/about", status: 200 } as PageNode,
        ],
        links: [{ source: "/", target: "/about", text: "About" }],
      }

      const result = identifyOrphanedPages(data)

      const homePage = result.nodes.find((node) => node.url === "/")
      expect(homePage?.isOrphaned).toBe(false)
    })
  })

  describe("findDeadLinks", () => {
    it("should identify links pointing to pages with 4xx or 5xx status codes", () => {
      const nodes: PageNode[] = [
        { id: "/home", url: "/home", status: 200 } as PageNode,
        { id: "/about", url: "/about", status: 200 } as PageNode,
        { id: "/not-found", url: "/not-found", status: 404 } as PageNode,
        { id: "/server-error", url: "/server-error", status: 500 } as PageNode,
      ]

      const links: Link[] = [
        { source: "/home", target: "/about", text: "About" },
        { source: "/home", target: "/not-found", text: "Not Found" },
        { source: "/about", target: "/server-error", text: "Error" },
      ]

      const deadLinks = findDeadLinks(nodes, links)

      expect(deadLinks).toHaveLength(2)
      expect(deadLinks.some((link) => link.target === "/not-found")).toBe(true)
      expect(deadLinks.some((link) => link.target === "/server-error")).toBe(true)
    })
  })

  describe("findDeadEnds", () => {
    it("should identify pages with no outbound links", () => {
      const nodes: PageNode[] = [
        { id: "/home", url: "/home", status: 200 } as PageNode,
        { id: "/about", url: "/about", status: 200 } as PageNode,
        { id: "/contact", url: "/contact", status: 200 } as PageNode,
        { id: "/dead-end", url: "/dead-end", status: 200 } as PageNode,
        { id: "/error", url: "/error", status: 404 } as PageNode,
      ]

      const links: Link[] = [
        { source: "/home", target: "/about", text: "About" },
        { source: "/home", target: "/contact", text: "Contact" },
        { source: "/home", target: "/dead-end", text: "Dead End" },
        { source: "/about", target: "/contact", text: "Contact" },
        { source: "/contact", target: "/home", text: "Home" },
      ]

      const deadEnds = findDeadEnds(nodes, links)

      expect(deadEnds).toHaveLength(1)
      expect(deadEnds[0].url).toBe("/dead-end")

      // Should not include error pages
      expect(deadEnds.some((node) => node.url === "/error")).toBe(false)
    })
  })
})
