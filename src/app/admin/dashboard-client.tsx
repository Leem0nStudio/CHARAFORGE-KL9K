'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Swords, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the type for the stats object for props validation
type DashboardStats = {
  totalUsers: number;
  totalCharacters: number;
  publicCharacters: number;
  privateCharacters: number;
};

type DashboardClientProps = {
  stats: DashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="space-y-8">
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total registered users</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Characters</CardTitle>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCharacters}</div>
               <p className="text-xs text-muted-foreground">
                  {stats.publicCharacters} public / {stats.privateCharacters} private
              </p>
            </CardContent>
          </Card>
        </motion.div>
         <motion.div variants={itemVariants}>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Operational</div>
               <p className="text-xs text-muted-foreground">Public API is running</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Analytics (Coming Soon)</h2>
         <Card className="min-h-[300px] flex items-center justify-center bg-card/50 border-2 border-dashed">
            <p className="text-muted-foreground">Charts and more detailed analytics will be displayed here.</p>
        </Card>
      </motion.div>
    </div>
  );
}
