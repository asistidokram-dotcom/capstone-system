import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { authenticate, AuthRequest } from './middleware/authMiddleware';
import { authorize } from './middleware/roleMiddleware';

import groupRoutes from './routes/groupRoutes';
import proposalRoutes from './routes/proposalRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import revisionRoutes from './routes/revisionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import auditLogRoutes from './routes/auditLogRoutes'; // <-- NEW IMPORT

dotenv.config();

const app = express();
const PORT = 5000;
const prisma = new PrismaClient();

app.use(cors());

const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Backend is running perfectly!' });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '8h' });
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => { res.json({ message: 'You are authenticated', user: req.user }); });
app.get('/api/admin/test', authenticate, authorize('ADMIN'), (req: AuthRequest, res: Response) => { res.json({ message: 'Welcome, admin!', user: req.user }); });

app.use('/api/groups', authenticate, groupRoutes);
app.use('/api/proposals', authenticate, proposalRoutes);
app.use('/api/schedules', authenticate, scheduleRoutes);
app.use('/api/evaluations', authenticate, evaluationRoutes);
app.use('/api/revisions', authenticate, revisionRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/users', authenticate, authorize('ADMIN'), userRoutes);
app.use('/api/audit-logs', authenticate, authorize('ADMIN'), auditLogRoutes); // <-- NEW MOUNT

app.listen(PORT, () => {
  console.log(`🚀 Server is running locally at http://localhost:${PORT}`);
});