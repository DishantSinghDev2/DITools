"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TruncatedLineProps {
  lineHtml: string
}

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

export function TruncatedLine({ lineHtml }: TruncatedLineProps) {
  const lineRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const plainTextLine = stripHtml(lineHtml)

  useLayoutEffect(() => {
    const checkTruncation = () => {
      const el = lineRef.current
      if (el) {
        setIsTruncated(el.scrollWidth > el.clientWidth)
      }
    }

    // Initial check (after paint)
    const raf = requestAnimationFrame(checkTruncation)

    // Watch for resizes
    const resizeObserver = new ResizeObserver(checkTruncation)
    if (lineRef.current) resizeObserver.observe(lineRef.current)

    // Watch for content changes
    const mutationObserver = new MutationObserver(checkTruncation)
    if (lineRef.current) mutationObserver.observe(lineRef.current, { childList: true, characterData: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [lineHtml])

  const lineContent = (
    <div
      ref={lineRef}
      className="truncate whitespace-pre"
      dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
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

  return lineContent
}
