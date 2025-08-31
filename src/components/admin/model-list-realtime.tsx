
'use client';

import { useState, useEffect } from 'react';
import type { AiModel } from '@/types/ai-model';
import { motion } from 'framer-motion';
import { ModelCard } from './model-card';
import { getModels } from '@/app/actions/ai-models';

interface ModelListRealtimeProps {
  initialModels: AiModel[];
  type: 'model' | 'lora';
}

// This component no longer uses realtime listeners for Supabase for simplicity,
// but keeps the "realtime" name for consistency during the migration.
// It could be updated to use Supabase realtime subscriptions if needed.
export function ModelListRealtime({ initialModels, type }: ModelListRealtimeProps) {
  const [models, setModels] = useState<AiModel[]>(initialModels.filter(m => !m.userId));

  useEffect(() => {
     async function fetchInitialModels() {
        const systemModels = await getModels(type);
        setModels(systemModels.filter(m => !m.userId));
     }
     fetchInitialModels();
  }, [type]);

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
      {models.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No {type}s added yet.</p>}
    </motion.div>
  );
}

    