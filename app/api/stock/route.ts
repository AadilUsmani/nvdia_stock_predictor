import { NextResponse } from "next/server"
import type { StockPrice, HistoricalData } from "@/lib/stock-api" // Import types only

// API Configuration - now accessed directly from process.env
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
const RAPIDAPI_YAHOO_URL = "https://yahoo-finance15.p.rapidapi.com/api/yahoo"

// Caching mechanism (in-memory, per serverless function invocation)
interface CacheEntry {
  data: any
  timestamp: number
  source: string
}

const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const API_CALL_DELAY = 500 // 500ms between API calls to respect rate limits

// Rate limiting (in-memory, per serverless function invocation)
let lastApiCall = 0
let apiCallCount = 0
const MAX_CALLS_PER_MINUTE = 5
const API_CALL_TIMEOUT = 8000 // 8 second timeout per API call
const TOTAL_REQUEST_TIMEOUT = 15000 // 15 second total timeout for all providers

// Utility function to add delay between API calls
async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now()
  const timeSinceLastCall = now - lastApiCall

  // Reset counter every minute
  if (timeSinceLastCall > 60000) {
    apiCallCount = 0
  }

  // Check rate limit
  if (apiCallCount >= MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - timeSinceLastCall
    console.log(`Rate limit reached. Waiting ${waitTime}ms...`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    apiCallCount = 0
  }

  // Add delay between calls
  if (timeSinceLastCall < API_CALL_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, API_CALL_DELAY - timeSinceLastCall))
  }

  lastApiCall = Date.now()
  apiCallCount++

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

// Exponential backoff retry mechanism
async function fetchWithRetry(url: string, options?: RequestInit, retries = 2, delay = 800): Promise<Response> {
  try {
    const response = await rateLimitedFetch(url, options)

    // Fail fast on permission errors and not found - these won't be fixed by retrying
    if (response.status === 403 || response.status === 404) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.ok && response.status === 429) {
      throw new Error("Rate limited")
    }
    return response
  } catch (error) {
    if (retries <= 0) throw error

    console.warn(`API call failed, retrying in ${delay}ms... (${retries} retries left)`)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return fetchWithRetry(url, options, retries - 1, delay * 1.5)
  }
}

// Check cache
function getCachedData(key: string): any | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached data from ${cached.source}`)
    return cached.data
  }
  return null
}

// Set cache
function setCachedData(key: string, data: any, source: string): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    source,
  })
}

// Finnhub API implementation
async function fetchFromFinnhub(): Promise<StockPrice> {
  if (!FINNHUB_API_KEY) {
    throw new Error("Finnhub API key not configured")
  }

  const cached = getCachedData("finnhub-nvda")
  if (cached) return cached

  try {
    console.log("Fetching from Finnhub API...")

    // Get current quote
    const quoteResponse = await fetchWithRetry(`${FINNHUB_BASE_URL}/quote?symbol=NVDA&token=${FINNHUB_API_KEY}`)
    const quoteData = await quoteResponse.json()

    if (quoteData.error) {
      throw new Error(`Finnhub API error: ${quoteData.error}`)
    }

    // Get company profile for additional data
    const profileResponse = await fetchWithRetry(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=NVDA&token=${FINNHUB_API_KEY}`,
    )
    const profileData = await profileResponse.json()

    const currentPrice = quoteData.c || 0
    const previousClose = quoteData.pc || 0
    const change = quoteData.d || 0
    const changePercent = quoteData.dp || 0

    const result: StockPrice = {
      symbol: "NVDA",
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: Math.round((quoteData.o || currentPrice) * 100) / 100,
      high: Math.round((quoteData.h || currentPrice) * 100) / 100,
      low: Math.round((quoteData.l || currentPrice) * 100) / 100,
      volume: quoteData.v || 0,
      marketCap: profileData.marketCapitalization || undefined,
      timestamp: new Date().toISOString(),
      source: "Finnhub",
    }

    setCachedData("finnhub-nvda", result, "Finnhub")
    return result
  } catch (error) {
    console.error("Finnhub API failed:", error)
    throw error
  }
}

// Alpha Vantage API implementation
async function fetchFromAlphaVantage(): Promise<StockPrice> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Alpha Vantage API key not configured")
  }

  const cached = getCachedData("alphavantage-nvda")
  if (cached) return cached

  try {
    console.log("Fetching from Alpha Vantage API...")

    const response = await fetchWithRetry(
      `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${ALPHA_VANTAGE_API_KEY}`,
    )
    const data = await response.json()

    if (data.Note) {
      throw new Error("Alpha Vantage rate limit exceeded")
    }

    if (data.Information) {
      throw new Error(`Alpha Vantage API error: ${data.Information}`)
    }

    if (!data["Global Quote"]) {
      throw new Error("Invalid response from Alpha Vantage")
    }

    const quote = data["Global Quote"]
    const currentPrice = Number.parseFloat(quote["05. price"])
    const change = Number.parseFloat(quote["09. change"])
    const changePercent = Number.parseFloat(quote["10. change percent"].replace("%", ""))

    const result: StockPrice = {
      symbol: "NVDA",
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round((currentPrice - change) * 100) / 100,
      open: Number.parseFloat(quote["02. open"]),
      high: Number.parseFloat(quote["03. high"]),
      low: Number.parseFloat(quote["04. low"]),
      volume: Number.parseInt(quote["06. volume"]),
      timestamp: new Date().toISOString(),
      source: "Alpha Vantage",
    }

    setCachedData("alphavantage-nvda", result, "Alpha Vantage")
    return result
  } catch (error) {
    console.error("Alpha Vantage API failed:", error)
    throw error
  }
}

// RapidAPI Yahoo Finance implementation
async function fetchFromRapidAPIYahoo(): Promise<StockPrice> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RapidAPI key not configured")
  }

  const cached = getCachedData("rapidapi-yahoo-nvda")
  if (cached) return cached

  try {
    console.log("Fetching from RapidAPI Yahoo Finance...")

    const response = await fetchWithRetry(`${RAPIDAPI_YAHOO_URL}/qu/quote/NVDA`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
      },
    })
    const data = await response.json()

    if (!data || data.error) {
      throw new Error("Invalid response from RapidAPI Yahoo Finance")
    }

    const currentPrice = data.regularMarketPrice || data.price
    const previousClose = data.regularMarketPreviousClose || data.previousClose
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    const result: StockPrice = {
      symbol: "NVDA",
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: data.regularMarketOpen || currentPrice,
      high: data.regularMarketDayHigh || currentPrice,
      low: data.regularMarketDayLow || currentPrice,
      volume: data.regularMarketVolume || 0,
      marketCap: data.marketCap || undefined,
      timestamp: new Date().toISOString(),
      source: "RapidAPI Yahoo Finance",
    }

    setCachedData("rapidapi-yahoo-nvda", result, "RapidAPI Yahoo Finance")
    return result
  } catch (error) {
    console.error("RapidAPI Yahoo Finance failed:", error)
    throw error
  }
}

// Generate realistic mock data as final fallback
function generateMockData(): StockPrice {
  console.log("Using mock data fallback...")

  const basePrice = 875 + (Math.random() - 0.5) * 50
  const change = (Math.random() - 0.5) * 20
  const changePercent = (change / basePrice) * 100

  return {
    symbol: "NVDA",
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    previousClose: Math.round((basePrice - change) * 100) / 100,
    open: Math.round((basePrice + (Math.random() - 0.5) * 10) * 100) / 100,
    high: Math.round((basePrice + Math.random() * 15) * 100) / 100,
    low: Math.round((basePrice - Math.random() * 15) * 100) / 100,
    volume: Math.floor(Math.random() * 50000000) + 20000000,
    timestamp: new Date().toISOString(),
    source: "Mock Data",
  }
}

// Main function with multiple provider fallback
export async function fetchNVIDIAStockServer(): Promise<StockPrice> {
  const startTime = Date.now()
  const providers = [
    { name: "Finnhub", fetch: fetchFromFinnhub },
    { name: "Alpha Vantage", fetch: fetchFromAlphaVantage },
    { name: "RapidAPI Yahoo Finance", fetch: fetchFromRapidAPIYahoo },
  ]

  for (const provider of providers) {
    try {
      if (Date.now() - startTime > TOTAL_REQUEST_TIMEOUT) {
        console.warn("Total request timeout exceeded, using mock data")
        break
      }

      console.log(`Attempting to fetch from ${provider.name}...`)
      const result = await provider.fetch()
      console.log(`✅ Successfully fetched from ${provider.name}`)
      return result
    } catch (error) {
      console.warn(`❌ ${provider.name} failed:`, (error as Error).message)
      continue
    }
  }

  console.warn("All API providers failed, using mock data")
  return generateMockData()
}

// Generate mock historical data relative to a reference price
function generateMockHistoricalData(days: number, referencePrice: number): HistoricalData[] {
  console.log(`Generating mock historical data with reference price: ${referencePrice}`)
  const mockData: HistoricalData[] = []
  const volatilityFactor = 0.02 // 2% daily volatility for mock data

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Base price for the day, fluctuating around the reference price
    const basePrice = referencePrice * (1 + ((Math.random() - 0.5) * volatilityFactor * (days - i)) / days)
    const dailyVariation = (Math.random() - 0.5) * referencePrice * 0.01 // 1% daily variation

    const open = basePrice + dailyVariation
    const close = open + (Math.random() - 0.5) * referencePrice * 0.005 // 0.5% close variation
    const high = Math.max(open, close) + Math.random() * referencePrice * 0.002
    const low = Math.min(open, close) - Math.random() * referencePrice * 0.002

    mockData.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 30000000) + 20000000,
    })
  }

  return mockData
}

// Enhanced historical data fetching
export async function fetchHistoricalDataServer(days = 30, currentPrice?: number): Promise<HistoricalData[]> {
  const startTime = Date.now()
  const cacheKey = `historical-${days}-${currentPrice || "no-ref"}` // Include currentPrice in cache key
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  // Try Alpha Vantage for historical data
  if (ALPHA_VANTAGE_API_KEY) {
    try {
      if (Date.now() - startTime > TOTAL_REQUEST_TIMEOUT * 0.6) {
        console.warn("Timeout threshold reached for historical data, skipping Alpha Vantage")
      } else {
        console.log("Fetching historical data from Alpha Vantage...")

        const response = await fetchWithRetry(
          `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=NVDA&apikey=${ALPHA_VANTAGE_API_KEY}`,
        )
        const data = await response.json()

        if (data["Time Series (Daily)"]) {
          const timeSeries = data["Time Series (Daily)"]
          const historicalData: HistoricalData[] = Object.entries(timeSeries)
            .slice(0, days)
            .map(([date, values]: [string, any]) => ({
              date,
              open: Number.parseFloat(values["1. open"]),
              high: Number.parseFloat(values["2. high"]),
              low: Number.parseFloat(values["3. low"]),
              close: Number.parseFloat(values["4. close"]),
              volume: Number.parseInt(values["5. volume"]),
            }))
            .reverse()

          setCachedData(cacheKey, historicalData, "Alpha Vantage")
          console.log(`✅ Successfully fetched ${historicalData.length} days of historical data from Alpha Vantage`)
          return historicalData
        } else {
          throw new Error("Alpha Vantage returned empty or malformed data")
        }
      }
    } catch (error) {
      console.warn(`❌ Alpha Vantage historical data failed:`, (error as Error).message)
      // Continue to mock data generation
    }
  }

  // Generate mock historical data as final fallback, using currentPrice if available
  console.log("Generating mock historical data as final fallback...")
  const mockData = generateMockHistoricalData(days, currentPrice || 875)
  setCachedData(cacheKey, mockData, "Mock Data")
  return mockData
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const days = searchParams.get("days") ? Number.parseInt(searchParams.get("days")!) : 30

  try {
    if (type === "current") {
      const stockPrice = await fetchNVIDIAStockServer()
      return NextResponse.json(stockPrice)
    } else if (type === "historical") {
      // Fetch current price first to use as reference for mock historical data if needed
      const stockPrice = await fetchNVIDIAStockServer()
      const historicalData = await fetchHistoricalDataServer(days, stockPrice.price)
      return NextResponse.json(historicalData)
    } else {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
    }
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
