import { cn } from "@/lib/utils";
import { Plane, Check } from "lucide-react";

interface BookingProgressProps {
  currentStage: 'briefing' | 'checkout' | 'flying' | 'debrief' | 'checkin' | 'none';
  bookingStatus?: string;
  briefing_completed?: boolean | null;
  debrief_completed?: boolean | null;
}

export function BookingProgress({ currentStage, bookingStatus, briefing_completed, debrief_completed }: BookingProgressProps) {
  const stages = ['briefing', 'checkout', 'flying', 'debrief', 'checkin'];
  
  const getStageNumber = (stage: string) => {
    if (stage === 'flying') return <Plane className="w-4 h-4" />;
    if (stage === 'checkin' && bookingStatus === 'complete') return <Check className="w-4 h-4" />;
    const numberMap: { [key: string]: number } = {
      'briefing': 1,
      'checkout': 2,
      'debrief': 3,
      'checkin': 4
    };
    return numberMap[stage];
  };

  const isStageComplete = (stage: string) => {
    // If booking is complete, show all stages as complete
    if (bookingStatus === 'complete') return true;
    
    // For briefing stage, only show complete if briefing_completed is true
    if (stage === 'briefing') {
      return briefing_completed === true;
    }

    // For debrief stage, only show complete if debrief_completed is true
    if (stage === 'debrief') {
      return debrief_completed === true;
    }
    
    // For other stages, show as complete if they're before the current stage
    return stages.indexOf(stage) < stages.indexOf(currentStage);
  };

  const isCurrentStage = (stage: string) => {
    if (bookingStatus === 'complete') return false;
    return stage === currentStage;
  };

  const getStageStyles = (stage: string) => {
    if (bookingStatus === 'complete') {
      if (stage === 'flying') {
        return "border-purple-500 bg-purple-500 text-white";
      }
      return "border-primary bg-primary text-white";
    }

    if (stage === 'briefing' && briefing_completed === true) {
      return "border-primary bg-primary text-white";
    }

    if (stage === 'debrief' && debrief_completed === true) {
      return "border-primary bg-primary text-white";
    }

    if (stage === 'flying') {
      if (isCurrentStage(stage)) {
        return "border-purple-500 bg-white text-purple-500";
      }
      if (isStageComplete(stage)) {
        return "border-purple-500 bg-purple-500 text-white";
      }
      return "border-muted-foreground/30 text-muted-foreground/50";
    }

    if (isStageComplete(stage)) {
      return "border-primary bg-primary text-white";
    }
    if (isCurrentStage(stage)) {
      return "border-primary bg-white text-primary";
    }
    return "border-muted-foreground/30 text-muted-foreground/50";
  };

  const getLabelStyles = (stage: string) => {
    if (bookingStatus === 'complete') {
      if (stage === 'flying') return "text-purple-500";
      return "text-primary";
    }

    if (stage === 'flying' && (isCurrentStage(stage) || isStageComplete(stage))) {
      return "text-purple-500";
    }
    if (isStageComplete(stage) || isCurrentStage(stage)) {
      return "text-primary";
    }
    return "text-muted-foreground/50";
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        {/* Connection Lines - Move to top of markup but behind circles */}
        <div className="absolute top-4 left-0 transform -translate-y-1/2 w-full h-[2px] bg-muted-foreground/30 z-0">
          {/* Completed Progress */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300",
              currentStage === 'flying' ? "bg-purple-500" : "bg-primary"
            )}
            style={{
              width: bookingStatus === 'complete' 
                ? '100%' 
                : currentStage === 'none' 
                  ? '0%' 
                  : `${((stages.indexOf(currentStage) / (stages.length - 1)) * 100)}%`
            }}
          />
        </div>

        <div className="flex items-center justify-between relative z-10">
          {stages.map((stage, index) => (
            <div key={stage} className="relative flex flex-col items-center">
              {/* Number Circle or Plane Icon - Add bg-background */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-background",
                  getStageStyles(stage)
                )}
              >
                {getStageNumber(stage)}
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  "absolute -bottom-6 text-sm font-medium whitespace-nowrap",
                  getLabelStyles(stage)
                )}
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 