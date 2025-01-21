"use client";

import { useBooking } from "@/hooks/useBooking";
import { useAircraftTechLog } from "@/hooks/useAircraftTechLog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface CheckInTimesProps {
  bookingId: string;
  onFlightChargesCalculated?: (charges: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    timeType: string;
    flightTime: number;
  }) => void;
  onFlightTimesValidated?: (flightTimes: {
    start_hobbs: number | null;
    end_hobbs: number | null;
    start_tacho: number | null;
    end_tacho: number | null;
    flight_time: number | null;
    isValid: boolean;
  }) => void;
}

export function CheckInTimes({ 
  bookingId, 
  onFlightChargesCalculated,
  onFlightTimesValidated 
}: CheckInTimesProps) {
  const { basicInfo, loading: bookingLoading } = useBooking(bookingId);
  const { data: techLog, isLoading: techLogLoading } = useAircraftTechLog(basicInfo?.aircraft?.id ?? null);
  const [endHobbs, setEndHobbs] = useState<string>("");
  const [endTacho, setEndTacho] = useState<string>("");
  const [selectedRate, setSelectedRate] = useState<string>("");
  const [isValid, setIsValid] = useState(false);

  const calculateTimeDifference = useCallback((start: number | null | undefined, end: string): number | null => {
    if (!start || !end) return null;
    const difference = parseFloat(end) - start;
    return difference > 0.1 ? difference : null;
  }, []);

  // Find the applicable rate based on the booking's flight type
  const applicableRate = basicInfo?.aircraft?.aircraft_rates?.find(
    rate => rate.flight_type_id === basicInfo.flight_type_id
  );

  // Set the selected rate when applicable rate is found
  useEffect(() => {
    if (applicableRate?.rate && !selectedRate) {
      setSelectedRate(applicableRate.rate.toString());
    }
  }, [applicableRate?.rate, selectedRate]);

  // Validate flight times and notify parent component
  useEffect(() => {
    if (!techLog || !basicInfo?.aircraft) return;

    const hobbsDifference = calculateTimeDifference(techLog.current_hobbs, endHobbs);
    const tachoDifference = calculateTimeDifference(techLog.current_tacho, endTacho);
    
    const useHobbs = basicInfo.aircraft.record_hobbs;
    const useTacho = basicInfo.aircraft.record_tacho;
    
    let isValidTimes = false;
    let flightTime: number | null = null;

    if (useHobbs && hobbsDifference) {
      isValidTimes = true;
      flightTime = hobbsDifference;
    } else if (useTacho && tachoDifference) {
      isValidTimes = true;
      flightTime = tachoDifference;
    }

    const newIsValid = isValidTimes && !!selectedRate;
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
    }

    if (onFlightTimesValidated) {
      onFlightTimesValidated({
        start_hobbs: techLog.current_hobbs,
        end_hobbs: endHobbs ? parseFloat(endHobbs) : null,
        start_tacho: techLog.current_tacho,
        end_tacho: endTacho ? parseFloat(endTacho) : null,
        flight_time: flightTime,
        isValid: newIsValid
      });
    }
  }, [
    endHobbs, 
    endTacho, 
    selectedRate, 
    techLog,
    basicInfo?.aircraft,
    calculateTimeDifference,
    onFlightTimesValidated,
    isValid
  ]);

  const handleCalculateCharges = () => {
    if (!basicInfo?.aircraft || !selectedRate) {
      toast({
        title: "Missing Information",
        description: "Aircraft and rate information are required to calculate charges.",
        variant: "destructive"
      });
      return;
    }

    // Determine which time recording method to use
    const useHobbs = basicInfo.aircraft.record_hobbs;
    const useTacho = basicInfo.aircraft.record_tacho;

    // Get the time difference based on the recording method
    let timeDifference: number | null = null;
    let timeType: string = '';

    if (useHobbs) {
      timeDifference = calculateTimeDifference(techLog?.current_hobbs, endHobbs);
      timeType = 'Hobbs';
    } else if (useTacho) {
      timeDifference = calculateTimeDifference(techLog?.current_tacho, endTacho);
      timeType = 'Tacho';
    }

    if (!timeDifference) {
      toast({
        title: "Invalid Time Difference",
        description: `Please enter a valid end ${timeType} time that is greater than the start time.`,
        variant: "destructive"
      });
      return;
    }

    // Calculate total charge
    const hourlyRate = parseFloat(selectedRate);
    const totalCharge = timeDifference * hourlyRate;

    // Get the selected flight type name
    const flightTypeName = basicInfo.aircraft.aircraft_rates?.find(
      rate => rate.rate.toString() === selectedRate
    )?.flight_type.name || 'Flight';

    toast({
      title: "Flight Charges Calculated",
      description: `${timeType} time: ${timeDifference.toFixed(1)} hours @ $${hourlyRate}/hr = $${totalCharge.toFixed(2)}`,
    });

    // Pass the calculated charges to the parent component
    if (onFlightChargesCalculated) {
      onFlightChargesCalculated({
        id: 'flight-time-charge',
        description: `${flightTypeName} (${basicInfo.aircraft.registration})`,
        quantity: timeDifference,
        unitPrice: hourlyRate,
        timeType,
        flightTime: timeDifference
      });
    }
  };

  if (bookingLoading.basic) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!basicInfo?.aircraft) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No aircraft assigned to this booking</p>
        </CardContent>
      </Card>
    );
  }

  const hobbsDifference = calculateTimeDifference(techLog?.current_hobbs, endHobbs);
  const tachoDifference = calculateTimeDifference(techLog?.current_tacho, endTacho);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aircraft Times</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {basicInfo.aircraft.registration}
              </p>
              <Button 
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={handleCalculateCharges}
              >
                Calculate Flight Charges
              </Button>
            </div>
          </div>

          {techLogLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          ) : techLog ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Hobbs Time Section */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium mb-2">Hobbs Time</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Start Hobbs</p>
                        <div className="bg-muted p-3 rounded-lg h-[48px]">
                          <p className="text-xl font-semibold">
                            {techLog.current_hobbs?.toFixed(1) ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">End Hobbs</p>
                        <div className="bg-white p-3 rounded-lg border h-[48px]">
                          <Input
                            type="number"
                            step="0.1"
                            value={endHobbs}
                            onChange={(e) => setEndHobbs(e.target.value)}
                            placeholder={techLog.current_hobbs?.toFixed(1)}
                            className="border-0 p-0 h-7 text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        {hobbsDifference && (
                          <p className="text-sm text-green-600 mt-1">
                            {hobbsDifference.toFixed(1)} hours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tacho Time Section */}
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium mb-2">Tacho Time</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Start Tacho</p>
                        <div className="bg-muted p-3 rounded-lg h-[48px]">
                          <p className="text-xl font-semibold">
                            {techLog.current_tacho?.toFixed(1) ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">End Tacho</p>
                        <div className="bg-white p-3 rounded-lg border h-[48px]">
                          <Input
                            type="number"
                            step="0.1"
                            value={endTacho}
                            onChange={(e) => setEndTacho(e.target.value)}
                            placeholder={techLog.current_tacho?.toFixed(1)}
                            className="border-0 p-0 h-7 text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        {tachoDifference && (
                          <p className="text-sm text-green-600 mt-1">
                            {tachoDifference.toFixed(1)} hours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate Selection Section */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Aircraft Rate</p>
                  <Select 
                    value={selectedRate} 
                    onValueChange={setSelectedRate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {basicInfo.aircraft.aircraft_rates?.map((rate) => (
                        <SelectItem 
                          key={rate.id} 
                          value={rate.rate.toString()}
                        >
                          {rate.flight_type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRate && (
                    <p className="text-sm text-muted-foreground">
                      Selected rate: ${selectedRate}/hr
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No tech log data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 