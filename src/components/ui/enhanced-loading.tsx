'use client';

import { motion } from 'framer-motion';
import { Wand2, Sparkles, Zap } from 'lucide-react';

interface EnhancedLoadingProps {
  variant?: 'default' | 'character' | 'ai' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number;
}

export function EnhancedLoading({ 
  variant = 'default', 
  size = 'md',
  message,
  progress 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (variant === 'skeleton') {
    return <CharacterSkeleton />;
  }

  if (variant === 'ai') {
    return <AIGenerationLoader message={message} progress={progress} />;
  }

  if (variant === 'character') {
    return <CharacterCreationLoader message={message} />;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-primary`}
      >
        <Wand2 className="w-full h-full" />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

function CharacterSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-5">
      {/* Image Skeleton */}
      <div className="md:col-span-2">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
            animate={{ x: [-200, 400] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="md:col-span-3 space-y-4">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/3 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
              animate={{ x: [-100, 200] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="h-4 bg-muted rounded relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
              animate={{ x: [-200, 400] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="h-4 bg-muted rounded w-4/5 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
              animate={{ x: [-150, 300] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        
        <div className="space-y-2 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: i * 0.1 
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIGenerationLoader({ message, progress }: { message?: string; progress?: number }) {
  const particles = [...Array(6)].map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-primary/60 rounded-full"
      animate={{
        x: [0, Math.random() * 100 - 50],
        y: [0, Math.random() * 100 - 50],
        opacity: [0, 1, 0],
        scale: [0, 1, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: i * 0.3,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* AI Brain Animation */}
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary" />
        </motion.div>
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2"
        >
          <div className="w-full h-full rounded-full border-2 border-primary/30 border-r-primary" />
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        
        {particles}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-64 space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% complete
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-lg font-medium">{message}</p>
          <motion.div
            className="flex items-center justify-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI is working its magic</span>
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function CharacterCreationLoader({ message }: { message?: string }) {
  const steps = [
    { icon: '🎨', label: 'Creating concept' },
    { icon: '✨', label: 'Adding magic' },
    { icon: '🖼️', label: 'Rendering image' },
    { icon: '📝', label: 'Writing story' }
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Steps Animation */}
      <div className="flex items-center gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0.3, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 1, 0.3], 
              scale: [0.8, 1, 0.8] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut"
            }}
          >
            <div className="text-2xl">{step.icon}</div>
            <span className="text-xs text-muted-foreground text-center">
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Connecting Lines */}
      <div className="relative w-64 h-1">
        <div className="absolute inset-0 bg-muted rounded-full" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary to-transparent rounded-full"
          animate={{ 
            scaleX: [0, 1, 0],
            transformOrigin: ["left", "left", "right"]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground max-w-sm"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}