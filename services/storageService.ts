import { Prompt, NewPromptInput, User, Feedback } from '../types';

// Updated keys to v2 to ensure a fresh, clean database environment
const USERS_KEY = 'promptnexus_users_v2';
const PROMPTS_KEY = 'promptnexus_prompts_v2';
const FOLLOW_KEY = 'promptnexus_follows_v2';
const FAVORITES_KEY = 'promptnexus_favorites_v2';
const RATINGS_KEY = 'promptnexus_ratings_v2';
const SESSION_KEY = 'promptnexus_session_v2';
const FEEDBACK_KEY = 'promptnexus_feedback_v1';

// Helper for safe storage access
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Storage Error for ${key}:`, e);
    return fallback;
  }
};

// Avatar generator helper (consistent with front-end styles)
const buildAvatarUrl = (seed: string, gender: 'male' | 'female') => {
  const s = encodeURIComponent((seed || 'placeholder').trim());
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`;
  if (gender === 'male') {
    url += `&top[]=shortHair&top[]=theCaesar&top[]=theCaesarSidePart&facialHairProbability=20&accessoriesProbability=0`;
  } else {
    url += `&top[]=longHair&top[]=bob&top[]=straight01&facialHairProbability=0&accessoriesProbability=20`;
  }
  return url;
};

// --- Auth System ---

export const getAllUsers = (): User[] => {
  const users = safeParse<User[]>(USERS_KEY, []);
  // Extra safety: ensure it's actually an array
  return Array.isArray(users) ? users : [];
};

export const registerUser = (user: User): { success: boolean; message?: string } => {
  const users = getAllUsers();

  if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
    return { success: false, message: 'Username already exists' };
  }

  // Ensure avatarUrl exists for compatibility with older data
  if (!user.avatarUrl) {
    user.avatarUrl = buildAvatarUrl(user.username, (user.gender as 'male' | 'female') || 'male');
  }
  users.push(user);
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    // Auto login after register
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true };
  } catch (e) {
    console.error('Registration error:', e);
    return { success: false, message: 'Failed to save user data' };
  }
};

export const deleteUser = (username: string): void => {
  const users = getAllUsers();
  const updated = users.filter(u => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

// Seed Admin User
(() => {
  const users = getAllUsers();
  if (!users.some(u => u.username === 'admin')) {
    const adminUser: User = {
      username: 'admin',
      displayName: 'Admin',
      bio: 'System Administrator',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
      password: 'admin123',
      isAdmin: true,
      isVerified: true
    };
    users.push(adminUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
})();

export const loginUser = (username: string, password: string): { success: boolean; user?: User; message?: string } => {
  const users = getAllUsers();
  // Ensure case-insensitive username match but case-sensitive password match
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  if (user) {
    // Ensure avatarUrl is present for older accounts
    if (!user.avatarUrl) {
      user.avatarUrl = buildAvatarUrl(user.username, (user.gender as 'male' | 'female') || 'male');
      // Persist updated user in users list as well
      const idx = users.findIndex(u => u.username === user.username);
      if (idx !== -1) {
        users[idx] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  }
  return { success: false, message: 'Invalid credentials' };
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const sess = safeParse<User | null>(SESSION_KEY, null);
  if (!sess) return null;

  // Backfill avatar for sessions created before avatar/gender fields existed
  if (!sess.avatarUrl) {
    const gender = (sess.gender as 'male' | 'female') || 'male';
    sess.avatarUrl = buildAvatarUrl(sess.username, gender);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      // Also update users list if present
      const users = getAllUsers();
      const idx = users.findIndex(u => u.username === sess.username);
      if (idx !== -1) {
        users[idx] = { ...users[idx], avatarUrl: sess.avatarUrl, gender };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Error updating session avatar fallback:', e);
    }
  }

  return sess;
};

export const getUserByUsername = (username: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.username === username);
};

export const updateUser = (username: string, updates: Partial<User>): User | null => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.username === username);

  if (index !== -1) {
    // Update user in the main list
    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update session if it's the current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === username) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    }
    return updatedUser;
  }
  return null;
};

// --- Prompts System ---

export const getPrompts = (): Prompt[] => {
  const prompts = safeParse<any[]>(PROMPTS_KEY, []);
  if (!Array.isArray(prompts)) return [];

  // Sanitize data structure
  return prompts.map(p => ({
    ...p,
    rating: typeof p.rating === 'number' ? p.rating : 0,
    ratingCount: typeof p.ratingCount === 'number' ? p.ratingCount : 0,
    model: p.model || 'Unknown',
    tags: Array.isArray(p.tags) ? p.tags : []
  }));
};

export const savePrompt = (input: NewPromptInput): Prompt => {
  const prompts = getPrompts();
  const newPrompt: Prompt = {
    id: Date.now().toString(),
    ...input,
    viewCount: 0,
    copyCount: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: Date.now()
  };

  const updatedPrompts = [newPrompt, ...prompts];
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(updatedPrompts));
  return newPrompt;
};

const INTERACTIONS_KEY = 'promptnexus_interactions_v2';

const hasInteracted = (username: string, promptId: string, type: 'view' | 'copy'): boolean => {
  if (!username) return false;
  const allInteractions = safeParse<Record<string, Record<string, string[]>>>(INTERACTIONS_KEY, {});
  // Structure: { username: { view: [id1, id2], copy: [id3] } }

  const userInteractions = allInteractions[username] || { view: [], copy: [] };
  const list = userInteractions[type] || [];
  return list.includes(promptId);
};

const recordInteraction = (username: string, promptId: string, type: 'view' | 'copy') => {
  if (!username) return;
  const allInteractions = safeParse<Record<string, Record<string, string[]>>>(INTERACTIONS_KEY, {});

  if (!allInteractions[username]) {
    allInteractions[username] = { view: [], copy: [] };
  }

  if (!allInteractions[username][type]) {
    allInteractions[username][type] = [];
  }

  if (!allInteractions[username][type].includes(promptId)) {
    allInteractions[username][type].push(promptId);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(allInteractions));
  }
};

export const incrementCopyCount = (id: string, username: string): void => {
  if (hasInteracted(username, id, 'copy')) return;

  const prompts = getPrompts();
  const updated = prompts.map(p => {
    if (p.id === id) {
      // COPY should NOT increment VIEW count, they are separate actions
      return { ...p, copyCount: p.copyCount + 1 };
    }
    return p;
  });
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
  recordInteraction(username, id, 'copy');
};

export const deletePrompt = (id: string): void => {
  const prompts = getPrompts();
  const updated = prompts.filter(p => p.id !== id);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
};

export const incrementViewCount = (id: string, username: string): void => {
  if (hasInteracted(username, id, 'view')) return;

  const prompts = getPrompts();
  const updated = prompts.map(p => {
    if (p.id === id) {
      return { ...p, viewCount: p.viewCount + 1 };
    }
    return p;
  });
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
  recordInteraction(username, id, 'view');
};

// --- Follow System ---

export const isFollowingUser = (follower: string, target: string): boolean => {
  const allFollows = safeParse<Record<string, string[]>>(FOLLOW_KEY, {});
  const userFollows = allFollows[follower] || [];
  return userFollows.includes(target);
};

export const toggleFollow = (follower: string, target: string): boolean => {
  const allFollows = safeParse<Record<string, string[]>>(FOLLOW_KEY, {});

  const currentFollowing = allFollows[follower] || [];
  const isFollowing = currentFollowing.includes(target);

  let newFollowing;
  if (isFollowing) {
    newFollowing = currentFollowing.filter((u: string) => u !== target);
  } else {
    newFollowing = [...currentFollowing, target];
  }

  allFollows[follower] = newFollowing;
  localStorage.setItem(FOLLOW_KEY, JSON.stringify(allFollows));
  return !isFollowing;
};

// --- Favorites System ---

export const getFavorites = (username: string): string[] => {
  const allFavs = safeParse<Record<string, string[]>>(FAVORITES_KEY, {});
  return allFavs[username] || [];
};

export const isPromptFavorite = (username: string, promptId: string): boolean => {
  const favs = getFavorites(username);
  return favs.includes(promptId);
};

export const toggleFavorite = (username: string, promptId: string): boolean => {
  const allFavs = safeParse<Record<string, string[]>>(FAVORITES_KEY, {});

  const userFavs = allFavs[username] || [];
  const isFav = userFavs.includes(promptId);

  let newFavs;
  if (isFav) {
    newFavs = userFavs.filter((id: string) => id !== promptId);
  } else {
    newFavs = [...userFavs, promptId];
  }

  allFavs[username] = newFavs;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavs));
  return !isFav;
};

// --- Rating System ---

export const getUserRating = (username: string, promptId: string): number => {
  const allRatings = safeParse<Record<string, Record<string, number>>>(RATINGS_KEY, {});
  const promptRatings = allRatings[promptId] || {};
  return promptRatings[username] || 0;
}

export const ratePrompt = (username: string, promptId: string, rating: number): void => {
  const allRatings = safeParse<Record<string, Record<string, number>>>(RATINGS_KEY, {});

  if (!allRatings[promptId]) {
    allRatings[promptId] = {};
  }

  allRatings[promptId][username] = rating;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(allRatings));

  // Recalculate average
  const promptRatings = allRatings[promptId];
  const ratingValues = Object.values(promptRatings) as number[];
  const sum = ratingValues.reduce((a, b) => a + b, 0);
  const avg = sum / ratingValues.length;
  const count = ratingValues.length;

  // Update prompt metadata
  const prompts = getPrompts();
  const updatedPrompts = prompts.map(p => {
    if (p.id === promptId) {
      return { ...p, rating: parseFloat(avg.toFixed(1)), ratingCount: count };
    }
    return p;
  });
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(updatedPrompts));
};

// --- Admin Utilities ---
export const rebuildAvatarsForAllUsers = (): { updated: number } => {
  const users = getAllUsers();
  let updatedCount = 0;
  const newUsers = users.map(u => {
    const gender = (u.gender as 'male' | 'female') || 'male';
    const expected = buildAvatarUrl(u.username, gender);
    if (!u.avatarUrl || u.avatarUrl !== expected) {
      updatedCount++;
      return { ...u, avatarUrl: expected, gender };
    }
    return u;
  });

  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));

    // If session user exists, update it as well
    const session = safeParse<User | null>(SESSION_KEY, null);
    if (session) {
      const updatedSession = newUsers.find(x => x.username === session.username) || session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    }
  } catch (e) {
    console.error('Failed to persist rebuilt avatars:', e);
  }

  return { updated: updatedCount };
};

// Simple inline SVG data URI used as a final fallback when external avatars fail to load.
export const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect fill='%2320282d' width='128' height='128'/><circle cx='64' cy='44' r='26' fill='%234a5568'/><rect x='24' y='80' width='80' height='28' rx='12' fill='%234a5568'/></svg>";

// --- Admin utilities (minimal) ---
export const promoteUser = (username: string): boolean => {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return false;
  users[idx].isAdmin = true;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const demoteUser = (username: string): boolean => {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return false;
  users[idx].isAdmin = false;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

// --- Feedback System ---
export const getAllFeedback = (): Feedback[] => {
  const list = safeParse<Feedback[]>(FEEDBACK_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.sort((a, b) => b.createdAt - a.createdAt);
};

export const addFeedback = (from: string, message: string): Feedback => {
  const list = getAllFeedback();
  const fb: Feedback = { id: Date.now().toString(), from, message, createdAt: Date.now(), read: false };
  const updated = [fb, ...list];
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  return fb;
};

export const markFeedbackRead = (id: string, read = true): boolean => {
  const list = safeParse<Feedback[]>(FEEDBACK_KEY, []);
  const idx = list.findIndex(f => f.id === id);
  if (idx === -1) return false;
  list[idx].read = read;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
  return true;
};

export const deleteFeedback = (id: string): boolean => {
  const list = getAllFeedback();
  const updated = list.filter(f => f.id !== id);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  return true;
};

export const getUnreadFeedbackCount = (): number => {
  return getAllFeedback().filter(f => !f.read).length;
};
