// Stock data fetching utilities - now ONLY contains types
export interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  high: number
  low: number
  volume: number
  marketCap?: number
  timestamp: string
  source: string
}

export interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// API Configuration
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
const RAPIDAPI_YAHOO_URL = "https://yahoo-finance15.p.rapidapi.com/api/yahoo"

// Caching mechanism
interface CacheEntry {
  data: any
  timestamp: number
  source: string
}

const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const API_CALL_DELAY = 1000 // 1 second between API calls to respect rate limits

// Rate limiting
let lastApiCall = 0
let apiCallCount = 0
const MAX_CALLS_PER_MINUTE = 5

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

  return fetch(url, options)
}

// Exponential backoff retry mechanism
async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await rateLimitedFetch(url, options)
    if (!response.ok && response.status === 429) {
      throw new Error("Rate limited")
    }
    return response
  } catch (error) {
    if (retries <= 0) throw error

    console.warn(`API call failed, retrying in ${delay}ms... (${retries} retries left)`)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return fetchWithRetry(url, options, retries - 1, delay * 2)
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

// Main function with multiple provider fallback
export async function fetchNVIDIAStock(): Promise<StockPrice> {
  const providers = [
    { name: "Finnhub", fetch: fetchFromFinnhub },
    { name: "Alpha Vantage", fetch: fetchFromAlphaVantage },
    { name: "RapidAPI Yahoo Finance", fetch: fetchFromRapidAPIYahoo },
  ]

  for (const provider of providers) {
    try {
      console.log(`Attempting to fetch from ${provider.name}...`)
      const result = await provider.fetch()
      console.log(`✅ Successfully fetched from ${provider.name}`)
      return result
    } catch (error) {
      console.warn(`❌ ${provider.name} failed:`, error.message)
      continue
    }
  }

  console.warn("All API providers failed, using mock data")
  return generateMockData()
}

// Mock data generation function
function generateMockData(): StockPrice {
  const currentPrice = 875
  const change = 5
  const changePercent = (change / currentPrice) * 100
  const previousClose = currentPrice - change

  return {
    symbol: "NVDA",
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    open: Math.round((currentPrice - 10) * 100) / 100,
    high: Math.round((currentPrice + 10) * 100) / 100,
    low: Math.round((currentPrice - 20) * 100) / 100,
    volume: Math.floor(Math.random() * 30000000) + 20000000,
    timestamp: new Date().toISOString(),
    source: "Mock Data",
  }
}

// Enhanced historical data fetching
export async function fetchHistoricalData(days = 30): Promise<HistoricalData[]> {
  const cacheKey = `historical-${days}`
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  // Try Finnhub first for historical data
  if (FINNHUB_API_KEY) {
    try {
      console.log("Fetching historical data from Finnhub...")

      const to = Math.floor(Date.now() / 1000)
      const from = to - days * 24 * 60 * 60

      const response = await fetchWithRetry(
        `${FINNHUB_BASE_URL}/stock/candle?symbol=NVDA&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
      )
      const data = await response.json()

      if (data.s === "ok" && data.c && data.c.length > 0) {
        const historicalData: HistoricalData[] = data.t.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split("T")[0],
          open: Math.round(data.o[index] * 100) / 100,
          high: Math.round(data.h[index] * 100) / 100,
          low: Math.round(data.l[index] * 100) / 100,
          close: Math.round(data.c[index] * 100) / 100,
          volume: data.v[index],
        }))

        setCachedData(cacheKey, historicalData, "Finnhub")
        return historicalData
      }
    } catch (error) {
      console.warn("Finnhub historical data failed:", error)
    }
  }

  // Try Alpha Vantage for historical data
  if (ALPHA_VANTAGE_API_KEY) {
    try {
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
        return historicalData
      }
    } catch (error) {
      console.warn("Alpha Vantage historical data failed:", error)
    }
  }

  // Generate mock historical data as final fallback
  console.log("Generating mock historical data...")
  const mockData: HistoricalData[] = []
  const currentPrice = 875

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const basePrice = currentPrice - (days - i) * 0.5 + (Math.random() - 0.5) * 20
    const dailyVariation = (Math.random() - 0.5) * 10

    const open = basePrice + dailyVariation
    const close = open + (Math.random() - 0.5) * 15
    const high = Math.max(open, close) + Math.random() * 5
    const low = Math.min(open, close) - Math.random() * 5

    mockData.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 30000000) + 20000000,
    })
  }

  setCachedData(cacheKey, mockData, "Mock Data")
  return mockData
}

// API health check function
export async function checkAPIHealth(): Promise<{
  finnhub: boolean
  alphaVantage: boolean
  rapidApiYahoo: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let finnhub = false
  let alphaVantage = false
  let rapidApiYahoo = false

  // Test Finnhub
  if (FINNHUB_API_KEY) {
    try {
      const response = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=NVDA&token=${FINNHUB_API_KEY}`)
      const data = await response.json()
      finnhub = !data.error
      if (data.error) errors.push(`Finnhub: ${data.error}`)
    } catch (error) {
      errors.push(`Finnhub: ${error.message}`)
    }
  } else {
    errors.push("Finnhub: API key not configured")
  }

  // Test Alpha Vantage
  if (ALPHA_VANTAGE_API_KEY) {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${ALPHA_VANTAGE_API_KEY}`,
      )
      const data = await response.json()
      alphaVantage = !!data["Global Quote"]
      if (data.Note) errors.push(`Alpha Vantage: ${data.Note}`)
      if (data.Information) errors.push(`Alpha Vantage: ${data.Information}`)
    } catch (error) {
      errors.push(`Alpha Vantage: ${error.message}`)
    }
  } else {
    errors.push("Alpha Vantage: API key not configured")
  }

  // Test RapidAPI Yahoo Finance
  if (RAPIDAPI_KEY) {
    try {
      const response = await fetch(`${RAPIDAPI_YAHOO_URL}/qu/quote/NVDA`, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
        },
      })
      const data = await response.json()
      rapidApiYahoo = !!data && !data.error
      if (data?.error) errors.push(`RapidAPI Yahoo: ${data.error}`)
    } catch (error) {
      errors.push(`RapidAPI Yahoo: ${error.message}`)
    }
  } else {
    errors.push("RapidAPI Yahoo: API key not configured")
  }

  return { finnhub, alphaVantage, rapidApiYahoo, errors }
}

// Usage monitoring
export function getAPIUsageStats() {
  return {
    totalCalls: apiCallCount,
    cacheHits: cache.size,
    lastCallTime: new Date(lastApiCall).toLocaleString(),
    rateLimitStatus: apiCallCount >= MAX_CALLS_PER_MINUTE ? "Limited" : "OK",
  }
}
