"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { StockAnalysis } from "@/hooks/use-stock-data"

interface StockChartProps {
  stockAnalysis: StockAnalysis
  showTechnical?: boolean
  simplified?: boolean
}

// Generate chart data from real stock analysis
const generateChartData = (stockAnalysis: StockAnalysis) => {
  const { stockPrice, historicalData, predictions } = stockAnalysis

  console.log("StockChart - generateChartData received stockAnalysis:", stockAnalysis)

  if (!stockPrice || !predictions || historicalData.length === 0) {
    console.warn("StockChart - Insufficient data for chart generation:", {
      stockPrice: stockPrice ? "present" : "missing",
      predictions: predictions ? "present" : "missing",
      historicalDataLength: historicalData.length,
    })
    return []
  }

  const data = []

  // Use real historical data
  historicalData.forEach((item) => {
    // Ensure data points are valid numbers
    if (typeof item.close === "number" && !isNaN(item.close)) {
      data.push({
        date: item.date,
        price: item.close,
        type: "historical",
      })
    } else {
      console.warn("StockChart - Invalid historical data point (close price not a number):", item)
    }
  })

  // Current price (might be slightly different from last historical price)
  const today = new Date().toISOString().split("T")[0]
  if (typeof stockPrice.price === "number" && !isNaN(stockPrice.price)) {
    data.push({
      date: today,
      price: stockPrice.price,
      type: "current",
    })
  } else {
    console.warn("StockChart - Invalid current stock price (not a number):", stockPrice.price)
  }

  // Predictions
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (typeof predictions.day1 === "number" && !isNaN(predictions.day1)) {
    data.push({
      date: tomorrow.toISOString().split("T")[0],
      price: predictions.day1,
      type: "prediction",
    })
  } else {
    console.warn("StockChart - Invalid day1 prediction (not a number):", predictions.day1)
  }

  const day5 = new Date()
  day5.setDate(day5.getDate() + 5)
  if (typeof predictions.day5 === "number" && !isNaN(predictions.day5)) {
    data.push({
      date: day5.toISOString().split("T")[0],
      price: predictions.day5,
      type: "prediction",
    })
  } else {
    console.warn("StockChart - Invalid day5 prediction (not a number):", predictions.day5)
  }

  const day10 = new Date()
  day10.setDate(day10.getDate() + 10)
  if (typeof predictions.day10 === "number" && !isNaN(predictions.day10)) {
    data.push({
      date: day10.toISOString().split("T")[0],
      price: predictions.day10,
      type: "prediction",
    })
  } else {
    console.warn("StockChart - Invalid day10 prediction (not a number):", predictions.day10)
  }

  console.log("StockChart - Final generated chartData array:", data)
  return data
}

export function StockChart({ stockAnalysis, showTechnical = false, simplified = false }: StockChartProps) {
  console.log("StockChart component rendering with stockAnalysis:", stockAnalysis)
  const chartData = generateChartData(stockAnalysis)

  if (chartData.length === 0) {
    console.log("StockChart - chartData is empty, showing loading message.")
    return <div className="w-full h-80 flex items-center justify-center text-gray-500">Loading chart data...</div>
  }

  const currentIndex = chartData.findIndex((d) => d.type === "current")
  const historicalData = chartData.slice(0, currentIndex + 1)
  const predictionData = chartData.slice(currentIndex)

  console.log("StockChart - Sliced historicalData:", historicalData)
  console.log("StockChart - Sliced predictionData:", predictionData)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const confidence = stockAnalysis.predictions
        ? data.type === "prediction"
          ? label.includes(new Date(Date.now() + 86400000).toISOString().split("T")[0])
            ? stockAnalysis.predictions.confidence.day1
            : label.includes(new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0])
              ? stockAnalysis.predictions.confidence.day5
              : stockAnalysis.predictions.confidence.day10
          : null
        : null

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-600">Price: ${payload[0].value.toFixed(2)}</p>
          {data.type === "prediction" && confidence && (
            <p className="text-sm text-gray-500">Predicted ({confidence}% confidence)</p>
          )}
          {data.type === "current" && <p className="text-sm text-green-600">Current Price</p>}
        </div>
      )
    }
    return null
  }

  // Calculate domain for Y axis to provide some padding
  const allPrices = chartData.map((d) => d.price)
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const padding = (maxPrice - minPrice) * 0.1 // 10% padding
  const yDomain = [Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)]

  console.log("StockChart - Y-axis domain:", yDomain)

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} domain={yDomain} tickFormatter={(value) => `$${value.toFixed(0)}`} />
          <Tooltip content={<CustomTooltip />} />

          {/* Historical line */}
          <Line
            data={historicalData}
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Historical"
          />

          {/* Prediction line */}
          <Line
            data={predictionData}
            type="monotone"
            dataKey="price"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
            name="AI Predicted"
          />

          {/* Current price reference line */}
          {currentIndex >= 0 && (
            <ReferenceLine
              x={chartData[currentIndex]?.date}
              stroke="#10b981"
              strokeDasharray="2 2"
              label={{ value: "Now", position: "top" }}
            />
          )}

          {/* Technical analysis lines */}
          {showTechnical && stockAnalysis.technicalAnalysis && (
            <>
              <ReferenceLine
                y={stockAnalysis.technicalAnalysis.support}
                stroke="#22c55e"
                strokeDasharray="3 3"
                label={{ value: "Support", position: "left" }}
              />
              <ReferenceLine
                y={stockAnalysis.technicalAnalysis.resistance}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: "Resistance", position: "left" }}
              />
              {!simplified && (
                <>
                  <ReferenceLine
                    y={stockAnalysis.technicalAnalysis.sma20}
                    stroke="#6366f1"
                    strokeDasharray="3 3"
                    label={{ value: "SMA20", position: "left" }}
                  />
                  <ReferenceLine
                    y={stockAnalysis.technicalAnalysis.sma50}
                    stroke="#8b5cf6"
                    strokeDasharray="3 3"
                    label={{ value: "SMA50", position: "left" }}
                  />
                </>
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
