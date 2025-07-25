import jsPDF from "jspdf"
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
  const { stockPrice, predictions, recommendation, technicalAnalysis, riskAssessment } = stockAnalysis

  if (!stockPrice || !predictions) {
    throw new Error("Insufficient data for PDF generation")
  }

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize = 12) => {
    pdf.setFontSize(fontSize)
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * (fontSize * 0.4)
    } else {
      pdf.text(text, x, y)
      return y + fontSize * 0.4
    }
  }

  // Header
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text("NVIDIA Stock Analysis Report", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(14)
  pdf.setFont("helvetica", "normal")
  pdf.text(`${userRole} Dashboard`, pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" })
  pdf.text(`Data Source: ${stockPrice.source}`, pageWidth / 2, yPosition + 5, { align: "center" })
  yPosition += 20

  // Current Stock Information
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  yPosition = addText("Current Stock Information", 20, yPosition, undefined, 16)
  yPosition += 5

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  yPosition = addText(`Symbol: ${stockPrice.symbol}`, 20, yPosition)
  yPosition = addText(`Current Price: $${stockPrice.price}`, 20, yPosition)
  yPosition = addText(
    `Change: ${stockPrice.change >= 0 ? "+" : ""}$${stockPrice.change} (${stockPrice.change >= 0 ? "+" : ""}${stockPrice.changePercent}%)`,
    20,
    yPosition,
  )
  yPosition = addText(`Previous Close: $${stockPrice.previousClose}`, 20, yPosition)
  yPosition = addText(`Volume: ${stockPrice.volume.toLocaleString()}`, 20, yPosition)
  yPosition += 10

  // Predictions
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  yPosition = addText("AI Price Predictions", 20, yPosition, undefined, 16)
  yPosition += 5

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  yPosition = addText(
    `1-Day Prediction: $${predictions.day1} (${predictions.confidence.day1}% confidence)`,
    20,
    yPosition,
  )
  yPosition = addText(
    `5-Day Prediction: $${predictions.day5} (${predictions.confidence.day5}% confidence)`,
    20,
    yPosition,
  )
  yPosition = addText(
    `10-Day Prediction: $${predictions.day10} (${predictions.confidence.day10}% confidence)`,
    20,
    yPosition,
  )
  yPosition += 10

  // Role-specific content
  if (reportType === "investor" && recommendation) {
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    yPosition = addText("Investment Recommendation", 20, yPosition, undefined, 16)
    yPosition += 5

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(`Recommendation: ${recommendation.action}`, 20, yPosition)
    yPosition = addText(`Confidence: ${recommendation.confidence}%`, 20, yPosition)
    yPosition = addText(`Target Price: $${recommendation.targetPrice}`, 20, yPosition)
    yPosition = addText(`Stop Loss: $${recommendation.stopLoss}`, 20, yPosition)
    yPosition += 5

    yPosition = addText("Analysis Reasoning:", 20, yPosition)
    recommendation.reasoning.forEach((reason) => {
      yPosition = addText(`• ${reason}`, 25, yPosition, pageWidth - 50)
    })
    yPosition += 10
  }

  if (reportType === "financial-advisor" && riskAssessment) {
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    yPosition = addText("Risk Assessment", 20, yPosition, undefined, 16)
    yPosition += 5

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(`Risk Score: ${riskAssessment.score.toFixed(1)}/10`, 20, yPosition)
    yPosition = addText(`Volatility: ${(riskAssessment.volatility * 100).toFixed(1)}%`, 20, yPosition)
    yPosition = addText(`Beta: ${riskAssessment.beta}`, 20, yPosition)
    yPosition = addText(`Sharpe Ratio: ${riskAssessment.sharpeRatio}`, 20, yPosition)
    yPosition = addText(`Max Drawdown: ${(riskAssessment.maxDrawdown * 100).toFixed(1)}%`, 20, yPosition)
    yPosition += 10
  }

  if (reportType === "data-scientist" && technicalAnalysis) {
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    yPosition = addText("Technical Analysis", 20, yPosition, undefined, 16)
    yPosition += 5

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(`RSI (14): ${technicalAnalysis.rsi.toFixed(1)}`, 20, yPosition)
    yPosition = addText(`MACD: ${technicalAnalysis.macd.toFixed(2)}`, 20, yPosition)
    yPosition = addText(`20-day SMA: $${technicalAnalysis.sma20}`, 20, yPosition)
    yPosition = addText(`50-day SMA: $${technicalAnalysis.sma50}`, 20, yPosition)
    yPosition = addText(`Support Level: $${technicalAnalysis.support}`, 20, yPosition)
    yPosition = addText(`Resistance Level: $${technicalAnalysis.resistance}`, 20, yPosition)
    yPosition += 10
  }

  // Add new page if needed
  if (yPosition > pageHeight - 40) {
    pdf.addPage()
    yPosition = 20
  }

  // Historical Data Summary
  if (stockAnalysis.historicalData.length > 0) {
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    yPosition = addText("Historical Data Summary", 20, yPosition, undefined, 16)
    yPosition += 5

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(`Data Points: ${stockAnalysis.historicalData.length}`, 20, yPosition)

    const recentData = stockAnalysis.historicalData.slice(-5)
    yPosition = addText("Recent 5-Day Performance:", 20, yPosition)

    recentData.forEach((day) => {
      yPosition = addText(`${day.date}: $${day.close} (Vol: ${day.volume.toLocaleString()})`, 25, yPosition)
    })
    yPosition += 10
  }

  // Footer
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "italic")
  pdf.text(
    "Disclaimer: This report is for informational purposes only and should not be considered as financial advice.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" },
  )
  pdf.text(
    "Please consult with a qualified financial advisor before making investment decisions.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" },
  )

  // Save the PDF
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
