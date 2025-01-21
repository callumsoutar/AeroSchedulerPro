"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CheckCircle2 } from "lucide-react";
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
  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: "lifejackets", name: "Lifejackets", selected: false, quantity: 0 },
    { id: "headsets", name: "Headsets", selected: false, quantity: 0 },
    { id: "vnc", name: "VNC", selected: false, quantity: 0 },
    { id: "aip", name: "AIP", selected: false, quantity: 0 },
    { id: "cushions", name: "Cushions", selected: false, quantity: 0 },
  ]);

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

  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <h2 className="text-lg font-semibold">Flight Details</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flight Information Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Equipment Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Equipment Required</h3>
            <p className="text-xs text-muted-foreground">Click cards to select equipment</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {equipment.map((item) => (
              <div
                key={item.id}
                className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  item.selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-dashed border-gray-200 hover:border-primary/50"
                }`}
                onClick={() => toggleEquipment(item.id)}
              >
                <div className="absolute top-2 right-2">
                  {item.selected ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  )}
                </div>
                <div className="space-y-2 pt-4">
                  <div className="font-medium text-sm">{item.name}</div>
                  {item.selected && (
                    <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Select
                        value={item.quantity.toString()}
                        onValueChange={(value) => updateQuantity(item.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Quantity" />
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