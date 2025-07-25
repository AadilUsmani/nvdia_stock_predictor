import type { HistoricalData } from "./stock-api"

export interface PredictionResult {
  day1: number
  day5: number
  day10: number
  confidence: {
    day1: number
    day5: number
    day10: number
  }
}

export interface TechnicalAnalysis {
  rsi: number
  macd: number
  sma20: number
  sma50: number
  bollinger: {
    upper: number
    middle: number
    lower: number
  }
  support: number
  resistance: number
}

export interface RiskAssessment {
  score: number // 1-10
  volatility: number
  beta: number
  sharpeRatio: number
  maxDrawdown: number
}

export interface InvestmentRecommendation {
  action: "BUY" | "HOLD" | "SELL"
  confidence: number
  reasoning: string[]
  targetPrice: number
  stopLoss: number
}

// AI-powered prediction engine (simplified ML simulation)
export function generatePredictions(currentPrice: number, historicalData: HistoricalData[]): PredictionResult {
  if (historicalData.length === 0) {
    // Fallback predictions based on current price
    return {
      day1: currentPrice * (1 + (Math.random() - 0.4) * 0.03), // ±3% variation
      day5: currentPrice * (1 + (Math.random() - 0.3) * 0.08), // ±8% variation
      day10: currentPrice * (1 + (Math.random() - 0.2) * 0.15), // ±15% variation
      confidence: { day1: 85, day5: 72, day10: 58 },
    }
  }

  // Calculate recent trends
  const recentPrices = historicalData.slice(-10).map((d) => d.close)
  const shortTermTrend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0]

  // Calculate volatility
  const returns = recentPrices.slice(1).map((price, i) => (price - recentPrices[i]) / recentPrices[i])
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length)

  // Simple momentum-based predictions
  const momentum = shortTermTrend * 0.7 // Dampen the trend
  const randomFactor = (Math.random() - 0.5) * volatility * 2

  const day1Prediction = currentPrice * (1 + momentum * 0.1 + randomFactor * 0.3)
  const day5Prediction = currentPrice * (1 + momentum * 0.3 + randomFactor * 0.6)
  const day10Prediction = currentPrice * (1 + momentum * 0.5 + randomFactor * 1.0)

  // Confidence decreases with time horizon and increases with data quality
  const baseConfidence = Math.min(90, 60 + historicalData.length)

  return {
    day1: Math.round(day1Prediction * 100) / 100,
    day5: Math.round(day5Prediction * 100) / 100,
    day10: Math.round(day10Prediction * 100) / 100,
    confidence: {
      day1: Math.round(baseConfidence),
      day5: Math.round(baseConfidence * 0.85),
      day10: Math.round(baseConfidence * 0.65),
    },
  }
}

// Technical analysis calculations
export function calculateTechnicalAnalysis(historicalData: HistoricalData[]): TechnicalAnalysis {
  if (historicalData.length < 20) {
    // Return default values if insufficient data
    const currentPrice = historicalData[historicalData.length - 1]?.close || 875
    return {
      rsi: 55,
      macd: 2.5,
      sma20: currentPrice * 0.98,
      sma50: currentPrice * 0.95,
      bollinger: {
        upper: currentPrice * 1.05,
        middle: currentPrice,
        lower: currentPrice * 0.95,
      },
      support: currentPrice * 0.92,
      resistance: currentPrice * 1.08,
    }
  }

  const prices = historicalData.map((d) => d.close)
  const currentPrice = prices[prices.length - 1]

  // RSI calculation (simplified)
  const gains = []
  const losses = []
  for (let i = 1; i < Math.min(15, prices.length); i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains.push(change)
    else losses.push(Math.abs(change))
  }
  const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / Math.max(gains.length, 1)
  const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / Math.max(losses.length, 1)
  const rs = avgGain / Math.max(avgLoss, 0.01)
  const rsi = 100 - 100 / (1 + rs)

  // Moving averages
  const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / Math.min(20, prices.length)
  const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / Math.min(50, prices.length)

  // Bollinger Bands (simplified)
  const sma = sma20
  const variance =
    prices.slice(-20).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / Math.min(20, prices.length)
  const stdDev = Math.sqrt(variance)

  // Support and resistance (simplified)
  const recentPrices = prices.slice(-30)
  const support = Math.min(...recentPrices) * 1.02
  const resistance = Math.max(...recentPrices) * 0.98

  return {
    rsi: Math.round(rsi * 100) / 100,
    macd: Math.round((sma20 - sma50) * 100) / 100,
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    bollinger: {
      upper: Math.round((sma + stdDev * 2) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - stdDev * 2) * 100) / 100,
    },
    support: Math.round(support * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
  }
}

// Risk assessment
export function calculateRiskAssessment(historicalData: HistoricalData[], currentPrice: number): RiskAssessment {
  if (historicalData.length < 10) {
    return {
      score: 6.5,
      volatility: 0.25,
      beta: 1.2,
      sharpeRatio: 0.8,
      maxDrawdown: 0.15,
    }
  }

  const prices = historicalData.map((d) => d.close)
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i])

  // Volatility (annualized)
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * Math.sqrt(252)

  // Max drawdown
  let maxDrawdown = 0
  let peak = prices[0]
  for (const price of prices) {
    if (price > peak) peak = price
    const drawdown = (peak - price) / peak
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  // Risk score (1-10, higher = riskier)
  const volatilityScore = Math.min(10, volatility * 20)
  const drawdownScore = Math.min(10, maxDrawdown * 20)
  const riskScore = (volatilityScore + drawdownScore) / 2

  return {
    score: Math.round(riskScore * 10) / 10,
    volatility: Math.round(volatility * 1000) / 1000,
    beta: Math.round((1.0 + volatility * 0.5) * 100) / 100, // Simplified beta
    sharpeRatio: Math.round((0.1 / Math.max(volatility, 0.01)) * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 1000) / 1000,
  }
}

// Investment recommendation engine
export function generateInvestmentRecommendation(
  currentPrice: number,
  predictions: PredictionResult,
  technicalAnalysis: TechnicalAnalysis,
  riskAssessment: RiskAssessment,
): InvestmentRecommendation {
  const reasoning: string[] = []
  let score = 0

  // Price momentum analysis
  const shortTermGrowth = (predictions.day5 - currentPrice) / currentPrice
  if (shortTermGrowth > 0.05) {
    score += 2
    reasoning.push("Strong upward price momentum predicted")
  } else if (shortTermGrowth > 0.02) {
    score += 1
    reasoning.push("Moderate upward price momentum predicted")
  } else if (shortTermGrowth < -0.05) {
    score -= 2
    reasoning.push("Negative price momentum predicted")
  }

  // Technical indicators
  if (technicalAnalysis.rsi < 30) {
    score += 1
    reasoning.push("RSI indicates oversold conditions")
  } else if (technicalAnalysis.rsi > 70) {
    score -= 1
    reasoning.push("RSI indicates overbought conditions")
  }

  if (currentPrice > technicalAnalysis.sma20 && technicalAnalysis.sma20 > technicalAnalysis.sma50) {
    score += 1
    reasoning.push("Price above moving averages with bullish trend")
  }

  // Risk considerations
  if (riskAssessment.score > 8) {
    score -= 1
    reasoning.push("High volatility increases investment risk")
  } else if (riskAssessment.score < 4) {
    score += 1
    reasoning.push("Low volatility provides stable investment environment")
  }

  // Confidence in predictions
  if (predictions.confidence.day5 > 80) {
    score += 1
    reasoning.push("High confidence in AI predictions")
  }

  // Determine recommendation
  let action: "BUY" | "HOLD" | "SELL"
  let confidence: number

  if (score >= 3) {
    action = "BUY"
    confidence = Math.min(95, 70 + score * 5)
    reasoning.unshift("Multiple positive indicators align for investment opportunity")
  } else if (score <= -2) {
    action = "SELL"
    confidence = Math.min(90, 60 + Math.abs(score) * 5)
    reasoning.unshift("Risk factors outweigh potential gains")
  } else {
    action = "HOLD"
    confidence = 60 + Math.abs(score) * 3
    reasoning.unshift("Mixed signals suggest maintaining current position")
  }

  return {
    action,
    confidence: Math.round(confidence),
    reasoning,
    targetPrice: Math.round(predictions.day10 * 100) / 100,
    stopLoss: Math.round(currentPrice * 0.92 * 100) / 100,
  }
}
