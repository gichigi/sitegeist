# Sitegeist

> *"There's something lurking in your website."*

A cyberpunk-themed website structure analyzer that crawls domains, maps site structures, and reveals hidden issues. Built with Next.js, TypeScript, and D3.js.

<!-- Demo screenshot coming soon -->

## Features

- 🔍 **Website Crawling**: Deep crawl any domain to map its structure
- 🗺️ **Interactive Visualization**: Clean, hierarchical site structure visualization
- 👻 **Orphaned Page Detection**: Find pages that exist but aren't linked
- 📊 **AI-Powered Insights**: Get analysis on site structure and SEO issues
- 🎨 **Cyberpunk UI**: Dark, immersive interface with green terminal aesthetics

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sitegeist.git
cd sitegeist

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Enter a URL**: Input any website URL (e.g., `example.com`)
2. **Crawl**: The app will crawl the site and map its structure
3. **Analyze**: View the interactive sitemap and AI insights
4. **Explore**: Click nodes to see detailed page information

## API Endpoints

### `/api/crawler`
Crawls a website and returns its structure.

**POST** `/api/crawler`
```json
{
  "url": "https://example.com",
  "maxPages": 20,
  "maxDepth": 1,
  "timeout": 15000
}
```

### `/api/analyze`
Analyzes crawled data and provides AI insights.

**POST** `/api/analyze`
```json
{
  "nodes": [...],
  "links": [...]
}
```

## Development

### Project Structure

```
sitegeist/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── page.tsx            # Home page
│   ├── sitemap/            # Sitemap visualization
│   └── report/             # Analysis report
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── ai-insights.tsx     # AI analysis component
│   └── sitemap-visualization.tsx
├── lib/                    # Utility functions
│   ├── crawler.ts          # Web crawler logic
│   ├── mock-ai-analysis.ts # AI analysis (mock)
│   └── pdf-export.ts       # PDF generation
└── __tests__/              # Test files
```

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. No additional configuration needed

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted with Docker

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# OpenAI API Key for AI-powered analysis
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: An OpenAI API key is required for AI analysis. The app will not function without it.

### Crawler Settings

Modify crawler behavior in `/lib/crawler.ts`:

```typescript
const options = {
  maxPages: 20,      // Maximum pages to crawl
  maxDepth: 1,       // Maximum crawl depth
  timeout: 15000     // Request timeout in ms
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Visualizations powered by [D3.js](https://d3js.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

*"It sees the pages you've abandoned. The links that lead nowhere. The users lost in the void."*
