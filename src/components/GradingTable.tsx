"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const exercises = [
  "Takeoff",
  "Climb",
  "Crosswind leg",
  "Downwind leg",
  "Base leg",
  "Final approach",
  "Landing",
  "Go-around procedure",
]

export default function GradingTable() {
  const [ratings, setRatings] = useState<number[]>(new Array(exercises.length).fill(0))
  const [comments, setComments] = useState<string[]>(new Array(exercises.length).fill(""))

  const handleRatingChange = (index: number, rating: number) => {
    const newRatings = [...ratings]
    newRatings[index] = rating
    setRatings(newRatings)
  }

  const handleCommentChange = (index: number, comment: string) => {
    const newComments = [...comments]
    newComments[index] = comment
    setComments(newComments)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise, index) => (
            <tr key={exercise} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900">{exercise}</td>
              <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500">
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 cursor-pointer transition-colors ${
                        star <= ratings[index] ? "text-purple-600 fill-purple-600" : "text-gray-300"
                      }`}
                      onClick={() => handleRatingChange(index, star)}
                    />
                  ))}
                </div>
              </td>
              <td className="px-3 py-1.5 text-sm text-gray-500">
                <Textarea
                  value={comments[index]}
                  onChange={(e) => handleCommentChange(index, e.target.value)}
                  placeholder="Add comments..."
                  className="w-full min-h-[40px] text-sm py-1 px-2"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

