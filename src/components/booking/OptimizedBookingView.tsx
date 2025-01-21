import { useBooking } from '@/hooks/useBooking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2, Plane, FileText, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OptimizedBookingView({ bookingId }: { bookingId: string }) {
  const { 
    basicInfo, 
    lesson,
    loading, 
    error 
  } = useBooking(bookingId);

  if (loading.basic) {
    return (
      <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error.basic) {
    return (
      <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
        <CardContent className="p-8 text-red-500">
          Error loading booking: {error.basic}
        </CardContent>
      </Card>
    );
  }

  if (!basicInfo) {
    return (
      <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
        <CardContent className="p-8 text-gray-500">
          No booking information found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calendar className="w-5 h-5 text-primary" />
          Booking Details
        </CardTitle>
        <Badge variant="secondary" className="text-xs font-medium">
          {basicInfo.flight_type?.name || 'No Flight Type'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scheduled Times Section */}
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            Scheduled Times
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Start Time</p>
              <p className="text-base font-medium">
                {format(new Date(basicInfo.startTime), "PPp")}
              </p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">End Time</p>
              <p className="text-base font-medium">
                {format(new Date(basicInfo.endTime), "PPp")}
              </p>
            </div>
          </div>
        </div>

        {/* Aircraft and Description Section - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Aircraft Details Section */}
          {basicInfo.aircraft && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Plane className="w-4 h-4 text-primary" />
                Aircraft
              </h3>
              <div className="inline-block bg-muted/30 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <p className="text-base font-semibold">{basicInfo.aircraft.registration}</p>
                  <Badge variant="outline" className="text-xs">
                    {basicInfo.aircraft.aircraft_type?.type} - {basicInfo.aircraft.aircraft_type?.model}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Description Section with Collapsible */}
          {basicInfo.description && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                Description
              </h3>
              <div className="bg-muted/30 p-3 rounded-lg">
                {basicInfo.description.length > 100 ? (
                  <div className="space-y-2">
                    <p className="text-sm line-clamp-2">{basicInfo.description}</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs hover:bg-transparent hover:text-primary p-0"
                        >
                          Show more...
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Full Description
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <p className="text-sm">{basicInfo.description}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <p className="text-sm">{basicInfo.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lesson Details Section */}
        {loading.lesson ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          </div>
        ) : lesson?.lesson && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              Lesson Details
            </h3>
            <div className="bg-muted/30 p-3 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Lesson Name</p>
                  <p className="text-sm font-medium">{lesson.lesson.name}</p>
                </div>
                {lesson.lesson.duration && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm">{lesson.lesson.duration} hours</p>
                  </div>
                )}
              </div>
              {lesson.lesson.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Lesson Description</p>
                  <p className="text-sm">{lesson.lesson.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 