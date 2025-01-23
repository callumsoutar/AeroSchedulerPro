"use client"

import { useState, useEffect } from "react"
import { Star, ChevronDown, ChevronRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useLessonGradings } from "@/hooks/useLessonGradings"
import { Skeleton } from "@/components/ui/skeleton"
import { DebriefPerformanceJSON } from "@/types"

interface GradingTableProps {
  lessonId: string | null;
  onGradingsChange: (gradings: DebriefPerformanceJSON[]) => void;
}

export default function GradingTable({ lessonId, onGradingsChange }: GradingTableProps) {
  const { data: gradings, isLoading } = useLessonGradings(lessonId || undefined);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!gradings) return;

    const performanceData: DebriefPerformanceJSON[] = gradings.map(grading => ({
      grading_id: grading.id,
      grade: ratings[grading.id] || 0,
      comments: comments[grading.id] || null,
      name: grading.name,
      description: grading.description
    }));

    onGradingsChange(performanceData);
  }, [gradings, ratings, comments, onGradingsChange]);

  const handleRatingChange = (gradingId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [gradingId]: rating
    }));
  }

  const handleCommentChange = (gradingId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [gradingId]: comment
    }));
  }

  const toggleDescription = (gradingId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [gradingId]: !prev[gradingId]
    }));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!gradings?.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No grading criteria found for this lesson.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">Exercise</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Rating</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50%]">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {gradings.map((grading, index) => (
            <tr key={grading.id} className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
              <td className="px-4 py-4">
                <div className="flex items-start space-x-2">
                  <button
                    onClick={() => toggleDescription(grading.id)}
                    className="group flex items-center mt-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={expandedRows[grading.id] ? "Hide details" : "Show details"}
                  >
                    <div className="relative">
                      {expandedRows[grading.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{grading.name}</div>
                      {grading.description && !expandedRows[grading.id] && (
                        <button
                          onClick={() => toggleDescription(grading.id)}
                          className="ml-2 text-xs text-purple-600 hover:text-purple-700"
                        >
                          View details
                        </button>
                      )}
                    </div>
                    {expandedRows[grading.id] && grading.description && (
                      <div className="text-xs text-gray-500 mt-1 pr-4 animate-fadeIn">
                        {grading.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer transition-colors ${
                        star <= (ratings[grading.id] || 0) ? "text-purple-600 fill-purple-600" : "text-gray-300"
                      }`}
                      onClick={() => handleRatingChange(grading.id, star)}
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-4">
                <Textarea
                  value={comments[grading.id] || ""}
                  onChange={(e) => handleCommentChange(grading.id, e.target.value)}
                  placeholder="Add comments..."
                  className="w-full min-h-[60px] text-sm py-2 px-3 border-gray-200 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Add this to your globals.css or equivalent
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(-4px); }
//   to { opacity: 1; transform: translateY(0); }
// }

// .animate-fadeIn {
//   animation: fadeIn 0.2s ease-out;
// }

