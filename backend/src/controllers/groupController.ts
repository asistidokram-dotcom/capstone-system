import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// GET ALL GROUPS (Filtered by Role)
export const getAllGroups = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let whereClause = {};

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.userId } });
      if (student) {
        const membership = await prisma.groupMember.findFirst({ where: { studentId: student.id } });
        if (membership) {
          whereClause = { id: membership.groupId };
        } else {
          return res.json([]);
        }
      }
    } else if (user.role === 'ADVISER') {
      const adviser = await prisma.adviser.findUnique({ where: { userId: user.userId } });
      if (adviser) {
        whereClause = { adviserId: adviser.id };
      }
    }

    const groups = await prisma.capstoneGroup.findMany({
      where: whereClause,
      include: {
        adviser: { include: { user: { select: { firstName: true, lastName: true } } } },
        members: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups' });
  }
};

// GET ADVISERS
export const getAdvisers = async (req: Request, res: Response) => {
  try {
    const advisers = await prisma.adviser.findMany({
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    res.json(advisers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching advisers' });
  }
};

// CREATE GROUP
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, adviserId } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });
    const status = adviserId ? 'ADVISER_ASSIGNED' : 'PENDING_ADVISER';
    const newGroup = await prisma.capstoneGroup.create({
      data: { name, adviserId: adviserId || null, status }
    });
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error creating group' });
  }
};

// UPDATE GROUP (ASSIGN ADVISER)
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adviserId } = req.body;

    const status = adviserId ? 'ADVISER_ASSIGNED' : 'PENDING_ADVISER';

    const updatedGroup = await prisma.capstoneGroup.update({
      where: { id },
      data: {
        adviserId: adviserId || null,
        status: status
      }
    });
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error updating group adviser' });
  }
};

// GET AVAILABLE STUDENTS
export const getAvailableStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      where: { groupMembers: { none: {} } },
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
};

// ADD STUDENT TO GROUP
export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
    const member = await prisma.groupMember.create({ data: { groupId, studentId } });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member' });
  }
};

// DELETE A GROUP
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.capstoneGroup.delete({ where: { id } });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting group. It may have linked records.' });
  }
};

// REMOVE A MEMBER
export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;
    await prisma.groupMember.deleteMany({ where: { groupId, studentId: memberId } });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member' });
  }
};