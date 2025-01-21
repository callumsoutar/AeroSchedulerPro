"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OverallComments() {
  const [comment, setComment] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg">
      <div 
        className="flex items-center cursor-pointer py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="text-sm text-gray-500">
            {isExpanded ? "Hide Comments" : "Show Comments"}
          </span>
        </div>
      </div>
      
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add overall comments for the lesson..."
          className="w-full"
          rows={4}
        />
        <div className="mt-2">
          <span className="text-sm text-gray-500">{comment.length} / 500 characters</span>
        </div>
      </div>
    </div>
  )
}

