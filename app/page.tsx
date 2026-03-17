"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Share2,
  Bookmark,
  BookmarkCheck,
  Languages,
  Timer,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  ChevronDown,
} from "lucide-react"

interface Article {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
  aiSummary?: string
  sentiment?: string
  originalTitle?: string
  originalDescription?: string
  originalLanguage?: string
  isTranslated?: boolean
}

interface NewsResponse {
  articles: Article[]
  status: string
  totalResults: number
  firstHeadlinesCount?: number
  query?: string
  category?: string
  translate?: boolean
  hasMore?: boolean
}

const NEWS_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "business", label: "Business" },
  { value: "entertainment", label: "Entertainment" },
  { value: "general", label: "General" },
  { value: "health", label: "Health" },
  { value: "science", label: "Science" },
  { value: "sports", label: "Sports" },
  { value: "technology", label: "Technology" },
]

export default function NewsApp() {
  const [articles, setArticles] = useState<Article[]>([])
  const [firstHeadlinesCount, setFirstHeadlinesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentQuery, setCurrentQuery] = useState("")
  const [currentCategory, setCurrentCategory] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [translateEnabled, setTranslateEnabled] = useState(false)
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set())
  const [viewingBookmarks, setViewingBookmarks] = useState(false)
  const [bookmarkedArticleData, setBookmarkedArticleData] = useState<Article[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked-articles")
    if (saved) {
      setBookmarkedArticles(new Set(JSON.parse(saved)))
    }
    const savedArticleData = localStorage.getItem("bookmarked-articles-data")
    if (savedArticleData) {
      setBookmarkedArticleData(JSON.parse(savedArticleData))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("bookmarked-articles", JSON.stringify([...bookmarkedArticles]))
  }, [bookmarkedArticles])

  useEffect(() => {
    localStorage.setItem("bookmarked-articles-data", JSON.stringify(bookmarkedArticleData))
  }, [bookmarkedArticleData])

  const fetchNews = useCallback(
    async (query?: string, category?: string, translate?: boolean, page = 1, append = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      try {
        let url = "/api/news"
        const params = new URLSearchParams()

        if (query) params.append("q", query)
        if (category && category !== "all") params.append("category", category)
        if (translate) params.append("translate", "true")
        if (page > 1) params.append("page", page.toString())

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data: NewsResponse = await response.json()

        if (append && page > 1) {
          setArticles((prev) => [...prev, ...data.articles])
        } else {
          setArticles(data.articles)
          setFirstHeadlinesCount(data.firstHeadlinesCount || 0)
        }

        setHasMore(data.hasMore || false)
        setCurrentPage(page)
        setCurrentQuery(data.query || "")
        setCurrentCategory(data.category || "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching news")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [],
  )

  const loadMoreArticles = () => {
    const nextPage = currentPage + 1
    fetchNews(currentQuery, currentCategory, translateEnabled, nextPage, true)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchNews(searchQuery, selectedCategory, translateEnabled)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    fetchNews(searchQuery, category, translateEnabled)
  }

  const handleTranslateToggle = () => {
    const newTranslateState = !translateEnabled
    setTranslateEnabled(newTranslateState)
    setCurrentPage(1)
    fetchNews(currentQuery, currentCategory, newTranslateState)
  }

  const toggleBookmark = (articleUrl: string) => {
    const newBookmarks = new Set(bookmarkedArticles)
    if (newBookmarks.has(articleUrl)) {
      newBookmarks.delete(articleUrl)
      setBookmarkedArticleData((prev) => prev.filter((article) => article.url !== articleUrl))
    } else {
      newBookmarks.add(articleUrl)
      const articleToSave = articles.find((article) => article.url === articleUrl)
      if (articleToSave) {
        setBookmarkedArticleData((prev) => [...prev, articleToSave])
      }
    }
    setBookmarkedArticles(newBookmarks)
  }

  const estimateReadingTime = (title: string, description: string): number => {
    const wordsPerMinute = 200
    const wordCount = (title + " " + (description || "")).split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  const shareArticle = async (article: Article, platform?: string) => {
    const shareData = {
      title: article.title,
      text: article.aiSummary || article.description || "",
      url: article.url,
    }

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(`${article.title}\n${article.url}`)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    } else if (platform === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.url)}`
      window.open(twitterUrl, "_blank")
    } else if (platform === "facebook") {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}`
      window.open(facebookUrl, "_blank")
    } else if (platform === "linkedin") {
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`
      window.open(linkedinUrl, "_blank")
    } else if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error("Error sharing:", err)
      }
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        setCurrentPage(1)
        fetchNews(currentQuery, currentCategory, translateEnabled)
      }, 300000) // Refresh every 5 minutes
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, currentQuery, currentCategory, translateEnabled, fetchNews])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "text-green-700 dark:text-green-300"
      case "negative":
        return "text-red-700 dark:text-red-300"
      default:
        return "text-gray-700 dark:text-gray-300"
    }
  }

  const ArticleCard = ({
    article,
    index,
    isPriority = false,
  }: { article: Article; index: number; isPriority?: boolean }) => {
    const readingTime = estimateReadingTime(article.title, article.description || "")
    const isBookmarked = bookmarkedArticles.has(article.url)

    return (
      <Card
        key={`${isPriority ? "first" : "remaining"}-${index}`}
        className={`hover:shadow-lg transition-shadow h-full flex flex-col ${isPriority ? "border-primary/20" : ""}`}
      >
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight mb-2 line-clamp-3">
                {article.title}
                {article.isTranslated && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Languages className="w-3 h-3 mr-1" />
                    Translated from {article.originalLanguage}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Badge variant={isPriority ? "default" : "secondary"} className="text-xs">
                  {article.source.name}
                </Badge>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{formatDate(article.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  <span className="text-xs">{readingTime} min read</span>
                </div>
              </div>
            </div>
            {article.urlToImage && (
              <img
                src={article.urlToImage || "/placeholder.svg"}
                alt={article.title}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {article.aiSummary && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI Summary</span>
                </div>
                {article.sentiment && (
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(article.sentiment)}
                    <span className={`text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
                      {article.sentiment}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{article.aiSummary}</p>
            </div>
          )}
          {article.description && (
            <CardDescription className="text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
              {article.description}
            </CardDescription>
          )}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Read Full Article
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => toggleBookmark(article.url)} className="p-2">
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-blue-600" /> : <Bookmark className="w-4 h-4" />}
              </Button>
              <div className="relative group">
                <Button variant="ghost" size="sm" className="p-2">
                  <Share2 className="w-4 h-4" />
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => shareArticle(article, "copy")} className="p-2">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => shareArticle(article, "twitter")} className="p-2">
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => shareArticle(article, "facebook")} className="p-2">
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => shareArticle(article, "linkedin")} className="p-2">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getDisplayArticles = () => {
    if (viewingBookmarks) {
      return bookmarkedArticleData
    }
    return articles
  }

  const getDisplayCount = () => {
    if (viewingBookmarks) {
      return 0
    }
    return firstHeadlinesCount
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">NewsLens AI</h1>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchNews()} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
            {error.includes("NEWS_API_KEY") && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-left max-w-2xl mx-auto">
                <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Get a free API key from{" "}
                    <a
                      href="https://newsapi.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      NewsAPI.org
                    </a>
                  </li>
                  <li>
                    Add it as an environment variable:{" "}
                    <code className="bg-background px-2 py-1 rounded">NEWS_API_KEY=your_api_key_here</code>
                  </li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const displayArticles = getDisplayArticles()
  const displayFirstHeadlinesCount = getDisplayCount()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NewsLens AI
                </span>
                {viewingBookmarks ? " - My Bookmarks" : ""}
              </h1>
              <p className="text-muted-foreground">
                {viewingBookmarks
                  ? `${bookmarkedArticleData.length} saved articles`
                  : currentQuery
                    ? `Search results for "${currentQuery}"`
                    : currentCategory
                      ? `${NEWS_CATEGORIES.find((c) => c.value === currentCategory)?.label} news`
                      : "AI-powered news aggregation with smart summaries and sentiment analysis"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewingBookmarks(!viewingBookmarks)}
                variant={viewingBookmarks ? "default" : "outline"}
                size="sm"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {viewingBookmarks ? "Show All News" : `Bookmarks (${bookmarkedArticles.size})`}
              </Button>
              {!viewingBookmarks && (
                <>
                  <Button onClick={handleTranslateToggle} variant={translateEnabled ? "default" : "outline"} size="sm">
                    <Languages className="w-4 h-4 mr-2" />
                    Translate {translateEnabled ? "ON" : "OFF"}
                  </Button>
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Auto-refresh {autoRefresh ? "ON" : "OFF"}
                  </Button>
                  <Button
                    onClick={() => fetchNews(currentQuery, currentCategory, translateEnabled)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </>
              )}
            </div>
          </div>

          {!viewingBookmarks && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search for topics, keywords, or events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {loading && !viewingBookmarks ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {displayArticles.length > 0 ? (
              <>
                {displayFirstHeadlinesCount > 0 && !currentQuery && !currentCategory && !viewingBookmarks && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-primary">Top Headlines from Each Source</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {displayArticles.slice(0, displayFirstHeadlinesCount).map((article, index) => (
                        <ArticleCard key={`first-${index}`} article={article} index={index} isPriority={true} />
                      ))}
                    </div>
                  </div>
                )}

                {(displayArticles.length > displayFirstHeadlinesCount ||
                  currentQuery ||
                  currentCategory ||
                  viewingBookmarks) && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      {viewingBookmarks
                        ? "Your Saved Articles"
                        : currentQuery || currentCategory
                          ? "Search Results"
                          : "More Headlines"}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {(currentQuery || currentCategory || viewingBookmarks
                        ? displayArticles
                        : displayArticles.slice(displayFirstHeadlinesCount)
                      ).map((article, index) => (
                        <ArticleCard
                          key={`${viewingBookmarks ? "bookmark" : "remaining"}-${index}`}
                          article={article}
                          index={index}
                          isPriority={false}
                        />
                      ))}
                    </div>

                    {!viewingBookmarks && hasMore && (
                      <div className="flex justify-center mt-8">
                        <Button
                          onClick={loadMoreArticles}
                          disabled={loadingMore}
                          variant="outline"
                          size="lg"
                          className="min-w-[200px] bg-transparent"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading More...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Load More Articles
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  {viewingBookmarks ? (
                    <>
                      <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Bookmarked Articles</h3>
                      <p className="text-muted-foreground mb-4">
                        Start bookmarking articles you want to read later by clicking the bookmark icon on any article.
                      </p>
                      <Button onClick={() => setViewingBookmarks(false)} variant="outline">
                        Browse News Articles
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      {currentQuery ? `No articles found for "${currentQuery}"` : "No articles found."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
