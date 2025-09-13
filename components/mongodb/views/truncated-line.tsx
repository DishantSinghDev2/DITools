// components/mongodb/views/truncated-line.tsx
"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TruncatedLineProps {
  lineHtml: string
}

// Helper to get plain text for the tooltip
const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export function TruncatedLine({ lineHtml }: TruncatedLineProps) {
  const lineRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const plainTextLine = stripHtml(lineHtml)

  useLayoutEffect(() => {
    const checkTruncation = () => {
      const element = lineRef.current
      if (element) {
        // If the scrollable width is greater than the visible width, it's truncated
        const isOverflowing = element.scrollWidth > element.clientWidth
        setIsTruncated(isOverflowing)
      }
    }
    
    checkTruncation()

    // Use ResizeObserver for robust checking if the element's size changes
    const observer = new ResizeObserver(checkTruncation)
    if (lineRef.current) {
        observer.observe(lineRef.current)
    }

    // Cleanup
    return () => observer.disconnect()
  }, [lineHtml])

  const lineContent = (
    <div
      ref={lineRef}
      className="truncate whitespace-pre"
      dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
    />
  )

  if (isTruncated) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{lineContent}</TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs">{plainTextLine}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // If not truncated, render the line without the tooltip wrapper
  return lineContent
}