'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionMainWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MotionMainWrapper({ children, className }: MotionMainWrapperProps) {
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.main>
  );
}
