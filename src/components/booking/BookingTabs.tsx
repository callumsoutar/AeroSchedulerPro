import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History,
  MessageSquare,
  Timer,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useBooking } from "@/hooks/useBooking";
import { useState } from "react";
import { LessonDebriefTable } from "@/components/LessonDebriefTable";

interface BookingTabsProps {
  bookingId: string;
}

export function BookingTabs({ bookingId }: BookingTabsProps) {
  const [activeTab, setActiveTab] = useState("flight_times");
  const { flightTimes, bookingDetails, loading, error } = useBooking(bookingId, {
    includeFlightTimes: activeTab === "flight_times"
  });

  const formatNumber = (num: number | undefined | null) => num?.toFixed(1) || '-';

  const renderFlightTimes = () => {
    if (!flightTimes && !loading.flightTimes) return null;

    if (loading.flightTimes) {
      return <p className="text-muted-foreground">Loading flight times...</p>;
    }

    if (error.flightTimes) {
      return <p className="text-red-500">Error loading flight times: {error.flightTimes}</p>;
    }

    if (!flightTimes?.flight_times) {
      return <p className="text-muted-foreground">No flight times recorded</p>;
    }

    const { start_hobbs, end_hobbs, start_tacho, end_tacho, flight_time } = flightTimes.flight_times;

    return (
      <div className="grid grid-cols-3 gap-3">
        {/* Total Flight Time */}
        <div className="bg-purple-50/50 rounded-lg p-3">
          <h3 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Total Flight Time
          </h3>
          <p className="text-2xl font-bold text-purple-700">{flight_time || '-'} hours</p>
        </div>

        {/* Hobbs Time */}
        <div className="bg-gray-50/50 rounded-lg p-3">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Hobbs Time</h3>
          <div className="grid grid-cols-7 gap-1 items-center text-sm">
            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">Start</p>
              <p className="font-medium">{formatNumber(start_hobbs)}</p>
            </div>
            <div className="col-span-1 flex justify-center">
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </div>
            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">End</p>
              <p className="font-medium">{formatNumber(end_hobbs)}</p>
            </div>
            <div className="col-span-7 mt-1 pt-1 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total</span>
                <span className="font-medium text-purple-600">
                  {start_hobbs && end_hobbs ? formatNumber(end_hobbs - start_hobbs) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tacho Time */}
        <div className="bg-gray-50/50 rounded-lg p-3">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Tacho Time</h3>
          <div className="grid grid-cols-7 gap-1 items-center text-sm">
            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">Start</p>
              <p className="font-medium">{formatNumber(start_tacho)}</p>
            </div>
            <div className="col-span-1 flex justify-center">
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </div>
            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">End</p>
              <p className="font-medium">{formatNumber(end_tacho)}</p>
            </div>
            <div className="col-span-7 mt-1 pt-1 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total</span>
                <span className="font-medium text-purple-600">
                  {start_tacho && end_tacho ? formatNumber(end_tacho - start_tacho) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="lg:col-span-6 hover:shadow-lg transition-shadow">
      <Tabs defaultValue="flight_times" className="w-full" onValueChange={setActiveTab}>
        <CardHeader>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flight_times" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Flight Times
            </TabsTrigger>
            <TabsTrigger value="debrief" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Lesson Debrief
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="flight_times" className="mt-0">
            {renderFlightTimes()}
          </TabsContent>
          <TabsContent value="debrief" className="mt-0">
            {activeTab === 'debrief' && <LessonDebriefTable bookingId={bookingId} />}
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <p className="text-muted-foreground">Booking history will be displayed here</p>
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            {bookingDetails?.booking_details?.comments || bookingDetails?.booking_details?.instructor_comment ? (
              <div className="space-y-4">
                {bookingDetails.booking_details.comments && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Comments</p>
                    <p className="text-sm">{bookingDetails.booking_details.comments}</p>
                  </div>
                )}
                {bookingDetails.booking_details.instructor_comment && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Instructor Comments</p>
                    <p className="text-sm">{bookingDetails.booking_details.instructor_comment}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No comments available</p>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
} 