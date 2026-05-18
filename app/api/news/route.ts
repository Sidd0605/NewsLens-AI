import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const NEWS_SOURCES = [
  { id: "cnn", name: "CNN" },
  { id: "bbc-news", name: "BBC News" },
  { id: "the-washington-post", name: "Washington Post" },
  { id: "nbc-news", name: "NBC News" },
  { id: "the-new-york-times", name: "New York Times" },
  { id: "reuters", name: "Reuters" },
  { id: "associated-press", name: "Associated Press" },
  { id: "abc-news", name: "ABC News" },
]

const NEWS_CATEGORIES = ["business", "entertainment", "general", "health", "science", "sports", "technology"]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

async function generateSummaryWithRetry(article: any, maxRetries = 2): Promise<{ summary: string; sentiment: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { text: response } = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `Analyze this news article and provide:
1. A 2-3 sentence summary focusing on key facts
2. The overall sentiment (Positive, Negative, or Neutral)

Format your response as:
SUMMARY: [your summary here]
SENTIMENT: [Positive/Negative/Neutral]

Title: ${article.title}
Description: ${article.description || "No description available"}`,
        maxOutputTokens: 150,
      })

      const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=SENTIMENT:|$)/s)
      const sentimentMatch = response.match(/SENTIMENT:\s*(\w+)/)

      const summary = summaryMatch ? summaryMatch[1].trim() : response.trim()
      const sentiment = sentimentMatch ? sentimentMatch[1].trim() : "Neutral"

      return { summary, sentiment }
    } catch (error: any) {
      console.error(`Summary attempt ${attempt + 1} failed:`, error.message)

      if (error.message?.includes("Rate limit")) {
        await delay(3000)
      } else if (attempt < maxRetries - 1) {
        await delay(1000)
      }
    }
  }
  return { summary: "Summary unavailable due to rate limits", sentiment: "Neutral" }
}

async function translateArticle(
  article: any,
): Promise<{ translatedTitle: string; translatedDescription: string; originalLanguage: string }> {
  try {
    const { text: response } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `Analyze this article and determine if it's in English. If not, translate it to English and identify the original language.

Format your response as:
LANGUAGE: [detected language or "English"]
TITLE: [translated title or original if English]
DESCRIPTION: [translated description or original if English]

Title: ${article.title}
Description: ${article.description || "No description available"}`,
      maxOutputTokens: 200,
    })

    const languageMatch = response.match(/LANGUAGE:\s*(.+?)(?=TITLE:|$)/s)
    const titleMatch = response.match(/TITLE:\s*(.+?)(?=DESCRIPTION:|$)/s)
    const descriptionMatch = response.match(/DESCRIPTION:\s*(.+?)$/s)

    const originalLanguage = languageMatch ? languageMatch[1].trim() : "English"
    const translatedTitle = titleMatch ? titleMatch[1].trim() : article.title
    const translatedDescription = descriptionMatch ? descriptionMatch[1].trim() : article.description

    return { translatedTitle, translatedDescription, originalLanguage }
  } catch (error) {
    console.error("Translation failed:", error)
    return {
      translatedTitle: article.title,
      translatedDescription: article.description,
      originalLanguage: "English",
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const category = searchParams.get("category")
    const translate = searchParams.get("translate") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = 15

    const apiKey = process.env.NEWS_API_KEY

    if (!apiKey || apiKey.length < 20) {
      return NextResponse.json(
        { error: "News API key not found. Please add NEWS_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    let apiUrl = ""

    if (query) {
      apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${pageSize}&page=${page}`
    } else if (category && category !== "all") {
      apiUrl = `https://newsapi.org/v2/top-headlines?category=${category}&country=us&pageSize=${pageSize}&page=${page}`
    } else {
      const sourceIds = NEWS_SOURCES.map((source) => source.id).join(",")
      const sourcesPageSize = page === 1 ? 50 : 30
      apiUrl = `https://newsapi.org/v2/top-headlines?sources=${sourceIds}&pageSize=${sourcesPageSize}&page=${page}`
    }

    try {
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "NewsApp/1.0",
          "X-Api-Key": apiKey,
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error(`NewsAPI error: ${response.status} - ${responseText}`)
        return NextResponse.json(
          {
            error: `NewsAPI error: ${response.status}. ${responseText.includes("Too Many") ? "Rate limit exceeded. Please try again later." : "Failed to fetch news."}`,
          },
          { status: response.status },
        )
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse NewsAPI response:", responseText)
        return NextResponse.json({ error: "Invalid response from NewsAPI. Please try again later." }, { status: 500 })
      }

      if (data.status !== "ok" || !data.articles || data.articles.length === 0) {
        return NextResponse.json({ error: "No articles found or API error" }, { status: 404 })
      }

      let organizedArticles = []
      let firstHeadlinesCount = 0

      if (query || (category && category !== "all")) {
        organizedArticles = data.articles
      } else {
        if (page === 1) {
          const articlesBySource = new Map()
          const firstHeadlines: any[] = []
          const remainingHeadlines: any[] = []

          data.articles.forEach((article: any) => {
            const sourceId = article.source?.id
            if (!articlesBySource.has(sourceId)) {
              articlesBySource.set(sourceId, [])
            }
            articlesBySource.get(sourceId).push(article)
          })

          NEWS_SOURCES.forEach((source) => {
            const sourceArticles = articlesBySource.get(source.id)
            if (sourceArticles && sourceArticles.length > 0) {
              firstHeadlines.push(sourceArticles[0])
              if (sourceArticles.length > 1) {
                remainingHeadlines.push(...sourceArticles.slice(1))
              }
            }
          })

          organizedArticles = [...firstHeadlines, ...remainingHeadlines.slice(0, 7)]
          firstHeadlinesCount = firstHeadlines.length
        } else {
          organizedArticles = data.articles
        }
      }

      const articlesWithSummaries = []

      for (let i = 0; i < organizedArticles.length; i++) {
        const article = organizedArticles[i]

        if (i > 0) {
          await delay(2000)
        }

        let processedArticle = { ...article }
        if (translate) {
          const { translatedTitle, translatedDescription, originalLanguage } = await translateArticle(article)
          processedArticle = {
            ...article,
            title: translatedTitle,
            description: translatedDescription,
            originalTitle: article.title,
            originalDescription: article.description,
            originalLanguage: originalLanguage,
            isTranslated: originalLanguage !== "English",
          }
          await delay(1000)
        }

        const { summary, sentiment } = await generateSummaryWithRetry(processedArticle)

        articlesWithSummaries.push({
          ...processedArticle,
          aiSummary: summary,
          sentiment: sentiment,
        })
      }

      return NextResponse.json({
        status: "ok",
        articles: articlesWithSummaries,
        totalResults: data.totalResults || articlesWithSummaries.length,
        firstHeadlinesCount: firstHeadlinesCount,
        query: query,
        category: category,
        translate: translate,
        page: page,
        hasMore: data.totalResults ? page * pageSize < data.totalResults : articlesWithSummaries.length === pageSize,
      })
    } catch (fetchError) {
      console.error("Error fetching from NewsAPI:", fetchError)
      return NextResponse.json(
        { error: "Failed to connect to NewsAPI. Please check your internet connection and try again." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("News API error:", error)
    return NextResponse.json({ error: "An error occurred while fetching news" }, { status: 500 })
  }
}
