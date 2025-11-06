"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, Target, Shield } from "@/components/icons"
import { StockChart } from "@/components/stock-chart"
import type { StockAnalysis } from "@/hooks/use-stock-data"
import { APIStatusPanel } from "@/components/api-status-panel"

interface InvestorDashboardProps {
  stockAnalysis: StockAnalysis
}

export function InvestorDashboard({ stockAnalysis }: InvestorDashboardProps) {
  const { stockPrice, predictions, recommendation, technicalAnalysis, riskAssessment } = stockAnalysis

  if (!stockPrice || !predictions || !recommendation) {
    return <div>Loading analysis...</div>
  }

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-green-600 hover:bg-green-700"
      case "SELL":
        return "bg-red-600 hover:bg-red-700"
      default:
        return "bg-yellow-600 hover:bg-yellow-700"
    }
  }

  return (
    <div className="space-y-6">
      <APIStatusPanel />

      {/* Investment Recommendation */}
      <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Investment Recommendation
          </CardTitle>
          <CardDescription>Based on real-time market analysis and ML predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                size="lg"
                className={`text-lg font-bold px-8 py-4 ${getRecommendationColor(recommendation.action)}`}
              >
                {recommendation.action}
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Confidence: {recommendation.confidence}% | Target: ${recommendation.targetPrice}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Risk Score</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {riskAssessment?.score.toFixed(1)}/10
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Analysis Summary
            </h4>
            <ul className="text-sm space-y-1">
              {recommendation.reasoning.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Live Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              1-Day Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${predictions.day1}</div>
            <div
              className={`text-sm ${predictions.day1 > stockPrice.price ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {predictions.day1 > stockPrice.price ? "+" : ""}
              {(((predictions.day1 - stockPrice.price) / stockPrice.price) * 100).toFixed(2)}%
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              {predictions.confidence.day1}% confidence
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              5-Day Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${predictions.day5}</div>
            <div
              className={`text-sm ${predictions.day5 > stockPrice.price ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {predictions.day5 > stockPrice.price ? "+" : ""}
              {(((predictions.day5 - stockPrice.price) / stockPrice.price) * 100).toFixed(2)}%
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              {predictions.confidence.day5}% confidence
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              10-Day Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${predictions.day10}</div>
            <div
              className={`text-sm ${predictions.day10 > stockPrice.price ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {predictions.day10 > stockPrice.price ? "+" : ""}
              {(((predictions.day10 - stockPrice.price) / stockPrice.price) * 100).toFixed(2)}%
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              {predictions.confidence.day10}% confidence
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Live Price Chart & AI Predictions</CardTitle>
          <CardDescription>
            Real-time NVIDIA stock data from {stockPrice.source} with ML-generated forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="stock-chart">
            <StockChart stockAnalysis={stockAnalysis} />
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis Summary */}
      {technicalAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Technical Analysis & Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3">Technical Indicators</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>RSI (14):</span>
                    <span
                      className={
                        technicalAnalysis.rsi > 70
                          ? "text-red-600 dark:text-red-400"
                          : technicalAnalysis.rsi < 30
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                      }
                    >
                      {technicalAnalysis.rsi.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>20-day SMA:</span>
                    <span>${technicalAnalysis.sma20}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50-day SMA:</span>
                    <span>${technicalAnalysis.sma50}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support Level:</span>
                    <span className="text-green-600 dark:text-green-400">${technicalAnalysis.support}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resistance Level:</span>
                    <span className="text-red-600 dark:text-red-400">${technicalAnalysis.resistance}</span>
                  </div>
                </div>
              </div>

              {riskAssessment && (
                <div>
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3">Risk Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Volatility:</span>
                      <span>{(riskAssessment.volatility * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Beta:</span>
                      <span>{riskAssessment.beta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span>{riskAssessment.sharpeRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="text-red-600 dark:text-red-400">
                        {(riskAssessment.maxDrawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop Loss:</span>
                      <span className="text-red-600 dark:text-red-400">${recommendation.stopLoss}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
