import { useBooking } from '@/hooks/useBooking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';

export function OptimizedPeopleView({ bookingId }: { bookingId: string }) {
  const { 
    people,
    loading,
    error 
  } = useBooking(bookingId);

  if (loading.people) {
    return (
      <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-primary" />
            People
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error.people) {
    return (
      <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-primary" />
            People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-red-500">
            Error loading people: {error.people}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
          {people?.user ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{people.user.name}</p>
                <p className="text-xs text-muted-foreground">{people.user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No member assigned</p>
          )}
        </div>
        <div className="bg-muted/30 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">Instructor</p>
          {people?.instructor ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{people.instructor.name}</p>
                <p className="text-xs text-muted-foreground">{people.instructor.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No instructor assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 