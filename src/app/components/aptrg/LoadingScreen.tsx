import { motion } from "motion/react";
import logoUrl from "../../../imports/aptrg_logo.png";

export function LoadingScreen() {
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f6f2f0]"
    >
      <motion.img
        src={logoUrl}
        alt="APTRG Logo"
        className="w-32 h-32 md:w-48 md:h-48 object-contain"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
