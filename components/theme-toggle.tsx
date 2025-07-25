"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme} className="bg-transparent">
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </>
      )}
    </Button>
  )
}
