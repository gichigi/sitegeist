import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { extractLinks } from "@/lib/crawler/link-extractor"
import { processPage } from "@/lib/crawler/page-processor"
import { checkStatus } from "@/lib/crawler/status-checker"
import * as cheerio from "cheerio"

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    head: vi.fn(),
  },
}))

// Mock database functions
vi.mock("@/lib/db", () => ({
  saveJob: vi.fn(),
  updateJob: vi.fn(),
  getJob: vi.fn(),
}))

describe("Crawler", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("extractLinks", () => {
    it("should extract links from HTML", () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/page1">Page 1</a>
            <a href="/page2">Page 2</a>
            <a href="page3">Page 3</a>
            <a href="https://other-domain.com/page4">External Page</a>
            <a href="mailto:test@example.com">Email</a>
            <a href="javascript:void(0)">JS Link</a>
            <a href="#section">Anchor</a>
          </body>
        </html>
      `

      const $ = cheerio.load(html)
      const currentUrl = "https://example.com/current"
      const baseUrl = "https://example.com"

      const links = extractLinks($, currentUrl, baseUrl)

      expect(links).toContain("https://example.com/page1")
      expect(links).toContain("https://example.com/page2")
      expect(links).toContain("https://example.com/page3")

      // Should not include external domains, anchors, mailto, or javascript links
      expect(links).not.toContain("https://other-domain.com/page4")
      expect(links).not.toContain("mailto:test@example.com")
      expect(links).not.toContain("javascript:void(0)")
      expect(links.some((link) => link.includes("#"))).toBe(false)
    })
  })

  describe("processPage", () => {
    it("should return basic info for error pages", async () => {
      const url = "https://example.com/not-found"
      const status = 404

      const result = await processPage(url, status)

      expect(result).toEqual({
        id: url,
        url,
        status,
        title: "",
        description: "",
        lastModified: null,
        contentType: "",
        hasOutboundLinks: false,
        wordCount: 0,
        headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
      })
    })
  })

  describe("checkStatus", () => {
    it("should handle errors gracefully", async () => {
      const axios = await import("axios")
      axios.default.head.mockRejectedValue(new Error("Network error"))

      const result = await checkStatus("https://example.com/error")

      expect(result.status).toBe(500)
    })
  })
})
