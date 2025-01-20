"use client"

import { motion } from "framer-motion"
import { Plane } from "lucide-react"

export default function SimplifiedFlyingBadge() {
  return (
    <motion.div
      className="relative flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full overflow-hidden"
      initial={{ y: 0 }}
      animate={{ y: [-1, 1, -1] }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration: 4,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="relative"
        animate={{
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut",
        }}
      >
        <Plane className="h-4 w-4" />
      </motion.div>
      <span className="text-sm font-medium z-10">Flying</span>

      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-primary/5"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 3,
          ease: "linear",
        }}
        style={{
          clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)",
        }}
      />
    </motion.div>
  )
}

