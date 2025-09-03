"use client"

import { useEffect, useState } from "react"

/**
 * useMobile
 * - SSR-safe: defaults to false on server to avoid hydration mismatches
 * - Uses matchMedia to track viewport width
 * - breakpoint defaults to 768px (Tailwind md)
 */
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Guard for non-browser environments
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      setIsMobile(false)
      return
    }

    const query = `(max-width: ${breakpoint - 1}px)`
    const mq = window.matchMedia(query)

    const update = () => setIsMobile(mq.matches)
    update()

    // Support older browsers
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update)
      return () => mq.removeEventListener("change", update)
    } else {
      mq.addListener(update)
      return () => mq.removeListener(update)
    }
  }, [breakpoint])

  return isMobile
}
