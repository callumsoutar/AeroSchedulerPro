import { LessonInfo } from "@/utils/booking-queries"
import { usePrerequisites } from "@/hooks/usePrerequisites";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

interface LessonDescriptionProps {
  lesson: LessonInfo | null;
  studentId?: string | null;
}

export default function LessonDescription({ lesson, studentId }: LessonDescriptionProps) {
  const { checkPrerequisites, loading: checkingPrerequisites } = usePrerequisites();
  const [missingPrerequisites, setMissingPrerequisites] = useState<{ name: string }[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    setHasChecked(false);
  }, [studentId, lesson?.lesson]);

  useEffect(() => {
    const lessonData = lesson?.lesson;

    async function checkLessonPrerequisites() {
      if (!studentId || !lessonData?.id || hasChecked || checkingPrerequisites) {
        return;
      }

      const result = await checkPrerequisites(studentId, lessonData.id);

      if (result?.status === 'error' && result.missing_prerequisites) {
        setMissingPrerequisites(result.missing_prerequisites);
      } else {
        setMissingPrerequisites([]);
      }
      
      setHasChecked(true);
    }

    checkLessonPrerequisites();
  }, [studentId, lesson?.lesson, checkPrerequisites, hasChecked, checkingPrerequisites]);

  if (!lesson?.lesson) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">No Lesson Description</h2>
            <p className="text-base text-gray-600 mt-1">This lesson does not have a description.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('Full lesson data:', lesson.lesson);
  console.log('Raw air_exercise data:', lesson.lesson.air_exercise);
  console.log('Briefing URL:', lesson.lesson.briefing_url);
  
  const objectives = lesson.lesson.objective?.objectives || [];
  const airExercises = (lesson.lesson.air_exercise as any)?.air_exercise || [];
  
  console.log('Processed airExercises:', airExercises);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <a 
            href={lesson?.lesson?.briefing_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              lesson?.lesson?.briefing_url && lesson.lesson.briefing_url.length > 0
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 cursor-pointer' 
                : 'text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (!lesson?.lesson?.briefing_url || lesson.lesson.briefing_url.length === 0) {
                e.preventDefault();
              }
            }}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
            <span>View Preflight Briefing</span>
          </a>
        </div>
        
        {/* Prerequisites Warning - Renders first if exists */}
        {missingPrerequisites.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertCircle className="h-5 w-5" />
              <span>Missing Prerequisites:</span>
            </div>
            <ul className="list-disc pl-9 space-y-1 text-red-600">
              {missingPrerequisites.map((prereq, index) => (
                <li key={index}>
                  Student has not completed {prereq.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Objectives Section */}
        {objectives.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Objectives</h3>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <ul className="list-disc pl-5 space-y-2">
                {objectives.map((objective: string, index: number) => (
                  <li key={index} className="text-gray-700">
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Air Exercises Section */}
        {Array.isArray(airExercises) && airExercises.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Air Exercises</h3>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {airExercises.map((exercise: string, index: number) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{exercise}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 