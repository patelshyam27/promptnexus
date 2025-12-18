export enum PromptCategory {
  CODING = 'Coding',
  WRITING = 'Writing',
  IMAGE_GEN = 'Image Generation',
  VIDEO_GEN = 'Video Generation',
  DATA_ANALYSIS = 'Data Analysis',
  MARKETING = 'Marketing',
  EDUCATION = 'Education',
  OTHER = 'Other'
}

export enum AIModel {
  GEMINI_FLASH = 'Gemini 2.5 Flash',
  GEMINI_PRO = 'Gemini 3 Pro',
  IMAGEN_3 = 'Imagen 3',
  VEO = 'Veo',
  GEMINI_1_5_PRO = 'Gemini 1.5 Pro',
  OTHER = 'Other'
}

export interface User {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  password: string; // Made required for robust auth
  gender?: 'male' | 'female';
  instagramUrl?: string;
  linkdealUrl?: string;
}

export interface Feedback {
  id: string;
  from: string; // username of sender
  message: string;
  createdAt: number;
  read?: boolean;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  category: PromptCategory;
  model: string;
  modelUrl?: string;
  author: string; // corresponds to User.username
  viewCount: number;
  copyCount: number;
  rating: number;      // Average rating (0-5)
  ratingCount: number; // Total number of ratings
  createdAt: number;
  tags: string[];
  isFavorited?: boolean;
  favoriteCount?: number;
}

export interface NewPromptInput {
  title: string;
  content: string;
  description: string;
  category: PromptCategory;
  model: string;
  modelUrl?: string;
  author: string;
  tags: string[];
}

export type FilterState = {
  category: PromptCategory | 'All';
  model: string | 'All';
  search: string;
};