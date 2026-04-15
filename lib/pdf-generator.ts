"use client"

import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import type { StockAnalysis } from "@/hooks/use-stock-data"

export interface PDFReportData {
  stockAnalysis: StockAnalysis
  reportType: "investor" | "data-scientist" | "financial-advisor" | "general"
  userRole: string
}

// Generate PDF report based on current stock analysis
export async function generatePDFReport(data: PDFReportData): Promise<void> {
  const { stockAnalysis, reportType, userRole } = data
  const { stockPrice, predictions, recommendation, technicalAnalysis, riskAssessment, historicalData } = stockAnalysis

  if (!stockPrice || !predictions) {
    throw new Error("Insufficient data for PDF generation")
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginX = 15
  const maxWidth = pageWidth - marginX * 2
  const bottomMargin = 15
  let yPosition = 18

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  const sectionTitle: Record<PDFReportData["reportType"], string> = {
    investor: "Investor Report",
    "data-scientist": "Data Scientist Report",
    "financial-advisor": "Financial Advisor Report",
    general: "General Market Report",
  }

  const ensureSpace = (requiredHeight = 8) => {
    if (yPosition + requiredHeight > pageHeight - bottomMargin) {
      pdf.addPage()
      yPosition = 18
    }
  }

  const writeWrappedText = (text: string, fontSize = 11, style: "normal" | "bold" | "italic" = "normal", indent = 0) => {
    pdf.setFont("helvetica", style)
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth - indent)
    ensureSpace(lines.length * (fontSize * 0.5) + 4)
    pdf.text(lines, marginX + indent, yPosition)
    yPosition += lines.length * (fontSize * 0.5) + 2
  }

  const writeHeader = () => {
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(20)
    pdf.text("NVIDIA Stock Analysis Report", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 8

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(sectionTitle[reportType], pageWidth / 2, yPosition, { align: "center" })
    yPosition += 6
    pdf.text(`Prepared for: ${userRole}`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 5
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10
  }

  writeHeader()

  writeWrappedText("Market Snapshot", 14, "bold")
  writeWrappedText(`- Symbol: ${stockPrice.symbol}`)
  writeWrappedText(`- Current Price: ${formatCurrency(stockPrice.price)}`)
  writeWrappedText(`- Change: ${formatCurrency(stockPrice.change)} (${formatPercent(stockPrice.changePercent)})`)
  writeWrappedText(`- Previous Close: ${formatCurrency(stockPrice.previousClose)}`)
  writeWrappedText(`- Volume: ${stockPrice.volume.toLocaleString()}`)
  writeWrappedText(`- Data Source: ${stockPrice.source}`)
  yPosition += 2

  writeWrappedText("AI Price Predictions", 14, "bold")
  writeWrappedText(`- 1-Day: ${formatCurrency(predictions.day1)} (confidence: ${predictions.confidence.day1}%)`)
  writeWrappedText(`- 5-Day: ${formatCurrency(predictions.day5)} (confidence: ${predictions.confidence.day5}%)`)
  writeWrappedText(`- 10-Day: ${formatCurrency(predictions.day10)} (confidence: ${predictions.confidence.day10}%)`)
  yPosition += 2

  if (reportType === "investor") {
    writeWrappedText("Investment Recommendation", 14, "bold")
    if (recommendation) {
      writeWrappedText(`- Action: ${recommendation.action}`)
      writeWrappedText(`- Confidence: ${recommendation.confidence}%`)
      writeWrappedText(`- Target Price: ${formatCurrency(recommendation.targetPrice)}`)
      writeWrappedText(`- Stop Loss: ${formatCurrency(recommendation.stopLoss)}`)
      writeWrappedText("Reasoning:", 11, "bold")
      recommendation.reasoning.forEach((reason) => writeWrappedText(`- ${reason}`, 11, "normal", 3))
    } else {
      writeWrappedText("Recommendation data is unavailable for this report.")
    }
    yPosition += 2
  }

  if (reportType === "financial-advisor") {
    writeWrappedText("Risk Assessment", 14, "bold")
    if (riskAssessment) {
      writeWrappedText(`- Risk Score: ${riskAssessment.score.toFixed(1)}/10`)
      writeWrappedText(`- Volatility: ${(riskAssessment.volatility * 100).toFixed(1)}%`)
      writeWrappedText(`- Beta: ${riskAssessment.beta}`)
      writeWrappedText(`- Sharpe Ratio: ${riskAssessment.sharpeRatio}`)
      writeWrappedText(`- Max Drawdown: ${(riskAssessment.maxDrawdown * 100).toFixed(1)}%`)
    } else {
      writeWrappedText("Risk assessment data is unavailable for this report.")
    }
    yPosition += 2
  }

  if (reportType === "data-scientist") {
    writeWrappedText("Technical Analysis", 14, "bold")
    if (technicalAnalysis) {
      writeWrappedText(`- RSI (14): ${technicalAnalysis.rsi.toFixed(1)}`)
      writeWrappedText(`- MACD: ${technicalAnalysis.macd.toFixed(2)}`)
      writeWrappedText(`- 20-day SMA: ${formatCurrency(technicalAnalysis.sma20)}`)
      writeWrappedText(`- 50-day SMA: ${formatCurrency(technicalAnalysis.sma50)}`)
      writeWrappedText(`- Support Level: ${formatCurrency(technicalAnalysis.support)}`)
      writeWrappedText(`- Resistance Level: ${formatCurrency(technicalAnalysis.resistance)}`)
    } else {
      writeWrappedText("Technical analysis data is unavailable for this report.")
    }
    yPosition += 2
  }

  if (reportType === "general") {
    writeWrappedText("General Summary", 14, "bold")
    writeWrappedText(
      `NVIDIA is currently trading at ${formatCurrency(stockPrice.price)} with a daily move of ${formatPercent(stockPrice.changePercent)}.`,
    )
    writeWrappedText(
      `Near-term model output suggests ${formatCurrency(predictions.day1)} (1 day), ${formatCurrency(predictions.day5)} (5 day), and ${formatCurrency(predictions.day10)} (10 day).`,
    )
    yPosition += 2
  }

  if (historicalData.length > 0) {
    writeWrappedText("Recent Historical Data", 14, "bold")
    writeWrappedText(`- Total data points: ${historicalData.length}`)
    historicalData.slice(-5).forEach((day) => {
      writeWrappedText(`- ${day.date}: Close ${formatCurrency(day.close)} | Volume ${day.volume.toLocaleString()}`, 10)
    })
  }

  ensureSpace(10)
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(8)
  pdf.text(
    "Disclaimer: This report is for informational purposes only and is not financial advice.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  )

  const fileName = `NVDA_${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`
  pdf.save(fileName)
}

// Generate chart image and add to PDF
export async function generateChartPDF(chartElementId: string, reportData: PDFReportData): Promise<void> {
  const chartElement = document.getElementById(chartElementId)

  if (!chartElement) {
    // Fallback to text-based PDF if chart not found
    await generatePDFReport(reportData)
    return
  }

  try {
    // Capture chart as image
    const canvas = await html2canvas(chartElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
    })

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Add chart image to PDF
    const imgData = canvas.toDataURL("image/png")
    const imgWidth = pageWidth - 40
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Header
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("NVIDIA Stock Chart Analysis", pageWidth / 2, 20, { align: "center" })

    // Add chart
    pdf.addImage(imgData, "PNG", 20, 30, imgWidth, Math.min(imgHeight, pageHeight - 80))

    // Add text analysis below chart
    const yPosition = Math.min(imgHeight + 40, pageHeight - 60)

    const { stockPrice, predictions } = reportData.stockAnalysis
    if (stockPrice && predictions) {
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `Current Price: $${stockPrice.price} (${stockPrice.change >= 0 ? "+" : ""}${stockPrice.changePercent}%)`,
        20,
        yPosition,
      )
      pdf.text(
        `Predictions: 1D: $${predictions.day1} | 5D: $${predictions.day5} | 10D: $${predictions.day10}`,
        20,
        yPosition + 10,
      )
    }

    // Save
    const fileName = `NVDA_chart_analysis_${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error("Chart PDF generation failed:", error)
    // Fallback to text-based PDF
    await generatePDFReport(reportData)
  }
}
