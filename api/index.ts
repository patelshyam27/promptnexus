import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Health
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

// Register
app.post('/api/register', async (req: Request, res: Response) => {
  const { username, password, displayName, bio, gender, avatarUrl } = req.body;
  if (!username || !password || !displayName) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });

    // First user is Admin OR username is 'admin'
    const userCount = await prisma.user.count();
    const isAdmin = userCount === 0 || username.toLowerCase() === 'admin';

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        displayName,
        bio: bio || '',
        gender: gender || null,
        avatarUrl: avatarUrl || null,
        isAdmin
      }
    });
    // Do not return password
    // @ts-ignore
    delete user.password;
    res.json({ success: true, user });
  } catch (e) {
    console.error('Register error', e);
    // DEBUG: Returning full error to client for debugging
    res.status(500).json({ success: false, message: 'Server error: ' + (e instanceof Error ? e.message : String(e)) });
  }
});

// Login
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    // @ts-ignore
    delete user.password;
    res.json({ success: true, user });
  } catch (e) {
    console.error('Login error', e);
    // DEBUG: Returning full error to client for debugging
    res.status(500).json({ success: false, message: 'Server error: ' + (e instanceof Error ? e.message : String(e)) });
  }
});

// Admin: Get all users
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { prompts: true } });
    const safeUsers = users.map(u => {
      // @ts-ignore
      const { password, ...rest } = u;
      return {
        ...rest,
        prompts: u.prompts.map(p => ({
          ...p,
          tags: p.tags ? p.tags.split(',').filter(Boolean) : []
        }))
      };
    });
    res.json(safeUsers);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
app.put('/api/users/profile', async (req: Request, res: Response) => {
  const { username, displayName, bio, gender, instagramUrl, linkdealUrl, avatarUrl } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Missing username' });
  try {
    const updated = await prisma.user.update({
      where: { username },
      data: {
        displayName,
        bio,
        gender,
        instagramUrl,
        linkdealUrl,
        avatarUrl
      }
    });
    // @ts-ignore
    delete updated.password;
    res.json({ success: true, user: updated });
  } catch (e) {
    console.error('Update profile error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Single User (Public Profile)
app.get('/api/users/:username', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username }, include: { prompts: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // @ts-ignore
    const { password, ...rest } = user;
    const formattedUser = {
      ...rest,
      prompts: user.prompts.map(p => ({
        ...p,
        tags: p.tags ? p.tags.split(',').filter(Boolean) : []
      }))
    };
    res.json(formattedUser);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete user
app.delete('/api/users/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    // Delete prompts first (cascade typically handles this but let's be safe if no cascade)
    // Actually prisma schema didn't specify cascade delete on relation, so we might error if we don't delete prompts first.
    // Let's rely on Prisma relation handling or manual delete.
    // For now, simple delete.
    await prisma.prompt.deleteMany({ where: { author: { username } } });
    await prisma.user.delete({ where: { username } });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete user error', e);
    res.status(500).json({ success: false, message: 'Deletion failed' });
  }
});

// Get prompts
app.get('/api/prompts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query; // Optional user ID to check if favorited
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        favoritedBy: true
      }
    });
    const formatted = prompts.map(p => ({
      ...p,
      author: p.author.username,
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      authorDetails: p.author,
      // Add favorite info
      favoritedBy: p.favoritedBy.map(f => f.userId),
      isFavorited: typeof userId === 'string' ? p.favoritedBy.some(f => f.userId === userId) : false,
      favoriteCount: p.favoritedBy.length
    }));
    res.json(formatted);
  } catch (e) {
    console.error('Get prompts error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create prompt
app.post('/api/prompts', async (req: Request, res: Response) => {
  const { title, content, model, tags, authorId } = req.body;
  if (!title || !content || !authorId) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || null);
    const p = await prisma.prompt.create({ data: { title, content, model: model || null, tags: tagsString, authorId } });
    const formattedP = {
      ...p,
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      author: authorId // Return authorId as author string to match type
    };
    res.json({ success: true, prompt: formattedP });
  } catch (e) {
    console.error('Create prompt error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update prompt
app.put('/api/prompts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, model, tags, authorId } = req.body;
  // Note: authorId here is used to verify ownership
  try {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Prompt not found' });
    if (existing.authorId !== authorId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || null);
    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        title,
        content,
        model: model || null,
        tags: tagsString
      }
    });

    // Format response matching get/create
    const formatted = {
      ...updated,
      tags: updated.tags ? updated.tags.split(',').filter(Boolean) : [],
      author: authorId // maintain string format
    };

    res.json({ success: true, prompt: formatted });
  } catch (e) {
    console.error('Update prompt error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Feedback
app.post('/api/feedback', async (req: Request, res: Response) => {
  const { from, message } = req.body;
  if (!from || !message) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const fb = await prisma.feedback.create({ data: { from, message } });
    res.json({ success: true, feedback: fb });
  } catch (e) {
    console.error('Feedback error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get Feedback
app.get('/api/feedback', async (_req: Request, res: Response) => {
  try {
    const feedback = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
    // Explicitly format date for frontend
    const formatted = feedback.map(f => ({
      ...f,
      createdAt: f.createdAt.toISOString() // Ensure standard ISO string
    }));
    res.json(formatted);
  } catch (e) {
    console.error('Get feedback error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Mark Feedback Read
app.put('/api/feedback/:id/read', async (req: Request, res: Response) => {
  const { read } = req.body;
  try {
    const fb = await prisma.feedback.update({ where: { id: req.params.id }, data: { read } });
    res.json({ success: true, feedback: fb });
  } catch (e) {
    console.error('Mark read error', e);
    res.status(500).json({ success: false });
  }
});

// Admin: Delete Feedback
app.delete('/api/feedback/:id', async (req: Request, res: Response) => {
  try {
    await prisma.feedback.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete feedback error', e);
    res.status(500).json({ success: false });
  }
});

// Interactions
app.post('/api/prompts/:id/view', async (req: Request, res: Response) => {
  try {
    await prisma.prompt.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/prompts/:id/copy', async (req: Request, res: Response) => {
  try {
    await prisma.prompt.update({ where: { id: req.params.id }, data: { copyCount: { increment: 1 } } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.delete('/api/prompts/:id', async (req: Request, res: Response) => {
  try {
    await prisma.prompt.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/prompts/:id/rate', async (req: Request, res: Response) => {
  const { rating, username } = req.body;
  try {
    const prompt = await prisma.prompt.findUnique({ where: { id: req.params.id } });
    if (!prompt) return res.status(404).json({ success: false });

    // Simple rating logic: re-calculate average
    const newCount = prompt.ratingCount + 1;
    const newRating = ((prompt.rating * prompt.ratingCount) + rating) / newCount;

    await prisma.prompt.update({
      where: { id: req.params.id },
      data: { rating: newRating, ratingCount: newCount }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Toggle Favorite
app.post('/api/prompts/:id/favorite', async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { id } = req.params;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing user ID' });

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_promptId: { userId, promptId: id } }
    });

    if (existing) {
      // Unfavorite
      await prisma.favorite.delete({
        where: { userId_promptId: { userId, promptId: id } }
      });
      res.json({ success: true, favorited: false });
    } else {
      // Favorite
      await prisma.favorite.create({
        data: { userId, promptId: id }
      });
      res.json({ success: true, favorited: true });
    }
  } catch (e) {
    console.error('Favorite error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- System Settings ---

app.get('/api/settings/:key', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: req.params.key }
    });
    res.json({ success: true, value: setting?.value || '' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/settings/:key', async (req: Request, res: Response) => {
  const { authorId, value } = req.body;
  if (!authorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const admin = await prisma.user.findUnique({ where: { id: authorId } });
    if (!admin || !admin.isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    await prisma.systemSetting.upsert({
      where: { key: req.params.key },
      update: { value },
      create: { key: req.params.key, value }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;
