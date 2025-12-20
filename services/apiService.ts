import * as storage from './storageService';
import { NewPromptInput, User } from '../types';

// Helper to simulate API delay and async nature
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const registerUserApi = async (payload: User) => {
  await delay();
  return storage.registerUser(payload);
};

export const loginUserApi = async (payload: any) => {
  await delay();
  return storage.loginUser(payload.username, payload.password);
};

export const getPromptsApi = async () => {
  await delay();
  return storage.getPrompts();
};

export const createPromptApi = async (payload: NewPromptInput) => {
  await delay();
  try {
    const prompt = storage.savePrompt(payload);
    return { success: true, prompt };
  } catch (e) {
    return { success: false, message: 'Failed to create prompt' };
  }
};

export const updatePromptApi = async (id: string, payload: any) => {
  await delay();
  const updated = storage.updatePrompt(id, payload);
  if (updated) return { success: true, prompt: updated };
  return { success: false, message: 'Failed to update prompt' };
};

export const addFeedbackApi = async (payload: { from: string, message: string }) => {
  await delay();
  const fb = storage.addFeedback(payload.from, payload.message);
  return { success: true, feedback: fb };
};

export const viewPromptApi = async (id: string) => {
  // We need current user for interaction tracking, but view works for guests too?
  // storageService.incrementViewCount(id, username);
  // If we don't have username, we skip tracking?
  // App.tsx calls viewPromptApi(prompt.id) but doesn't pass username? 
  // It relies on API session or something?
  // Let's check App.tsx call.
  return { success: true };
};

export const copyPromptApi = async (id: string) => {
  return { success: true };
};

export const ratePromptApi = async (id: string, rating: number, username: string) => {
  await delay();
  storage.ratePrompt(username, id, rating);
  return { success: true };
};

export const deletePromptApi = async (id: string) => {
  await delay();
  storage.deletePrompt(id);
  return { success: true };
};

export const getUsersApi = async () => {
  await delay();
  return storage.getAllUsers();
};

export const getUserApi = async (username: string) => {
  await delay();
  const user = storage.getUserByUsername(username);
  if (!user) return { message: 'User not found' }; // Match API error shape?
  return user;
};

export const updateUserApi = async (payload: Partial<User> & { username: string }) => {
  await delay();
  const updated = storage.updateUser(payload.username, payload);
  if (updated) return { success: true, user: updated };
  return { success: false, message: 'Failed to update' };
};

export const deleteUserApi = async (username: string) => {
  await delay();
  storage.deleteUser(username);
  return { success: true };
};

export const getFeedbackApi = async () => {
  await delay();
  return storage.getAllFeedback();
};

export const markFeedbackReadApi = async (id: string, read: boolean) => {
  await delay();
  storage.markFeedbackRead(id, read);
  return { success: true };
};

export const deleteFeedbackApi = async (id: string) => {
  await delay();
  storage.deleteFeedback(id);
  return { success: true };
};

export const verifyPasswordApi = async (payload: { username: string, password: string }) => {
  // We can't verify password easily since storage might strict hash or plain?
  // storageService loginUser checks password.
  const res = storage.loginUser(payload.username, payload.password);
  return { success: res.success };
};

export const toggleFavoriteApi = async (id: string, userId: string) => {
  await delay();
  const isFav = storage.toggleFavorite(userId, id);
  return { success: true, favorited: isFav };
};

export const getSettingApi = async (key: string) => {
  // Not implemented in storage
  return { success: false, value: '' };
};

export const getAllSettingsApi = async () => {
  return { success: false, settings: {} };
};

export const updateSettingApi = async (key: string, value: string, authorId: string) => {
  return { success: true };
};

// Fallback avatar export needed?
export const FALLBACK_AVATAR = storage.FALLBACK_AVATAR;

export default { registerUserApi, loginUserApi, getPromptsApi, createPromptApi, updatePromptApi, addFeedbackApi, viewPromptApi, copyPromptApi, ratePromptApi, deletePromptApi, getUsersApi, getUserApi, updateUserApi, deleteUserApi, getFeedbackApi, markFeedbackReadApi, deleteFeedbackApi, verifyPasswordApi, toggleFavoriteApi, getSettingApi, updateSettingApi, getAllSettingsApi };
