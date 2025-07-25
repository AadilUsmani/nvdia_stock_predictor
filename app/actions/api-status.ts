"use server"

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

// Rate limiting (in-memory, per serverless function invocation)
let lastApiCall = 0
let apiCallCount = 0
const MAX_CALLS_PER_MINUTE = 5
const API_CALL_DELAY = 1000 // Declare API_CALL_DELAY variable

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

// API health check function
export async function checkAPIHealthServer(): Promise<{
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
      errors.push(`Finnhub: ${(error as Error).message}`)
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
      errors.push(`Alpha Vantage: ${(error as Error).message}`)
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
      errors.push(`RapidAPI Yahoo: ${(error as Error).message}`)
    }
  } else {
    errors.push("RapidAPI Yahoo: API key not configured")
  }

  return { finnhub, alphaVantage, rapidApiYahoo, errors }
}

// Usage monitoring
export async function getAPIUsageStatsServer() {
  // Note: In a serverless environment, these stats are per invocation.
  // For persistent stats, an external store (e.g., Redis) would be needed.
  return {
    totalCalls: apiCallCount,
    cacheHits: cache.size,
    lastCallTime: new Date(lastApiCall).toLocaleString(),
    rateLimitStatus: apiCallCount >= MAX_CALLS_PER_MINUTE ? "Limited" : "OK",
  }
}
