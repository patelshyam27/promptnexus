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
      return rest;
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
    res.json(rest);
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
app.get('/api/prompts', async (_req: Request, res: Response) => {
  try {
    const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
    res.json(prompts);
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
    const p = await prisma.prompt.create({ data: { title, content, model: model || null, tags: tags || null, authorId } });
    res.json({ success: true, prompt: p });
  } catch (e) {
    console.error('Create prompt error', e);
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
    // In a real app we would store individual ratings in a separate table
    // For now, we will just update the average with a weighted approximation or ignore for simplicity
    // Actually, let's just increment ratingCount and update rating
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;
