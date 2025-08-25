
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const sunRayVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1.5,
      ease: 'easeOut',
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
};

const characterVariants = {
  hidden: { y: 50, opacity: 0, scale: 0.8 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 },
  },
};

const bannerVariants = {
  hidden: { y: -30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 },
  },
};

const sparkles = Array.from({ length: 15 });

export function CharacterRevealScreen({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="fixed inset-0 bg-[#0a2a2f] flex items-center justify-center z-[100] overflow-hidden">
      {/* Sun Rays Background */}
      <motion.div
        className="absolute inset-0"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.3)_0%,_rgba(251,191,36,0)_50%)]" />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.2)_0%,_rgba(251,191,36,0)_60%)]"
          variants={sunRayVariants}
        />
      </motion.div>
      
       {/* Sparkles */}
        {sparkles.map((_, i) => {
            const size = Math.random() * 20 + 5;
            const duration = Math.random() * 2 + 3;
            const delay = Math.random() * 2;
            return (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-yellow-300"
                    style={{
                        width: size,
                        height: size,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
            );
        })}


      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
         {/* Banner */}
        <motion.div 
            className="absolute top-[20%] text-center"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
        >
          <div className="relative inline-block bg-primary/20 border-2 border-primary/50 py-2 px-12 text-white font-headline text-3xl tracking-wider shadow-lg rounded-md backdrop-blur-sm">
            Character Forged
          </div>
        </motion.div>

        {/* Character Image */}
        <motion.div
          className="relative w-[300px] h-[400px]"
          variants={characterVariants}
          initial="hidden"
          animate="visible"
        >
          <Image
            src={imageUrl}
            alt="Newly generated character"
            fill
            className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          />
        </motion.div>
      </div>
    </div>
  );
}
