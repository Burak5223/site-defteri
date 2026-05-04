"use client"

import { cn } from "@/lib/utils"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ListItemProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconBg?: string
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }
  rightText?: string
  rightSubtext?: string
  onClick?: () => void
  className?: string
}

export function ListItem({
  title,
  subtitle,
  icon: Icon,
  iconBg = "bg-muted",
  badge,
  rightText,
  rightSubtext,
  onClick,
  className,
}: ListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all active:scale-[0.98]",
        className,
      )}
    >
      {Icon && (
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{title}</p>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="text-[10px] px-1.5 py-0">
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {(rightText || rightSubtext) && (
        <div className="text-right shrink-0">
          {rightText && <p className="text-sm font-medium text-foreground">{rightText}</p>}
          {rightSubtext && <p className="text-xs text-muted-foreground">{rightSubtext}</p>}
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  )
}

