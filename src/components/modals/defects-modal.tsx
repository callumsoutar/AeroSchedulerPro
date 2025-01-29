import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Defect } from "@/types";
import { format } from "date-fns";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "@/components/ui/use-toast";

interface DefectsModalProps {
  defect: Defect | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (defect: Defect) => void;
}

export function DefectsModal({ defect, isOpen, onClose, onStatusChange }: DefectsModalProps) {
  const supabase = createClientComponentClient();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!defect) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'pending' | 'closed') => {
    try {
      setIsUpdating(true);
      const { data, error } = await supabase
        .from('Defects')
        .update({ status: newStatus })
        .eq('id', defect.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Defect status changed to ${newStatus}`,
      });

      if (onStatusChange && data) {
        onStatusChange(data as Defect);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update defect status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Defect Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{defect.name}</h3>
              <p className="text-sm text-muted-foreground">
                Reported by {defect.user?.name || 'Unknown'} on{' '}
                {format(new Date(defect.reported_at), 'PPp')}
              </p>
            </div>
            <Badge className={getStatusColor(defect.status)}>
              {defect.status.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm">{defect.description}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Aircraft</h4>
            <p className="text-sm">{defect.aircraft?.registration || 'Unknown'}</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {defect.status !== 'closed' && (
              <>
                {defect.status === 'open' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('pending')}
                    disabled={isUpdating}
                  >
                    Mark as Pending
                  </Button>
                )}
                {defect.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('open')}
                    disabled={isUpdating}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  onClick={() => handleStatusChange('closed')}
                  disabled={isUpdating}
                >
                  Close Defect
                </Button>
              </>
            )}
            {defect.status === 'closed' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('open')}
                disabled={isUpdating}
              >
                Reopen Defect
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 