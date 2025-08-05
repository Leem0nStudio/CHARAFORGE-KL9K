'use server';

/**
 * Represents the structure of a Character object throughout the application.
 */
export type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string; // The primary image for the character card
  gallery?: string[]; // An array of image URLs for the character's gallery
  userId: string;
  status: 'private' | 'public';
  createdAt: Date; // Use Date object on both server and client for consistency
  userName?: string;
};
