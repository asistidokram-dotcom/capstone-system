import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET REVISIONS FOR A SCHEDULE
export const getRevisions = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const revisions = await prisma.revisionChecklist.findMany({
      where: { scheduleId },
      orderBy: { id: 'desc' }
    });
    res.json(revisions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revisions' });
  }
};

// CREATE A REVISION
export const createRevision = async (req: Request, res: Response) => {
  try {
    const { scheduleId, description } = req.body;

    if (!scheduleId || !description) {
      return res.status(400).json({ message: 'Schedule ID and description are required' });
    }

    const newRevision = await prisma.revisionChecklist.create({
      data: { scheduleId, description, status: 'PENDING' }
    });

    res.status(201).json(newRevision);
  } catch (error) {
    res.status(500).json({ message: 'Error creating revision' });
  }
};

// UPDATE REVISION STATUS (Approve/Reject)
export const updateRevisionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedRevision = await prisma.revisionChecklist.update({
      where: { id },
      data: { status }
    });

    res.json(updatedRevision);
  } catch (error) {
    res.status(500).json({ message: 'Error updating revision status' });
  }
};