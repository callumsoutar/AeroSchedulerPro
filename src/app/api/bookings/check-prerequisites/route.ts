import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');
    const lesson_id = searchParams.get('lesson_id');

    if (!student_id || !lesson_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: lesson, error: lessonError } = await supabase
      .from('Lesson')
      .select('prerequisites, name')
      .eq('id', lesson_id)
      .single();

    if (lessonError) {
      return NextResponse.json(
        { error: 'Failed to fetch lesson details' },
        { status: 500 }
      );
    }

    let prerequisiteIds: string[] = [];
    if (lesson?.prerequisites) {
      if (Array.isArray(lesson.prerequisites) && lesson.prerequisites[0]?.prerequisites) {
        prerequisiteIds = lesson.prerequisites[0].prerequisites;
      } else if (Array.isArray(lesson.prerequisites)) {
        prerequisiteIds = lesson.prerequisites;
      }
    }

    if (!prerequisiteIds.length) {
      return NextResponse.json({
        status: 'success',
        message: 'No prerequisites required'
      });
    }

    const { data: completedLessons, error: completedError } = await supabase
      .from('student_lessons')
      .select('lesson_id')
      .eq('student_id', student_id);

    if (completedError) {
      return NextResponse.json(
        { error: 'Failed to fetch completed lessons' },
        { status: 500 }
      );
    }

    const completedLessonIds = new Set(completedLessons?.map(cl => cl.lesson_id) || []);
    const missingPrerequisites = prerequisiteIds.filter(
      prereqId => !completedLessonIds.has(prereqId)
    );

    if (missingPrerequisites.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'All prerequisites completed'
      });
    }

    const { data: missingLessons, error: missingError } = await supabase
      .from('Lesson')
      .select('id, name, objective')
      .in('id', missingPrerequisites);

    if (missingError) {
      return NextResponse.json(
        { error: 'Failed to fetch missing lesson details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'error',
      message: 'Prerequisite lessons not completed',
      missing_prerequisites: missingLessons
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 