"use client";

import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarIcon, 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon, 
  UserIcon, 
  BuildingIcon, 
  PencilIcon,
  GlobeIcon,
  CreditCardIcon,
  IdCard,
  HeartPulseIcon,
  AwardIcon,
  ClipboardCheckIcon,
  PlaneIcon,
  ClockIcon,
  PlusIcon
} from "lucide-react";
import Image from "next/image";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { MemberAccountOverview } from "@/components/member/MemberAccountOverview";

interface PilotDetails {
  id: string;
  caaClientNumber?: string;
  licenceType?: string;
  typeRatings: string[];
  class1Expiry?: string;
  class2Expiry?: string;
  dl9Expiry?: string;
  bfrExpiry?: string;
  endorsements: string[];
  primeRatings: string[];
}

interface Membership {
  id: string;
  membershipType: string;
  status: 'ACTIVE' | 'EXPIRED';
  startDate?: string;
  expiryDate?: string;
  paid: boolean;
  discount?: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  memberStatus: string;
  phone?: string;
  photo_url?: string;
  birthDate?: string;
  joinDate?: string;
  lastFlight?: string;
  memberNumber?: string;
  isStaff?: boolean;
  gender?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  UserPilotDetails: PilotDetails[];
  UserMemberships: Membership[];
}

async function getMemberDetails(memberId: string): Promise<Member> {
  console.log('Fetching member details for ID:', memberId);
  try {
    const response = await fetch(`/api/members/${memberId}`);
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(`Failed to fetch member details: ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Member data received:', {
      hasData: !!data,
      hasPilotDetails: !!data?.UserPilotDetails,
      pilotDetails: data?.UserPilotDetails,
      hasMemberships: !!data?.UserMemberships,
      memberships: data?.UserMemberships
    });
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export default function MemberViewPage() {
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN"],
    "/unauthorized"
  );
  
  const params = useParams();
  const memberId = params.id as string;

  const { data: member, isLoading: memberLoading, error } = useQuery<Member, Error>({
    queryKey: ['member', memberId],
    queryFn: () => getMemberDetails(memberId),
    enabled: !authLoading && !!user
  });

  if (authLoading || memberLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading member details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!member) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative h-20 w-20">
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt={member.name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{member.name}</h1>
            <div className="flex space-x-2 mt-1">
              <Badge variant={member.memberStatus === 'ACTIVE' ? 'success' : 'destructive'}>
                {member.memberStatus}
              </Badge>
              <Badge variant="secondary">{member.role}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="pilot">Pilot Details</TabsTrigger>
          <TabsTrigger value="flights">Flight History</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Contact Information</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Personal Contact */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <UserIcon className="h-4 w-4 text-primary" />
                        Personal Contact
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Full Name</div>
                        <div className="text-sm font-medium">{member.name}</div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Email Address</div>
                        <div className="text-sm font-medium">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Phone Number</div>
                        <div className="text-sm font-medium">{member.phone || 'Not provided'}</div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Address</div>
                        <div className="text-sm font-medium">{member.address || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/70 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <ClockIcon className="h-4 w-4 text-primary/70" />
                        Account Status
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Account Created</div>
                        <div className="text-sm font-medium">
                          {format(new Date(member.createdAt), 'PP')}
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Last Updated</div>
                        <div className="text-sm font-medium">
                          {format(new Date(member.updatedAt), 'PP')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/80 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <IdCard className="h-4 w-4 text-primary/80" />
                        Personal Information
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Date of Birth</div>
                        <div className="text-sm font-medium">
                          {member.birthDate ? format(new Date(member.birthDate), 'PP') : 'Not provided'}
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Gender</div>
                        <div className="text-sm font-medium">{member.gender || 'Not provided'}</div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Member Number</div>
                        <div className="text-sm font-medium">
                          <Badge variant="secondary" className="font-mono">
                            {member.memberNumber || 'Not assigned'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[120px] text-sm text-muted-foreground">Member Since</div>
                        <div className="text-sm font-medium">
                          {member.joinDate ? format(new Date(member.joinDate), 'PP') : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/60 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <HeartPulseIcon className="h-4 w-4 text-primary/60" />
                        Emergency Contact
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground mb-3">
                          No emergency contact information provided
                        </p>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <PlusIcon className="h-4 w-4" />
                          Add Emergency Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberAccountOverview memberId={member.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership" className="space-y-4">
          {/* Active Membership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Membership</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Membership
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.UserMemberships?.filter((m: any) => m.status === 'ACTIVE').map((membership: any) => (
                <div key={membership.id} className="flex items-start space-x-6">
                  {/* Large Icon */}
                  <div className="flex-shrink-0">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <CreditCardIcon className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  {/* Membership Details */}
                  <div className="flex-grow space-y-6">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{membership.membershipType}</h3>
                        <p className="text-sm text-gray-500">Membership ID: {membership.id.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={membership.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-sm">
                          {membership.status}
                        </Badge>
                        <Badge variant={membership.paid ? 'success' : 'destructive'} className="text-sm">
                          {membership.paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="text-sm font-medium">
                          {membership.startDate ? format(new Date(membership.startDate), 'PP') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="text-sm font-medium">
                          {membership.expiryDate ? format(new Date(membership.expiryDate), 'PP') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Discount Applied</p>
                        <p className="text-sm font-medium">
                          {membership.discount ? `${membership.discount}%` : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expired Memberships */}
          {member.UserMemberships?.some((m: any) => m.status === 'EXPIRED') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-600 text-base">Membership History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {member.UserMemberships
                        ?.filter((m: any) => m.status === 'EXPIRED')
                        .map((membership: any) => (
                          <tr key={membership.id} className="text-sm">
                            <td className="px-4 py-3 text-gray-900">{membership.membershipType}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {membership.startDate ? format(new Date(membership.startDate), 'PP') : 'N/A'} - {' '}
                              {membership.expiryDate ? format(new Date(membership.expiryDate), 'PP') : 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={membership.paid ? 'success' : 'destructive'} 
                                className="text-xs"
                              >
                                {membership.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {membership.discount ? `${membership.discount}%` : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pilot" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Pilot Information</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Details
              </Button>
            </CardHeader>
            <CardContent>
              {member.UserPilotDetails && member.UserPilotDetails.length > 0 ? (
                <div className="grid gap-6">
                  {/* License Information */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <IdCard className="h-4 w-4 text-primary" />
                        License Information
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[140px] text-sm text-muted-foreground">CAA Client Number</div>
                        <div className="text-sm font-medium">
                          {member.UserPilotDetails[0].caaClientNumber || 'Not provided'}
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[140px] text-sm text-muted-foreground">License Type</div>
                        <div className="text-sm font-medium">
                          {member.UserPilotDetails[0].licenceType || 'Not specified'}
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <div className="min-w-[140px] text-sm text-muted-foreground">Status</div>
                        <Badge variant={member.UserPilotDetails[0].licenceType ? 'outline' : 'secondary'}>
                          {member.UserPilotDetails[0].licenceType ? 'Active' : 'Not Available'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Medical Certificates */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/80 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <HeartPulseIcon className="h-4 w-4 text-primary/80" />
                        Medical Certificates
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class 1 Medical */}
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <p className="text-sm font-medium mb-3">Class 1 Medical</p>
                          <div className="space-y-2">
                            <Badge variant={
                              member.UserPilotDetails[0].class1Expiry && 
                              new Date(member.UserPilotDetails[0].class1Expiry) > new Date() 
                                ? 'success' 
                                : 'destructive'
                            } className="w-fit">
                              {member.UserPilotDetails[0].class1Expiry && 
                               new Date(member.UserPilotDetails[0].class1Expiry) > new Date() 
                                ? 'Valid' 
                                : 'Expired'}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Expires: {member.UserPilotDetails[0].class1Expiry 
                                ? format(new Date(member.UserPilotDetails[0].class1Expiry), 'PP')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Class 2 Medical */}
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <p className="text-sm font-medium mb-3">Class 2 Medical</p>
                          <div className="space-y-2">
                            <Badge variant={
                              member.UserPilotDetails[0].class2Expiry && 
                              new Date(member.UserPilotDetails[0].class2Expiry) > new Date() 
                                ? 'success' 
                                : 'destructive'
                            } className="w-fit">
                              {member.UserPilotDetails[0].class2Expiry && 
                               new Date(member.UserPilotDetails[0].class2Expiry) > new Date() 
                                ? 'Valid' 
                                : 'Expired'}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Expires: {member.UserPilotDetails[0].class2Expiry 
                                ? format(new Date(member.UserPilotDetails[0].class2Expiry), 'PP')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* DL9 Medical */}
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <p className="text-sm font-medium mb-3">DL9 Medical</p>
                          <div className="space-y-2">
                            <Badge variant={
                              member.UserPilotDetails[0].dl9Expiry && 
                              new Date(member.UserPilotDetails[0].dl9Expiry) > new Date() 
                                ? 'success' 
                                : 'destructive'
                            } className="w-fit">
                              {member.UserPilotDetails[0].dl9Expiry && 
                               new Date(member.UserPilotDetails[0].dl9Expiry) > new Date() 
                                ? 'Valid' 
                                : 'Expired'}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Expires: {member.UserPilotDetails[0].dl9Expiry 
                                ? format(new Date(member.UserPilotDetails[0].dl9Expiry), 'PP')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Endorsements */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/70 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <AwardIcon className="h-4 w-4 text-primary/70" />
                        Ratings & Endorsements
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Type Ratings</h4>
                        <div className="flex flex-wrap gap-2">
                          {member.UserPilotDetails[0].typeRatings?.length > 0 ? (
                            member.UserPilotDetails[0].typeRatings.map((rating: string) => (
                              <Badge key={rating} variant="outline">
                                {rating}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No type ratings</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Prime Ratings</h4>
                        <div className="flex flex-wrap gap-2">
                          {member.UserPilotDetails[0].primeRatings?.length > 0 ? (
                            member.UserPilotDetails[0].primeRatings.map((rating: string) => (
                              <Badge key={rating} variant="outline">
                                {rating}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No prime ratings</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Endorsements</h4>
                        <div className="flex flex-wrap gap-2">
                          {member.UserPilotDetails[0].endorsements?.length > 0 ? (
                            member.UserPilotDetails[0].endorsements.map((endorsement: string) => (
                              <Badge key={endorsement} variant="outline">
                                {endorsement}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No endorsements</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BFR Status */}
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="border-b border-l-4 border-l-primary/60 px-6 py-3 rounded-tl-lg">
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <ClipboardCheckIcon className="h-4 w-4 text-primary/60" />
                        BFR Status
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          member.UserPilotDetails[0].bfrExpiry && 
                          new Date(member.UserPilotDetails[0].bfrExpiry) > new Date() 
                            ? 'success' 
                            : 'destructive'
                        }>
                          {member.UserPilotDetails[0].bfrExpiry && 
                           new Date(member.UserPilotDetails[0].bfrExpiry) > new Date() 
                            ? 'Current' 
                            : 'Due'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Expires: {member.UserPilotDetails[0].bfrExpiry 
                            ? format(new Date(member.UserPilotDetails[0].bfrExpiry), 'PP')
                            : 'Not recorded'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-muted/30 rounded-lg p-6 mb-4">
                    <PlaneIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Pilot Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This member doesn&apos;t have any pilot information recorded.
                  </p>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Pilot Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="h-5 w-5" />
                Flight History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Flight history will be implemented later */}
              <p className="text-gray-500">Flight history records will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="h-5 w-5" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Progress tracking will be implemented later */}
              <p className="text-gray-500">Training progress and achievements will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MemberDetailsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
} 