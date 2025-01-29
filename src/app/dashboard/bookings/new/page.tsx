'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plane, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingForm } from "@/components/booking/BookingForm";

type BookingType = 'member' | 'trial';

export default function NewBookingPage() {
  const [selectedType, setSelectedType] = useState<BookingType>('member');

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">New Booking</h1>
        <p className="text-muted-foreground">
          Create a new booking for a member or trial flight
        </p>
      </div>

      {/* Booking Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedType('member')}
          className={cn(
            "relative p-6 rounded-lg border-2 transition-all duration-200",
            selectedType === 'member' 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-muted-foreground/25"
          )}
        >
          {selectedType === 'member' && (
            <motion.div
              layoutId="activeBookingType"
              className="absolute inset-0 rounded-lg bg-primary/5"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <div className="relative space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" />
              Member Booking
            </div>
            <p className="text-sm text-muted-foreground">
              Schedule a flight for an existing club member
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedType('trial')}
          className={cn(
            "relative p-6 rounded-lg border-2 transition-all duration-200",
            selectedType === 'trial' 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-muted-foreground/25"
          )}
        >
          {selectedType === 'trial' && (
            <motion.div
              layoutId="activeBookingType"
              className="absolute inset-0 rounded-lg bg-primary/5"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <div className="relative space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Plane className="h-5 w-5" />
              Trial Flight
            </div>
            <p className="text-sm text-muted-foreground">
              Book a trial flight for a potential new member
            </p>
          </div>
        </button>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <BookingForm bookingType={selectedType} />
      </Card>
    </div>
  );
} 