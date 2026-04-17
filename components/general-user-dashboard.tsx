"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react"
import { StockChart } from "@/components/stock-chart"
import { APIStatusPanel } from "@/components/api-status-panel"
import type { StockAnalysis } from "@/hooks/use-stock-data"
import { generatePDFReport } from "@/lib/pdf-generator"

interface GeneralUserDashboardProps {
  stockAnalysis: StockAnalysis
}

export function GeneralUserDashboard({ stockAnalysis }: GeneralUserDashboardProps) {
  const { stockPrice, predictions } = stockAnalysis

  if (!stockPrice || !predictions) {
    return <div>Loading analysis...</div>
  }

  const handleDownloadSummary = () => {
    // In a real app, this would generate and download a PDF report
    alert("Summary report would be downloaded here")
  }

  const isPositiveTrend = stockPrice.change >= 0

  return (
    <div className="space-y-6">
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
          📊 View API Status (Advanced)
        </summary>
        <APIStatusPanel />
      </details>

      {/* Current Price & Trend */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">${stockPrice.price}</div>
            <div
              className={`flex items-center justify-center gap-2 text-lg ${
                isPositiveTrend ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveTrend ? <ArrowUp className="h-6 w-6" /> : <ArrowDown className="h-6 w-6" />}
              <span>
                {isPositiveTrend ? "+" : ""}${stockPrice.change} ({isPositiveTrend ? "+" : ""}
                {stockPrice.changePercent}%)
              </span>
            </div>
            <div className="mt-4">
              <Badge
                variant={isPositiveTrend ? "default" : "destructive"}
                className={`text-lg px-4 py-2 ${
                  isPositiveTrend ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isPositiveTrend ? "Trending Up" : "Trending Down"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Price Predictions</CardTitle>
          <CardDescription className="text-center">AI-powered forecasts for the next few days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Tomorrow</div>
              <div className="text-2xl font-bold text-blue-600">${predictions.day1}</div>
              <div
                className={`text-sm mt-1 ${predictions.day1 > stockPrice.price ? "text-green-600" : "text-red-600"}`}
              >
                {predictions.day1 > stockPrice.price ? "↗" : "↘"}
                {Math.abs(((predictions.day1 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Next Week</div>
              <div className="text-2xl font-bold text-green-600">${predictions.day5}</div>
              <div
                className={`text-sm mt-1 ${predictions.day5 > stockPrice.price ? "text-green-600" : "text-red-600"}`}
              >
                {predictions.day5 > stockPrice.price ? "↗" : "↘"}
                {Math.abs(((predictions.day5 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">10 Days</div>
              <div className="text-2xl font-bold text-purple-600">${predictions.day10}</div>
              <div
                className={`text-sm mt-1 ${predictions.day10 > stockPrice.price ? "text-green-600" : "text-red-600"}`}
              >
                {predictions.day10 > stockPrice.price ? "↗" : "↘"}
                {Math.abs(((predictions.day10 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Trend</CardTitle>
          <CardDescription>Recent performance and future predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <StockChart stockAnalysis={stockAnalysis} simplified={true} />
        </CardContent>
      </Card>

      {/* Simple Summary */}
      <Card>
        <CardHeader>
          <CardTitle>What This Means</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                isPositiveTrend ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className={`flex items-center gap-2 mb-2 ${isPositiveTrend ? "text-green-800" : "text-red-800"}`}>
                {isPositiveTrend ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="font-semibold">{isPositiveTrend ? "Positive Trend" : "Negative Trend"}</span>
              </div>
              <p className={`text-sm ${isPositiveTrend ? "text-green-700" : "text-red-700"}`}>
                {isPositiveTrend
                  ? "NVIDIA stock is showing upward momentum. Our AI models predict continued growth over the next 10 days."
                  : "NVIDIA stock is experiencing downward pressure. Our AI models suggest caution in the near term."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Key Highlights</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• AI-powered predictions using advanced models</li>
                  <li>• Based on historical price patterns</li>
                  <li>• Updated daily with latest market data</li>
                  <li>• Considers market trends and volatility</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Remember</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Stock predictions are estimates, not guarantees</li>
                  <li>• Markets can be unpredictable</li>
                  <li>• Consider your risk tolerance</li>
                  <li>• Consult a financial advisor for investment decisions</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button onClick={handleDownloadSummary} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Summary Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
