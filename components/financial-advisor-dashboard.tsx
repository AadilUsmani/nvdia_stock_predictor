"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Shield, TrendingUp, AlertTriangle, Users } from "lucide-react"
import { StockChart } from "@/components/stock-chart"
import { APIStatusPanel } from "@/components/api-status-panel"
import type { StockAnalysis } from "@/hooks/use-stock-data"
import { generatePDFReport, type PDFReportData } from "@/lib/pdf-generator"

interface FinancialAdvisorDashboardProps {
  stockAnalysis: StockAnalysis
}

export function FinancialAdvisorDashboard({ stockAnalysis }: FinancialAdvisorDashboardProps) {
  const { stockPrice, predictions, riskAssessment } = stockAnalysis

  if (!stockPrice || !predictions || !riskAssessment) {
    return <div>Loading analysis...</div>
  }

  // Calculate S&P 500 comparison (in a real app, this would come from API)
  const sp500Comparison = 2.3 // Percentage outperformance

  const handleDownloadReport = async (type: "Executive Summary" | "Detailed Analysis" | "Risk Assessment") => {
    const reportTypeMap: Record<"Executive Summary" | "Detailed Analysis" | "Risk Assessment", PDFReportData["reportType"]> =
      {
        "Executive Summary": "financial-advisor",
        "Detailed Analysis": "data-scientist",
        "Risk Assessment": "financial-advisor",
      }

    await generatePDFReport({
      stockAnalysis,
      reportType: reportTypeMap[type],
      userRole: "Financial Advisor",
    })
  }

  return (
    <div className="space-y-6">
      <APIStatusPanel />

      {/* Risk Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Index
            </CardTitle>
            <CardDescription>Volatility and risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{riskAssessment.score.toFixed(1)}/10</span>
                <Badge
                  variant={
                    riskAssessment.score > 7 ? "destructive" : riskAssessment.score > 5 ? "secondary" : "default"
                  }
                >
                  {riskAssessment.score > 7 ? "High Risk" : riskAssessment.score > 5 ? "Moderate Risk" : "Low Risk"}
                </Badge>
              </div>
              <Progress value={riskAssessment.score * 10} className="h-3" />
              <div className="text-sm text-gray-600">
                Based on volatility ({(riskAssessment.volatility * 100).toFixed(1)}%), beta ({riskAssessment.beta}), and
                market conditions
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              S&P 500 Comparison
            </CardTitle>
            <CardDescription>Performance vs market benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">+{sp500Comparison}%</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Outperforming
                </Badge>
              </div>
              <div className="text-sm text-gray-600">30-day relative performance vs S&P 500</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">NVIDIA</div>
                  <div className="font-semibold">+{stockPrice.changePercent}%</div>
                </div>
                <div>
                  <div className="text-gray-600">S&P 500</div>
                  <div className="font-semibold">+{(stockPrice.changePercent - sp500Comparison).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client-Friendly Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800">Investment Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700">
              <p className="mb-2">
                <strong>{stockPrice.change >= 0 ? "Positive momentum" : "Cautious outlook"}</strong> with AI-driven
                growth expectations.
              </p>
              <p>
                Predicted price targets suggest
                {predictions.day10 > stockPrice.price ? " continued upward trajectory" : " potential challenges"}
                over the next 10 days.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Key Considerations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700">
              <p className="mb-2">
                <strong>
                  {riskAssessment.score > 7 ? "High" : riskAssessment.score > 5 ? "Moderate" : "Low"} risk
                </strong>{" "}
                due to tech sector volatility.
              </p>
              <p>Consider position sizing and diversification strategies.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800">Time Horizon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700">
              <p className="mb-2">
                <strong>Short-term:</strong>{" "}
                {predictions.day1 > stockPrice.price ? "Bullish signals" : "Cautious outlook"}
              </p>
              <p>
                <strong>Medium-term:</strong>{" "}
                {predictions.day10 > stockPrice.price ? "Positive trend" : "Potential volatility"}, monitor earnings and
                AI market developments
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Predictions for Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Price Forecasts</CardTitle>
          <CardDescription>AI-generated price predictions with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">1-Day Target</div>
              <div className="text-2xl font-bold text-blue-600">${predictions.day1}</div>
              <div className={`text-sm ${predictions.day1 > stockPrice.price ? "text-green-600" : "text-red-600"}`}>
                {predictions.day1 > stockPrice.price ? "+" : ""}
                {(((predictions.day1 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">5-Day Target</div>
              <div className="text-2xl font-bold text-blue-600">${predictions.day5}</div>
              <div className={`text-sm ${predictions.day5 > stockPrice.price ? "text-green-600" : "text-red-600"}`}>
                {predictions.day5 > stockPrice.price ? "+" : ""}
                {(((predictions.day5 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">10-Day Target</div>
              <div className="text-2xl font-bold text-blue-600">${predictions.day10}</div>
              <div className={`text-sm ${predictions.day10 > stockPrice.price ? "text-green-600" : "text-red-600"}`}>
                {predictions.day10 > stockPrice.price ? "+" : ""}
                {(((predictions.day10 - stockPrice.price) / stockPrice.price) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <StockChart stockAnalysis={stockAnalysis} />
        </CardContent>
      </Card>

      {/* Portfolio Allocation Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Portfolio Allocation Guidance
          </CardTitle>
          <CardDescription>Suggested allocation based on risk profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-green-600 mb-2">Conservative</h4>
              <div className="text-3xl font-bold mb-2">3-5%</div>
              <p className="text-sm text-gray-600">Low risk tolerance, focus on capital preservation</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-blue-600 mb-2">Moderate</h4>
              <div className="text-3xl font-bold mb-2">5-10%</div>
              <p className="text-sm text-gray-600">Balanced approach, moderate growth seeking</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-purple-600 mb-2">Aggressive</h4>
              <div className="text-3xl font-bold mb-2">10-15%</div>
              <p className="text-sm text-gray-600">High risk tolerance, growth-focused strategy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Report Download */}
      <Card>
        <CardHeader>
          <CardTitle>Client Reports</CardTitle>
          <CardDescription>Generate professional reports for client meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={() => handleDownloadReport("Executive Summary")} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Executive Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport("Detailed Analysis")}
              className="flex-1 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Detailed Analysis
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport("Risk Assessment")}
              className="flex-1 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Risk Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
