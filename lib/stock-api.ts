// Stock data types - this file contains ONLY type definitions for client use
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
