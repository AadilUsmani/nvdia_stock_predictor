"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Download, BarChart3, Briefcase, Globe, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { InvestorDashboard } from "@/components/investor-dashboard"
import { DataScientistDashboard } from "@/components/data-scientist-dashboard"
import { FinancialAdvisorDashboard } from "@/components/financial-advisor-dashboard"
import { GeneralUserDashboard } from "@/components/general-user-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { useStockData } from "@/hooks/use-stock-data"

const userRoles = [
  {
    id: "investor",
    title: "Investor",
    description: "Investment recommendations and analysis",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    description: "Model insights and raw data access",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    id: "financial-advisor",
    title: "Financial Advisor",
    description: "Client reports and risk analysis",
    icon: Briefcase,
    color: "bg-purple-500",
  },
  {
    id: "general",
    title: "General User",
    description: "Simplified stock insights",
    icon: Globe,
    color: "bg-gray-500",
  },
]

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showRoleSelection, setShowRoleSelection] = useState(true)
  const stockAnalysis = useStockData()

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setShowRoleSelection(false)
  }

  const handleBackToSelection = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
  }

  // Show loading state if data is still being fetched
  if (stockAnalysis.loading && !stockAnalysis.stockPrice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">Loading NVIDIA Stock Data</h2>
              <p className="text-gray-600 dark:text-gray-400">Fetching live market data and generating analysis...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if data fetch failed
  if (stockAnalysis.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900 dark:to-pink-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-400">Data Fetch Error</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{stockAnalysis.error}</p>
              <Button onClick={stockAnalysis.refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stockPrice = stockAnalysis.stockPrice
  if (!stockPrice) return null

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Theme Toggle */}
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              NVIDIA Stock Predictor
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">AI-Powered Stock Analysis & Predictions</p>
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="font-semibold text-green-600 dark:text-green-400">${stockPrice.price}</span>
              {stockPrice.change >= 0 ? (
                <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm ${stockPrice.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {stockPrice.change >= 0 ? "+" : ""}
                {stockPrice.changePercent}%
              </span>
            </div>
            {stockAnalysis.lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Last updated: {stockAnalysis.lastUpdated.toLocaleTimeString()}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stockAnalysis.refresh}
                  className="ml-2"
                  disabled={stockAnalysis.loading}
                >
                  <RefreshCw className={`h-3 w-3 ${stockAnalysis.loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-200">
              Select Your Role
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userRoles.map((role) => {
                const IconComponent = role.icon
                return (
                  <Card
                    key={role.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-blue-300 dark:hover:border-blue-600"
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">{role.title}</CardTitle>
                      <CardDescription className="text-sm">{role.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Features Preview */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">Live Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Real-Time Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Live NVIDIA stock prices from {stockPrice.source}
                  </p>
                </div>
                <div>
                  <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced algorithms analyze market data to generate predictions
                  </p>
                </div>
                <div>
                  <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">PDF Reports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Downloadable reports based on current market conditions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToSelection} className="text-sm bg-transparent">
                ← Back to Role Selection
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NVIDIA Stock Predictor</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userRoles.find((r) => r.id === selectedRole)?.title} Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={stockAnalysis.refresh} disabled={stockAnalysis.loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${stockAnalysis.loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">${stockPrice.price}</div>
                <div
                  className={`text-sm flex items-center gap-1 ${stockPrice.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {stockPrice.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {stockPrice.change >= 0 ? "+" : ""}${stockPrice.change} ({stockPrice.change >= 0 ? "+" : ""}
                  {stockPrice.changePercent}%)
                </div>
              </div>
            </div>
          </div>
          {stockAnalysis.lastUpdated && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated: {stockAnalysis.lastUpdated.toLocaleString()} via {stockPrice.source}
            </div>
          )}
        </div>
      </div>

      {/* Role-specific Dashboard */}
      <div className="max-w-7xl mx-auto p-4">
        {selectedRole === "investor" && <InvestorDashboard stockAnalysis={stockAnalysis} />}
        {selectedRole === "data-scientist" && <DataScientistDashboard stockAnalysis={stockAnalysis} />}
        {selectedRole === "financial-advisor" && <FinancialAdvisorDashboard stockAnalysis={stockAnalysis} />}
        {selectedRole === "general" && <GeneralUserDashboard stockAnalysis={stockAnalysis} />}
      </div>
    </div>
  )
}
