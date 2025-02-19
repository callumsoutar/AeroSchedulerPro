"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LessonStatusProps {
  onStatusChange: (status: 'PASS' | 'FAIL' | 'INCOMPLETE') => void;
}

export default function LessonStatus({ onStatusChange }: LessonStatusProps) {
  const [status, setStatus] = useState<"passed" | "not-yet-competent">("not-yet-competent")

  useEffect(() => {
    // Map internal status to the format expected by parent
    const statusMap = {
      "passed": "PASS",
      "not-yet-competent": "FAIL"
    } as const;
    
    onStatusChange(statusMap[status]);
  }, [status, onStatusChange]);

  return (
    <div className="bg-white rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 border-2",
            status === "passed" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300",
          )}
          onClick={() => setStatus("passed")}
        >
          <div className="py-2 px-3 text-center">
            <span className={cn("font-medium", status === "passed" ? "text-green-600" : "text-gray-700")}>
              Passed
            </span>
          </div>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 border-2",
            status === "not-yet-competent" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300",
          )}
          onClick={() => setStatus("not-yet-competent")}
        >
          <div className="py-2 px-3 text-center">
            <span
              className={cn(
                "font-medium",
                status === "not-yet-competent" ? "text-purple-600" : "text-gray-700",
              )}
            >
              Not Yet Competent
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}

