'use client';

import { motion } from 'framer-motion';
import { Heart, Share2, Download, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ImprovedCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creator: {
    name: string;
    avatar: string;
  };
  stats: {
    likes: number;
    views: number;
  };
  isLiked?: boolean;
  onLike?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function ImprovedCard({
  id,
  title,
  description,
  imageUrl,
  creator,
  stats,
  isLiked = false,
  onLike,
  onShare,
  onDownload,
}: ImprovedCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike?.();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative bg-card rounded-xl border border-border/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
        )}
        
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
        
        {/* Quick Actions - Appear on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 backdrop-blur-sm bg-background/70 hover:bg-background/90"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 backdrop-blur-sm bg-background/70 hover:bg-background/90"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Add to Collection</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* Like Badge */}
        {stats.likes > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/70 backdrop-blur-sm text-xs font-medium">
            {stats.likes} likes
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Creator Info */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={creator.avatar} alt={creator.name} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {creator.name}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart 
                  className={`h-4 w-4 transition-colors ${
                    liked ? 'fill-red-500 text-red-500' : ''
                  }`} 
                />
              </motion.div>
              <span>{stats.likes + (liked && !isLiked ? 1 : 0)}</span>
            </motion.button>

            <button
              onClick={onShare}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            {stats.views} views
          </div>
        </div>
      </div>

      {/* Hover border effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
}