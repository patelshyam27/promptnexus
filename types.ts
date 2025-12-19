export enum PromptCategory {
  CODING = 'Coding',
  WRITING = 'Writing',
  IMAGE_GEN = 'Image Generation',
  VIDEO_GEN = 'Video Generation',
  DATA_ANALYSIS = 'Data Analysis',
  MARKETING = 'Marketing',
  EDUCATION = 'Education',
  BUSINESS = 'Business',
  SEO = 'SEO',
  SOCIAL_MEDIA = 'Social Media',
  PRODUCTIVITY = 'Productivity',
  HEALTH = 'Health',
  FINANCE = 'Finance',
  LEGAL = 'Legal',
  CREATIVE = 'Creative',
  GAMING = 'Gaming',
  OTHER = 'Other'
}

export enum AIModel {
  GEMINI_FLASH = 'Gemini 2.5 Flash',
  GEMINI_PRO = 'Gemini 3 Pro',
  GEMINI_1_5_PRO = 'Gemini 1.5 Pro',
  GEMINI_1_5_FLASH = 'Gemini 1.5 Flash',
  GPT_4_TURBO = 'GPT-4 Turbo',
  GPT_4_O = 'GPT-4o',
  GPT_3_5 = 'GPT-3.5',
  CLAUDE_3_OPUS = 'Claude 3 Opus',
  CLAUDE_3_SONNET = 'Claude 3.5 Sonnet',
  CLAUDE_3_HAIKU = 'Claude 3 Haiku',
  LLAMA_3_70B = 'Llama 3 70B',
  LLAMA_3_8B = 'Llama 3 8B',
  MISTRAL_LARGE = 'Mistral Large',
  IMAGEN_3 = 'Imagen 3',
  MIDJOURNEY_V6 = 'Midjourney v6',
  DALL_E_3 = 'DALL-E 3',
  STABLE_DIFFUSION_3 = 'Stable Diffusion 3',
  VEO = 'Veo',
  SORA = 'Sora',
  GROK_1_5 = 'Grok 1.5',
  OTHER = 'Other'
}

export interface User {
  id: string; // UUID from DB
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
  model: AIModel | null;
  category: PromptCategory;
  tags: string[];
  imageUrl?: string;
  author: string;
  authorDetails?: User;
  createdAt: string; // ISO String for frontend
  viewCount: number;
  copyCount: number;
  rating: number;      // Average rating (0-5)
  ratingCount: number; // Total number of ratings
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
  imageUrl?: string | null;
}

export type FilterState = {
  category: PromptCategory | 'All';
  model: string | 'All';
  search: string;
};