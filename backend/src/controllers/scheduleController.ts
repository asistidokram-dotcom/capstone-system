import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let whereClause = {};

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.userId } });
      if (student) {
        const membership = await prisma.groupMember.findFirst({ where: { studentId: student.id } });
        if (membership) whereClause = { groupId: membership.groupId };
        else return res.json([]);
      }
    } else if (user.role === 'PANELIST') {
      const panelist = await prisma.panelist.findUnique({ where: { userId: user.userId } });
      if (panelist) {
        whereClause = { panelMembers: { some: { panelistId: panelist.id } } };
      }
    }

    const schedules = await prisma.defenseSchedule.findMany({
      where: whereClause,
      include: {
        group: { select: { name: true } },
        room: { select: { name: true } },
        panelMembers: { include: { panelist: { include: { user: { select: { firstName: true, lastName: true } } } } } }
      },
      orderBy: { date: 'asc' }
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules' });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

export const getPanelists = async (req: Request, res: Response) => {
  try {
    const panelists = await prisma.panelist.findMany({
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    res.json(panelists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching panelists' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { groupId, type, date, startTime, endTime, roomId } = req.body;
    if (!groupId || !type || !date || !startTime || !endTime || !roomId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const formattedDate = new Date(date);
    const formattedStart = new Date(`${date}T${startTime}:00`);
    const formattedEnd = new Date(`${date}T${endTime}:00`);

    // FIXED: Ensure End Time is after Start Time
    if (formattedEnd <= formattedStart) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const roomConflict = await prisma.defenseSchedule.findFirst({
      where: { roomId, date: formattedDate, AND: [{ startTime: { lt: formattedEnd } }, { endTime: { gt: formattedStart } }] }
    });
    if (roomConflict) return res.status(409).json({ message: 'Conflict: This room is already booked for this time slot.' });

    const groupConflict = await prisma.defenseSchedule.findFirst({
      where: { groupId, date: formattedDate, AND: [{ startTime: { lt: formattedEnd } }, { endTime: { gt: formattedStart } }] }
    });
    if (groupConflict) return res.status(409).json({ message: 'Conflict: This group already has a defense scheduled at this time.' });

    const newSchedule = await prisma.defenseSchedule.create({
      data: { groupId, type, date: formattedDate, startTime: formattedStart, endTime: formattedEnd, roomId }
    });
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule' });
  }
};

export const addPanelistToSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { panelistId } = req.body;
    if (!panelistId) return res.status(400).json({ message: 'Panelist ID is required' });

    const currentSchedule = await prisma.defenseSchedule.findUnique({ where: { id: scheduleId } });
    if (!currentSchedule) return res.status(404).json({ message: 'Schedule not found' });

    // FIXED: Prevent duplicate panelist on the SAME schedule
    const alreadyAssigned = await prisma.defensePanelMember.findFirst({
      where: { scheduleId, panelistId }
    });
    if (alreadyAssigned) return res.status(400).json({ message: 'Panelist is already assigned to this schedule.' });

    const panelistConflict = await prisma.defensePanelMember.findFirst({
      where: { panelistId, schedule: { date: currentSchedule.date, AND: [{ startTime: { lt: currentSchedule.endTime } }, { endTime: { gt: currentSchedule.startTime } }] } }
    });
    if (panelistConflict) return res.status(409).json({ message: 'Conflict: This panelist is already assigned to another defense at this time.' });

    const member = await prisma.defensePanelMember.create({ data: { scheduleId, panelistId } });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error adding panelist' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.defensePanelMember.deleteMany({ where: { scheduleId: id } });
    await prisma.defenseSchedule.delete({ where: { id } });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule' });
  }
};

export const removePanelistFromSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId, panelistId } = req.params;
    await prisma.defensePanelMember.deleteMany({ where: { scheduleId, panelistId } });
    res.json({ message: 'Panelist removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing panelist' });
  }
};