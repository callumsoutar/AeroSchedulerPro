import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { LessonInfo } from "@/utils/booking-queries"

interface LessonHeaderProps {
  lesson: LessonInfo | null;
  status: "complete" | "in-progress";
}

export default function LessonHeader({ lesson, status }: LessonHeaderProps) {
  if (!lesson?.lesson) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">No Lesson Assigned</h2>
            <p className="text-base text-gray-600 mt-1">This booking does not have a lesson assigned.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="space-y-6">
        {/* Lesson Name and Status */}
        <div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold text-gray-900">{lesson.lesson.name}</h3>
              <div className="flex items-center gap-3">
                <Badge
                  variant={status === "complete" ? "default" : "secondary"}
                  className={`${
                    status === "complete" 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {status === "complete" ? "Complete" : "In Progress"}
                </Badge>
                {lesson.lesson.duration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{lesson.lesson.duration} minutes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {lesson.lesson.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Description</h3>
            <p className="text-base text-gray-700">
              {lesson.lesson.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

