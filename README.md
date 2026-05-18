# NewsLens AI

An intelligent news aggregation platform that combines real-time news gathering with AI-powered analysis to provide users with a comprehensive, enhanced news reading experience.

🌐 **Live Demo**: [https://newslens-ai-ten.vercel.app](https://newslens-ai-ten.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css)
![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

---

## Features

### News Aggregation
- **Multi-source fetching**: Aggregates news from 8 major sources (CNN, BBC News, Washington Post, NBC News, New York Times, Reuters, Associated Press, ABC News)
- **Smart organization**: Displays one headline from each source first, then remaining articles
- **Real-time updates**: Auto-refresh functionality every 5 minutes
- **Load more articles**: Pagination system for discovering additional content

### AI-Powered Features
- **Article summarization**: Uses Groq's Llama 3.1 8B Instant model to generate concise 2-3 sentence summaries
- **Sentiment analysis**: AI determines if articles are Positive, Negative, or Neutral with visual indicators
- **Language translation**: Automatically detects and translates non-English articles to English

### Search & Filtering
- **Keyword search**: Search across all articles for specific topics
- **Category filtering**: Filter by Business, Technology, Sports, Health, Entertainment, Science, and General news

### User Experience
- **Bookmarking system**: Save articles with persistent local storage
- **Bookmarks view**: Dedicated section to view and manage saved articles
- **Share functionality**: Share articles via Twitter, Facebook, LinkedIn, or copy link
- **Reading time estimation**: Calculates estimated reading time for each article
- **Responsive design**: Mobile-optimized with grid layouts
- **Skeleton loaders**: Smooth loading states while fetching content

---

## Tech Stack

### Frontend
- **Next.js 15** — React framework with App Router
- **TypeScript** — Type-safe development (targeting ES2018+)
- **Tailwind CSS v4** — Utility-first styling
- **shadcn/ui** — Pre-built accessible Radix UI components
- **Lucide React** — Icon library

### Backend
- **Next.js API Routes** — Server-side endpoints (`/api/news`)
- **Vercel AI SDK** — AI integration framework (`ai` v6)

### AI & Data
- **Groq AI** (`@ai-sdk/groq`) — Ultra-fast LLM inference via Llama 3.1 8B Instant
- **NewsAPI.org** — News aggregation from 80,000+ sources

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- NewsAPI.org API key — free at [newsapi.org/register](https://newsapi.org/register)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sidd0605/NewsLens-AI.git
   cd NewsLens-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEWS_API_KEY=your_newsapi_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** at [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── news/
│   │       └── route.ts      # News fetching + Groq AI processing
│   ├── globals.css           # Global styles and Tailwind config
│   ├── layout.tsx            # Root layout with metadata
│   ├── loading.tsx           # Loading state component
│   └── page.tsx              # Main news page (client component)
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── theme-provider.tsx    # next-themes dark/light mode
├── lib/
│   └── utils.ts              # clsx + tailwind-merge utility
├── tsconfig.json             # TypeScript config (ES2018 target)
└── README.md
```

---

## API Architecture

### `/api/news` Route

The server-side API route handles all backend logic:

1. **News Fetching** — Calls NewsAPI.org with the API key securely stored server-side
2. **Smart Organization** — On the default feed, ensures one headline per source before showing extras
3. **AI Processing** — Sends each article to Groq for summarization and sentiment analysis
4. **Rate Limiting** — Sequential processing with delays to respect API rate limits
5. **Translation** — Optional language detection and translation via the same LLM

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `category` | string | News category filter |
| `page` | number | Pagination page number |
| `translate` | boolean | Enable auto-translation |

---

## AI Integration Details

### Groq Provider Setup

This project uses the `@ai-sdk/groq` provider package with Vercel AI SDK v6:

```typescript
import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

const { text } = await generateText({
  model: groq("llama-3.1-8b-instant"),
  prompt: "...",
  maxOutputTokens: 150,
})
```

### Prompt Engineering

Structured prompts enforce a consistent, parseable LLM output format:

```
Analyze this news article and provide:
1. A 2-3 sentence summary focusing on key facts
2. The overall sentiment (Positive, Negative, or Neutral)

Format your response as:
SUMMARY: [your summary here]
SENTIMENT: [Positive/Negative/Neutral]
```

### Response Parsing

Regex with the ES2018 dotAll (`/s`) flag parses multi-line LLM responses reliably:

```typescript
const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=SENTIMENT:|$)/s)
const sentimentMatch = response.match(/SENTIMENT:\s*(\w+)/)
```

### Rate Limit Handling

- **Retry logic** — up to 2 retries per article
- **2-second delay** between each article's AI call
- **3-second backoff** if a rate-limit error is detected
- **Graceful degradation** — returns fallback text instead of crashing

---

## Deployment

This project is deployed on Vercel: **[https://newslens-ai-ten.vercel.app](https://newslens-ai-ten.vercel.app)**

### Deploy Your Own

1. Push your code to GitHub
2. Import the repository at [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `NEWS_API_KEY`
   - `GROQ_API_KEY`
4. Deploy

Or use the Vercel CLI:
```bash
npm install -g vercel
vercel --prod
```

> **Note**: NewsAPI.org free tier only works on `localhost`. For a production deployment with live news, upgrade to a paid NewsAPI plan or use an alternative like [GNews](https://gnews.io) or [TheNewsAPI](https://www.thenewsapi.com).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | Yes | API key from [newsapi.org](https://newsapi.org) |
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Acknowledgments

- [NewsAPI.org](https://newsapi.org) for news data
- [Groq](https://groq.com) for fast LLM inference
- [Vercel](https://vercel.com) for hosting and AI SDK
- [shadcn/ui](https://ui.shadcn.com) for beautiful accessible components
