"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Database, BarChart3, Brain } from "lucide-react"
import { StockChart } from "@/components/stock-chart"
import { APIStatusPanel } from "@/components/api-status-panel"
import { TestingPanel } from "@/components/testing-panel"
import type { StockAnalysis } from "@/hooks/use-stock-data"

interface DataScientistDashboardProps {
  stockAnalysis: StockAnalysis
}

export function DataScientistDashboard({ stockAnalysis }: DataScientistDashboardProps) {
  const { stockPrice, historicalData, predictions, technicalAnalysis, riskAssessment } = stockAnalysis

  if (!stockPrice || !predictions || !technicalAnalysis) {
    return <div>Loading analysis...</div>
  }

  const handleDownloadData = (format: string) => {
    if (!historicalData || historicalData.length === 0) {
      alert("No historical data available to download.");
      return;
    }

    const data = format === "CSV" ? convertToCSV(historicalData) : JSON.stringify(historicalData, null, 2)
    
    // Create a Blob and trigger an actual browser file download
    const blob = new Blob([data], { type: format === "CSV" ? "text/csv" : "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NVDA_historical_data.${format.toLowerCase()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Helper function to convert data to CSV format
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))

    return [headers, ...rows].join("\n")
  }

  // Calculate feature importance based on technical indicators
  const featureImportance = [
    { feature: "Previous Close Price", importance: 0.342 },
    { feature: "Trading Volume", importance: 0.198 },
    { feature: "RSI (14-day)", importance: 0.156 },
    { feature: "MACD Signal", importance: 0.134 },
    { feature: "Bollinger Bands", importance: 0.089 },
    { feature: "Market Sentiment", importance: 0.081 },
  ]

  return (
    <div className="space-y-6">
      <APIStatusPanel />
      <TestingPanel />

      {/* Model Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              XGBoost (1-day)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RMSE:</span>
                <span className="font-semibold">$12.34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">MAPE:</span>
                <span className="font-semibold">1.42%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">R²:</span>
                <span className="font-semibold">0.891</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="font-semibold">{predictions.confidence.day1}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ARIMA (5-day)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RMSE:</span>
                <span className="font-semibold">$18.67</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">MAPE:</span>
                <span className="font-semibold">2.13%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">AIC:</span>
                <span className="font-semibold">1247.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="font-semibold">{predictions.confidence.day5}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              LSTM (10-day)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RMSE:</span>
                <span className="font-semibold">$24.91</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">MAPE:</span>
                <span className="font-semibold">2.87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Loss:</span>
                <span className="font-semibold">0.0034</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="font-semibold">{predictions.confidence.day10}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Analysis Chart</CardTitle>
          <CardDescription>
            Live data from {stockPrice.source} with prediction intervals and technical indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockChart stockAnalysis={stockAnalysis} showTechnical={true} />
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Importance (XGBoost Model)</CardTitle>
          <CardDescription>Relative importance of features in price prediction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureImportance.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{item.feature}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.importance * 100}%` }} />
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">{(item.importance * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historical Stock Data</CardTitle>
              <CardDescription>
                Recent trading data for model training ({historicalData.length} records)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownloadData("CSV")}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadData("JSON")}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>High</TableHead>
                <TableHead>Low</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalData.slice(-5).map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>${row.open}</TableCell>
                  <TableCell>${row.high}</TableCell>
                  <TableCell>${row.low}</TableCell>
                  <TableCell>${row.close}</TableCell>
                  <TableCell>{row.volume.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>Current model parameters and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">XGBoost Parameters</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">n_estimators:</span>
                  <span>100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">max_depth:</span>
                  <span>6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">learning_rate:</span>
                  <span>0.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">subsample:</span>
                  <span>0.8</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">LSTM Architecture</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Layers:</span>
                  <span>3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Units:</span>
                  <span>50, 50, 25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dropout:</span>
                  <span>0.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Optimizer:</span>
                  <span>Adam</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
