# NewsLens AI

An intelligent news aggregation platform that combines real-time news gathering with AI-powered analysis to provide users with a comprehensive, enhanced news reading experience.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css)
![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=flat-square)

## Features

### News Aggregation
- **Multi-source fetching**: Aggregates news from 8 major sources (CNN, BBC News, Washington Post, NBC News, New York Times, Reuters, Associated Press, ABC News)
- **Smart organization**: Displays one headline from each source first, then remaining articles
- **Real-time updates**: Auto-refresh functionality every 5 minutes
- **Load more articles**: Pagination system for discovering additional content

### AI-Powered Features
- **Article summarization**: Uses Groq's Llama 3.1 8B Instant model to generate concise 2-3 sentence summaries
- **Sentiment analysis**: AI determines if articles are positive, negative, or neutral with visual indicators
- **Language translation**: Automatically detects and translates non-English articles to English

### Search & Filtering
- **Keyword search**: Search across all articles for specific topics
- **Category filtering**: Filter by Business, Technology, Sports, Health, Entertainment, Science, and General news

### User Experience
- **Bookmarking system**: Save articles with persistent local storage
- **Bookmarks view**: Dedicated section to view and manage saved articles
- **Share functionality**: Share articles via social media, email, or copy links
- **Reading time estimation**: Calculates estimated reading time for each article
- **Responsive design**: Mobile-optimized with grid layouts

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Vercel AI SDK** - AI integration framework

### External APIs
- **NewsAPI.org** - News aggregation service
- **Groq AI** - LLM for summarization, sentiment analysis, and translation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- NewsAPI.org API key (free at [newsapi.org](https://newsapi.org/register))
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/newslens-ai.git
   cd newslens-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
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
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── news/
│   │       └── route.ts      # News fetching and AI processing API
│   ├── globals.css           # Global styles and Tailwind config
│   ├── layout.tsx            # Root layout with metadata
│   ├── loading.tsx           # Loading state component
│   └── page.tsx              # Main news page component
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   └── utils.ts              # Utility functions
└── README.md
```

## API Architecture

### `/api/news` Route

The server-side API route handles:

1. **News Fetching**: Calls NewsAPI.org with the API key securely stored server-side
2. **AI Processing**: Sends each article to Groq for summarization and sentiment analysis
3. **Rate Limiting**: Sequential processing with delays to respect API limits
4. **Translation**: Optional language detection and translation

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `category` | string | News category filter |
| `page` | number | Pagination page number |
| `translate` | boolean | Enable translation |

## AI Integration Details

### Prompt Engineering

The project uses structured prompts for reliable, parseable LLM outputs:

```
Analyze this news article and provide:
1. A 2-3 sentence summary focusing on key facts
2. The overall sentiment (Positive, Negative, or Neutral)

Format your response as:
SUMMARY: [your summary here]
SENTIMENT: [Positive/Negative/Neutral]
```

### Response Parsing

Regex extraction ensures consistent data:
```typescript
const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=SENTIMENT:|$)/s)
const sentimentMatch = response.match(/SENTIMENT:\s*(\w+)/)
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEWS_API_KEY`
   - `GROQ_API_KEY`
4. Deploy

**Note**: NewsAPI.org free tier only works on localhost. For production, upgrade to a paid plan or use an alternative news API.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | Yes | API key from NewsAPI.org |
| `GROQ_API_KEY` | Yes | API key from Groq |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NewsAPI.org](https://newsapi.org) for news data
- [Groq](https://groq.com) for fast LLM inference
- [Vercel](https://vercel.com) for hosting and AI SDK
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
