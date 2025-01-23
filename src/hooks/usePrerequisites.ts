import { useState } from 'react';

interface PrerequisiteCheck {
  status: 'success' | 'error';
  message: string;
  missing_prerequisites?: {
    id: string;
    name: string;
    objective: any;
  }[];
}

export function usePrerequisites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPrerequisites = async (studentId: string, lessonId: string): Promise<PrerequisiteCheck | null> => {
    try {
      console.log('usePrerequisites: Starting check with:', { studentId, lessonId });
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/check-prerequisites?student_id=${studentId}&lesson_id=${lessonId}`);
      const data = await response.json();
      console.log('usePrerequisites: API response:', data);

      if (!response.ok) {
        console.error('usePrerequisites: API error:', data.error);
        throw new Error(data.error || 'Failed to check prerequisites');
      }

      return data;
    } catch (err) {
      const error = err as Error;
      console.error('usePrerequisites: Error occurred:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
      console.log('usePrerequisites: Check completed');
    }
  };

  return {
    checkPrerequisites,
    loading,
    error
  };
} 