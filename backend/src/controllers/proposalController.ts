import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import fs from 'fs';

const prisma = new PrismaClient();

export const getAllProposals = async (req: AuthRequest, res: Response) => {
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
    } else if (user.role === 'ADVISER') {
      // NEW FIX: Only fetch proposals for groups assigned to this specific adviser
      const adviser = await prisma.adviser.findUnique({ where: { userId: user.userId } });
      if (adviser) {
        whereClause = { group: { adviserId: adviser.id } };
      } else {
        return res.json([]);
      }
    }

    const proposals = await prisma.titleProposal.findMany({
      where: whereClause,
      include: { 
        group: { 
          include: { 
            adviser: { 
              include: { user: { select: { firstName: true, lastName: true } } } 
            } 
          } 
        },
        remarks: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proposals' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarkText } = req.body;
    const user = req.user;

    if (!['APPROVED', 'REJECTED', 'NEEDS_REVISION'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const updatedProposal = await prisma.titleProposal.update({ 
      where: { id }, 
      data: { status } 
    });

    if (status === 'APPROVED') {
      await prisma.capstoneGroup.update({
        where: { id: updatedProposal.groupId },
        data: { status: 'TITLE_APPROVED' }
      });
    }

    if (remarkText && user) {
      await prisma.proposalRemark.create({
        data: {
          proposalId: id,
          authorId: user.userId,
          remarkText: remarkText
        }
      });
    }

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: `PROPOSAL_${status}`,
          details: `Updated proposal "${updatedProposal.title}" to ${status}`
        }
      });
    }

    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating proposal status' });
  }
};

export const createProposal = async (req: Request, res: Response) => {
  try {
    const { groupId, title, abstract } = req.body;
    if (!groupId || !title || !abstract) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF document.' });

    const filePath = req.file.filename;
    const normalizedNewTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingProposals = await prisma.titleProposal.findMany({ select: { title: true } });
    const isDuplicate = existingProposals.some(p => p.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedNewTitle);

    if (isDuplicate) {
      fs.unlinkSync(req.file.path); 
      return res.status(409).json({ message: 'A project with a very similar title already exists.' });
    }

    const proposal = await prisma.titleProposal.create({
      data: { groupId, title, abstract, filePath, status: 'PENDING' }
    });
    res.status(201).json(proposal);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); 
    res.status(500).json({ message: 'Error creating proposal' });
  }
};