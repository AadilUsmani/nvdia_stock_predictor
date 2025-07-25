"use client"

import { useState, useEffect, useCallback } from "react"
import type { StockPrice, HistoricalData } from "@/lib/stock-api" // Import types only
import {
  generatePredictions,
  calculateTechnicalAnalysis,
  calculateRiskAssessment,
  generateInvestmentRecommendation,
  type PredictionResult,
  type TechnicalAnalysis,
  type RiskAssessment,
  type InvestmentRecommendation,
} from "@/lib/analysis-engine"

export interface StockAnalysis {
  stockPrice: StockPrice | null
  historicalData: HistoricalData[]
  predictions: PredictionResult | null
  technicalAnalysis: TechnicalAnalysis | null
  riskAssessment: RiskAssessment | null
  recommendation: InvestmentRecommendation | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useStockData() {
  const [analysis, setAnalysis] = useState<StockAnalysis>({
    stockPrice: null,
    historicalData: [],
    predictions: null,
    technicalAnalysis: null,
    riskAssessment: null,
    recommendation: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchAndAnalyze = useCallback(async () => {
    try {
      setAnalysis((prev) => ({ ...prev, loading: true, error: null }))

      // Fetch current stock price and historical data from the server route
      const [stockPriceResponse, historicalDataResponse] = await Promise.all([
        fetch("/api/stock?type=current"),
        fetch("/api/stock?type=historical&days=30"),
      ])

      if (!stockPriceResponse.ok || !historicalDataResponse.ok) {
        const errorText = await Promise.all([stockPriceResponse.text(), historicalDataResponse.text()])
        throw new Error(`Failed to fetch stock data from API route: ${errorText.join(" | ")}`)
      }

      const stockPrice: StockPrice = await stockPriceResponse.json()
      const historicalData: HistoricalData[] = await historicalDataResponse.json()

      console.log("Fetched stock price:", stockPrice)
      console.log("Fetched historical data:", historicalData)

      // Generate predictions based on current price and historical data
      const predictions = generatePredictions(stockPrice.price, historicalData)

      // Calculate technical analysis
      const technicalAnalysis = calculateTechnicalAnalysis(historicalData)

      // Assess risk
      const riskAssessment = calculateRiskAssessment(historicalData, stockPrice.price)

      // Generate investment recommendation
      const recommendation = generateInvestmentRecommendation(
        stockPrice.price,
        predictions,
        technicalAnalysis,
        riskAssessment,
      )

      setAnalysis({
        stockPrice,
        historicalData,
        predictions,
        technicalAnalysis,
        riskAssessment,
        recommendation,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      })
      console.log("Final analysis state updated:", {
        stockPrice,
        historicalData,
        predictions,
        technicalAnalysis,
        riskAssessment,
        recommendation,
      })
    } catch (error) {
      console.error("Error fetching or analyzing stock data:", error)
      setAnalysis((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch stock data",
      }))
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchAndAnalyze()
  }, [fetchAndAnalyze])

  // Auto-refresh every 5 minutes during market hours
  useEffect(() => {
    const interval = setInterval(
      () => {
        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay()

        // Only auto-refresh during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
        // This is a simplified check - in production, you'd want more sophisticated market hours logic
        if (day >= 1 && day <= 5 && hour >= 9 && hour <= 16) {
          fetchAndAnalyze()
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchAndAnalyze])

  return {
    ...analysis,
    refresh: fetchAndAnalyze,
  }
}
