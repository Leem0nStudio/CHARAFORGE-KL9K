
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { getFirebaseClient } from '@/lib/firebase/client';
import type { AiModel } from '@/types/ai-model';
import { motion } from 'framer-motion';
import { ModelCard } from './model-card';

interface ModelListRealtimeProps {
  initialModels: AiModel[];
  type: 'model' | 'lora';
}

export function ModelListRealtime({ initialModels, type }: ModelListRealtimeProps) {
  const [models, setModels] = useState<AiModel[]>(initialModels);

  useEffect(() => {
    const q = query(
      collection(getFirebaseClient().db, 'ai_models'), 
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedModels = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(),
      })) as AiModel[];
      
      setModels(updatedModels.filter(m => !m.userId));
    });

    return () => unsubscribe();
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
