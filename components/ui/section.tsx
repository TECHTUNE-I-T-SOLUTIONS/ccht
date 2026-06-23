import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.ComponentProps<"section"> {
  containerClassName?: string
  fullWidth?: boolean
}

export function Section({
  className,
  containerClassName,
  fullWidth = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)} {...props}>
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16",
          !fullWidth && "max-w-none w-full",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
