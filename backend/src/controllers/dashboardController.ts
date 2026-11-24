import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// GET SYSTEM STATS
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalGroups,
      pendingProposals,
      totalSchedules,
      pendingRevisions,
      totalPanelists
    ] = await Promise.all([
      prisma.capstoneGroup.count(),
      prisma.titleProposal.count({ where: { status: 'PENDING' } }),
      prisma.defenseSchedule.count(),
      prisma.revisionChecklist.count({ where: { status: 'PENDING' } }),
      prisma.panelist.count()
    ]);

    res.json({
      totalGroups,
      pendingProposals,
      totalSchedules,
      pendingRevisions,
      totalPanelists
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

// GET WORKLOADS (Advisers & Panelists)
export const getWorkloads = async (req: Request, res: Response) => {
  try {
    const advisers = await prisma.adviser.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        groups: true
      }
    });

    const panelists = await prisma.panelist.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        schedules: true
      }
    });

    const adviserWorkload = advisers.map(a => ({
      name: `${a.user.firstName} ${a.user.lastName}`,
      count: a.groups.length
    }));

    const panelistWorkload = panelists.map(p => ({
      name: `${p.user.firstName} ${p.user.lastName}`,
      count: p.schedules.length
    }));

    res.json({ adviserWorkload, panelistWorkload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching workloads' });
  }
};

// GET STUDENT'S GROUP PROFILE
export const getStudentGroupInfo = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'STUDENT') return res.status(403).json({ message: 'Forbidden' });

    const student = await prisma.student.findUnique({ where: { userId: user.userId } });
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const membership = await prisma.groupMember.findFirst({
      where: { studentId: student.id },
      include: {
        group: {
          include: {
            adviser: { include: { user: { select: { firstName: true, lastName: true } } } },
            members: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } }
          }
        }
      }
    });

    if (!membership) return res.status(404).json({ message: 'No group assigned yet' });

    res.json(membership.group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching student group' });
  }
};