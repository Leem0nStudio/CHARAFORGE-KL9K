
'use client';

import type { AiModel } from '@/types/ai-model';
import { motion } from 'framer-motion';
import { ModelCard } from './model-card';

interface ModelListProps {
  models: AiModel[];
}

export function ModelList({ models }: ModelListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {models.map((model) => (
        <motion.div key={model.id} variants={itemVariants}>
          <ModelCard model={model} />
        </motion.div>
      ))}
      {models.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No models of this type have been added to the system yet.</p>}
    </motion.div>
  );
}
