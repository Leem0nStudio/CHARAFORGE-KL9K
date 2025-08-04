'use server';

import type { Timestamp } from "firebase/firestore";

/**
 * Represents the structure of a Character object throughout the application.
 */
export type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string;
  userId: string;
  status: 'private' | 'public';
  createdAt: Timestamp | Date; // Firestore Timestamps on server, Date objects on client
  userName?: string;
};
