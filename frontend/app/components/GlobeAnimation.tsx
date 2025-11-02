"use client";

import { motion } from "framer-motion";

export default function GlobeAnimation({
  text = "Generating...",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <motion.div
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Globe texture overlay */}
        <div className="absolute inset-0 bg-[url('/globe-pattern.png')] bg-cover opacity-30 rounded-full" />
      </motion.div>

      <p className="text-gray-500 font-medium animate-pulse text-center">
        {text}
      </p>
    </div>
  );
}
