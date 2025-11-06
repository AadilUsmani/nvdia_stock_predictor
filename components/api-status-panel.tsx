"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { checkAPIHealthServer, getAPIUsageStatsServer } from "@/app/actions/api-status"
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "@/components/icons"

export function APIStatusPanel() {
  const [apiHealth, setApiHealth] = useState<any>(null)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const health = await checkAPIHealthServer()
      const stats = await getAPIUsageStatsServer()
      setApiHealth(health)
      setUsageStats(stats)
    } catch (error) {
      console.error("Failed to check API status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (!apiHealth) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              API Status & Usage
            </CardTitle>
            <CardDescription>Monitor API health and usage statistics</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Check Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Health Status */}
          <div>
            <h4 className="font-semibold mb-3">API Providers</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Finnhub</span>
                <div className="flex items-center gap-2">
                  {apiHealth.finnhub ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={apiHealth.finnhub ? "default" : "destructive"}>
                    {apiHealth.finnhub ? "Active" : "Failed"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Alpha Vantage</span>
                <div className="flex items-center gap-2">
                  {apiHealth.alphaVantage ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={apiHealth.alphaVantage ? "default" : "destructive"}>
                    {apiHealth.alphaVantage ? "Active" : "Failed"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">RapidAPI Yahoo Finance</span>
                <div className="flex items-center gap-2">
                  {apiHealth.rapidApiYahoo ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={apiHealth.rapidApiYahoo ? "default" : "destructive"}>
                    {apiHealth.rapidApiYahoo ? "Active" : "Failed"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          {usageStats && (
            <div>
              <h4 className="font-semibold mb-3">Usage Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API Calls (this minute):</span>
                  <span className="font-medium">{usageStats.totalCalls}/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Entries:</span>
                  <span className="font-medium">{usageStats.cacheHits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last API Call:</span>
                  <span className="font-medium text-xs">{usageStats.lastCallTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Limit Status:</span>
                  <Badge variant={usageStats.rateLimitStatus === "OK" ? "default" : "destructive"}>
                    {usageStats.rateLimitStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {apiHealth.errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="font-semibold text-red-800 mb-2">API Errors:</h5>
            <ul className="text-sm text-red-700 space-y-1">
              {apiHealth.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
