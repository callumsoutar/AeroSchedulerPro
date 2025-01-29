"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Defect } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Equipment {
  id: string;
  name: string;
  selected: boolean;
  quantity: number;
}

interface BookingDetailsProps {
  bookingId: string;
  onFormChange?: (data: { route: string; passengers: string; eta: string }) => void;
}

export function BookingDetails({ bookingId, onFormChange }: BookingDetailsProps) {
  const [route, setRoute] = useState("");
  const [passengers, setPassengers] = useState("");
  const [eta, setEta] = useState("");
  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoadingDefects, setIsLoadingDefects] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: "lifejackets", name: "Lifejackets", selected: false, quantity: 0 },
    { id: "headsets", name: "Headsets", selected: false, quantity: 0 },
    { id: "vnc", name: "VNC", selected: false, quantity: 0 },
    { id: "aip", name: "AIP", selected: false, quantity: 0 },
    { id: "cushions", name: "Cushions", selected: false, quantity: 0 },
  ]);

  // First fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      console.log('Fetching booking details for ID:', bookingId);
      const supabase = createClientComponentClient();
      
      try {
        const { data, error } = await supabase
          .from('Booking')
          .select(`
            *,
            aircraft:aircraft_id (
              id,
              registration
            )
          `)
          .eq('id', bookingId)
          .single();

        console.log('Booking fetch result:', { data, error });
        
        if (error) {
          console.error('Error fetching booking:', error);
          return;
        }

        setBooking(data);
      } catch (error) {
        console.error('Error in fetchBooking:', error);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // Then fetch defects when we have the booking details
  useEffect(() => {
    const fetchDefects = async () => {
      if (!booking?.aircraft_id) {
        console.log('No aircraft_id from booking:', booking);
        return;
      }
      
      console.log('Fetching defects for aircraft:', booking.aircraft_id);
      setIsLoadingDefects(true);
      const supabase = createClientComponentClient();
      
      try {
        const { data: defectsData, error: defectsError } = await supabase
          .from('Defects')
          .select(`
            *,
            aircraft:aircraft_id (
              id,
              registration
            ),
            user:user_id (
              id,
              name,
              email
            )
          `)
          .eq('aircraft_id', booking.aircraft_id)
          .eq('status', 'open')
          .order('reported_at', { ascending: false });

        console.log('Defects fetch result:', { defectsData, defectsError });
          
        if (defectsError) {
          console.error('Error fetching defects:', defectsError);
          return;
        }

        setDefects(defectsData || []);
      } catch (error) {
        console.error('Error in fetchDefects:', error);
      } finally {
        setIsLoadingDefects(false);
      }
    };

    fetchDefects();
  }, [booking]);

  // Update parent component whenever form data changes
  useEffect(() => {
    onFormChange?.({
      route,
      passengers,
      eta
    });
  }, [route, passengers, eta, onFormChange]);

  const toggleEquipment = (id: string) => {
    setEquipment(equipment.map(item => 
      item.id === id 
        ? { ...item, selected: !item.selected, quantity: !item.selected ? 1 : 0 }
        : item
    ));
  };

  const updateQuantity = (id: string, quantity: string) => {
    setEquipment(equipment.map(item =>
      item.id === id
        ? { ...item, quantity: parseInt(quantity) || 0 }
        : item
    ));
  };

  console.log('Current defects state:', defects);
  console.log('Is loading defects:', isLoadingDefects);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold">Flight Details</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aircraft Defects Section */}
        {isLoadingDefects ? (
          <div className="text-sm text-muted-foreground">Loading defects...</div>
        ) : booking && booking.aircraft_id && defects.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-red-600">
                Active Defects ({defects.length})
              </h3>
            </div>
            <div className="space-y-2">
              {defects.map((defect) => (
                <div
                  key={defect.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-red-100 bg-red-50"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-red-600 block">{defect.name}</span>
                      {defect.description && (
                        <p className="text-xs text-red-500 line-clamp-1">{defect.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-100 ml-2"
                    onClick={() => {
                      console.log('View defect clicked:', defect);
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Flight Information Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Input
              id="route"
              placeholder="Enter flight route"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passengers">Number of Passengers</Label>
            <Input
              id="passengers"
              type="number"
              placeholder="Enter number of passengers"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eta">Estimated Time of Arrival</Label>
            <Input
              id="eta"
              type="time"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>
        </div>

        {/* Equipment Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Equipment Required</h3>
            <p className="text-xs text-muted-foreground">Click to select</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {equipment.map((item) => (
              <div
                key={item.id}
                className={`group relative p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  item.selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-dashed border-gray-200 hover:border-primary/50"
                }`}
                onClick={() => toggleEquipment(item.id)}
              >
                <div className="absolute top-1 right-1">
                  {item.selected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <PlusCircle className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  )}
                </div>
                <div className="pt-2">
                  <div className="text-sm">{item.name}</div>
                  {item.selected && (
                    <div 
                      className="mt-1"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <Select
                        value={item.quantity.toString()}
                        onValueChange={(value) => updateQuantity(item.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Qty" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 