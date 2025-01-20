"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Booking } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  Loader2, 
  Plane, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Send,
  Timer,
  History,
  MessageSquare,
  MoreVertical,
  LogIn,
  LogOut,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SimplifiedFlyingBadge from "@/components/flying-badge";

export default function BookingViewPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchBooking() {
      try {
        console.log('Fetching booking data...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', { hasSession: !!sessionData?.session, error: sessionError });

        if (sessionError || !sessionData?.session) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("User")
          .select("organizationId")
          .eq("id", sessionData.session.user.id)
          .single();

        console.log('User data:', { userData, error: userError });

        if (userError || !userData?.organizationId) {
          setError("Organization not found");
          setLoading(false);
          return;
        }

        console.log('Fetching booking with ID:', params.id);
        const { data, error } = await supabase
          .from("Booking")
          .select(`
            *,
            description,
            aircraft:aircraft_id(
              id,
              registration,
              aircraft_type:type_id(
                id,
                type,
                model
              )
            ),
            instructor:instructor_id(
              id,
              name,
              email
            ),
            user:user_id(
              id,
              name,
              email
            ),
            booking_details:booking_details_id(
              route,
              comments,
              instructor_comment,
              passengers
            ),
            flight_times:booking_flight_times_id(
              start_hobbs,
              end_hobbs,
              start_tacho,
              end_tacho,
              flight_time
            ),
            lesson:lesson_id(*)
          `)
          .eq("id", params.id)
          .eq("organization_id", userData.organizationId)
          .single();

        console.log('Raw booking data:', data);
        console.log('Lesson data specifically:', {
          lesson_id: data?.lesson_id,
          lesson: data?.lesson,
          hasLesson: !!data?.lesson
        });

        if (error) {
          console.error('Error fetching booking:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        setBooking(data);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    }

    fetchBooking();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Booking not found
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Flight Details</h1>
            {booking.status === "flying" ? (
              <SimplifiedFlyingBadge />
            ) : (
              <Badge
                className={`px-4 py-2 text-base ${
                  booking.status === "confirmed"
                    ? "bg-green-50 text-green-700"
                    : booking.status === "unconfirmed"
                    ? "bg-yellow-50 text-yellow-700"
                    : booking.status === "cancelled"
                    ? "bg-red-50 text-red-700"
                    : booking.status === "inProgress"
                    ? "bg-purple-50 text-purple-700"
                    : booking.status === "complete"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === "flying" ? (
              <Button className="bg-green-600 hover:bg-green-700">
                <LogIn className="w-4 h-4 mr-2" />
                Check-in Flight
              </Button>
            ) : booking.status === "confirmed" ? (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <LogOut className="w-4 h-4 mr-2" />
                Check Flight Out
              </Button>
            ) : null}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Print Checkout Sheet
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Send className="w-4 h-4 mr-2" />
                  Send Booking Confirmation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Booking Details Card - Spans 4 columns */}
        <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-5 h-5 text-primary" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Flight Times Section */}
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                Flight Times
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="text-base font-medium">
                    {format(new Date(booking.startTime), "PPp")}
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="text-base font-medium">
                    {format(new Date(booking.endTime), "PPp")}
                  </p>
                </div>
              </div>
            </div>

            {/* Flight Times Details */}
            {booking.flight_times && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Hobbs Time</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Start</p>
                        <p className="font-medium">{booking.flight_times.start_hobbs || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End</p>
                        <p className="font-medium">{booking.flight_times.end_hobbs || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Tacho Time</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Start</p>
                        <p className="font-medium">{booking.flight_times.start_tacho || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End</p>
                        <p className="font-medium">{booking.flight_times.end_tacho || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {booking.flight_times.flight_time && (
                  <div className="flex justify-end mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                      <Timer className="w-4 h-4" />
                      Flight Time: {booking.flight_times.flight_time} hours
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Aircraft and Description Section - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Aircraft Details Section - More Compact */}
              {booking.aircraft && (
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Plane className="w-4 h-4 text-primary" />
                    Aircraft
                  </h3>
                  <div className="inline-block bg-muted/30 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-semibold">{booking.aircraft.registration}</p>
                      <Badge variant="outline" className="text-xs">
                        {booking.aircraft.aircraft_type?.type} - {booking.aircraft.aircraft_type?.model}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Section with Collapsible */}
              {booking.description && (
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    Description
                  </h3>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    {booking.description.length > 100 ? (
                      <div className="space-y-2">
                        <p className="text-sm line-clamp-2">{booking.description}</p>
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
                              <p className="text-sm">{booking.description}</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <p className="text-sm">{booking.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Details Section */}
            {booking.lesson && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  Lesson Details
                </h3>
                <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Lesson Name</p>
                      <p className="text-sm font-medium">{booking.lesson.name}</p>
                    </div>
                    {booking.lesson.duration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm">{booking.lesson.duration} hours</p>
                      </div>
                    )}
                  </div>
                  {booking.lesson.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Lesson Description</p>
                      <p className="text-sm">{booking.lesson.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* People Card - Spans 2 columns */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" />
              People
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Member</p>
              {booking.user ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{booking.user.name}</p>
                    <p className="text-xs text-muted-foreground">{booking.user.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No member assigned</p>
              )}
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Instructor</p>
              {booking.instructor ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{booking.instructor.name}</p>
                    <p className="text-xs text-muted-foreground">{booking.instructor.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No instructor assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Information Card - Spans full width */}
        <Card className="lg:col-span-6 hover:shadow-lg transition-shadow">
          <Tabs defaultValue="aircraft" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aircraft" className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Aircraft
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
              <TabsContent value="aircraft" className="mt-0">
                <p className="text-muted-foreground">Aircraft details will be displayed here</p>
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <p className="text-muted-foreground">Booking history will be displayed here</p>
              </TabsContent>
              <TabsContent value="comments" className="mt-0">
                {booking.booking_details?.comments || booking.booking_details?.instructor_comment ? (
                  <div className="space-y-4">
                    {booking.booking_details.comments && (
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Comments</p>
                        <p className="text-sm">{booking.booking_details.comments}</p>
                      </div>
                    )}
                    {booking.booking_details.instructor_comment && (
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Instructor Comments</p>
                        <p className="text-sm">{booking.booking_details.instructor_comment}</p>
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
      </div>
    </div>
  );
} 