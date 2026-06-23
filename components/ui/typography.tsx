import * as React from "react"
import { cn } from "@/lib/utils"

export function TypographyH1({ className, children, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-6xl font-display",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function TypographyH2({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "scroll-m-20 text-3xl font-bold tracking-tight first:mt-0 md:text-4xl font-display",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function TypographyH3({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight font-display",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function TypographyP({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6 font-sans", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function TypographyLead({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xl text-muted-foreground font-sans", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function TypographyTechnical({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("font-technical tracking-widest uppercase", className)}
      {...props}
    >
      {children}
    </span>
  )
}
