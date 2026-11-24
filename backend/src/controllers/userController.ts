import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET ALL USERS
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// CREATE A USER (Student, Adviser, Panelist, Coordinator)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, department, expertise } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create the base User
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, role: role as Role }
    });

    // 2. Create the specific profile based on role
    if (role === 'ADVISER') {
      await prisma.adviser.create({
        data: { userId: user.id, department: department || 'Computer Studies' }
      });
    } else if (role === 'PANELIST') {
      await prisma.panelist.create({
        data: { userId: user.id, expertise: expertise || 'General' }
      });
    } else if (role === 'STUDENT') {
      // Find the first section to assign the student to
      const defaultSection = await prisma.section.findFirst();
      if (defaultSection) {
        await prisma.student.create({
          data: { 
            userId: user.id, 
            studentNumber: `2024-${Math.floor(Math.random() * 9000) + 1000}`, 
            sectionId: defaultSection.id 
          }
        });
      }
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// GET ALL ROOMS
export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

// CREATE A ROOM
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, capacity } = req.body;
    const room = await prisma.room.create({
      data: { name, capacity: Number(capacity) }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room' });
  }
};