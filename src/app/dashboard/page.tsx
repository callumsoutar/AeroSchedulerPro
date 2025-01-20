"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

const stats = [
  {
    title: "Flights This Week",
    value: "23",
    change: "+12%",
    trend: "up"
  },
  {
    title: "Flying Hours This Week",
    value: "50",
    change: "+8%",
    trend: "up"
  },
  {
    title: "Active Members",
    value: "270",
    change: "-2%",
    trend: "down"
  },
  {
    title: "Active Aircraft",
    value: "8",
    change: "+1%",
    trend: "up"
  }
];

const activeFlights = [
  {
    aircraft: "ZK-KID",
    member: "Callum Soutar",
    instructor: "Sarah Brown",
    checkedOut: "05:32 PM",
    eta: "06:30 PM"
  }
];

const aircraftDefects = [
  {
    aircraft: "ZK-KID",
    issue: "Doesn't transmit mode A or C",
    status: "Open",
    reported: "1/4/2025"
  },
  {
    aircraft: "ZK-KAL",
    issue: "Oil pressure gauge fluctuating during flight",
    status: "Open",
    reported: "3/20/2024"
  },
  {
    aircraft: "ZK-KID",
    issue: "Directional gyro showing excessive drift",
    status: "In Progress",
    reported: "3/19/2024"
  },
  {
    aircraft: "ZK-KID",
    issue: "Right seat belt showing signs of wear",
    status: "In Progress",
    reported: "3/18/2024"
  },
  {
    aircraft: "ZK-KAL",
    issue: "Right brake squeaking during application",
    status: "In Progress",
    reported: "3/15/2024"
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-xs flex items-center ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUp className="mr-1 h-4 w-4" />
                ) : (
                  <ArrowDown className="mr-1 h-4 w-4" />
                )}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Flights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Active Flights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Aircraft</th>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Instructor</th>
                  <th className="px-6 py-3">Checked Out</th>
                  <th className="px-6 py-3">ETA</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeFlights.map((flight, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-6 py-4">{flight.aircraft}</td>
                    <td className="px-6 py-4">{flight.member}</td>
                    <td className="px-6 py-4">{flight.instructor}</td>
                    <td className="px-6 py-4">{flight.checkedOut}</td>
                    <td className="px-6 py-4">{flight.eta}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:underline">Edit</button>
                      <button className="text-blue-600 hover:underline ml-4">Check In</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Aircraft Defects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Aircraft Defects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Aircraft</th>
                  <th className="px-6 py-3">Issue</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reported</th>
                </tr>
              </thead>
              <tbody>
                {aircraftDefects.map((defect, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-6 py-4">{defect.aircraft}</td>
                    <td className="px-6 py-4">{defect.issue}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        defect.status === 'Open' 
                          ? 'bg-red-100 text-red-600' 
                          : defect.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {defect.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{defect.reported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 