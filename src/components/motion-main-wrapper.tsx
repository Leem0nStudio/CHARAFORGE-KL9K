'use client';

import { ReactNode } from 'react';

interface MotionMainWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MotionMainWrapper({ children, className }: MotionMainWrapperProps) {
  return (
    <main className={className}>
      {children}
    </main>
  );
}
