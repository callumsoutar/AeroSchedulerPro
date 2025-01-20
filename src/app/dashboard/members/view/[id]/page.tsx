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
  PlaneIcon
} from "lucide-react";
import Image from "next/image";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Information</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-gray-600"
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
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Personal Contact</h3>
                    <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">
                      <div className="flex items-center gap-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <MailIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="text-sm font-medium text-gray-900">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="text-sm font-medium text-gray-900">{member.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900">{member.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Account Status</h3>
                    <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">
                      <div className="flex items-center gap-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Account Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(member.createdAt), 'PP')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(member.updatedAt), 'PP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Personal Information</h3>
                    <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">
                      <div className="flex items-center gap-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-900">
                            {member.birthDate ? format(new Date(member.birthDate), 'PP') : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="text-sm font-medium text-gray-900">{member.gender || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <BuildingIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Member Number</p>
                          <p className="text-sm font-medium text-gray-900">{member.memberNumber || 'Not assigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="text-sm font-medium text-gray-900">
                            {member.joinDate ? format(new Date(member.joinDate), 'PP') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Emergency Contact</h3>
                    <div className="bg-gray-50/50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 text-center">
                        No emergency contact information provided
                      </p>
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
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            
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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pilot Information</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.UserPilotDetails && member.UserPilotDetails.length > 0 ? (
                <div className="grid gap-6">
                  {/* License Information */}
                  <div className="bg-gray-50/50 rounded-lg p-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <IdCard className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-1">License Information</h3>
                        <div className="grid gap-4">
                          <div className="text-sm">
                            <span className="text-gray-500">CAA Client Number:</span>
                            <span className="ml-2 font-medium">{member.UserPilotDetails[0].caaClientNumber || 'Not provided'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-sm">
                              <p className="text-gray-500 mb-1">License Type</p>
                              <span className="font-medium">{member.UserPilotDetails[0].licenceType || 'Not specified'}</span>
                            </div>
                            <div className="text-sm">
                              <p className="text-gray-500 mb-1">Status</p>
                              <Badge variant={member.UserPilotDetails[0].licenceType ? 'outline' : 'secondary'}>
                                {member.UserPilotDetails[0].licenceType ? 'Active' : 'Not Available'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Certificates */}
                  <div className="bg-gray-50/50 rounded-lg p-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <HeartPulseIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-3">Medical Certificates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Class 1 Medical */}
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Class 1 Medical</p>
                            <div className="flex flex-col gap-1">
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
                              <span className="text-sm">
                                {member.UserPilotDetails[0].class1Expiry 
                                  ? format(new Date(member.UserPilotDetails[0].class1Expiry), 'PP')
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Class 2 Medical */}
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Class 2 Medical</p>
                            <div className="flex flex-col gap-1">
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
                              <span className="text-sm">
                                {member.UserPilotDetails[0].class2Expiry 
                                  ? format(new Date(member.UserPilotDetails[0].class2Expiry), 'PP')
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* DL9 Medical */}
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">DL9 Medical</p>
                            <div className="flex flex-col gap-1">
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
                              <span className="text-sm">
                                {member.UserPilotDetails[0].dl9Expiry 
                                  ? format(new Date(member.UserPilotDetails[0].dl9Expiry), 'PP')
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Endorsements */}
                  <div className="bg-gray-50/50 rounded-lg p-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <AwardIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-3">Ratings & Endorsements</h3>
                        <div className="space-y-4">
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Type Ratings</p>
                            <div className="flex flex-wrap gap-2">
                              {member.UserPilotDetails[0].typeRatings?.length > 0 ? (
                                member.UserPilotDetails[0].typeRatings.map((rating: string) => (
                                  <Badge key={rating} variant="outline">
                                    {rating}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No type ratings</p>
                              )}
                            </div>
                          </div>
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Prime Ratings</p>
                            <div className="flex flex-wrap gap-2">
                              {member.UserPilotDetails[0].primeRatings?.length > 0 ? (
                                member.UserPilotDetails[0].primeRatings.map((rating: string) => (
                                  <Badge key={rating} variant="outline">
                                    {rating}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No prime ratings</p>
                              )}
                            </div>
                          </div>
                          <div className="bg-white rounded-md p-3 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Endorsements</p>
                            <div className="flex flex-wrap gap-2">
                              {member.UserPilotDetails[0].endorsements?.length > 0 ? (
                                member.UserPilotDetails[0].endorsements.map((endorsement: string) => (
                                  <Badge key={endorsement} variant="outline">
                                    {endorsement}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No endorsements</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BFR Status */}
                  <div className="bg-gray-50/50 rounded-lg p-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <ClipboardCheckIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-3">BFR Status</h3>
                        <div className="bg-white rounded-md p-3 border border-gray-100">
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
                            <span className="text-sm">
                              Expires: {member.UserPilotDetails[0].bfrExpiry 
                                ? format(new Date(member.UserPilotDetails[0].bfrExpiry), 'PP')
                                : 'Not recorded'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-6 inline-block mb-4">
                    <PlaneIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Pilot Details</h3>
                  <p className="text-gray-500">This member doesn&apos;t have any pilot information recorded.</p>
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