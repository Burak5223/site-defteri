"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} className="text-primary h-8 px-2">
          {action.label}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  )
}

