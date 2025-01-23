"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface LessonDebriefPerformance {
  id: string;
  description: string;
  grade: number;
  comments: string;
  lesson_debrief_id: string;
  created_at: string;
}

interface LessonDebrief {
  id: string;
  booking_id: string;
  lesson_status: 'PASS' | 'FAIL' | 'INCOMPLETE';
  overall_comments: string;
  created_at: string;
}

interface LessonDebriefTableProps {
  bookingId: string;
}

export function LessonDebriefTable({ bookingId }: LessonDebriefTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<LessonDebrief | null>(null);
  const [performances, setPerformances] = useState<LessonDebriefPerformance[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchDebriefData() {
      try {
        setLoading(true);
        setError(null);

        // First get the debrief record
        const { data: debriefData, error: debriefError } = await supabase
          .from('lesson_debriefs')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (debriefError) {
          if (debriefError.code === 'PGRST116') {
            // This is the "no rows returned" error code from PostgREST
            setError('No debrief found for this booking');
            setLoading(false);
            return;
          }
          throw debriefError;
        }

        if (!debriefData) {
          setError('No debrief found for this booking');
          setLoading(false);
          return;
        }

        setDebrief(debriefData);

        // Then get all related performances
        const { data: performancesData, error: performancesError } = await supabase
          .from('lesson_debrief_performances')
          .select('*')
          .eq('lesson_debrief_id', debriefData.id)
          .order('created_at', { ascending: true });

        if (performancesError) throw performancesError;
        setPerformances(performancesData);

      } catch (err) {
        console.error('Error fetching debrief data:', err);
        setError('Failed to load debrief data');
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      fetchDebriefData();
    }
  }, [bookingId, supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !debrief) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground">
        {error || 'No debrief found for this booking'}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-xl font-semibold">Lesson Debrief</CardTitle>
        <Badge
          className={`px-6 py-2 text-base font-medium ${
            debrief.lesson_status === 'PASS'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : debrief.lesson_status === 'FAIL'
              ? 'bg-red-100 text-red-800 hover:bg-red-200'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          {debrief.lesson_status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Table */}
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Performance Item</TableHead>
                <TableHead className="w-24 text-center font-semibold">Grade</TableHead>
                <TableHead className="font-semibold">Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performances.map((performance) => (
                <TableRow key={performance.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {performance.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`px-3 py-1 ${
                        performance.grade >= 4
                          ? 'bg-green-100 text-green-800'
                          : performance.grade >= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {performance.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {performance.comments}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Overall Comments */}
        {debrief.overall_comments && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Overall Comments
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border">
              {debrief.overall_comments}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 