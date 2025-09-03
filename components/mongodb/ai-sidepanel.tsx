"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bot } from "lucide-react"

// Dynamic import to avoid type coupling if props differ
const AIAssistant: any = dynamic(() => import("../../app/mongodb/AIAssistant").then((m) => m.default || m), {
  ssr: false,
})

export function AISidePanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" size="sm" aria-label="Open AI Assistant">
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gemini AI Assistant</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <AIAssistant />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default AISidePanel
