// components/mongodb/views/json-view.tsx
"use client"

import { useState } from "react"
import { MongoDoc } from "../data-grid"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, Copy, CopyPlus, Save, XCircle } from "lucide-react"
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism-dark.css' // Using a theme that looks good
import { TruncatedLine } from "./truncated-line"

// Helper to strip HTML tags for tooltip content
const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

export function JsonView({ doc, isSelected, onToggleSelection, onUpdate, onDelete, onDuplicate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const idString = String(doc._id?.$oid || doc._id)

  const handleEdit = () => {
    const { _id, ...editableDoc } = doc
    setEditContent(JSON.stringify(editableDoc, null, 2))
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent("")
    setError(null)
  }

  const handleSave = async () => {
    try {
      const parsedUpdate = JSON.parse(editContent)
      setError(null)
      await onUpdate(doc._id, { $set: parsedUpdate })
      setIsEditing(false)
    } catch (e: any) {
      setError("Invalid JSON: " + e.message)
    }
  }

  // --- NEW: Truncation Logic ---
  const renderPrettyJson = () => {
    const prettyJson = JSON.stringify(doc, null, 2);
    const highlightedHtml = highlight(prettyJson, languages.json, 'json');
    const lines = highlightedHtml.split('\n');

    return (
      <pre className="text-xs w-full font-mono">
        {lines.map((line, index) => (
          // Use the new smart component for each line
          <TruncatedLine key={index} lineHtml={line} />
        ))}
      </pre>
    )
  }

  return (
    <Card className="group relative hover:bg-muted/30 transition-colors">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit}><Edit className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent>Edit Document</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(doc)}><CopyPlus className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent>Duplicate Document</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(JSON.stringify(doc, null, 2))}><Copy className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent>Copy JSON</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => confirm('Are you sure you want to delete this document?') && onDelete(doc._id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent>Delete Document</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      <div className="p-4 pl-10">
        <p className="text-xs font-mono text-muted-foreground mb-2">_id: {idString}</p>
        {!isEditing ? (
          // Use the new rendering function
          renderPrettyJson()
        ) : (
          <div>
            <div className="border rounded-md font-mono text-xs bg-[#282c34]">
                 <Editor
                    value={editContent}
                    onValue-change={code => setEditContent(code)}
                    highlight={code => highlight(code, languages.json, 'json')}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        color: '#abb2bf',
                    }}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <div className="flex items-center gap-2 mt-2">
                <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2"/> Save Changes</Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}><XCircle className="h-4 w-4 mr-2"/> Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}