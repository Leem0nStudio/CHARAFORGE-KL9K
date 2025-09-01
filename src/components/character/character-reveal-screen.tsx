'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

const sunRaysVariants = {
  initial: { rotate: 0, scale: 0.8, opacity: 0 },
  animate: {
    rotate: 360,
    scale: 1.2,
    opacity: 0.5,
    transition: {
      duration: 30,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

const characterVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1], // EaseOutQuint
        }
    }
};

const bannerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.5,
            duration: 0.5,
            ease: 'easeOut',
        }
    }
}

export function CharacterRevealScreen({ imageUrl }: { imageUrl: string }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-[100] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Starfield & Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(41,41,85,0.5),transparent_60%)]" />

      {/* Rotating Sun Rays */}
      <motion.div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/sun-rays.svg')" }}
        variants={sunRaysVariants}
        initial="initial"
        animate="animate"
      />

      {/* Character Image */}
      <motion.div 
        className="relative w-[300px] h-[400px] md:w-[400px] md:h-[533px] z-20"
        variants={characterVariants}
        initial="hidden"
        animate="visible"
      >
        <Image
          src={imageUrl}
          alt="Generated Character"
          fill
          className="object-contain drop-shadow-[0_10px_30px_rgba(255,255,255,0.25)]"
          priority
        />
      </motion.div>

       {/* Banner */}
      <motion.div 
        className="absolute top-10 md:top-20 z-30"
        variants={bannerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="px-8 py-3 bg-gradient-to-r from-primary via-accent to-primary border-2 border-primary-foreground/50 rounded-lg shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-headline tracking-widest text-primary-foreground text-center font-bold">
                CHARACTER FORGED
            </h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
