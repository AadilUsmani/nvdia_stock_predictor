"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, CheckCircle, XCircle, Clock } from "lucide-react"

export function TestingPanel() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    setTestResults([])

    const tests = [
      {
        name: "Current Stock Price",
        test: async () => {
          const response = await fetch("/api/stock?type=current")
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || "Failed to fetch current stock price")
          return {
            success: result.price > 0,
            data: `$${result.price} from ${result.source}`,
            details: result,
          }
        },
      },
      {
        name: "Historical Data (7 days)",
        test: async () => {
          const response = await fetch("/api/stock?type=historical&days=7")
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || "Failed to fetch historical data")
          return {
            success: result.length > 0,
            data: `${result.length} data points`,
            details: result.slice(0, 3),
          }
        },
      },
      {
        name: "Historical Data (30 days)",
        test: async () => {
          const response = await fetch("/api/stock?type=historical&days=30")
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || "Failed to fetch historical data")
          return {
            success: result.length > 0,
            data: `${result.length} data points`,
            details: result.slice(0, 3),
          }
        },
      },
      {
        name: "Cache Performance",
        test: async () => {
          const start = Date.now()
          await fetch("/api/stock?type=current") // Should use cache if within duration
          const duration = Date.now() - start
          return {
            success: duration < 100, // Expect fast response for cached data
            data: `${duration}ms (cached)`,
            details: { duration, cached: duration < 100 },
          }
        },
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        setTestResults((prev) => [
          ...prev,
          {
            name: test.name,
            status: "success",
            ...result,
          },
        ])
      } catch (error) {
        setTestResults((prev) => [
          ...prev,
          {
            name: test.name,
            status: "error",
            success: false,
            data: (error as Error).message,
            details: error,
          },
        ])
      }
    }

    setTesting(false)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              API Integration Tests
            </CardTitle>
            <CardDescription>Test all API endpoints and functionality</CardDescription>
          </div>
          <Button onClick={runTests} disabled={testing}>
            {testing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-600">{result.data}</div>
                  </div>
                </div>
                <Badge variant={result.success ? "default" : "destructive"}>{result.success ? "Pass" : "Fail"}</Badge>
              </div>
            ))}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">Test Summary:</h5>
              <div className="text-sm text-blue-700">
                ✅ Passed: {testResults.filter((r) => r.success).length} | ❌ Failed:{" "}
                {testResults.filter((r) => !r.success).length} | 📊 Total: {testResults.length}
              </div>
            </div>
          </div>
        )}

        {testResults.length === 0 && !testing && (
          <div className="text-center py-8 text-gray-500">Click "Run Tests" to verify your API integration</div>
        )}
      </CardContent>
    </Card>
  )
}
