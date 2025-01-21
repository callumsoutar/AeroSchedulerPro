import { Badge } from "@/components/ui/badge"

interface LessonHeaderProps {
  title: string
  objective: string
  status: "complete" | "in-progress"
}

export default function LessonHeader({ title, objective, status }: LessonHeaderProps) {
  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-base text-gray-600 mt-1">{objective}</p>
        </div>
        <Badge
          variant={status === "complete" ? "default" : "secondary"}
          className={`${status === "complete" ? "bg-purple-600" : "bg-gray-400"} text-white ml-4`}
        >
          {status === "complete" ? "Complete" : "In Progress"}
        </Badge>
      </div>
    </div>
  )
}

