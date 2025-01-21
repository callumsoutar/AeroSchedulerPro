"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Plane } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [stage, setStage] = useState<"requesting" | "cleared">("requesting");

  useEffect(() => {
    if (isOpen) {
      // Reset stage when modal opens
      setStage("requesting");
      // Change to cleared after 2 seconds
      const timer = setTimeout(() => {
        setStage("cleared");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
          <AnimatePresence mode="wait">
            {stage === "requesting" ? (
              <motion.div
                key="requesting"
                className="flex flex-col items-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Animated Plane */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, 10, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Plane className="w-20 h-20 text-primary" />
                </motion.div>
                <motion.h2
                  className="text-xl font-bold text-foreground"
                  animate={{
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Requesting Clearance
                </motion.h2>
                {/* Radio waves animation */}
                <motion.div
                  className="absolute w-full h-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-full h-full border-2 border-primary/20 rounded-full" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="cleared"
                className="flex flex-col items-center space-y-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CheckCircle2 className="w-20 h-20 text-primary" />
                </motion.div>
                <motion.div
                  className="space-y-2 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-foreground">
                    Cleared for Takeoff
                  </h2>
                  <p className="text-muted-foreground">
                    Your flight has been successfully checked out
                  </p>
                </motion.div>
                {/* Celebration particles */}
                <motion.div
                  className="absolute w-full h-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-full h-full border-2 border-primary/20 rounded-full" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
} 