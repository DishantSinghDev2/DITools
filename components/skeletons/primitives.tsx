import type React from "react"

type BaseProps = React.HTMLAttributes<HTMLDivElement> & { className?: string }

export function Skeleton({ className = "", ...props }: BaseProps) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} {...props} />
}

export function TextLine({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-3 w-full ${className}`} />
}

export function Circle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />
}

export function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={className} />
}
